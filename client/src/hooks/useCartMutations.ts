import { useReducer, useState } from 'react';
import { deleteCartItem, patchQuantity } from '../api/cartApi';
import { isValidQuantity } from '../utils/cart.utils';
import type { CartItemData } from '../types/cart';

type CartItemsAction =
  | { type: 'changeQuantity'; cartItemId: string; newQuantity: number }
  | { type: 'deleteItem'; cartItemId: string };

function cartItemsReducer(
  cartItems: CartItemData[],
  action: CartItemsAction,
): CartItemData[] {
  switch (action.type) {
    case 'changeQuantity':
      return cartItems.map((item) =>
        item.cartItemId === action.cartItemId
          ? { ...item, purchaseQuantity: action.newQuantity }
          : item,
      );
    case 'deleteItem':
      return cartItems.filter((item) => item.cartItemId !== action.cartItemId);
    default:
      throw new Error(`Unknown action: ${(action as CartItemsAction).type}`);
  }
}

export function useCartMutations(initialItems: CartItemData[]) {
  const [cartItems, dispatch] = useReducer(cartItemsReducer, initialItems);
  const [error, setError] = useState<string | null>(null);

  const changeQuantity = async (cartItemId: string, newQuantity: number) => {
    if (!isValidQuantity(newQuantity)) return;

    try {
      await patchQuantity(cartItemId, newQuantity);
      dispatch({ type: 'changeQuantity', cartItemId, newQuantity });
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const deleteItem = async (cartItemId: string) => {
    try {
      await deleteCartItem(cartItemId);
      dispatch({ type: 'deleteItem', cartItemId });
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return { cartItems, changeQuantity, deleteItem, error };
}
