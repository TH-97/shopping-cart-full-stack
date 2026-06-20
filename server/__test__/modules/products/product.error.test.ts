import express from 'express';
import request from 'supertest';
import { errorHandler } from '../../../src/middlewares/errorHandlers.js';
import { CartItemService } from '../../../src/modules/cart/cartItem.service.js';
import { createProductRouter } from '../../../src/modules/products/product.routes.js';
import {
  createInMemoryCartItemRepository,
  createInMemoryProductRepository,
} from '../../support/inMemoryRepositories.js';
import { ProductService } from '../../../src/modules/products/product.service.js';
import { DeleteProductUseCase } from '../../../src/application/deleteProduct.usecase.js';

let app: express.Express;

beforeEach(() => {
  const productRepository = createInMemoryProductRepository(new Map());
  const cartItemRepository = createInMemoryCartItemRepository(new Map());
  const productService = new ProductService(productRepository);
  const cartItemService = new CartItemService(
    cartItemRepository,
    productRepository,
  );
  const deleteProductUseCase = new DeleteProductUseCase(
    productService,
    cartItemService,
  );

  app = express();
  app.use(express.json());
  app.use(createProductRouter(productService, deleteProductUseCase));
  app.use(errorHandler);
});

describe('상품 에러 테스트', () => {
  describe('상품 추가 에러 테스트', () => {
    test('상품 추가 시, 상품의 이름이 유효하지 않은 경우 INVALID_PRODUCT_NAME 에러를 반환한다.', async () => {
      const addRes = await request(app).post('/products').send({
        productPrice: 1300,
        remainingQuantity: 25,
        imageUrl: 'src/assets/coke.png',
      });

      expect(addRes.status).toBe(400);
      expect(addRes.body.code).toBe('INVALID_PRODUCT_NAME');
      expect(addRes.body.message).toEqual('유효하지 않은 상품 이름입니다.');
    });

    test('상품 추가 시, 상품의 가격이 유효하지 않은 경우 INVALID_PRODUCT_PRICE 에러를 반환한다.', async () => {
      const addRes = await request(app).post('/products').send({
        productName: '콜라',
        remainingQuantity: 25,
        imageUrl: 'src/assets/coke.png',
      });

      expect(addRes.status).toBe(400);
      expect(addRes.body.code).toBe('INVALID_PRODUCT_PRICE');
      expect(addRes.body.message).toEqual('유효하지 않은 상품 가격입니다.');
    });

    test('상품 추가 시, 상품의 수량이 유효하지 않은 경우 INVALID_REMAINING_QUANTITY 에러를 반환한다.', async () => {
      const addRes = await request(app).post('/products').send({
        productName: '콜라',
        productPrice: 1300,
        imageUrl: 'src/assets/coke.png',
      });

      expect(addRes.status).toBe(400);
      expect(addRes.body.code).toBe('INVALID_REMAINING_QUANTITY');
      expect(addRes.body.message).toEqual('유효하지 않은 상품 수량입니다.');
    });

    test('상품 추가 시, 상품의 이미지 경로가 유효하지 않은 경우 INVALID_IMAGE_URL 에러를 반환한다.', async () => {
      const addRes = await request(app).post('/products').send({
        productName: '콜라',
        productPrice: 1300,
        remainingQuantity: 100,
        imageUrl: ' ',
      });

      expect(addRes.status).toBe(400);
      expect(addRes.body.code).toBe('INVALID_IMAGE_URL');
      expect(addRes.body.message).toEqual('유효하지 않은 이미지 경로입니다.');
    });

    test('상품 추가 시, 도메인 검증(수량 범위)에 걸리면 INVALID_REMAINING_QUANTITY 에러를 반환한다.', async () => {
      const addRes = await request(app).post('/products').send({
        productName: '콜라',
        productPrice: 1300,
        remainingQuantity: 100,
        imageUrl: 'src/assets/coke.png',
      });

      expect(addRes.status).toBe(400);
      expect(addRes.body.code).toBe('INVALID_REMAINING_QUANTITY');
      expect(addRes.body.message).toEqual('유효하지 않은 상품 수량입니다.');
    });
  });

  describe('상품 삭제 에러 테스트', () => {
    test('상품 삭제 시, 해당 상품이 존재하지 않는 경우 PRODUCT_NOT_FOUND 에러를 반환한다.', async () => {
      const deleteRes = await request(app).delete(`/products/123123`);
      expect(deleteRes.status).toBe(404);
      expect(deleteRes.body.code).toEqual('PRODUCT_NOT_FOUND');
      expect(deleteRes.body.message).toEqual('존재하지 않는 상품입니다.');
    });
  });
});
