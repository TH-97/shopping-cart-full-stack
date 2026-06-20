import express from 'express';
import request from 'supertest';
import { errorHandler } from '../../../src/middlewares/errorHandlers.js';
import { createCartItemRouter } from '../../../src/modules/cart/cartItem.routes.js';
import { CartItemService } from '../../../src/modules/cart/cartItem.service.js';
import { Product } from '../../../src/modules/products/product.model.js';
import {
  createInMemoryCartItemRepository,
  createInMemoryProductRepository,
} from '../../support/inMemoryRepositories.js';

let productRepository: ReturnType<typeof createInMemoryProductRepository>;
let app: express.Express;

beforeEach(() => {
  productRepository = createInMemoryProductRepository(new Map());
  const cartItemRepository = createInMemoryCartItemRepository(new Map());
  const cartItemService = new CartItemService(
    cartItemRepository,
    productRepository,
  );

  app = express();
  app.use(express.json());
  app.use(createCartItemRouter(cartItemService));
  app.use(errorHandler);
});

const seedProduct = (productId = 'product-1', remainingQuantity = 10) => {
  const product = new Product({
    productId,
    productName: '콜라',
    productPrice: 1300,
    remainingQuantity,
    imageUrl: 'src/assets/coke.png',
  });
  productRepository.save(product);
  return product;
};

describe('장바구니 에러 테스트', () => {
  describe('장바구니 상품 추가 에러 테스트', () => {
    test('장바구니 상품 추가 시, productId가 유효하지 않은 경우 INVALID_PRODUCT_ID 에러를 반환한다.', async () => {
      const addRes = await request(app).post('/cart/items').send({
        purchaseQuantity: 1,
      });

      expect(addRes.status).toBe(400);
      expect(addRes.body.code).toBe('INVALID_PRODUCT_ID');
      expect(addRes.body.message).toBe('유효하지 않은 상품 id입니다.');
    });

    test('장바구니 상품 추가 시, 해당 상품이 존재하지 않는 경우 PRODUCT_NOT_FOUND 에러를 반환한다.', async () => {
      const addRes = await request(app).post('/cart/items').send({
        productId: 'unknown-product-id',
        purchaseQuantity: 1,
      });

      expect(addRes.status).toBe(404);
      expect(addRes.body.code).toBe('PRODUCT_NOT_FOUND');
      expect(addRes.body.message).toBe('존재하지 않는 상품입니다.');
    });

    test('장바구니 상품 추가 시, 구매 수량이 유효하지 않은 경우 INVALID_PURCHASE_QUANTITY 에러를 반환한다.', async () => {
      const product = seedProduct();

      const addRes = await request(app).post('/cart/items').send({
        productId: product.productId,
      });

      expect(addRes.status).toBe(400);
      expect(addRes.body.code).toBe('INVALID_PURCHASE_QUANTITY');
      expect(addRes.body.message).toBe('유효하지 않은 구매 수량입니다.');
    });

    test('장바구니 상품 추가 시, 구매 수량이 상품의 남은 수량보다 많으면 EXCEEDS_REMAINING_QUANTITY 에러를 반환한다.', async () => {
      const product = seedProduct('product-1', 1);

      const addRes = await request(app).post('/cart/items').send({
        productId: product.productId,
        purchaseQuantity: 2,
      });

      expect(addRes.status).toBe(400);
      expect(addRes.body.code).toBe('EXCEEDS_REMAINING_QUANTITY');
      expect(addRes.body.message).toBe('상품의 남은 수량을 초과했습니다.');
    });

    test('이미 장바구니에 담긴 상품을 다시 추가할 때 합산 수량이 상품의 남은 수량보다 많으면 EXCEEDS_REMAINING_QUANTITY 에러를 반환한다.', async () => {
      const product = seedProduct('product-1', 1);

      await request(app).post('/cart/items').send({
        productId: product.productId,
        purchaseQuantity: 1,
      });

      const addRes = await request(app).post('/cart/items').send({
        productId: product.productId,
        purchaseQuantity: 1,
      });

      expect(addRes.status).toBe(400);
      expect(addRes.body.code).toBe('EXCEEDS_REMAINING_QUANTITY');
      expect(addRes.body.message).toBe('상품의 남은 수량을 초과했습니다.');
    });
  });

  describe('장바구니 상품 수량 변경 에러 테스트', () => {
    test('장바구니 상품 수량 변경 시, cartItemId 형식이 유효하지 않은 경우 INVALID_CART_ITEM_ID 에러를 반환한다.', async () => {
      const patchRes = await request(app)
        .patch('/cart/items/%20')
        .send({ purchaseQuantity: 1 });

      expect(patchRes.status).toBe(400);
      expect(patchRes.body.code).toBe('INVALID_CART_ITEM_ID');
      expect(patchRes.body.message).toBe('유효하지 않은 장바구니 상품 id입니다.');
    });

    test('장바구니 상품 수량 변경 시, 해당 장바구니 상품이 존재하지 않는 경우 CART_ITEM_NOT_FOUND 에러를 반환한다.', async () => {
      const patchRes = await request(app)
        .patch('/cart/items/unknown-cart-item-id')
        .send({ purchaseQuantity: 1 });

      expect(patchRes.status).toBe(404);
      expect(patchRes.body.code).toBe('CART_ITEM_NOT_FOUND');
      expect(patchRes.body.message).toBe('존재하지 않는 장바구니 상품입니다.');
    });

    test('장바구니 상품 수량 변경 시, 구매 수량이 유효하지 않은 경우 INVALID_PURCHASE_QUANTITY 에러를 반환한다.', async () => {
      const product = seedProduct();

      const addRes = await request(app).post('/cart/items').send({
        productId: product.productId,
        purchaseQuantity: 1,
      });

      const patchRes = await request(app)
        .patch(`/cart/items/${addRes.body.cartItemId}`)
        .send({});

      expect(patchRes.status).toBe(400);
      expect(patchRes.body.code).toBe('INVALID_PURCHASE_QUANTITY');
      expect(patchRes.body.message).toBe('유효하지 않은 구매 수량입니다.');
    });

    test('장바구니 상품 수량 변경 시, 변경 수량이 상품의 남은 수량보다 많으면 EXCEEDS_REMAINING_QUANTITY 에러를 반환한다.', async () => {
      const product = seedProduct('product-1', 1);

      const addRes = await request(app).post('/cart/items').send({
        productId: product.productId,
        purchaseQuantity: 1,
      });

      const patchRes = await request(app)
        .patch(`/cart/items/${addRes.body.cartItemId}`)
        .send({ purchaseQuantity: 2 });

      expect(patchRes.status).toBe(400);
      expect(patchRes.body.code).toBe('EXCEEDS_REMAINING_QUANTITY');
      expect(patchRes.body.message).toBe('상품의 남은 수량을 초과했습니다.');
    });
  });

  describe('장바구니 상품 제거 에러 테스트', () => {
    test('장바구니 상품 제거 시, 해당 장바구니 상품이 존재하지 않는 경우 CART_ITEM_NOT_FOUND 에러를 반환한다.', async () => {
      const deleteRes = await request(app).delete(
        '/cart/items/unknown-cart-item-id',
      );

      expect(deleteRes.status).toBe(404);
      expect(deleteRes.body.code).toBe('CART_ITEM_NOT_FOUND');
      expect(deleteRes.body.message).toBe('존재하지 않는 장바구니 상품입니다.');
    });
  });
});
