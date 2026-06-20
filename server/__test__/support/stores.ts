import type { CartItem } from '../../src/modules/cart/cartItem.model.js';
import type { Coupon } from '../../src/modules/coupon/coupon.model.js';
import type { Product } from '../../src/modules/products/product.model.js';
import type { UserCouponRow } from './inMemoryRepositories.js';

// 인메모리 더블이 쓰는 Map 묶음. 테스트 전용(프로덕션은 Supabase).
export type Stores = {
  productsDB: Map<string, Product>;
  cartItemsDB: Map<string, CartItem>;
  couponsDB: Map<string, Coupon>;
  userCouponsDB: Map<string, UserCouponRow>;
};

export const createStores = (): Stores => ({
  productsDB: new Map<string, Product>(),
  cartItemsDB: new Map<string, CartItem>(),
  couponsDB: new Map<string, Coupon>(),
  userCouponsDB: new Map<string, UserCouponRow>(),
});
