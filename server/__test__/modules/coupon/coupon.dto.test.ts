import {
  parseSelectedCartItemIdsQuery,
  parseSelectedCouponIdsDto,
  toCouponsResponse,
  type CouponSummaryItem,
} from '../../../src/modules/coupon/coupon.dto.js';

describe('parseSelectedCartItemIdsQuery', () => {
  test('쉼표로 분리해 배열로 만든다', () => {
    expect(
      parseSelectedCartItemIdsQuery({ selectedCartItemIds: '10,12' }),
    ).toEqual(['10', '12']);
  });

  test('공백을 제거하고 빈 토큰은 버린다', () => {
    expect(
      parseSelectedCartItemIdsQuery({ selectedCartItemIds: ' 10 , ,12,' }),
    ).toEqual(['10', '12']);
  });

  test('쿼리가 없으면 빈 배열', () => {
    expect(parseSelectedCartItemIdsQuery({})).toEqual([]);
  });

  test('문자열이 아니면 INVALID_CART_ITEM_IDS를 던진다', () => {
    expect(() =>
      parseSelectedCartItemIdsQuery({ selectedCartItemIds: ['10'] }),
    ).toThrow('유효하지 않은 장바구니 상품 id 목록입니다.');
  });
});

describe('parseSelectedCouponIdsDto', () => {
  test('문자열 배열을 그대로 반환한다', () => {
    expect(
      parseSelectedCouponIdsDto({ selectedCouponIds: ['c1', 'c2'] }),
    ).toEqual(['c1', 'c2']);
  });

  test('body가 객체가 아니면 INVALID_COUPON_IDS를 던진다', () => {
    expect(() => parseSelectedCouponIdsDto(null)).toThrow(
      '유효하지 않은 쿠폰 id 목록입니다.',
    );
  });

  test('selectedCouponIds가 배열이 아니면 INVALID_COUPON_IDS를 던진다', () => {
    expect(() =>
      parseSelectedCouponIdsDto({ selectedCouponIds: 'c1' }),
    ).toThrow('유효하지 않은 쿠폰 id 목록입니다.');
  });

  test('원소가 빈 문자열이면 INVALID_COUPON_IDS를 던진다', () => {
    expect(() =>
      parseSelectedCouponIdsDto({ selectedCouponIds: ['c1', ' '] }),
    ).toThrow('유효하지 않은 쿠폰 id 목록입니다.');
  });
});

describe('toCouponsResponse', () => {
  test('orderAmount와 coupons를 응답 모양으로 묶는다', () => {
    const coupons: CouponSummaryItem[] = [
      {
        couponId: 'c1',
        couponName: '쿠폰',
        discountType: 'FIXED',
        isApplicable: true,
        expiresAt: '2026-11-30T14:59:59.000Z',
        minOrderAmount: 100000,
        usableFrom: null,
        usableTo: null,
      },
    ];
    expect(toCouponsResponse(50000, coupons, ['c1'])).toEqual({
      orderAmount: 50000,
      coupons,
      recommendedCouponIds: ['c1'],
    });
  });

  test('보유 쿠폰이 없으면 빈 배열', () => {
    expect(toCouponsResponse(0, [], [])).toEqual({
      orderAmount: 0,
      coupons: [],
      recommendedCouponIds: [],
    });
  });
});
