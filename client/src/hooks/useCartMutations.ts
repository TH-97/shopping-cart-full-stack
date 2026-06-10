import { useReducer } from 'react';
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

  const changeQuantity = async (cartItemId: string, newQuantity: number) => {
    if (!isValidQuantity(newQuantity)) return;

    await patchQuantity(cartItemId, newQuantity);
    dispatch({ type: 'changeQuantity', cartItemId, newQuantity });
  };

  const deleteItem = async (cartItemId: string) => {
    await deleteCartItem(cartItemId);
    dispatch({ type: 'deleteItem', cartItemId });
  };

  return { cartItems, changeQuantity, deleteItem };
}
