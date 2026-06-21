import { useQuery } from './useQuery';
import { fetchCartItems } from '../api/cartApi';
import type { CartItemData } from '../types/cart';

export type CartQueryState =
  | { status: 'loading' }
  | { status: 'error'; error: Error }
  | { status: 'ready'; cartItems: CartItemData[] };

// 범용 useQuery 위에 얹은 cart 전용 훅.
// data → cartItems로만 매핑해 기존 소비처의 반환 모양을 유지한다.
export function useCartQuery(): CartQueryState {
  const state = useQuery(fetchCartItems);

  if (state.status === 'ready') {
    return { status: 'ready', cartItems: state.data };
  }

  return state;
}
