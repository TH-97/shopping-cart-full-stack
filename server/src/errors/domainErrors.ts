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

export const invalidCartItemIdsError = () =>
  new DomainError(
    'INVALID_CART_ITEM_IDS',
    '유효하지 않은 장바구니 상품 id 목록입니다.',
  );

export const invalidCouponIdsError = () =>
  new DomainError('INVALID_COUPON_IDS', '유효하지 않은 쿠폰 id 목록입니다.');

export const invalidIsRemoteAreaError = () =>
  new DomainError('INVALID_IS_REMOTE_AREA', '유효하지 않은 도서산간 여부입니다.');

export const exceedsCouponLimitError = () =>
  new DomainError('EXCEEDS_COUPON_LIMIT', '쿠폰은 최대 2장까지 사용할 수 있습니다.');

export const couponNotFoundError = () =>
  new DomainError('COUPON_NOT_FOUND', '존재하지 않는 쿠폰입니다.');

export const couponExpiredError = () =>
  new DomainError('COUPON_EXPIRED', '만료된 쿠폰입니다.');

export const couponAlreadyUsedError = () =>
  new DomainError('COUPON_ALREADY_USED', '이미 사용한 쿠폰입니다.');

export const couponNotApplicableError = () =>
  new DomainError('COUPON_NOT_APPLICABLE', '적용할 수 없는 쿠폰입니다.');
