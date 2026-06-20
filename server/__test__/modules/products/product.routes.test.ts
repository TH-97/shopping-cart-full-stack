import express from 'express';
import request from 'supertest';
import { errorHandler } from '../../../src/middlewares/errorHandlers.js';
import { CartItem } from '../../../src/modules/cart/cartItem.model.js';
import { CartItemService } from '../../../src/modules/cart/cartItem.service.js';
import { createProductRouter } from '../../../src/modules/products/product.routes.js';
import {
  createInMemoryCartItemRepository,
  createInMemoryProductRepository,
} from '../../support/inMemoryRepositories.js';
import { ProductService } from '../../../src/modules/products/product.service.js';
import { DeleteProductUseCase } from '../../../src/application/deleteProduct.usecase.js';

const mockProduct = {
  productId: '1',
  productName: 'testName',
  productPrice: 1300,
  remainingQuantity: 25,
  imageUrl: 'src/assets/test.png',
};

let cartItemRepository: ReturnType<typeof createInMemoryCartItemRepository>;
let app: express.Express;

beforeEach(() => {
  const productRepository = createInMemoryProductRepository(new Map());
  cartItemRepository = createInMemoryCartItemRepository(new Map());
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

describe('상품 API', () => {
  it('상품 목록 요청', async () => {
    const response = await request(app).get('/products');

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });
  it('상품 목록 요청 시 응답 모양으로 변환되어 내려온다', async () => {
    const created = await request(app).post('/products').send({
      productName: mockProduct.productName,
      productPrice: mockProduct.productPrice,
      remainingQuantity: mockProduct.remainingQuantity,
      imageUrl: mockProduct.imageUrl,
    });

    const response = await request(app).get('/products');

    expect(response.status).toBe(200);
    expect(response.body).toEqual([
      {
        productId: created.body.productId,
        productName: mockProduct.productName,
        productPrice: mockProduct.productPrice,
        remainingQuantity: mockProduct.remainingQuantity,
        imageUrl: mockProduct.imageUrl,
      },
    ]);
  });
  it('상품 추가', async () => {
    const response = await request(app).post('/products').send({
      productName: mockProduct.productName,
      productPrice: mockProduct.productPrice,
      remainingQuantity: mockProduct.remainingQuantity,
      imageUrl: mockProduct.imageUrl,
    });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({ productId: expect.any(String) });
  });
  it('상품 삭제', async () => {
    const response = await request(app).post('/products').send({
      productName: mockProduct.productName,
      productPrice: mockProduct.productPrice,
      remainingQuantity: mockProduct.remainingQuantity,
      imageUrl: mockProduct.imageUrl,
    });

    const deleteRes = await request(app).delete(
      `/products/${response.body.productId}`,
    );
    expect(deleteRes.status).toBe(204);
  });

  it('상품을 삭제하면 장바구니에 담긴 동일한 상품도 함께 삭제된다', async () => {
    const productRes = await request(app).post('/products').send({
      productName: mockProduct.productName,
      productPrice: mockProduct.productPrice,
      remainingQuantity: mockProduct.remainingQuantity,
      imageUrl: mockProduct.imageUrl,
    });
    const { productId } = productRes.body;

    await cartItemRepository.save(
      new CartItem({
        cartItemId: 'cart-item-1',
        productId,
        purchaseQuantity: 2,
      }),
    );

    const deleteRes = await request(app).delete(`/products/${productId}`);

    expect(deleteRes.status).toBe(204);
    expect(await cartItemRepository.findByProductId(productId)).toBeUndefined();
  });
});
