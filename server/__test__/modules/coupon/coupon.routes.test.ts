import express from 'express';
import request from 'supertest';
import { errorHandler } from '../../../src/middlewares/errorHandlers.js';
import { CartItem } from '../../../src/modules/cart/cartItem.model.js';
import { Coupon } from '../../../src/modules/coupon/coupon.model.js';
import { CouponService } from '../../../src/modules/coupon/coupon.service.js';
import { Product } from '../../../src/modules/products/product.model.js';
import { GetOrderCouponsUseCase } from '../../../src/application/getOrderCoupons.usecase.js';
import { createCouponRouter } from '../../../src/modules/coupon/coupon.routes.js';
import {
  createInMemoryCartItemRepository,
  createInMemoryCouponRepository,
  createInMemoryProductRepository,
  type UserCouponRow,
} from '../../support/inMemoryRepositories.js';

const future = new Date('2099-12-31T23:59:59Z');
const past = new Date('2020-01-01T00:00:00Z');

let app: express.Express;
let productsDB: Map<string, Product>;
let cartItemsDB: Map<string, CartItem>;
let couponsDB: Map<string, Coupon>;
let userCouponsDB: Map<string, UserCouponRow>;

const USER_ID = 'demo-user';

beforeEach(() => {
  productsDB = new Map();
  cartItemsDB = new Map();
  couponsDB = new Map();
  userCouponsDB = new Map();

  const couponRepository = createInMemoryCouponRepository(
    couponsDB,
    userCouponsDB,
  );
  const getOrderCouponsUseCase = new GetOrderCouponsUseCase(
    createInMemoryCartItemRepository(cartItemsDB),
    createInMemoryProductRepository(productsDB),
    couponRepository,
  );
  const couponService = new CouponService(couponRepository);

  app = express();
  app.use(express.json());
  app.use(
    createCouponRouter({ getOrderCouponsUseCase, couponService, userId: USER_ID }),
  );
  app.use(errorHandler);
});

const addCoupon = (coupon: Coupon, isUsed = false) => {
  couponsDB.set(coupon.couponId, coupon);
  userCouponsDB.set(`uc-${coupon.couponId}`, {
    userCouponId: `uc-${coupon.couponId}`,
    couponId: coupon.couponId,
    userId: USER_ID,
    isUsed,
  });
};

const seedItem = (
  cartItemId: string,
  productId: string,
  price: number,
  qty: number,
) => {
  productsDB.set(
    productId,
    new Product({
      productId,
      productName: '상품',
      productPrice: price,
      remainingQuantity: 99,
    }),
  );
  cartItemsDB.set(
    cartItemId,
    new CartItem({ cartItemId, productId, purchaseQuantity: qty }),
  );
};

describe('GET /coupons', () => {
  test('보유 쿠폰과 주문금액을 200으로 반환한다', async () => {
    seedItem('ci1', 'p1', 10000, 1);
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

    const res = await request(app).get('/coupons?selectedCartItemIds=ci1');

    expect(res.status).toBe(200);
    expect(res.body.orderAmount).toBe(10000);
    expect(res.body.coupons).toHaveLength(1);
    expect(res.body.coupons[0]).toMatchObject({
      couponId: 'fixed',
      discountType: 'FIXED',
      isApplicable: true,
    });
    // 단일 적용 가능 쿠폰이 할인 > 0이므로 추천에 포함된다.
    expect(res.body.recommendedCouponIds).toEqual(['fixed']);
  });

  test('보유 쿠폰이 없으면 빈 배열을 반환한다', async () => {
    seedItem('ci1', 'p1', 10000, 1);

    const res = await request(app).get('/coupons?selectedCartItemIds=ci1');

    expect(res.status).toBe(200);
    expect(res.body.coupons).toEqual([]);
    expect(res.body.recommendedCouponIds).toEqual([]);
  });

  test('추천은 항상 응답 coupons 중 applicable 부분집합이다', async () => {
    seedItem('ci1', 'p1', 50000, 2); // 주문금액 100000 → 배송비 0
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

    const res = await request(app).get('/coupons?selectedCartItemIds=ci1');

    expect(res.status).toBe(200);
    // 단독 상위2는 {90000, 30%}지만 실제 최적은 {90000, 5000}(95,000 > 93,000).
    // 반환 순서는 couponId 정렬(findOwnedByUser)을 따라 결정적이다.
    expect(res.body.recommendedCouponIds).toEqual(['fix5000', 'fix90000']);

    const applicableIds = res.body.coupons
      .filter((c: { isApplicable: boolean }) => c.isApplicable)
      .map((c: { couponId: string }) => c.couponId);
    for (const id of res.body.recommendedCouponIds) {
      expect(applicableIds).toContain(id);
    }
  });

  test('존재하지 않는 cartItemId면 404 CART_ITEM_NOT_FOUND', async () => {
    const res = await request(app).get('/coupons?selectedCartItemIds=missing');

    expect(res.status).toBe(404);
    expect(res.body.code).toBe('CART_ITEM_NOT_FOUND');
  });
});

describe('POST /coupons/validate', () => {
  test('유효한 쿠폰이면 204', async () => {
    addCoupon(
      new Coupon({
        couponId: 'valid',
        code: 'FIXED5000',
        name: '정액',
        discountType: 'FIXED',
        discountValue: 5000,
        expiresAt: future,
      }),
    );

    const res = await request(app)
      .post('/coupons/validate')
      .send({ selectedCouponIds: ['valid'] });

    expect(res.status).toBe(204);
  });

  test('2장 초과면 400 EXCEEDS_COUPON_LIMIT', async () => {
    const res = await request(app)
      .post('/coupons/validate')
      .send({ selectedCouponIds: ['a', 'b', 'c'] });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('EXCEEDS_COUPON_LIMIT');
  });

  test('존재하지 않으면 404 COUPON_NOT_FOUND', async () => {
    const res = await request(app)
      .post('/coupons/validate')
      .send({ selectedCouponIds: ['missing'] });

    expect(res.status).toBe(404);
    expect(res.body.code).toBe('COUPON_NOT_FOUND');
  });

  test('만료된 쿠폰이면 400 COUPON_EXPIRED', async () => {
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

    const res = await request(app)
      .post('/coupons/validate')
      .send({ selectedCouponIds: ['expired'] });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('COUPON_EXPIRED');
  });

  test('이미 사용한 쿠폰이면 400 COUPON_ALREADY_USED', async () => {
    addCoupon(
      new Coupon({
        couponId: 'used',
        code: 'FIXED5000',
        name: '사용완료',
        discountType: 'FIXED',
        discountValue: 5000,
        expiresAt: future,
      }),
      true,
    );

    const res = await request(app)
      .post('/coupons/validate')
      .send({ selectedCouponIds: ['used'] });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('COUPON_ALREADY_USED');
  });

  test('selectedCouponIds가 배열이 아니면 400 INVALID_COUPON_IDS', async () => {
    const res = await request(app)
      .post('/coupons/validate')
      .send({ selectedCouponIds: 'c1' });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_COUPON_IDS');
  });
});
