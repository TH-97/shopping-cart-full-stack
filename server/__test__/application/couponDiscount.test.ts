import { Coupon } from '../../src/modules/coupon/coupon.model.js';
import type { CouponContext } from '../../src/modules/coupon/coupon.model.js';
import {
  calculateCouponDiscount,
  selectBestCouponCombo,
} from '../../src/application/couponDiscount.js';

const future = new Date('2099-12-31T23:59:59Z');
const now = new Date('2026-06-20T10:00:00Z');

type CouponOverrides = Partial<ConstructorParameters<typeof Coupon>[0]> & {
  couponId: string;
};

// 테스트용 합성 쿠폰. code별로 calculateDiscount/isApplicable 거동이 결정된다.
const fixed = (couponId: string, value: number, extra: Partial<CouponOverrides> = {}) =>
  new Coupon({
    couponId,
    code: 'FIXED5000',
    name: `정액 ${value}`,
    discountType: 'FIXED',
    discountValue: value,
    expiresAt: future,
    ...extra,
  });

const percentage = (couponId: string, value: number) =>
  new Coupon({
    couponId,
    code: 'MIRACLESALE',
    name: `정율 ${value}%`,
    discountType: 'PERCENTAGE',
    discountValue: value,
    expiresAt: future,
  });

const freeShipping = (couponId: string) =>
  new Coupon({
    couponId,
    code: 'FREESHIPPING',
    name: '무료배송',
    discountType: 'FIXED',
    discountValue: 0,
    expiresAt: future,
  });

const ctxOf = (orderAmount: number, shippingFee: number): CouponContext => ({
  orderAmount,
  shippingFee,
  selectedItems: [{ unitPrice: orderAmount, quantity: 1 }],
  now,
});

describe('calculateCouponDiscount', () => {
  test('단일 정액 쿠폰은 정액만큼 할인한다', () => {
    const ctx = ctxOf(100000, 0);
    expect(calculateCouponDiscount([fixed('a', 5000)], ctx)).toBe(5000);
  });

  test('정액 → 정율 순서로 순차 적용한다(orderSummary와 동일 수치)', () => {
    const ctx = ctxOf(100000, 0);
    // 100000 - 5000 = 95000, 95000 × 30% = 28500 → 합 33500.
    const discount = calculateCouponDiscount(
      [percentage('p', 30), fixed('f', 5000)],
      ctx,
    );
    expect(discount).toBe(33500);
  });

  test('FREESHIPPING은 트랙 B로 배송비를 더해 합산한다', () => {
    const ctx = ctxOf(60000, 3000);
    // 상품할인 5000 + 배송할인 3000 = 8000.
    const discount = calculateCouponDiscount(
      [fixed('f', 5000), freeShipping('s')],
      ctx,
    );
    expect(discount).toBe(8000);
  });

  test('FREESHIPPING 단독은 배송비 전액만 할인한다', () => {
    const ctx = ctxOf(60000, 3000);
    expect(calculateCouponDiscount([freeShipping('s')], ctx)).toBe(3000);
  });
});

describe('selectBestCouponCombo', () => {
  test('적용 가능 쿠폰이 없으면 빈 배열', () => {
    expect(selectBestCouponCombo([], ctxOf(100000, 0))).toEqual([]);
  });

  test('단일 쿠폰만 있으면 그 쿠폰을 추천한다', () => {
    const result = selectBestCouponCombo([fixed('a', 5000)], ctxOf(100000, 0));
    expect(result).toEqual(['a']);
  });

  test('정율-after-정액 역전: 단독 상위2가 아닌 실제 최적 조합을 고른다', () => {
    const coupons = [fixed('fix90000', 90000), fixed('fix5000', 5000), percentage('pct30', 30)];
    // 단독: 90000 / 5000 / 30000. 상위2 단독은 {90000, 30%}이지만,
    // {90000,5000}=95,000 > {90000,30%}=93,000 이므로 후자가 최적.
    expect(selectBestCouponCombo(coupons, ctxOf(100000, 0))).toEqual([
      'fix90000',
      'fix5000',
    ]);
  });

  test('동점이면 개수가 적은 조합을 우선한다', () => {
    // 주문금액 100000 → 배송비 0이므로 FREESHIPPING은 할인 0.
    // 단일 {fix}=5000 과 쌍 {fix, freeship}=5000 이 동점 → 단일 우선.
    const coupons = [fixed('fix', 5000), freeShipping('free')];
    expect(selectBestCouponCombo(coupons, ctxOf(100000, 0))).toEqual(['fix']);
  });

  test('동점이면 인덱스 튜플이 사전식으로 작은 조합을 우선한다', () => {
    // 동일 정액 3장: 모든 쌍이 10000으로 동점 → [0,1] 우선.
    const coupons = [fixed('a', 5000), fixed('b', 5000), fixed('c', 5000)];
    expect(selectBestCouponCombo(coupons, ctxOf(100000, 0))).toEqual(['a', 'b']);
  });

  test('할인 0 조합은 추천에서 제외된다(∅과 동점)', () => {
    // 배송비 0이므로 FREESHIPPING 단독은 할인 0 → 추천 없음.
    expect(selectBestCouponCombo([freeShipping('free')], ctxOf(100000, 0))).toEqual([]);
  });

  test('maxCount(기본 2)를 넘는 조합은 만들지 않는다', () => {
    const coupons = [fixed('a', 5000), fixed('b', 5000), fixed('c', 5000)];
    const result = selectBestCouponCombo(coupons, ctxOf(100000, 0));
    expect(result.length).toBeLessThanOrEqual(2);
  });

  test('FREESHIPPING + 상품쿠폰 조합은 두 트랙 합으로 평가된다', () => {
    const ctx = ctxOf(60000, 3000);
    const coupons = [fixed('fix', 5000), freeShipping('free')];
    // 8000(=5000+3000) > 단독 5000/3000 → 쌍 추천.
    expect(selectBestCouponCombo(coupons, ctx)).toEqual(['fix', 'free']);
  });
});
