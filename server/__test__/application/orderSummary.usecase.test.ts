import { CartItem } from '../../src/modules/cart/cartItem.model.js';
import { Coupon } from '../../src/modules/coupon/coupon.model.js';
import { Product } from '../../src/modules/products/product.model.js';
import { OrderSummaryUseCase } from '../../src/application/orderSummary.usecase.js';
import {
  createInMemoryCartItemRepository,
  createInMemoryCouponRepository,
  createInMemoryProductRepository,
  type UserCouponRow,
} from '../support/inMemoryRepositories.js';

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

  test('장바구니엔 있으나 상품이 없으면 PRODUCT_NOT_FOUND를 던진다', async () => {
    addCartItem('ci1', 'missing-product', 1);

    await expect(
      useCase.execute({
        selectedCartItemIds: ['ci1'],
        selectedCouponIds: [],
        isRemoteArea: false,
        now,
      }),
    ).rejects.toThrow('존재하지 않는 상품입니다.');
  });

  test('정액 → 정율 순서로 순차 적용한다 (검산: 100000, FIXED5000+MIRACLESALE)', async () => {
    addProduct('p1', 50000);
    addCartItem('ci1', 'p1', 2); // 주문금액 100000 → 배송비 0
    addCoupon(
      new Coupon({
        couponId: 'fixed',
        code: 'FIXED5000',
        name: '정액',
        discountType: 'FIXED',
        discountValue: 5000,
        expiresAt: future,
        minOrderAmount: 100000,
      }),
    );
    addCoupon(
      new Coupon({
        couponId: 'miracle',
        code: 'MIRACLESALE',
        name: '정율',
        discountType: 'PERCENTAGE',
        discountValue: 30,
        expiresAt: future,
      }),
    );

    const summary = await useCase.execute({
      selectedCartItemIds: ['ci1'],
      // 입력 순서가 정율 먼저여도 정렬되어 정액이 먼저 적용된다.
      selectedCouponIds: ['miracle', 'fixed'],
      isRemoteArea: false,
      now,
    });

    // 100000 - 5000 = 95000, 95000 × 30% = 28500 차감 → 66500. 할인 합 33500.
    expect(summary.orderAmount).toBe(100000);
    expect(summary.shippingFee).toBe(0);
    expect(summary.couponDiscountAmount).toBe(33500);
    expect(summary.totalPaymentAmount).toBe(66500);
  });

  test('FREESHIPPING은 배송비를 전액 할인하고 상품금액은 줄이지 않는다', async () => {
    addProduct('p1', 30000);
    addCartItem('ci1', 'p1', 2); // 주문금액 60000 → 배송비 3000
    addCoupon(
      new Coupon({
        couponId: 'freeship',
        code: 'FREESHIPPING',
        name: '무료배송',
        discountType: 'FIXED',
        discountValue: 0,
        expiresAt: future,
        minOrderAmount: 50000,
      }),
    );

    const summary = await useCase.execute({
      selectedCartItemIds: ['ci1'],
      selectedCouponIds: ['freeship'],
      isRemoteArea: false,
      now,
    });

    expect(summary.orderAmount).toBe(60000);
    expect(summary.shippingFee).toBe(0);
    expect(summary.couponDiscountAmount).toBe(3000);
    expect(summary.totalPaymentAmount).toBe(60000);
  });

  test('FREESHIPPING은 도서산간 추가분 포함 배송비 전액을 할인한다', async () => {
    addProduct('p1', 30000);
    addCartItem('ci1', 'p1', 2); // 주문금액 60000, 도서산간 → 배송비 6000
    addCoupon(
      new Coupon({
        couponId: 'freeship',
        code: 'FREESHIPPING',
        name: '무료배송',
        discountType: 'FIXED',
        discountValue: 0,
        expiresAt: future,
        minOrderAmount: 50000,
      }),
    );

    const summary = await useCase.execute({
      selectedCartItemIds: ['ci1'],
      selectedCouponIds: ['freeship'],
      isRemoteArea: true,
      now,
    });

    expect(summary.shippingFee).toBe(0);
    expect(summary.couponDiscountAmount).toBe(6000);
    expect(summary.totalPaymentAmount).toBe(60000);
  });

  test('선택 쿠폰이 적용 불가하면 COUPON_NOT_APPLICABLE을 던진다', async () => {
    addProduct('p1', 10000);
    addCartItem('ci1', 'p1', 1); // 주문금액 10000
    addCoupon(
      new Coupon({
        couponId: 'min',
        code: 'FIXED5000',
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

  test('중복 쿠폰 ID는 한 번만 합산한다', async () => {
    addProduct('p1', 10000);
    addCartItem('ci1', 'p1', 5); // 주문금액 50000
    addCoupon(
      new Coupon({
        couponId: 'fixed',
        code: 'FIXED5000',
        name: '정액',
        discountType: 'FIXED',
        discountValue: 5000,
        expiresAt: future,
      }),
    );

    const summary = await useCase.execute({
      selectedCartItemIds: ['ci1'],
      selectedCouponIds: ['fixed', 'fixed'],
      isRemoteArea: false,
      now,
    });

    // 중복 제거되어 5000만 적용
    expect(summary.couponDiscountAmount).toBe(5000);
  });

  test('중복 포함 3개라도 unique 2개면 limit을 넘지 않는다', async () => {
    addProduct('p1', 10000);
    addCartItem('ci1', 'p1', 5);
    addCoupon(
      new Coupon({
        couponId: 'a',
        code: 'FIXED5000',
        name: '정액',
        discountType: 'FIXED',
        discountValue: 5000,
        expiresAt: future,
      }),
    );
    addCoupon(
      new Coupon({
        couponId: 'b',
        code: 'FIXED5000',
        name: '정액',
        discountType: 'FIXED',
        discountValue: 3000,
        expiresAt: future,
      }),
    );

    const summary = await useCase.execute({
      selectedCartItemIds: ['ci1'],
      selectedCouponIds: ['a', 'b', 'a'],
      isRemoteArea: false,
      now,
    });

    expect(summary.couponDiscountAmount).toBe(8000);
  });

  test('BOGO는 수량 3 이상 항목이 있을 때 최고가 단가만큼 할인한다', async () => {
    addProduct('cheap', 3000);
    addProduct('pricey', 12000);
    addCartItem('ci1', 'cheap', 1);
    addCartItem('ci2', 'pricey', 3); // 수량 3 → BOGO 조건 충족
    addCoupon(
      new Coupon({
        couponId: 'bogo',
        code: 'BOGO',
        name: '증정',
        discountType: 'FIXED',
        discountValue: 0,
        expiresAt: future,
        buyQuantity: 3,
        freeQuantity: 1,
      }),
    );

    const summary = await useCase.execute({
      selectedCartItemIds: ['ci1', 'ci2'],
      selectedCouponIds: ['bogo'],
      isRemoteArea: false,
      now,
    });

    expect(summary.couponDiscountAmount).toBe(12000);
  });

  test('BOGO는 단일 항목 수량이 3 미만이면 COUPON_NOT_APPLICABLE을 던진다', async () => {
    addProduct('p1', 12000);
    addCartItem('ci1', 'p1', 2); // 수량 2 → BOGO 조건 미달
    addCoupon(
      new Coupon({
        couponId: 'bogo',
        code: 'BOGO',
        name: '증정',
        discountType: 'FIXED',
        discountValue: 0,
        expiresAt: future,
        buyQuantity: 3,
        freeQuantity: 1,
      }),
    );

    await expect(
      useCase.execute({
        selectedCartItemIds: ['ci1'],
        selectedCouponIds: ['bogo'],
        isRemoteArea: false,
        now,
      }),
    ).rejects.toThrow('적용할 수 없는 쿠폰입니다.');
  });
});
