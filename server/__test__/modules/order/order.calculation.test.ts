import {
  calculateOrderAmount,
  calculateShippingFee,
  calculateTotalPayment,
  sumCouponDiscount,
} from '../../../src/modules/order/order.calculation.js';

describe('calculateOrderAmount', () => {
  test('각 항목의 단가 × 수량 합을 반환한다', () => {
    expect(
      calculateOrderAmount([
        { unitPrice: 10000, quantity: 2 },
        { unitPrice: 3000, quantity: 1 },
      ]),
    ).toBe(23000);
  });

  test('항목이 없으면 0', () => {
    expect(calculateOrderAmount([])).toBe(0);
  });
});

describe('calculateShippingFee', () => {
  test('주문금액 100000 미만이면 기본 배송비 3000', () => {
    expect(calculateShippingFee(99999, false)).toBe(3000);
  });

  test('주문금액 100000이면 무료(경계)', () => {
    expect(calculateShippingFee(100000, false)).toBe(0);
  });

  test('도서산간이면 기본 + 3000 = 6000', () => {
    expect(calculateShippingFee(50000, true)).toBe(6000);
  });

  test('주문금액 100000 이상이면 도서산간이어도 무료', () => {
    expect(calculateShippingFee(100000, true)).toBe(0);
  });
});

describe('sumCouponDiscount', () => {
  test('적용 쿠폰 할인의 합을 반환한다', () => {
    expect(sumCouponDiscount([5000, 3000], 50000, 3000)).toBe(8000);
  });

  test('총 할인은 (주문금액 + 배송비)를 넘지 않는다', () => {
    expect(sumCouponDiscount([100000], 50000, 3000)).toBe(53000);
  });

  test('음수 합은 0으로 하한 처리한다', () => {
    expect(sumCouponDiscount([-1000], 50000, 3000)).toBe(0);
  });
});

describe('calculateTotalPayment', () => {
  test('주문금액 - 쿠폰할인 + 배송비', () => {
    expect(calculateTotalPayment(50000, 8000, 3000)).toBe(45000);
  });
});
