import type { CartItem } from './modules/cart/cartItem.model.js';
import type { Coupon } from './modules/coupon/coupon.model.js';
import type { UserCouponRow } from './modules/coupon/coupon.repository.js';
import type { Product } from './modules/products/product.model.js';

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
