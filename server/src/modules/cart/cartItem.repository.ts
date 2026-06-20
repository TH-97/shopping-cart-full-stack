import type { SupabaseClient } from '@supabase/supabase-js';
import { CartItem } from './cartItem.model.js';

export interface CartItemRepository {
  save(cartItem: CartItem): Promise<CartItem>;
  findAll(): Promise<CartItem[]>;
  findById(cartItemId: string): Promise<CartItem | undefined>;
  findByProductId(productId: string): Promise<CartItem | undefined>;
  deleteById(cartItemId: string): Promise<boolean>;
  deleteByProductId(productId: string): Promise<void>;
}

// 테스트·로컬용 인메모리 구현. 인터페이스는 비동기이므로 Promise를 반환한다.
export const createInMemoryCartItemRepository = (
  store: Map<string, CartItem>,
): CartItemRepository => ({
  async save(cartItem) {
    store.set(cartItem.cartItemId, cartItem);
    return cartItem;
  },

  async findAll() {
    return Array.from(store.values());
  },

  async findById(cartItemId) {
    return store.get(cartItemId);
  },

  async findByProductId(productId) {
    return [...store.values()].find(
      (cartItem) => cartItem.productId === productId,
    );
  },

  async deleteById(cartItemId) {
    return store.delete(cartItemId);
  },

  async deleteByProductId(productId) {
    [...store.values()]
      .filter((cartItem) => cartItem.productId === productId)
      .forEach((cartItem) => store.delete(cartItem.cartItemId));
  },
});

// 인메모리가 기본 팩토리(테스트·로컬). 프로덕션은 container가 Supabase 구현을 고른다.
export const createCartItemRepository = createInMemoryCartItemRepository;

const TABLE = 'cart_item';

const toCartItem = (row: {
  cart_item_id: string;
  product_id: string;
  purchase_quantity: number;
}): CartItem =>
  new CartItem({
    cartItemId: row.cart_item_id,
    productId: row.product_id,
    purchaseQuantity: row.purchase_quantity,
  });

export const createSupabaseCartItemRepository = (
  client: SupabaseClient,
): CartItemRepository => ({
  async save(cartItem) {
    const { error } = await client.from(TABLE).upsert({
      cart_item_id: cartItem.cartItemId,
      product_id: cartItem.productId,
      purchase_quantity: cartItem.purchaseQuantity,
    });
    if (error) throw new Error(error.message);
    return cartItem;
  },

  async findAll() {
    const { data, error } = await client.from(TABLE).select('*');
    if (error) throw new Error(error.message);
    return (data ?? []).map(toCartItem);
  },

  async findById(cartItemId) {
    const { data, error } = await client
      .from(TABLE)
      .select('*')
      .eq('cart_item_id', cartItemId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ? toCartItem(data) : undefined;
  },

  async findByProductId(productId) {
    const { data, error } = await client
      .from(TABLE)
      .select('*')
      .eq('product_id', productId)
      .limit(1)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ? toCartItem(data) : undefined;
  },

  async deleteById(cartItemId) {
    const { data, error } = await client
      .from(TABLE)
      .delete()
      .eq('cart_item_id', cartItemId)
      .select('cart_item_id');
    if (error) throw new Error(error.message);
    return (data ?? []).length > 0;
  },

  async deleteByProductId(productId) {
    const { error } = await client
      .from(TABLE)
      .delete()
      .eq('product_id', productId);
    if (error) throw new Error(error.message);
  },
});
