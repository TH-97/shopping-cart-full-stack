import {
  couponNotApplicableError,
  couponNotFoundError,
  exceedsCouponLimitError,
} from '../errors/domainErrors.js';
import type { CartItemRepository } from '../modules/cart/cartItem.repository.js';
import { MAX_COUPON_COUNT } from '../modules/coupon/coupon.service.js';
import type { CouponRepository } from '../modules/coupon/coupon.repository.js';
import type { Coupon, CouponContext } from '../modules/coupon/coupon.model.js';
import {
  calculateOrderAmount,
  calculateProductDiscount,
  calculateShippingDiscount,
  calculateShippingFee,
  calculateTotalPayment,
  type ProductCoupon,
} from '../modules/order/order.calculation.js';
import { resolveSelectedItems } from '../modules/order/resolveSelectedItems.js';
import type { OrderSummary } from '../modules/order/order.dto.js';
import type { ProductRepository } from '../modules/products/product.repository.js';

type OrderSummaryInput = {
  selectedCartItemIds: string[];
  selectedCouponIds: string[];
  isRemoteArea: boolean;
  now?: Date;
};

// 선택 장바구니 항목·쿠폰을 조회·검증해 주문 요약 금액을 산출하는 use-case.
// 계산 자체는 order.calculation / coupon.model의 순수 로직에 위임한다.
export class OrderSummaryUseCase {
  constructor(
    private readonly cartItemRepository: CartItemRepository,
    private readonly productRepository: ProductRepository,
    private readonly couponRepository: CouponRepository,
  ) {}

  async execute(input: OrderSummaryInput): Promise<OrderSummary> {
    const now = input.now ?? new Date();

    const selectedItems = await resolveSelectedItems(
      this.cartItemRepository,
      this.productRepository,
      input.selectedCartItemIds,
    );
    const orderAmount = calculateOrderAmount(selectedItems);
    // 무료배송 기준은 쿠폰 적용 전 주문금액으로 판정한다(도서산간이면 추가 요금 포함).
    const baseShippingFee = calculateShippingFee(orderAmount, input.isRemoteArea);

    const coupons = await this.resolveAppliedCoupons(
      input.selectedCouponIds,
      { orderAmount, shippingFee: baseShippingFee, selectedItems, now },
    );

    // 트랙 A(상품금액): 정액 먼저 → 정율 나중 순차 적용. FREESHIPPING은 제외.
    const productCoupons = coupons
      .filter((coupon) => coupon.code !== 'FREESHIPPING')
      .map((coupon): ProductCoupon => ({
        discountType: coupon.discountType,
        applyTo: (amount) =>
          coupon.calculateDiscount({
            orderAmount: amount,
            shippingFee: baseShippingFee,
            selectedItems,
            now,
          }),
      }));
    const productDiscount = calculateProductDiscount(orderAmount, productCoupons);

    // 트랙 B(배송비): FREESHIPPING이 있으면 배송비 전액 할인.
    const hasFreeShipping = coupons.some(
      (coupon) => coupon.code === 'FREESHIPPING',
    );
    const shippingDiscount = calculateShippingDiscount(
      baseShippingFee,
      hasFreeShipping,
    );

    const couponDiscountAmount = productDiscount + shippingDiscount;
    const finalShippingFee = baseShippingFee - shippingDiscount;

    return {
      orderAmount,
      couponDiscountAmount,
      shippingFee: finalShippingFee,
      totalPaymentAmount: calculateTotalPayment(
        orderAmount,
        couponDiscountAmount,
        baseShippingFee,
      ),
    };
  }

  // 선택 쿠폰을 조회·검증해 적용 가능한 Coupon 도메인 목록을 돌려준다.
  // 적용 불가/미존재/개수 초과는 throw한다(계산은 호출부 트랙 A/B에서 한다).
  private async resolveAppliedCoupons(
    selectedCouponIds: string[],
    ctx: CouponContext,
  ): Promise<Coupon[]> {
    // 중복 ID는 같은 쿠폰이 두 번 적용되지 않도록 제거한다(limit도 unique 개수 기준).
    const uniqueCouponIds = [...new Set(selectedCouponIds)];
    if (uniqueCouponIds.length === 0) return [];
    if (uniqueCouponIds.length > MAX_COUPON_COUNT) {
      throw exceedsCouponLimitError();
    }

    return Promise.all(
      uniqueCouponIds.map(async (couponId) => {
        const owned = await this.couponRepository.findById(couponId);
        if (!owned) throw couponNotFoundError();

        const couponCtx: CouponContext = { ...ctx, isUsed: owned.isUsed };
        if (!owned.coupon.isApplicable(couponCtx)) {
          throw couponNotApplicableError();
        }

        return owned.coupon;
      }),
    );
  }
}
