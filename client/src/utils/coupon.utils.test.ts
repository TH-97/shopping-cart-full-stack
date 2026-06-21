import {
  formatExpiry,
  formatMinOrder,
  formatUsableTime,
  pickBestCoupons,
} from './coupon.utils';
import type { CouponData } from '../types/coupon';

const makeCoupon = (overrides: Partial<CouponData> = {}): CouponData => ({
  couponId: 'C1',
  couponName: '쿠폰',
  discountType: 'FIXED',
  isApplicable: true,
  discountAmount: 1000,
  expiresAt: '2026-11-30T23:59:59',
  minOrderAmount: null,
  usableFrom: null,
  usableTo: null,
  ...overrides,
});

describe('pickBestCoupons', () => {
  test('적용 불가 쿠폰은 후보에서 제외한다', () => {
    const coupons = [
      makeCoupon({ couponId: 'A', isApplicable: false, discountAmount: 9000 }),
      makeCoupon({ couponId: 'B', isApplicable: true, discountAmount: 1000 }),
    ];

    expect(pickBestCoupons(coupons)).toEqual(['B']);
  });

  test('할인액 내림차순으로 정렬해 최대 2개를 고른다', () => {
    const coupons = [
      makeCoupon({ couponId: 'A', discountAmount: 1000 }),
      makeCoupon({ couponId: 'B', discountAmount: 5000 }),
      makeCoupon({ couponId: 'C', discountAmount: 3000 }),
    ];

    expect(pickBestCoupons(coupons)).toEqual(['B', 'C']);
  });

  test('적용 가능 쿠폰이 없으면 빈 배열', () => {
    const coupons = [makeCoupon({ isApplicable: false })];

    expect(pickBestCoupons(coupons)).toEqual([]);
  });

  test('원본 배열을 변형하지 않는다', () => {
    const coupons = [
      makeCoupon({ couponId: 'A', discountAmount: 1000 }),
      makeCoupon({ couponId: 'B', discountAmount: 5000 }),
    ];
    const before = coupons.map((c) => c.couponId);

    pickBestCoupons(coupons);

    expect(coupons.map((c) => c.couponId)).toEqual(before);
  });
});

describe('formatExpiry', () => {
  test('ISO 문자열을 "YYYY년 M월 D일"로 표기한다', () => {
    expect(formatExpiry('2026-11-30T23:59:59')).toBe('2026년 11월 30일');
  });
});

describe('formatMinOrder', () => {
  test('null이면 null', () => {
    expect(formatMinOrder(null)).toBeNull();
  });

  test('금액이 있으면 천단위 구분 안내 문구', () => {
    expect(formatMinOrder(50000)).toBe('50,000원 이상 구매 시 사용 가능');
  });
});

describe('formatUsableTime', () => {
  test('둘 중 하나라도 없으면 null', () => {
    expect(formatUsableTime(null, '07:00')).toBeNull();
    expect(formatUsableTime('04:00', null)).toBeNull();
  });

  test('시작은 오전/오후 시각, 끝은 시각만 표기한다', () => {
    expect(formatUsableTime('04:00', '07:00')).toBe('오전 4시부터 7시까지');
  });
});
