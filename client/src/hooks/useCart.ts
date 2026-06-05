import { useEffect, useState } from 'react';
import {
  deleteCartItem,
  fetchCartItems,
  patchQuantity,
} from '../api/cartApi';
import { isValidQuantity } from '../utils/cart.utils';
import type { CartItemData } from '../types/cart';

type CartStatus =
  | { status: 'loading' }
  | { status: 'error'; error: Error }
  | { status: 'ready' };

export function useCart() {
  const [state, setState] = useState<CartStatus>({ status: 'loading' });
  const [cartItems, setCartItems] = useState<CartItemData[]>([]);

  useEffect(() => {
    const loadCartItems = async () => {
      try {
        const data = await fetchCartItems();
        setCartItems(data);
        setState({ status: 'ready' });
      } catch (err) {
        setState({ status: 'error', error: err as Error });
      }
    };
    loadCartItems();
  }, []);

  const changeQuantity = async (cartItemId: string, newQuantity: number) => {
    if (!isValidQuantity(newQuantity)) return;

    await patchQuantity(cartItemId, newQuantity);

    setCartItems((prev) =>
      prev.map((item) =>
        item.cartItemId === cartItemId
          ? { ...item, purchaseQuantity: newQuantity }
          : item,
      ),
    );
  };

  const deleteItem = async (cartItemId: string) => {
    await deleteCartItem(cartItemId);
    setCartItems((prev) =>
      prev.filter((item) => item.cartItemId !== cartItemId),
    );
  };

  return { state, cartItems, changeQuantity, deleteItem };
}
