import { CartItem } from '../../src/modules/cart/cartItem.model.js';
import { Coupon } from '../../src/modules/coupon/coupon.model.js';
import { Product } from '../../src/modules/products/product.model.js';
import { GetOrderCouponsUseCase } from '../../src/application/getOrderCoupons.usecase.js';
import {
  createInMemoryCartItemRepository,
  createInMemoryCouponRepository,
  createInMemoryProductRepository,
  type UserCouponRow,
} from '../support/inMemoryRepositories.js';

const future = new Date('2099-12-31T23:59:59Z');
const past = new Date('2020-01-01T00:00:00Z');
const now = new Date('2026-06-20T10:00:00Z');

describe('GetOrderCouponsUseCase', () => {
  let productsDB: Map<string, Product>;
  let cartItemsDB: Map<string, CartItem>;
  let couponsDB: Map<string, Coupon>;
  let userCouponsDB: Map<string, UserCouponRow>;
  let useCase: GetOrderCouponsUseCase;

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

    useCase = new GetOrderCouponsUseCase(
      createInMemoryCartItemRepository(cartItemsDB),
      createInMemoryProductRepository(productsDB),
      createInMemoryCouponRepository(couponsDB, userCouponsDB),
    );
  });

  test('적용 가능/불가 쿠폰을 혼재해 판정하고 할인액을 제시한다', async () => {
    addProduct('p1', 10000);
    addCartItem('ci1', 'p1', 1); // 주문금액 10000
    addCoupon(
      new Coupon({
        couponId: 'ok',
        code: 'FIXED5000',
        name: '정액',
        discountType: 'FIXED',
        discountValue: 5000,
        expiresAt: future,
      }),
    );
    addCoupon(
      new Coupon({
        couponId: 'min',
        code: 'FIXED5000',
        name: '최소주문',
        discountType: 'FIXED',
        discountValue: 3000,
        expiresAt: future,
        minOrderAmount: 50000,
      }),
    );

    const result = await useCase.execute({
      selectedCartItemIds: ['ci1'],
      userId: 'demo-user',
      now,
    });

    expect(result.orderAmount).toBe(10000);
    const ok = result.coupons.find((c) => c.couponId === 'ok');
    const min = result.coupons.find((c) => c.couponId === 'min');

    expect(ok).toMatchObject({
      isApplicable: true,
      discountType: 'FIXED',
    });
    expect(min).toMatchObject({ isApplicable: false });
    // 적용 가능한 'ok'만 추천되고, 불가한 'min'은 빠진다.
    expect(result.recommendedCouponIds).toEqual(['ok']);
  });

  test('정율-after-정액 역전: 단독 상위2가 아닌 실제 최적 조합을 추천한다', async () => {
    addProduct('p1', 100000);
    addCartItem('ci1', 'p1', 1); // 주문금액 100000 → 배송비 0

    addCoupon(
      new Coupon({
        couponId: 'fix90000',
        code: 'FIXED5000',
        name: '9만원 정액',
        discountType: 'FIXED',
        discountValue: 90000,
        expiresAt: future,
      }),
    );
    addCoupon(
      new Coupon({
        couponId: 'fix5000',
        code: 'FIXED5000',
        name: '5천원 정액',
        discountType: 'FIXED',
        discountValue: 5000,
        expiresAt: future,
      }),
    );
    addCoupon(
      new Coupon({
        couponId: 'pct30',
        code: 'MIRACLESALE',
        name: '30% 할인',
        discountType: 'PERCENTAGE',
        discountValue: 30,
        expiresAt: future,
      }),
    );

    const result = await useCase.execute({
      selectedCartItemIds: ['ci1'],
      userId: 'demo-user',
      now,
    });

    // {90000,5000}=95,000 > {90000,30%}=93,000 이므로 5000 쿠폰을 추천한다.
    // 반환 순서는 couponId 정렬(findOwnedByUser)을 따라 결정적이다.
    expect(result.recommendedCouponIds).toEqual(['fix5000', 'fix90000']);
  });

  test('선택 항목이 없으면 추천도 빈 배열이다', async () => {
    addCoupon(
      new Coupon({
        couponId: 'fixed',
        code: 'FIXED5000',
        name: '정액',
        discountType: 'FIXED',
        discountValue: 5000,
        expiresAt: future,
        minOrderAmount: 50000,
      }),
    );

    const result = await useCase.execute({
      selectedCartItemIds: [],
      userId: 'demo-user',
      now,
    });

    expect(result.orderAmount).toBe(0);
    expect(result.recommendedCouponIds).toEqual([]);
  });

  test('응답에 만료일·최소주문·사용시간 메타를 포함한다(모달 표시용)', async () => {
    addProduct('p1', 10000);
    addCartItem('ci1', 'p1', 1);
    addCoupon(
      new Coupon({
        couponId: 'miracle',
        code: 'MIRACLESALE',
        name: '30% 할인 쿠폰',
        discountType: 'PERCENTAGE',
        discountValue: 30,
        expiresAt: future,
        usableFrom: '04:00',
        usableTo: '07:00',
      }),
    );

    const result = await useCase.execute({
      selectedCartItemIds: ['ci1'],
      userId: 'demo-user',
      now,
    });

    expect(result.coupons[0]).toMatchObject({
      couponId: 'miracle',
      discountType: 'PERCENTAGE',
      expiresAt: future.toISOString(),
      minOrderAmount: null,
      usableFrom: '04:00',
      usableTo: '07:00',
    });
  });

  test('적용 불가 쿠폰은 throw하지 않고 할인 0으로 내려간다', async () => {
    addProduct('p1', 10000);
    addCartItem('ci1', 'p1', 1);
    addCoupon(
      new Coupon({
        couponId: 'expired',
        code: 'FIXED5000',
        name: '만료',
        discountType: 'FIXED',
        discountValue: 5000,
        expiresAt: past,
      }),
    );

    const result = await useCase.execute({
      selectedCartItemIds: ['ci1'],
      userId: 'demo-user',
      now,
    });

    expect(result.coupons[0]).toMatchObject({
      isApplicable: false,
    });
  });

  test('보유 쿠폰이 없으면 빈 배열을 반환한다', async () => {
    addProduct('p1', 10000);
    addCartItem('ci1', 'p1', 1);

    const result = await useCase.execute({
      selectedCartItemIds: ['ci1'],
      userId: 'demo-user',
      now,
    });

    expect(result.coupons).toEqual([]);
    expect(result.orderAmount).toBe(10000);
  });

  test('존재하지 않는 cartItemId면 CART_ITEM_NOT_FOUND를 던진다', async () => {
    await expect(
      useCase.execute({
        selectedCartItemIds: ['missing'],
        userId: 'demo-user',
        now,
      }),
    ).rejects.toThrow('존재하지 않는 장바구니 상품입니다.');
  });
});
