import { createApp } from './app.js';
import { createStores, type Stores } from './db.js';
import { createSupabaseClient, hasSupabaseCredentials } from './supabase.js';
import {
  createInMemoryCartItemRepository,
  createSupabaseCartItemRepository,
} from './modules/cart/cartItem.repository.js';
import { CartItemService } from './modules/cart/cartItem.service.js';
import {
  createInMemoryProductRepository,
  createSupabaseProductRepository,
} from './modules/products/product.repository.js';
import { ProductService } from './modules/products/product.service.js';
import { DeleteProductUseCase } from './application/deleteProduct.usecase.js';
import {
  createInMemoryCouponRepository,
  createSupabaseCouponRepository,
} from './modules/coupon/coupon.repository.js';
import { CouponService } from './modules/coupon/coupon.service.js';
import { OrderSummaryUseCase } from './application/orderSummary.usecase.js';
import { GetOrderCouponsUseCase } from './application/getOrderCoupons.usecase.js';
import { seedDemoCoupons } from './modules/coupon/coupon.seed.js';

// 인증이 없으므로 모든 쿠폰 조회는 데모 유저 기준으로 한다.
export const DEMO_USER_ID = process.env.DEMO_USER_ID ?? 'demo-user';

export const createRepositories = () => {
  // 자격증명이 있으면 Supabase, 없으면(테스트·로컬) 인메모리로 폴백한다.
  if (hasSupabaseCredentials()) {
    const client = createSupabaseClient();
    return {
      productRepository: createSupabaseProductRepository(client),
      cartItemRepository: createSupabaseCartItemRepository(client),
      couponRepository: createSupabaseCouponRepository(client, DEMO_USER_ID),
    };
  }

  const stores = createStores();
  // 인메모리 경로에서는 데모 쿠폰을 시드해 GET /coupons가 데이터를 반환하게 한다.
  seedDemoCoupons(stores, DEMO_USER_ID);

  return {
    productRepository: createInMemoryProductRepository(stores.productsDB),
    cartItemRepository: createInMemoryCartItemRepository(stores.cartItemsDB),
    couponRepository: createInMemoryCouponRepository(
      stores.couponsDB,
      stores.userCouponsDB,
      DEMO_USER_ID,
    ),
  };
};

export const createServices = ({
  productRepository,
  cartItemRepository,
  couponRepository,
}: ReturnType<typeof createRepositories>) => ({
  productService: new ProductService(productRepository),
  cartItemService: new CartItemService(cartItemRepository, productRepository),
  couponService: new CouponService(couponRepository),
});

export const bootstrapApp = () => {
  const repositories = createRepositories();
  const services = createServices(repositories);

  const deleteProductUseCase = new DeleteProductUseCase(
    services.productService,
    services.cartItemService,
  );
  const orderSummaryUseCase = new OrderSummaryUseCase(
    repositories.cartItemRepository,
    repositories.productRepository,
    repositories.couponRepository,
  );
  const getOrderCouponsUseCase = new GetOrderCouponsUseCase(
    repositories.cartItemRepository,
    repositories.productRepository,
    repositories.couponRepository,
  );

  return createApp({
    ...services,
    deleteProductUseCase,
    orderSummaryUseCase,
    getOrderCouponsUseCase,
    userId: DEMO_USER_ID,
  });
};

export type { Stores };
