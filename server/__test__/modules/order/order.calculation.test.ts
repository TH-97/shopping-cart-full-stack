import {
  calculateOrderAmount,
  calculateProductDiscount,
  calculateShippingDiscount,
  calculateShippingFee,
  calculateTotalPayment,
  type ProductCoupon,
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

describe('calculateProductDiscount', () => {
  // 헬퍼: 정액 쿠폰(고정 차감)
  const fixed = (value: number): ProductCoupon => ({
    discountType: 'FIXED',
    applyTo: () => value,
  });
  // 헬퍼: 정율 쿠폰(그 시점 amount 비례)
  const percentage = (rate: number): ProductCoupon => ({
    discountType: 'PERCENTAGE',
    applyTo: (amount) => Math.floor((amount * rate) / 100),
  });

  test('쿠폰이 없으면 할인 0', () => {
    expect(calculateProductDiscount(100000, [])).toBe(0);
  });

  test('정액 → 정율 순서로 순차 적용한다(입력 순서와 무관)', () => {
    // 입력은 정율 먼저지만 정액(5000)이 먼저 적용되어 95000 → 30% → 28500.
    const result = calculateProductDiscount(100000, [
      percentage(30),
      fixed(5000),
    ]);
    // 100000 - 5000 = 95000, 95000 - 28500 = 66500 → 할인 합 33500
    expect(result).toBe(33500);
  });

  test('정율은 갱신된 금액 기준으로 계산한다', () => {
    const result = calculateProductDiscount(100000, [fixed(5000), percentage(30)]);
    expect(result).toBe(33500);
  });

  test('각 단계에서 금액은 0 미만으로 내려가지 않는다', () => {
    const result = calculateProductDiscount(10000, [fixed(20000)]);
    // 10000 - 20000 → max(.., 0) = 0 → 할인 합 10000
    expect(result).toBe(10000);
  });
});

describe('calculateShippingDiscount', () => {
  test('FREESHIPPING이 있으면 배송비 전액을 할인한다', () => {
    expect(calculateShippingDiscount(6000, true)).toBe(6000);
  });

  test('FREESHIPPING이 없으면 0', () => {
    expect(calculateShippingDiscount(6000, false)).toBe(0);
  });
});

describe('calculateTotalPayment', () => {
  test('주문금액 - 쿠폰할인 + 기준배송비', () => {
    expect(calculateTotalPayment(50000, 8000, 3000)).toBe(45000);
  });
});
