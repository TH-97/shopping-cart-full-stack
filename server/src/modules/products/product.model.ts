import {
  invalidProductNameError,
  invalidProductPriceError,
  invalidRemainingQuantityError,
} from '../../errors/domainErrors.js';

export type ProductProps = {
  productId: string;
  productName: string;
  productPrice: number;
  remainingQuantity: number;
  imageUrl?: string;
};

export class Product {
  productId;
  productName;
  productPrice;
  remainingQuantity;
  imageUrl?;

  constructor(product: ProductProps) {
    this.validate(product);

    this.productId = product.productId;
    this.productName = product.productName;
    this.productPrice = product.productPrice;
    this.remainingQuantity = product.remainingQuantity;
    this.imageUrl = product.imageUrl;
  }

  private validate(product: ProductProps) {
    this.validateProductName(product.productName);
    this.validateProductPrice(product.productPrice);
    this.validateRemainingQuantity(product.remainingQuantity);
  }

  private validateProductName(productName: string) {
    if (productName.trim() === '' || productName.length > 100)
      throw invalidProductNameError();
  }

  private validateProductPrice(productPrice: number) {
    if (!Number.isFinite(productPrice) || productPrice <= 0)
      throw invalidProductPriceError();
  }

  private validateRemainingQuantity(remainingQuantity: number) {
    if (
      !Number.isInteger(remainingQuantity) ||
      remainingQuantity < 1 ||
      remainingQuantity > 99
    )
      throw invalidRemainingQuantityError();
  }
}
