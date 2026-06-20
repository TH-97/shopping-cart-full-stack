// 주문 요약 계산을 순수 함수로 모아 둔다(레이어·I/O 의존 없음).
// usecase가 cart/product/coupon을 조회해 여기에 값을 넘긴다.

export const FREE_SHIPPING_THRESHOLD = 100000;
export const BASE_SHIPPING_FEE = 3000;
export const REMOTE_AREA_SURCHARGE = 3000;

export type SelectedItem = { unitPrice: number; quantity: number };

// 선택 항목들의 (단가 × 수량) 합.
export const calculateOrderAmount = (items: SelectedItem[]): number =>
  items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

// 주문금액이 무료배송 기준 이상이면 도서산간이어도 0.
// 그 외에는 기본 배송비, 도서산간이면 추가 요금을 더한다.
export const calculateShippingFee = (
  orderAmount: number,
  isRemoteArea: boolean,
): number => {
  if (orderAmount >= FREE_SHIPPING_THRESHOLD) return 0;
  return BASE_SHIPPING_FEE + (isRemoteArea ? REMOTE_AREA_SURCHARGE : 0);
};

// 적용 쿠폰들의 할인 합. 총 할인은 (주문금액 + 배송비)를 넘지 못하고 0 미만이 되지 않는다.
export const sumCouponDiscount = (
  discounts: number[],
  orderAmount: number,
  shippingFee: number,
): number => {
  const total = discounts.reduce((sum, discount) => sum + discount, 0);
  const cap = orderAmount + shippingFee;
  return Math.min(Math.max(total, 0), cap);
};

// 최종 결제 금액 = 주문금액 - 쿠폰할인 + 배송비.
export const calculateTotalPayment = (
  orderAmount: number,
  couponDiscountAmount: number,
  shippingFee: number,
): number => orderAmount - couponDiscountAmount + shippingFee;
