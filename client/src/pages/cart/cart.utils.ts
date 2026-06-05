interface CartItemData {
  cartItemId: string;
  productId: string;
  productName: string;
  productPrice: number;
  imageUrl: string;
  purchaseQuantity: number;
}

export function isValidQuantity(quantity: number): boolean {
  return quantity >= 1 && quantity <= 99;
}

export function calculateOrderAmount(
  cartItems: CartItemData[],
  selectedIds: Set<string>,
): number {
  return cartItems.reduce((sum, item) => {
    if (!selectedIds.has(item.cartItemId)) return sum;
    return sum + item.productPrice * item.purchaseQuantity;
  }, 0);
}

export function calculateDeliveryFee(orderAmount: number): number {
  return orderAmount >= 100000 ? 0 : 3000;
}

export function isAllChecked(
  cartItems: CartItemData[],
  selectedIds: Set<string>,
): boolean {
  return cartItems.length > 0 && selectedIds.size === cartItems.length;
}

export function toggleId(selectedIds: Set<string>, id: string): Set<string> {
  const next = new Set(selectedIds);

  if (next.has(id)) {
    next.delete(id);
  } else {
    next.add(id);
  }
  return next;
}
