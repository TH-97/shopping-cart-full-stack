import type { CartItemData } from '../types/cart';
import { API_BASE_URL as BASE_URL } from './config';

export async function fetchCartItems(): Promise<CartItemData[]> {
  const response = await fetch(`${BASE_URL}/cart/items`);
  if (!response.ok) {
    throw new Error('장바구니를 불러오지 못했습니다.');
  }
  return response.json();
}

export async function patchQuantity(
  cartItemId: string,
  purchaseQuantity: number,
): Promise<void> {
  const response = await fetch(`${BASE_URL}/cart/items/${cartItemId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ purchaseQuantity }),
  });
  if (!response.ok) {
    throw new Error('수량을 변경하지 못했습니다.');
  }
}

export async function deleteCartItem(cartItemId: string): Promise<void> {
  const response = await fetch(`${BASE_URL}/cart/items/${cartItemId}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('상품을 삭제하지 못했습니다.');
  }
}
