import {
  invalidCartItemIdError,
  invalidProductIdError,
  invalidPurchaseQuantityError,
} from '../../errors/domainErrors.js';
import {
  requireBody,
  requireNonEmptyString,
  requireNumber,
} from '../../shared/requestParsing.js';
import type { Product } from '../products/product.model.js';
import type { CartItem } from './cartItem.model.js';

export const parseAddCartItemDto = (body: unknown) => {
  const requestBody = requireBody(body, invalidProductIdError);

  return {
    productId: requireNonEmptyString(
      requestBody.productId,
      invalidProductIdError,
    ),
    purchaseQuantity: requireNumber(
      requestBody.purchaseQuantity,
      invalidPurchaseQuantityError,
    ),
  };
};

export const parseChangeCartItemQuantityDto = (
  params: { cartItemId?: unknown },
  body: unknown,
) => {
  const requestBody = requireBody(body, invalidPurchaseQuantityError);

  return {
    cartItemId: requireNonEmptyString(
      params.cartItemId,
      invalidCartItemIdError,
    ),
    purchaseQuantity: requireNumber(
      requestBody.purchaseQuantity,
      invalidPurchaseQuantityError,
    ),
  };
};

export const parseCartItemIdDto = (params: {
  cartItemId?: unknown;
}) => ({
  cartItemId: requireNonEmptyString(params.cartItemId, invalidCartItemIdError),
});

// 장바구니 항목 + 상품(조인 결과)을 클라이언트 응답 모양으로 변환한다.
// 상품이 없으면(orphan) 상품 필드는 undefined로 내려간다.
export const toCartItemResponse = (
  cartItem: CartItem,
  product: Product | undefined,
) => ({
  cartItemId: cartItem.cartItemId,
  productId: cartItem.productId,
  productName: product?.productName,
  productPrice: product?.productPrice,
  imageUrl: product?.imageUrl,
  purchaseQuantity: cartItem.purchaseQuantity,
});
