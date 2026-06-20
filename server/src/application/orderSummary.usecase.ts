import {
  couponNotApplicableError,
  couponNotFoundError,
  exceedsCouponLimitError,
} from '../errors/domainErrors.js';
import type { CartItemRepository } from '../modules/cart/cartItem.repository.js';
import { MAX_COUPON_COUNT } from '../modules/coupon/coupon.service.js';
import type { CouponRepository } from '../modules/coupon/coupon.repository.js';
import type { CouponContext } from '../modules/coupon/coupon.model.js';
import {
  calculateOrderAmount,
  calculateShippingFee,
  calculateTotalPayment,
  sumCouponDiscount,
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
    const shippingFee = calculateShippingFee(orderAmount, input.isRemoteArea);

    const ctx: CouponContext = {
      orderAmount,
      shippingFee,
      selectedItems,
      now,
    };

    const couponDiscountAmount = await this.resolveCouponDiscount(
      input.selectedCouponIds,
      ctx,
    );

    return {
      orderAmount,
      couponDiscountAmount,
      shippingFee,
      totalPaymentAmount: calculateTotalPayment(
        orderAmount,
        couponDiscountAmount,
        shippingFee,
      ),
    };
  }

  // 선택 쿠폰을 조회·검증하고 적용 가능한 경우의 할인 합을 계산한다.
  private async resolveCouponDiscount(
    selectedCouponIds: string[],
    ctx: CouponContext,
  ): Promise<number> {
    // 중복 ID는 같은 쿠폰이 두 번 합산되지 않도록 제거한다(limit도 unique 개수 기준).
    const uniqueCouponIds = [...new Set(selectedCouponIds)];
    if (uniqueCouponIds.length === 0) return 0;
    if (uniqueCouponIds.length > MAX_COUPON_COUNT) {
      throw exceedsCouponLimitError();
    }

    const discounts = await Promise.all(
      uniqueCouponIds.map(async (couponId) => {
        const owned = await this.couponRepository.findById(couponId);
        if (!owned) throw couponNotFoundError();

        const couponCtx: CouponContext = { ...ctx, isUsed: owned.isUsed };
        if (!owned.coupon.isApplicable(couponCtx)) {
          throw couponNotApplicableError();
        }

        return owned.coupon.calculateDiscount(couponCtx);
      }),
    );

    return sumCouponDiscount(discounts, ctx.orderAmount, ctx.shippingFee);
  }
}
