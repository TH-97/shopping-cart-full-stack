import type { CartItemData } from '../types/cart';

const BASE_URL =
  'https://shopping-cart-full-stack-production-7ca8.up.railway.app';

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
  await fetch(`${BASE_URL}/cart/items/${cartItemId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ purchaseQuantity }),
  });
}

export async function deleteCartItem(cartItemId: string): Promise<void> {
  await fetch(`${BASE_URL}/cart/items/${cartItemId}`, { method: 'DELETE' });
}
