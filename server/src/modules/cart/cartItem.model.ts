import { invalidPurchaseQuantityError } from '../../errors/domainErrors.js';

export type CartItemProps = {
  cartItemId: string;
  productId: string;
  purchaseQuantity: number;
};

export class CartItem {
  cartItemId;
  productId;
  purchaseQuantity;

  constructor(cartItem: CartItemProps) {
    this.validatePurchaseQuantity(cartItem.purchaseQuantity);

    this.cartItemId = cartItem.cartItemId;
    this.productId = cartItem.productId;
    this.purchaseQuantity = cartItem.purchaseQuantity;
  }

  changeQuantityTo(quantity: number) {
    this.validatePurchaseQuantity(quantity);
    this.purchaseQuantity = quantity;
  }

  private validatePurchaseQuantity(quantity: number) {
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
      throw invalidPurchaseQuantityError();
    }
  }
}
