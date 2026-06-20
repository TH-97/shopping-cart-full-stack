import { createApp } from '../../src/app.js';
import { CartItemService } from '../../src/modules/cart/cartItem.service.js';
import { ProductService } from '../../src/modules/products/product.service.js';
import { CouponService } from '../../src/modules/coupon/coupon.service.js';
import { DeleteProductUseCase } from '../../src/application/deleteProduct.usecase.js';
import { OrderSummaryUseCase } from '../../src/application/orderSummary.usecase.js';
import { GetOrderCouponsUseCase } from '../../src/application/getOrderCoupons.usecase.js';
import {
  createInMemoryCartItemRepository,
  createInMemoryCouponRepository,
  createInMemoryProductRepository,
} from './inMemoryRepositories.js';
import { createStores } from './stores.js';
import { seedDemoCoupons } from './seedDemoCoupons.js';

const TEST_USER_ID = 'demo-user';

// 인메모리 더블로 createApp을 조립하는 테스트용 헬퍼.
// 프로덕션 container는 Supabase 자격증명을 요구하므로 테스트에서는 이걸 쓴다.
export const createTestApp = () => {
  const stores = createStores();
  seedDemoCoupons(stores, TEST_USER_ID);

  const productRepository = createInMemoryProductRepository(stores.productsDB);
  const cartItemRepository = createInMemoryCartItemRepository(
    stores.cartItemsDB,
  );
  const couponRepository = createInMemoryCouponRepository(
    stores.couponsDB,
    stores.userCouponsDB,
    TEST_USER_ID,
  );

  const productService = new ProductService(productRepository);
  const cartItemService = new CartItemService(
    cartItemRepository,
    productRepository,
  );
  const couponService = new CouponService(couponRepository);

  const deleteProductUseCase = new DeleteProductUseCase(
    productService,
    cartItemService,
  );
  const orderSummaryUseCase = new OrderSummaryUseCase(
    cartItemRepository,
    productRepository,
    couponRepository,
  );
  const getOrderCouponsUseCase = new GetOrderCouponsUseCase(
    cartItemRepository,
    productRepository,
    couponRepository,
  );

  return createApp({
    productService,
    cartItemService,
    couponService,
    deleteProductUseCase,
    orderSummaryUseCase,
    getOrderCouponsUseCase,
    userId: TEST_USER_ID,
  });
};
