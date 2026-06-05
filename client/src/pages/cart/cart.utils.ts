interface CartItemData {
  cartItemId: string;
  productId: string;
  productName: string;
  productPrice: number;
  imageUrl: string;
  purchaseQuantity: number;
}

const FREE_DELIVERY_THRESHOLD = 100000;
const DELIVERY_CHARGE = 3000;

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
  return orderAmount >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_CHARGE;
}

export function isAllChecked(
  cartItems: CartItemData[],
  selectedIds: Set<string>,
): boolean {
  return cartItems.length > 0 && selectedIds.size === cartItems.length;
}
