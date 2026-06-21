import type { CartItemRepository } from '../modules/cart/cartItem.repository.js';
import type { CouponContext } from '../modules/coupon/coupon.model.js';
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
};

// 선택 장바구니 기준으로 demo user 보유 쿠폰 각각의 적용 가능 여부·할인액을 제시한다.
// 여기서는 검증 실패를 throw하지 않고(보유 쿠폰 나열용), 불가 쿠폰은 isApplicable=false·할인 0.
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

    const coupons = owned.map(({ coupon, isUsed }): CouponSummaryItem => {
      const couponCtx: CouponContext = { ...ctx, isUsed };
      const isApplicable = coupon.isApplicable(couponCtx);

      return {
        couponId: coupon.couponId,
        couponName: coupon.name,
        discountType: coupon.discountType,
        isApplicable,
        discountAmount: isApplicable
          ? coupon.calculateDiscount(couponCtx)
          : 0,
        expiresAt: coupon.expiresAt.toISOString(),
        minOrderAmount: coupon.minOrderAmount ?? null,
        usableFrom: coupon.usableFrom ?? null,
        usableTo: coupon.usableTo ?? null,
      };
    });

    return { orderAmount, coupons };
  }
}
