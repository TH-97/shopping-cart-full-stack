// 쿠폰 할인 계산을 모아 둔 순수 함수 모듈(레이어·I/O 의존 없음).
// 주문 요약(orderSummary)과 쿠폰 추천(getOrderCoupons)이 함께 쓴다.
import type { Coupon, CouponContext } from '../modules/coupon/coupon.model.js';
import { MAX_COUPON_COUNT } from '../modules/coupon/coupon.service.js';
import {
  calculateProductDiscount,
  calculateShippingDiscount,
  type ProductCoupon,
} from '../modules/order/order.calculation.js';

// 쿠폰 조합의 총할인액(= 상품할인 + 배송할인)을 계산한다.
// 트랙 A(상품금액): FREESHIPPING을 제외하고 정액→정율 순서로 순차 적용.
// 트랙 B(배송비): FREESHIPPING이 있으면 ctx.shippingFee 전액 할인.
// ctx.orderAmount / ctx.shippingFee는 쿠폰 적용 전 기준 금액(배송비는 도서산간 추가분 포함 가능)이다.
export const calculateCouponDiscount = (
  coupons: Coupon[],
  ctx: CouponContext,
): number => {
  // 트랙 A: 정액 먼저 → 정율 나중 순차 적용. FREESHIPPING은 제외.
  const productCoupons = coupons
    .filter((coupon) => coupon.code !== 'FREESHIPPING')
    .map((coupon): ProductCoupon => ({
      discountType: coupon.discountType,
      applyTo: (amount) =>
        coupon.calculateDiscount({ ...ctx, orderAmount: amount }),
    }));
  const productDiscount = calculateProductDiscount(ctx.orderAmount, productCoupons);

  // 트랙 B: FREESHIPPING이 있으면 배송비 전액 할인.
  const hasFreeShipping = coupons.some(
    (coupon) => coupon.code === 'FREESHIPPING',
  );
  const shippingDiscount = calculateShippingDiscount(
    ctx.shippingFee,
    hasFreeShipping,
  );

  return productDiscount + shippingDiscount;
};

// 평가 대상 한 조합. indices는 applicableCoupons 기준 인덱스 튜플(오름차순).
type Combo = {
  discount: number;
  indices: number[];
};

// candidate가 best보다 더 나은 조합인지 판정한다.
// ① 총할인이 크면 우선 ② 동일 할인이면 개수 적은 조합 ③ 그래도 동점이면 인덱스 튜플 사전식 비교.
const isBetterCombo = (candidate: Combo, best: Combo): boolean => {
  if (candidate.discount !== best.discount) {
    return candidate.discount > best.discount;
  }
  if (candidate.indices.length !== best.indices.length) {
    return candidate.indices.length < best.indices.length;
  }
  for (let k = 0; k < candidate.indices.length; k++) {
    if (candidate.indices[k] !== best.indices[k]) {
      return candidate.indices[k] < best.indices[k];
    }
  }
  return false;
};

// 크기 1..maxCount인 모든 인덱스 조합을 만든다(∅ 제외). n이 작아 brute-force로 충분하다.
const buildIndexCombos = (n: number, maxCount: number): number[][] => {
  const result: number[][] = [];
  const build = (start: number, current: number[]): void => {
    if (current.length > 0) result.push(current);
    if (current.length === maxCount) return;
    for (let i = start; i < n; i++) {
      build(i + 1, [...current, i]);
    }
  };
  build(0, []);
  return result;
};

// 적용 가능 쿠폰들 중 실제 총할인이 최대가 되는 크기 ≤ maxCount 조합의 couponId 배열을 돌려준다.
// 빈/0할인이면 []. throw 하지 않는다.
// 적용 가능성은 호출부에서 base orderAmount로 1회 판정한 집합을 그대로 받는다(여기서 재판정하지 않음).
export const selectBestCouponCombo = (
  applicableCoupons: Coupon[],
  ctx: CouponContext,
  maxCount: number = MAX_COUPON_COUNT,
): string[] => {
  // ∅(할인 0)을 기준값으로 둔다. 어떤 조합도 ∅를 이기지 못하면(할인 0) 추천 없음.
  let best: Combo = { discount: 0, indices: [] };

  for (const indices of buildIndexCombos(applicableCoupons.length, maxCount)) {
    const combo = indices.map((i) => applicableCoupons[i]);
    const candidate: Combo = {
      discount: calculateCouponDiscount(combo, ctx),
      indices,
    };
    if (isBetterCombo(candidate, best)) best = candidate;
  }

  return best.indices.map((i) => applicableCoupons[i].couponId);
};
