import { CartItem } from '../../src/modules/cart/cartItem.model.js';
import { createInMemoryCartItemRepository } from '../../src/modules/cart/cartItem.repository.js';
import { Coupon } from '../../src/modules/coupon/coupon.model.js';
import {
  createInMemoryCouponRepository,
  type UserCouponRow,
} from '../../src/modules/coupon/coupon.repository.js';
import { Product } from '../../src/modules/products/product.model.js';
import { createInMemoryProductRepository } from '../../src/modules/products/product.repository.js';
import { OrderSummaryUseCase } from '../../src/application/orderSummary.usecase.js';

const future = new Date('2099-12-31T23:59:59Z');
const now = new Date('2026-06-20T10:00:00Z');

describe('OrderSummaryUseCase', () => {
  let productsDB: Map<string, Product>;
  let cartItemsDB: Map<string, CartItem>;
  let couponsDB: Map<string, Coupon>;
  let userCouponsDB: Map<string, UserCouponRow>;
  let useCase: OrderSummaryUseCase;

  const addProduct = (productId: string, price: number) =>
    productsDB.set(
      productId,
      new Product({
        productId,
        productName: '상품',
        productPrice: price,
        remainingQuantity: 99,
      }),
    );

  const addCartItem = (
    cartItemId: string,
    productId: string,
    quantity: number,
  ) =>
    cartItemsDB.set(
      cartItemId,
      new CartItem({ cartItemId, productId, purchaseQuantity: quantity }),
    );

  const addCoupon = (coupon: Coupon, isUsed = false) => {
    couponsDB.set(coupon.couponId, coupon);
    userCouponsDB.set(`uc-${coupon.couponId}`, {
      userCouponId: `uc-${coupon.couponId}`,
      couponId: coupon.couponId,
      userId: 'demo-user',
      isUsed,
    });
  };

  beforeEach(() => {
    productsDB = new Map();
    cartItemsDB = new Map();
    couponsDB = new Map();
    userCouponsDB = new Map();

    useCase = new OrderSummaryUseCase(
      createInMemoryCartItemRepository(cartItemsDB),
      createInMemoryProductRepository(productsDB),
      createInMemoryCouponRepository(couponsDB, userCouponsDB),
    );
  });

  test('선택 항목의 주문금액과 배송비를 계산한다', async () => {
    addProduct('p1', 10000);
    addCartItem('ci1', 'p1', 2);

    const summary = await useCase.execute({
      selectedCartItemIds: ['ci1'],
      selectedCouponIds: [],
      isRemoteArea: false,
      now,
    });

    expect(summary.orderAmount).toBe(20000);
    expect(summary.shippingFee).toBe(3000);
    expect(summary.couponDiscountAmount).toBe(0);
    expect(summary.totalPaymentAmount).toBe(23000);
  });

  test('주문금액 100000 이상이면 배송비가 무료다', async () => {
    addProduct('p1', 50000);
    addCartItem('ci1', 'p1', 2);

    const summary = await useCase.execute({
      selectedCartItemIds: ['ci1'],
      selectedCouponIds: [],
      isRemoteArea: true,
      now,
    });

    expect(summary.orderAmount).toBe(100000);
    expect(summary.shippingFee).toBe(0);
  });

  test('존재하지 않는 cartItemId면 CART_ITEM_NOT_FOUND를 던진다', async () => {
    await expect(
      useCase.execute({
        selectedCartItemIds: ['missing'],
        selectedCouponIds: [],
        isRemoteArea: false,
        now,
      }),
    ).rejects.toThrow('존재하지 않는 장바구니 상품입니다.');
  });

  test('쿠폰 2장을 합산 적용한다', async () => {
    addProduct('p1', 10000);
    addCartItem('ci1', 'p1', 5); // 주문금액 50000
    addCoupon(
      new Coupon({
        couponId: 'fixed',
        name: '정액',
        discountType: 'FIXED',
        discountValue: 5000,
        expiresAt: future,
      }),
    );
    addCoupon(
      new Coupon({
        couponId: 'percent',
        name: '정률',
        discountType: 'PERCENT',
        discountValue: 10,
        expiresAt: future,
      }),
    );

    const summary = await useCase.execute({
      selectedCartItemIds: ['ci1'],
      selectedCouponIds: ['fixed', 'percent'],
      isRemoteArea: false,
      now,
    });

    // 5000 + floor(50000*10/100)=5000 → 10000
    expect(summary.couponDiscountAmount).toBe(10000);
    expect(summary.totalPaymentAmount).toBe(50000 - 10000 + 3000);
  });

  test('선택 쿠폰이 적용 불가하면 COUPON_NOT_APPLICABLE을 던진다', async () => {
    addProduct('p1', 10000);
    addCartItem('ci1', 'p1', 1); // 주문금액 10000
    addCoupon(
      new Coupon({
        couponId: 'min',
        name: '최소주문',
        discountType: 'FIXED',
        discountValue: 5000,
        expiresAt: future,
        minOrderAmount: 50000,
      }),
    );

    await expect(
      useCase.execute({
        selectedCartItemIds: ['ci1'],
        selectedCouponIds: ['min'],
        isRemoteArea: false,
        now,
      }),
    ).rejects.toThrow('적용할 수 없는 쿠폰입니다.');
  });

  test('존재하지 않는 쿠폰이면 COUPON_NOT_FOUND를 던진다', async () => {
    addProduct('p1', 10000);
    addCartItem('ci1', 'p1', 1);

    await expect(
      useCase.execute({
        selectedCartItemIds: ['ci1'],
        selectedCouponIds: ['missing'],
        isRemoteArea: false,
        now,
      }),
    ).rejects.toThrow('존재하지 않는 쿠폰입니다.');
  });

  test('쿠폰이 2장을 초과하면 EXCEEDS_COUPON_LIMIT을 던진다', async () => {
    addProduct('p1', 10000);
    addCartItem('ci1', 'p1', 1);

    await expect(
      useCase.execute({
        selectedCartItemIds: ['ci1'],
        selectedCouponIds: ['a', 'b', 'c'],
        isRemoteArea: false,
        now,
      }),
    ).rejects.toThrow('쿠폰은 최대 2장까지 사용할 수 있습니다.');
  });

  test('BUY_X_GET_1은 선택 항목 중 최고가 단가만큼 할인한다', async () => {
    addProduct('cheap', 3000);
    addProduct('pricey', 12000);
    addCartItem('ci1', 'cheap', 1);
    addCartItem('ci2', 'pricey', 2);
    addCoupon(
      new Coupon({
        couponId: 'gift',
        name: '증정',
        discountType: 'BUY_X_GET_1',
        discountValue: 0,
        expiresAt: future,
        buyQuantity: 2,
        freeQuantity: 1,
      }),
    );

    const summary = await useCase.execute({
      selectedCartItemIds: ['ci1', 'ci2'],
      selectedCouponIds: ['gift'],
      isRemoteArea: false,
      now,
    });

    expect(summary.couponDiscountAmount).toBe(12000);
  });
});
