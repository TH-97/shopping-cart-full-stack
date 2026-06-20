import express from 'express';
import cors from 'cors';
import { errorHandler } from './middlewares/errorHandlers.js';
import { notFoundHandler } from './middlewares/notFoundHandler.js';
import { createCartItemRouter } from './modules/cart/cartItem.routes.js';
import { CartItemService } from './modules/cart/cartItem.service.js';
import { createProductRouter } from './modules/products/product.routes.js';
import { ProductService } from './modules/products/product.service.js';
import { DeleteProductUseCase } from './application/deleteProduct.usecase.js';
import { createCouponRouter } from './modules/coupon/coupon.routes.js';
import { CouponService } from './modules/coupon/coupon.service.js';
import { createOrderRouter } from './modules/order/order.routes.js';
import { OrderSummaryUseCase } from './application/orderSummary.usecase.js';
import { GetOrderCouponsUseCase } from './application/getOrderCoupons.usecase.js';

export type AppDependencies = {
  productService: ProductService;
  cartItemService: CartItemService;
  deleteProductUseCase: DeleteProductUseCase;
  couponService: CouponService;
  orderSummaryUseCase: OrderSummaryUseCase;
  getOrderCouponsUseCase: GetOrderCouponsUseCase;
  userId: string;
};

export const createApp = ({
  productService,
  cartItemService,
  deleteProductUseCase,
  couponService,
  orderSummaryUseCase,
  getOrderCouponsUseCase,
  userId,
}: AppDependencies) => {
  const app = express();

  app.use(
    cors({
      origin: ['http://localhost:8080', 'https://th-97.github.io'],
      credentials: true,
    }),
  );
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use(createProductRouter(productService, deleteProductUseCase));
  app.use(createCartItemRouter(cartItemService));
  app.use(createOrderRouter(orderSummaryUseCase));
  app.use(
    createCouponRouter({ getOrderCouponsUseCase, couponService, userId }),
  );

  // 매칭 안 된 경로는 JSON 404로, 그 외 던져진 에러는 errorHandler로.
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
