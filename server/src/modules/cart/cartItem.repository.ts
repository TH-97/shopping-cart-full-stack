import type { CartItem } from './cartItem.model.js';

export interface CartItemRepository {
  save(cartItem: CartItem): CartItem;
  findAll(): CartItem[];
  findById(cartItemId: string): CartItem | undefined;
  findByProductId(productId: string): CartItem | undefined;
  deleteById(cartItemId: string): boolean;
  deleteByProductId(productId: string): void;
}

const createMemoryCartItemRepository = (
  store: Map<string, CartItem>,
): CartItemRepository => ({
  save(cartItem: CartItem) {
    store.set(cartItem.cartItemId, cartItem);
    return cartItem;
  },

  findAll() {
    return Array.from(store.values());
  },

  findById(cartItemId: string) {
    return store.get(cartItemId);
  },

  findByProductId(productId: string) {
    return [...store.values()].find(
      (cartItem) => cartItem.productId === productId,
    );
  },

  deleteById(cartItemId: string) {
    return store.delete(cartItemId);
  },

  deleteByProductId(productId: string) {
    [...store.values()]
      .filter((cartItem) => cartItem.productId === productId)
      .forEach((cartItem) => store.delete(cartItem.cartItemId));
  },
});

export const createCartItemRepository = createMemoryCartItemRepository;
