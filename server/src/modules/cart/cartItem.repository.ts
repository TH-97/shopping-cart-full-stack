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
