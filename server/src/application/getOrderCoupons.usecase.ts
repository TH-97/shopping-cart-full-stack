import { selectBestCouponCombo } from './couponDiscount.js';
import type { CartItemRepository } from '../modules/cart/cartItem.repository.js';
import type { Coupon, CouponContext } from '../modules/coupon/coupon.model.js';
import type { CouponRepository } from '../modules/coupon/coupon.repository.js';
import type { CouponSummaryItem } from '../modules/coupon/coupon.dto.js';
import {
  calculateOrderAmount,
  calculateShippingFee,
} from '../modules/order/order.calculation.js';
import { resolveSelectedItems } from '../modules/order/resolveSelectedItems.js';
import type { ProductRepository } from '../modules/products/product.repository.js';

type GetOrderCouponsInput = {
  selectedCartItemIds: string[];
  userId: string;
  now?: Date;
};

export type OrderCouponsResult = {
  orderAmount: number;
  coupons: CouponSummaryItem[];
  // 적용 가능 쿠폰 중 실제 할인이 최대가 되는 ≤2 조합(추천 기본값). coupons의 applicable 부분집합.
  recommendedCouponIds: string[];
};

// 선택 장바구니 기준으로 demo user 보유 쿠폰 각각의 적용 가능 여부를 제시하고,
// 실제 할인 최대 ≤2 조합을 추천한다. 검증 실패를 throw하지 않고(보유 쿠폰 나열용),
// 불가 쿠폰은 isApplicable=false.
export class GetOrderCouponsUseCase {
  constructor(
    private readonly cartItemRepository: CartItemRepository,
    private readonly productRepository: ProductRepository,
    private readonly couponRepository: CouponRepository,
  ) {}

  async execute(input: GetOrderCouponsInput): Promise<OrderCouponsResult> {
    const now = input.now ?? new Date();

    const selectedItems = await resolveSelectedItems(
      this.cartItemRepository,
      this.productRepository,
      input.selectedCartItemIds,
    );
    const orderAmount = calculateOrderAmount(selectedItems);
    // GET /coupons에는 도서산간 정보가 없으므로 기본 배송비로 본다.
    const shippingFee = calculateShippingFee(orderAmount, false);

    const ctx: CouponContext = { orderAmount, shippingFee, selectedItems, now };

    const owned = await this.couponRepository.findOwnedByUser(input.userId);

    // 적용 가능 쿠폰을 repository 반환 순서 그대로 모아 최적 조합 추천에 쓴다(tie-break 인덱스 기준).
    const applicableCoupons: Coupon[] = [];

    const coupons = owned.map(({ coupon, isUsed }): CouponSummaryItem => {
      const couponCtx: CouponContext = { ...ctx, isUsed };
      const isApplicable = coupon.isApplicable(couponCtx);
      if (isApplicable) applicableCoupons.push(coupon);

      return {
        couponId: coupon.couponId,
        couponName: coupon.name,
        discountType: coupon.discountType,
        isApplicable,
        expiresAt: coupon.expiresAt.toISOString(),
        minOrderAmount: coupon.minOrderAmount ?? null,
        usableFrom: coupon.usableFrom ?? null,
        usableTo: coupon.usableTo ?? null,
      };
    });

    // 적용 가능 집합 안에서 실제 할인 최대 조합을 계산한다(0할인이면 []).
    const recommendedCouponIds = selectBestCouponCombo(applicableCoupons, ctx);

    return { orderAmount, coupons, recommendedCouponIds };
  }
}
