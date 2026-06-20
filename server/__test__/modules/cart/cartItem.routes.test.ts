import express from 'express';
import request from 'supertest';
import { createCartItemRouter } from '../../../src/modules/cart/cartItem.routes.js';
import { CartItemService } from '../../../src/modules/cart/cartItem.service.js';
import { Product } from '../../../src/modules/products/product.model.js';
import {
  createInMemoryCartItemRepository,
  createInMemoryProductRepository,
} from '../../support/inMemoryRepositories.js';

const mockCartItem = {
  productId: '1',
  purchaseQuantity: 1,
};

const mockProduct = new Product({
  productId: mockCartItem.productId,
  productName: '콜라',
  productPrice: 1300,
  remainingQuantity: 25,
  imageUrl: 'src/assets/coke.png',
});

let app: express.Express;

beforeEach(() => {
  const productRepository = createInMemoryProductRepository(new Map());
  const cartItemRepository = createInMemoryCartItemRepository(new Map());
  productRepository.save(mockProduct);

  const cartItemService = new CartItemService(
    cartItemRepository,
    productRepository,
  );

  app = express();
  app.use(express.json());
  app.use(createCartItemRouter(cartItemService));
});

describe('장바구니 API', () => {
  it('장바구니 목록 요청', async () => {
    const response = await request(app).get('/cart/items');

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });
  it('장바구니 목록 요청 시 항목에 상품 정보가 조인되어 내려온다', async () => {
    await request(app).post('/cart/items').send({
      productId: mockCartItem.productId,
      purchaseQuantity: 2,
    });

    const response = await request(app).get('/cart/items');

    expect(response.status).toBe(200);
    expect(response.body).toEqual([
      {
        cartItemId: expect.any(String),
        productId: mockCartItem.productId,
        productName: '콜라',
        productPrice: 1300,
        imageUrl: 'src/assets/coke.png',
        purchaseQuantity: 2,
      },
    ]);
  });
  it('장바구니에 상품 추가', async () => {
    const response = await request(app).post('/cart/items').send({
      productId: mockCartItem.productId,
      purchaseQuantity: mockCartItem.purchaseQuantity,
    });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({ cartItemId: expect.any(String) });
  });
  it('장바구니에 이미 존재하는 상품을 다시 추가', async () => {
    const responseA = await request(app).post('/cart/items').send({
      productId: mockCartItem.productId,
      purchaseQuantity: mockCartItem.purchaseQuantity,
    });
    const responseB = await request(app).post('/cart/items').send({
      productId: mockCartItem.productId,
      purchaseQuantity: mockCartItem.purchaseQuantity,
    });

    expect(responseA.status).toBe(201);
    expect(responseB.status).toBe(200);
    expect(responseA.body).toEqual({ cartItemId: expect.any(String) });
    expect(responseB.body).toEqual({ cartItemId: expect.any(String) });
  });
  it('상품 삭제', async () => {
    // 장바구니에 상품 추가
    const response = await request(app).post('/cart/items').send({
      productId: mockCartItem.productId,
      purchaseQuantity: mockCartItem.purchaseQuantity,
    });

    // 상품 삭제
    const deleteRes = await request(app).delete(
      `/cart/items/${response.body.cartItemId}`,
    );
    expect(deleteRes.status).toBe(204);
  });
  it('상품 수량 업데이트', async () => {
    // 장바구니에 상품 추가
    const response = await request(app).post('/cart/items').send({
      productId: mockCartItem.productId,
      purchaseQuantity: mockCartItem.purchaseQuantity,
    });

    // 상품 수량 수정
    const patchRes = await request(app)
      .patch(`/cart/items/${response.body.cartItemId}`)
      .send({ purchaseQuantity: 2 });
    expect(patchRes.status).toBe(204);
    expect(patchRes.body).toEqual({});
  });
});
