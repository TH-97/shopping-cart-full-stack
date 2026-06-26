import { act, renderHook } from '@testing-library/react';
import { useCouponSelection } from './useCouponSelection';
import type { CouponData } from '../types/coupon';

const makeCoupon = (overrides: Partial<CouponData> = {}): CouponData => ({
  couponId: 'C1',
  couponName: '쿠폰',
  discountType: 'FIXED',
  isApplicable: true,
  expiresAt: '2026-11-30T23:59:59',
  minOrderAmount: null,
  usableFrom: null,
  usableTo: null,
  ...overrides,
});

describe('useCouponSelection', () => {
  test('빈 목록이면 선택은 비어 있다', () => {
    const { result } = renderHook(() => useCouponSelection([], []));

    expect(result.current.selectedCouponIds).toEqual([]);
  });

  test('적용 가능 쿠폰이 준비되면 서버 추천 조합으로 1회 초기화한다', () => {
    const coupons = [
      makeCoupon({ couponId: 'A' }),
      makeCoupon({ couponId: 'B' }),
      makeCoupon({ couponId: 'C' }),
    ];

    const { result } = renderHook(() =>
      useCouponSelection(coupons, ['A', 'B']),
    );

    expect(result.current.selectedCouponIds).toEqual(['A', 'B']);
  });

  test('초기화 후 목록이 다시 들어와도 사용자 선택을 덮지 않는다', () => {
    const coupons = [
      makeCoupon({ couponId: 'A' }),
      makeCoupon({ couponId: 'B' }),
    ];

    const { result, rerender } = renderHook(
      ({ list }) => useCouponSelection(list, ['A', 'B']),
      { initialProps: { list: coupons } },
    );

    act(() => result.current.toggleCoupon('A'));
    expect(result.current.selectedCouponIds).toEqual(['B']);

    // 새 배열 참조로 재렌더해도 초기화는 1회뿐이라 선택이 유지된다.
    rerender({ list: [...coupons] });
    expect(result.current.selectedCouponIds).toEqual(['B']);
  });

  test('toggleCoupon은 선택/해제하며 최대 2개를 넘기지 않는다', () => {
    const coupons = [
      makeCoupon({ couponId: 'A' }),
      makeCoupon({ couponId: 'B' }),
      makeCoupon({ couponId: 'C' }),
    ];

    const { result } = renderHook(() =>
      useCouponSelection(coupons, ['A', 'B']),
    );

    // 서버 추천 조합 2개가 선택된 상태에서 시작한다.
    expect(result.current.selectedCouponIds).toEqual(['A', 'B']);

    // 3번째 선택은 무시된다(최대 2).
    act(() => result.current.toggleCoupon('C'));
    expect(result.current.selectedCouponIds).toEqual(['A', 'B']);

    // 이미 선택된 건 해제된다.
    act(() => result.current.toggleCoupon('A'));
    expect(result.current.selectedCouponIds).toEqual(['B']);

    // 자리가 생기면 새 선택이 들어간다.
    act(() => result.current.toggleCoupon('C'));
    expect(result.current.selectedCouponIds).toEqual(['B', 'C']);
  });

  test('적용 가능 집합이 바뀌면 이제 못 쓰는 쿠폰은 선택에서 빠진다', () => {
    const coupons = [
      makeCoupon({ couponId: 'A' }),
      makeCoupon({ couponId: 'B' }),
    ];

    const { result, rerender } = renderHook(
      ({ list }) => useCouponSelection(list, ['A', 'B']),
      { initialProps: { list: coupons } },
    );

    expect(result.current.selectedCouponIds).toEqual(['A', 'B']);

    // 선택 항목이 바뀌어 A가 적용 가능 목록에서 빠지면 선택에서도 빠진다.
    rerender({ list: [makeCoupon({ couponId: 'B' })] });
    expect(result.current.selectedCouponIds).toEqual(['B']);
  });

  test('open/close로 모달 상태를 제어한다', () => {
    const { result } = renderHook(() => useCouponSelection([], []));

    expect(result.current.isModalOpen).toBe(false);
    act(() => result.current.open());
    expect(result.current.isModalOpen).toBe(true);
    act(() => result.current.close());
    expect(result.current.isModalOpen).toBe(false);
  });
});
