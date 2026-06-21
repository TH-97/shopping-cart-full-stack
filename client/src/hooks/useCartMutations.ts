import { useState } from 'react';
import { deleteCartItem, patchQuantity } from '../api/cartApi';
import { isValidQuantity } from '../utils/cart.utils';
import { queryStore } from '../queries/queryStore';
import { CART_QUERY_KEY } from './useCartQuery';

// cart mutation은 로컬 상태를 복제하지 않는다(SSOT).
// 서버 호출 성공 시 cart 쿼리를 invalidate → store가 재요청해 모든 구독자가 갱신된다.
export function useCartMutations() {
  const [error, setError] = useState<string | null>(null);

  const changeQuantity = async (cartItemId: string, newQuantity: number) => {
    if (!isValidQuantity(newQuantity)) return;

    try {
      await patchQuantity(cartItemId, newQuantity);
      setError(null);
      queryStore.invalidate(CART_QUERY_KEY);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const deleteItem = async (cartItemId: string) => {
    try {
      await deleteCartItem(cartItemId);
      setError(null);
      queryStore.invalidate(CART_QUERY_KEY);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return { changeQuantity, deleteItem, error };
}
