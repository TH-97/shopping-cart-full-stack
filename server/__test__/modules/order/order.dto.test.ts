import {
  parseOrderSummaryDto,
  toOrderSummaryResponse,
} from '../../../src/modules/order/order.dto.js';

describe('parseOrderSummaryDto', () => {
  test('정상 body를 파싱한다', () => {
    expect(
      parseOrderSummaryDto({
        selectedCartItemIds: ['10', '12'],
        selectedCouponIds: ['c1'],
        isRemoteArea: false,
      }),
    ).toEqual({
      selectedCartItemIds: ['10', '12'],
      selectedCouponIds: ['c1'],
      isRemoteArea: false,
    });
  });

  test('selectedCartItemIds가 배열이 아니면 INVALID_CART_ITEM_IDS', () => {
    expect(() =>
      parseOrderSummaryDto({
        selectedCartItemIds: '10',
        selectedCouponIds: [],
        isRemoteArea: false,
      }),
    ).toThrow('유효하지 않은 장바구니 상품 id 목록입니다.');
  });

  test('selectedCouponIds가 배열이 아니면 INVALID_COUPON_IDS', () => {
    expect(() =>
      parseOrderSummaryDto({
        selectedCartItemIds: ['10'],
        selectedCouponIds: 'c1',
        isRemoteArea: false,
      }),
    ).toThrow('유효하지 않은 쿠폰 id 목록입니다.');
  });

  test('isRemoteArea가 boolean이 아니면 INVALID_IS_REMOTE_AREA', () => {
    expect(() =>
      parseOrderSummaryDto({
        selectedCartItemIds: ['10'],
        selectedCouponIds: [],
        isRemoteArea: 'false',
      }),
    ).toThrow('유효하지 않은 도서산간 여부입니다.');
  });
});

describe('toOrderSummaryResponse', () => {
  test('요약을 응답 모양으로 변환한다', () => {
    expect(
      toOrderSummaryResponse({
        orderAmount: 50000,
        couponDiscountAmount: 5000,
        shippingFee: 3000,
        totalPaymentAmount: 48000,
      }),
    ).toEqual({
      orderAmount: 50000,
      couponDiscountAmount: 5000,
      shippingFee: 3000,
      totalPaymentAmount: 48000,
    });
  });
});
