import {
  Coupon,
  type CouponContext,
  type Type,
} from '../../../src/modules/coupon/coupon.model.js';

const future = new Date('2099-12-31T23:59:59Z');
const now = new Date('2026-06-20T10:00:00Z');

const createCoupon = (overrides: Partial<Type> = {}) =>
  new Coupon({
    couponId: 'c1',
    name: '쿠폰',
    discountType: 'FIXED',
    discountValue: 5000,
    expiresAt: future,
    ...overrides,
  });

const ctx = (overrides: Partial<CouponContext> = {}): CouponContext => ({
  orderAmount: 50000,
  shippingFee: 3000,
  selectedItems: [{ unitPrice: 10000, quantity: 2 }],
  now,
  ...overrides,
});

describe('Coupon.calculateDiscount', () => {
  test('FIXED는 discountValue를 그대로 반환한다', () => {
    const coupon = createCoupon({ discountType: 'FIXED', discountValue: 5000 });
    expect(coupon.calculateDiscount(ctx())).toBe(5000);
  });

  test('PERCENT는 floor(orderAmount × value / 100)을 반환한다', () => {
    const coupon = createCoupon({ discountType: 'PERCENT', discountValue: 10 });
    expect(coupon.calculateDiscount(ctx({ orderAmount: 33333 }))).toBe(3333);
  });

  test('FREE_SHIPPING은 현재 배송비를 반환한다', () => {
    const coupon = createCoupon({ discountType: 'FREE_SHIPPING' });
    expect(coupon.calculateDiscount(ctx({ shippingFee: 6000 }))).toBe(6000);
  });

  test('FREE_SHIPPING은 배송비가 0이면 0을 반환한다', () => {
    const coupon = createCoupon({ discountType: 'FREE_SHIPPING' });
    expect(coupon.calculateDiscount(ctx({ shippingFee: 0 }))).toBe(0);
  });

  test('BUY_X_GET_1은 최고가 단가 × freeQuantity를 반환한다', () => {
    const coupon = createCoupon({
      discountType: 'BUY_X_GET_1',
      buyQuantity: 2,
      freeQuantity: 1,
    });
    const result = coupon.calculateDiscount(
      ctx({
        selectedItems: [
          { unitPrice: 3000, quantity: 1 },
          { unitPrice: 12000, quantity: 2 },
        ],
      }),
    );
    expect(result).toBe(12000);
  });

  test('BUY_X_GET_1은 freeQuantity가 없으면 1로 본다', () => {
    const coupon = createCoupon({ discountType: 'BUY_X_GET_1', buyQuantity: 2 });
    const result = coupon.calculateDiscount(
      ctx({ selectedItems: [{ unitPrice: 7000, quantity: 3 }] }),
    );
    expect(result).toBe(7000);
  });
});

describe('Coupon.isApplicable', () => {
  test('모든 조건을 만족하면 true', () => {
    const coupon = createCoupon();
    expect(coupon.isApplicable(ctx())).toBe(true);
  });

  test('만료일이 now보다 과거면 false', () => {
    const coupon = createCoupon({
      expiresAt: new Date('2026-06-20T09:59:59Z'),
    });
    expect(coupon.isApplicable(ctx())).toBe(false);
  });

  test('만료일이 now와 같으면 true(경계 포함)', () => {
    const coupon = createCoupon({ expiresAt: now });
    expect(coupon.isApplicable(ctx())).toBe(true);
  });

  test('이미 사용한 쿠폰이면 false', () => {
    const coupon = createCoupon();
    expect(coupon.isApplicable(ctx({ isUsed: true }))).toBe(false);
  });

  test('최소 주문 금액 미만이면 false', () => {
    const coupon = createCoupon({ minOrderAmount: 50000 });
    expect(coupon.isApplicable(ctx({ orderAmount: 49999 }))).toBe(false);
  });

  test('최소 주문 금액과 같으면 true(경계 포함)', () => {
    const coupon = createCoupon({ minOrderAmount: 50000 });
    expect(coupon.isApplicable(ctx({ orderAmount: 50000 }))).toBe(true);
  });

  test('사용 시간대 밖이면 false (KST 기준)', () => {
    const coupon = createCoupon({ usableFrom: '13:00', usableTo: '14:00' });
    // 03:00Z = 12:00 KST → 구간 밖
    const at1200Kst = new Date('2026-06-20T03:00:00Z');
    expect(coupon.isApplicable(ctx({ now: at1200Kst }))).toBe(false);
  });

  test('사용 시간대 안이면 true(경계 포함, KST 기준)', () => {
    const coupon = createCoupon({ usableFrom: '13:00', usableTo: '14:00' });
    // 04:00Z = 13:00 KST → 시작 경계 포함
    const at1300Kst = new Date('2026-06-20T04:00:00Z');
    expect(coupon.isApplicable(ctx({ now: at1300Kst }))).toBe(true);
  });

  test('자정 횡단 구간: from > to면 from 이후 또는 to 이전이 true (KST 기준)', () => {
    const coupon = createCoupon({ usableFrom: '22:00', usableTo: '02:00' });
    // 14:00Z = 23:00 KST → 구간 안
    const at2300Kst = new Date('2026-06-20T14:00:00Z');
    // 16:00Z = 01:00 KST → 구간 안(자정 넘김)
    const at0100Kst = new Date('2026-06-20T16:00:00Z');
    // 06:00Z = 15:00 KST → 구간 밖
    const at1500Kst = new Date('2026-06-20T06:00:00Z');

    expect(coupon.isApplicable(ctx({ now: at2300Kst }))).toBe(true);
    expect(coupon.isApplicable(ctx({ now: at0100Kst }))).toBe(true);
    expect(coupon.isApplicable(ctx({ now: at1500Kst }))).toBe(false);
  });

  test('자정 횡단 구간 경계(22:00, 02:00)는 포함된다 (KST 기준)', () => {
    const coupon = createCoupon({ usableFrom: '22:00', usableTo: '02:00' });
    // 13:00Z = 22:00 KST (from 경계)
    const atFrom = new Date('2026-06-20T13:00:00Z');
    // 17:00Z = 02:00 KST (to 경계)
    const atTo = new Date('2026-06-20T17:00:00Z');

    expect(coupon.isApplicable(ctx({ now: atFrom }))).toBe(true);
    expect(coupon.isApplicable(ctx({ now: atTo }))).toBe(true);
  });

  test('BUY_X_GET_1: buyQuantity가 없으면 적용 불가(false)', () => {
    const coupon = createCoupon({ discountType: 'BUY_X_GET_1' });
    const result = coupon.isApplicable(
      ctx({ selectedItems: [{ unitPrice: 1000, quantity: 5 }] }),
    );
    expect(result).toBe(false);
  });

  test('BUY_X_GET_1: 선택 수량 합이 buyQuantity 미만이면 false', () => {
    const coupon = createCoupon({
      discountType: 'BUY_X_GET_1',
      buyQuantity: 3,
    });
    const result = coupon.isApplicable(
      ctx({ selectedItems: [{ unitPrice: 1000, quantity: 2 }] }),
    );
    expect(result).toBe(false);
  });

  test('BUY_X_GET_1: 선택 수량 합이 buyQuantity 이상이면 true', () => {
    const coupon = createCoupon({
      discountType: 'BUY_X_GET_1',
      buyQuantity: 3,
    });
    const result = coupon.isApplicable(
      ctx({ selectedItems: [{ unitPrice: 1000, quantity: 3 }] }),
    );
    expect(result).toBe(true);
  });

  test('FREE_SHIPPING: 배송비가 0이면 false', () => {
    const coupon = createCoupon({ discountType: 'FREE_SHIPPING' });
    expect(coupon.isApplicable(ctx({ shippingFee: 0 }))).toBe(false);
  });

  test('FREE_SHIPPING: 배송비가 0보다 크면 true', () => {
    const coupon = createCoupon({ discountType: 'FREE_SHIPPING' });
    expect(coupon.isApplicable(ctx({ shippingFee: 3000 }))).toBe(true);
  });
});
