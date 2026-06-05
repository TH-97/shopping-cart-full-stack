import { useEffect, useState } from 'react';
import { isValidQuantity } from './cart.utils';
import type { CartItemData } from '../../types/cart';

const BASE_URL =
  'https://shopping-cart-full-stack-production-7ca8.up.railway.app';

type CartStatus =
  | { status: 'loading' }
  | { status: 'error'; error: Error }
  | { status: 'ready' };

export function useCart() {
  const [state, setState] = useState<CartStatus>({ status: 'loading' });
  const [cartItems, setCartItems] = useState<CartItemData[]>([]);

  useEffect(() => {
    const fetchCartItems = async () => {
      try {
        const response = await fetch(`${BASE_URL}/cart/items`);
        if (!response.ok) {
          throw new Error('장바구니를 불러오지 못했습니다.');
        }
        const data: CartItemData[] = await response.json();
        setCartItems(data);
        setState({ status: 'ready' });
      } catch (err) {
        setState({ status: 'error', error: err as Error });
      }
    };
    fetchCartItems();
  }, []);

  const changeQuantity = async (cartItemId: string, newQuantity: number) => {
    if (!isValidQuantity(newQuantity)) return;

    await fetch(`${BASE_URL}/cart/items/${cartItemId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ purchaseQuantity: newQuantity }),
    });

    setCartItems((prev) =>
      prev.map((item) =>
        item.cartItemId === cartItemId
          ? { ...item, purchaseQuantity: newQuantity }
          : item,
      ),
    );
  };

  const deleteItem = async (cartItemId: string) => {
    await fetch(`${BASE_URL}/cart/items/${cartItemId}`, { method: 'DELETE' });
    setCartItems((prev) =>
      prev.filter((item) => item.cartItemId !== cartItemId),
    );
  };

  return { state, cartItems, changeQuantity, deleteItem };
}
