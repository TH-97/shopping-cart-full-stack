import { DomainError } from './DomainError.js';

// throw 지점에서 상태코드를 직접 지정하지 않도록 에러 생성 팩토리를 제공한다.
// 상태코드는 STATUS_BY_CODE 매핑에서 결정된다.
export const invalidProductNameError = () =>
  new DomainError('INVALID_PRODUCT_NAME', '유효하지 않은 상품 이름입니다.');

export const invalidProductPriceError = () =>
  new DomainError('INVALID_PRODUCT_PRICE', '유효하지 않은 상품 가격입니다.');

export const invalidRemainingQuantityError = () =>
  new DomainError('INVALID_REMAINING_QUANTITY', '유효하지 않은 상품 수량입니다.');

export const invalidImageUrlError = () =>
  new DomainError('INVALID_IMAGE_URL', '유효하지 않은 이미지 경로입니다.');

export const invalidProductIdError = () =>
  new DomainError('INVALID_PRODUCT_ID', '유효하지 않은 상품 id입니다.');

export const invalidPurchaseQuantityError = () =>
  new DomainError('INVALID_PURCHASE_QUANTITY', '유효하지 않은 구매 수량입니다.');

export const invalidCartItemIdError = () =>
  new DomainError('INVALID_CART_ITEM_ID', '유효하지 않은 장바구니 상품 id입니다.');

export const exceedsRemainingQuantityError = () =>
  new DomainError('EXCEEDS_REMAINING_QUANTITY', '상품의 남은 수량을 초과했습니다.');

export const productNotFoundError = () =>
  new DomainError('PRODUCT_NOT_FOUND', '존재하지 않는 상품입니다.');

export const cartItemNotFoundError = () =>
  new DomainError('CART_ITEM_NOT_FOUND', '존재하지 않는 장바구니 상품입니다.');
