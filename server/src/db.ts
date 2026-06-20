import type { CartItem } from './modules/cart/cartItem.model.js';
import type { Product } from './modules/products/product.model.js';

export type Stores = {
  productsDB: Map<string, Product>;
  cartItemsDB: Map<string, CartItem>;
};

export const createStores = (): Stores => ({
  productsDB: new Map<string, Product>(),
  cartItemsDB: new Map<string, CartItem>(),
});
