import { createApp } from './app.js';
import { createSupabaseClient } from './supabase.js';
import { createSupabaseCartItemRepository } from './modules/cart/cartItem.repository.js';
import { CartItemService } from './modules/cart/cartItem.service.js';
import { createSupabaseProductRepository } from './modules/products/product.repository.js';
import { ProductService } from './modules/products/product.service.js';
import { DeleteProductUseCase } from './application/deleteProduct.usecase.js';
import { createSupabaseCouponRepository } from './modules/coupon/coupon.repository.js';
import { CouponService } from './modules/coupon/coupon.service.js';
import { OrderSummaryUseCase } from './application/orderSummary.usecase.js';
import { GetOrderCouponsUseCase } from './application/getOrderCoupons.usecase.js';

// 인증이 없으므로 모든 쿠폰 조회는 데모 유저 기준으로 한다.
export const DEMO_USER_ID = process.env.DEMO_USER_ID ?? 'demo-user';

// 전역 단일 장바구니를 담는 데모 cart. cart_item.cart_id(NOT NULL) 충족용.
export const DEMO_CART_ID = process.env.DEMO_CART_ID ?? 'demo-cart';

// 프로덕션은 Supabase 전용이다. 자격증명이 없으면 createSupabaseClient가 throw해
// "Supabase 필수, 실패는 명확히" 동작을 보장한다. 인메모리 더블은 테스트 전용.
export const createRepositories = () => {
  const client = createSupabaseClient();
  return {
    productRepository: createSupabaseProductRepository(client),
    cartItemRepository: createSupabaseCartItemRepository(client, DEMO_CART_ID),
    couponRepository: createSupabaseCouponRepository(client, DEMO_USER_ID),
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
