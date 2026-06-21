import express from 'express';
import request from 'supertest';
import { errorHandler } from '../../../src/middlewares/errorHandlers.js';
import { CartItem } from '../../../src/modules/cart/cartItem.model.js';
import { Coupon } from '../../../src/modules/coupon/coupon.model.js';
import { Product } from '../../../src/modules/products/product.model.js';
import { OrderSummaryUseCase } from '../../../src/application/orderSummary.usecase.js';
import { createOrderRouter } from '../../../src/modules/order/order.routes.js';
import {
  createInMemoryCartItemRepository,
  createInMemoryCouponRepository,
  createInMemoryProductRepository,
  type UserCouponRow,
} from '../../support/inMemoryRepositories.js';

const future = new Date('2099-12-31T23:59:59Z');

let app: express.Express;
let productsDB: Map<string, Product>;
let cartItemsDB: Map<string, CartItem>;
let couponsDB: Map<string, Coupon>;
let userCouponsDB: Map<string, UserCouponRow>;

beforeEach(() => {
  productsDB = new Map();
  cartItemsDB = new Map();
  couponsDB = new Map();
  userCouponsDB = new Map();

  const useCase = new OrderSummaryUseCase(
    createInMemoryCartItemRepository(cartItemsDB),
    createInMemoryProductRepository(productsDB),
    createInMemoryCouponRepository(couponsDB, userCouponsDB),
  );

  app = express();
  app.use(express.json());
  app.use(createOrderRouter(useCase));
  app.use(errorHandler);
});

const seedItem = (cartItemId: string, productId: string, price: number, qty: number) => {
  productsDB.set(
    productId,
    new Product({ productId, productName: '상품', productPrice: price, remainingQuantity: 99 }),
  );
  cartItemsDB.set(
    cartItemId,
    new CartItem({ cartItemId, productId, purchaseQuantity: qty }),
  );
};

describe('POST /orders/summary', () => {
  test('주문 요약 금액을 200으로 반환한다', async () => {
    seedItem('ci1', 'p1', 10000, 2);

    const res = await request(app).post('/orders/summary').send({
      selectedCartItemIds: ['ci1'],
      selectedCouponIds: [],
      isRemoteArea: false,
    });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      orderAmount: 20000,
      couponDiscountAmount: 0,
      shippingFee: 3000,
      totalPaymentAmount: 23000,
    });
  });

  test('selectedCartItemIds가 배열이 아니면 400 INVALID_CART_ITEM_IDS', async () => {
    const res = await request(app).post('/orders/summary').send({
      selectedCartItemIds: '10',
      selectedCouponIds: [],
      isRemoteArea: false,
    });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_CART_ITEM_IDS');
  });

  test('존재하지 않는 cartItemId면 404 CART_ITEM_NOT_FOUND', async () => {
    const res = await request(app).post('/orders/summary').send({
      selectedCartItemIds: ['missing'],
      selectedCouponIds: [],
      isRemoteArea: false,
    });

    expect(res.status).toBe(404);
    expect(res.body.code).toBe('CART_ITEM_NOT_FOUND');
  });

  test('적용 불가 쿠폰이면 400 COUPON_NOT_APPLICABLE', async () => {
    seedItem('ci1', 'p1', 10000, 1);
    couponsDB.set(
      'min',
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
    userCouponsDB.set('uc-min', {
      userCouponId: 'uc-min',
      couponId: 'min',
      userId: 'demo-user',
      isUsed: false,
    });

    const res = await request(app).post('/orders/summary').send({
      selectedCartItemIds: ['ci1'],
      selectedCouponIds: ['min'],
      isRemoteArea: false,
    });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('COUPON_NOT_APPLICABLE');
  });
});
