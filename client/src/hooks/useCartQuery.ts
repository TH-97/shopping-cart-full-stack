import { useEffect, useState } from 'react';
import { fetchCartItems } from '../api/cartApi';
import type { CartItemData } from '../types/cart';

type CartStatus =
  | { status: 'loading' }
  | { status: 'error'; error: Error }
  | { status: 'ready'; cartItems: CartItemData[] };

export function useCartQuery() {
  const [status, setStatus] = useState<CartStatus>({ status: 'loading' });

  useEffect(() => {
    const loadCartItems = async () => {
      try {
        const data = await fetchCartItems();
        setStatus({ status: 'ready', cartItems: data });
      } catch (err) {
        setStatus({ status: 'error', error: err as Error });
      }
    };
    loadCartItems();
  }, []);

  return status;
}
