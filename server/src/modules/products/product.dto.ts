import {
  invalidImageUrlError,
  invalidProductIdError,
  invalidProductNameError,
  invalidProductPriceError,
  invalidRemainingQuantityError,
} from '../../errors/domainErrors.js';
import {
  requireBody,
  requireNonEmptyString,
  requireNumber,
  requireString,
} from '../../shared/requestParsing.js';
import type { Product } from './product.model.js';

const parseImageUrl = (value: unknown): string | undefined => {
  if (value === undefined) return undefined;
  if (typeof value !== 'string' || value.trim() === '')
    throw invalidImageUrlError();
  return value;
};

export const parseCreateProductDto = (body: unknown) => {
  const requestBody = requireBody(body, invalidProductNameError);

  return {
    productName: requireString(requestBody.productName, invalidProductNameError),
    productPrice: requireNumber(
      requestBody.productPrice,
      invalidProductPriceError,
    ),
    remainingQuantity: requireNumber(
      requestBody.remainingQuantity,
      invalidRemainingQuantityError,
    ),
    imageUrl: parseImageUrl(requestBody.imageUrl),
  };
};

export const parseProductIdDto = (params: { productId?: unknown }) => ({
  productId: requireNonEmptyString(params.productId, invalidProductIdError),
});

// 상품 엔티티를 클라이언트 응답 모양으로 변환한다.
// 엔티티를 그대로 직렬화하지 않고, 내보낼 필드를 여기서 명시적으로 통제한다.
export const toProductResponse = (product: Product) => ({
  productId: product.productId,
  productName: product.productName,
  productPrice: product.productPrice,
  remainingQuantity: product.remainingQuantity,
  imageUrl: product.imageUrl,
});
