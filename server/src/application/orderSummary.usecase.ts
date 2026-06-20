import {
  cartItemNotFoundError,
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
  type SelectedItem,
} from '../modules/order/order.calculation.js';
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

    const selectedItems = await this.resolveSelectedItems(
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

  // 각 cartItemId를 조회(없으면 CART_ITEM_NOT_FOUND)하고 상품 단가와 조인한다.
  private async resolveSelectedItems(
    selectedCartItemIds: string[],
  ): Promise<SelectedItem[]> {
    return Promise.all(
      selectedCartItemIds.map(async (cartItemId) => {
        const cartItem = await this.cartItemRepository.findById(cartItemId);
        if (!cartItem) throw cartItemNotFoundError();

        const product = await this.productRepository.findById(
          cartItem.productId,
        );
        if (!product) throw cartItemNotFoundError();

        return {
          unitPrice: product.productPrice,
          quantity: cartItem.purchaseQuantity,
        };
      }),
    );
  }

  // 선택 쿠폰을 조회·검증하고 적용 가능한 경우의 할인 합을 계산한다.
  private async resolveCouponDiscount(
    selectedCouponIds: string[],
    ctx: CouponContext,
  ): Promise<number> {
    if (selectedCouponIds.length === 0) return 0;
    if (selectedCouponIds.length > MAX_COUPON_COUNT) {
      throw exceedsCouponLimitError();
    }

    const discounts = await Promise.all(
      selectedCouponIds.map(async (couponId) => {
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
