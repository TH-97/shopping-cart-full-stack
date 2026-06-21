// 주문 요약 계산을 순수 함수로 모아 둔다(레이어·I/O 의존 없음).
// usecase가 cart/product/coupon을 조회해 여기에 값을 넘긴다.
import type { DiscountType } from '../coupon/coupon.model.js';

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

// 트랙 A(상품금액) 한 단계 적용을 표현하는 입력.
// discountType은 적용 순서 정렬(정액 먼저 → 정율 나중)에만 쓰고, applyTo가 실제 차감액을 만든다.
export type ProductCoupon = {
  discountType: DiscountType;
  // 현재 시점 amount를 받아 그 시점 기준 할인액을 돌려준다(정율은 amount 비례).
  applyTo: (amount: number) => number;
};

// 정액 먼저, 정율 나중으로 정렬한다. 같은 타입끼리의 상대 순서는 입력 순서를 유지한다.
const DISCOUNT_ORDER: Record<DiscountType, number> = {
  FIXED: 0,
  PERCENTAGE: 1,
};

// 트랙 A: 상품금액에 쿠폰을 정액→정율 순서로 순차 적용한다.
// 각 단계 amount = max(amount - 그 시점 할인액, 0). 정율은 갱신된 amount 기준.
// 반환값은 상품 할인 합(orderAmount - 최종 amount).
export const calculateProductDiscount = (
  orderAmount: number,
  coupons: ProductCoupon[],
): number => {
  const ordered = [...coupons].sort(
    (a, b) => DISCOUNT_ORDER[a.discountType] - DISCOUNT_ORDER[b.discountType],
  );

  let amount = orderAmount;
  for (const coupon of ordered) {
    const discount = coupon.applyTo(amount);
    amount = Math.max(amount - discount, 0);
  }

  return orderAmount - amount;
};

// 트랙 B: FREESHIPPING이 있으면 배송비 전액(도서산간 추가분 포함)을 할인, 없으면 0.
export const calculateShippingDiscount = (
  baseShippingFee: number,
  hasFreeShipping: boolean,
): number => (hasFreeShipping ? baseShippingFee : 0);

// 최종 결제 금액 = 주문금액 - 쿠폰할인 + 기준배송비.
// (= (orderAmount - productDiscount) + finalShippingFee 와 동치)
export const calculateTotalPayment = (
  orderAmount: number,
  couponDiscountAmount: number,
  baseShippingFee: number,
): number => orderAmount - couponDiscountAmount + baseShippingFee;
