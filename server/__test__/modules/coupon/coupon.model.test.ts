import {
  Coupon,
  type CouponContext,
  type CouponProps,
} from '../../../src/modules/coupon/coupon.model.js';

const future = new Date('2099-12-31T23:59:59Z');
const now = new Date('2026-06-20T10:00:00Z');

const createCoupon = (overrides: Partial<CouponProps> = {}) =>
  new Coupon({
    couponId: 'c1',
    code: 'FIXED5000',
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
  test('FIXED5000은 discountValue를 그대로 반환한다', () => {
    const coupon = createCoupon({ code: 'FIXED5000', discountValue: 5000 });
    expect(coupon.calculateDiscount(ctx())).toBe(5000);
  });

  test('MIRACLESALE은 floor(orderAmount × value / 100)을 반환한다', () => {
    const coupon = createCoupon({
      code: 'MIRACLESALE',
      discountType: 'PERCENTAGE',
      discountValue: 30,
    });
    expect(coupon.calculateDiscount(ctx({ orderAmount: 33333 }))).toBe(9999);
  });

  test('MIRACLESALE은 ctx.orderAmount(순차 계산 시점 금액) 기준으로 계산한다', () => {
    const coupon = createCoupon({
      code: 'MIRACLESALE',
      discountType: 'PERCENTAGE',
      discountValue: 30,
    });
    // 앞선 쿠폰 적용 후 갱신된 금액(95000)을 넘기면 그 기준으로 계산.
    expect(coupon.calculateDiscount(ctx({ orderAmount: 95000 }))).toBe(28500);
  });

  test('FREESHIPPING은 현재 배송비를 반환한다', () => {
    const coupon = createCoupon({ code: 'FREESHIPPING', discountValue: 0 });
    expect(coupon.calculateDiscount(ctx({ shippingFee: 6000 }))).toBe(6000);
  });

  test('FREESHIPPING은 배송비가 0이면 0을 반환한다', () => {
    const coupon = createCoupon({ code: 'FREESHIPPING', discountValue: 0 });
    expect(coupon.calculateDiscount(ctx({ shippingFee: 0 }))).toBe(0);
  });

  test('BOGO는 최고가 단가 × freeQuantity를 반환한다', () => {
    const coupon = createCoupon({
      code: 'BOGO',
      discountValue: 0,
      buyQuantity: 3,
      freeQuantity: 1,
    });
    const result = coupon.calculateDiscount(
      ctx({
        selectedItems: [
          { unitPrice: 3000, quantity: 1 },
          { unitPrice: 12000, quantity: 3 },
        ],
      }),
    );
    expect(result).toBe(12000);
  });

  test('BOGO는 freeQuantity가 없으면 1로 본다', () => {
    const coupon = createCoupon({
      code: 'BOGO',
      discountValue: 0,
      buyQuantity: 3,
    });
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

  test('MIRACLESALE: 사용 시간대 밖이면 false (KST 기준)', () => {
    const coupon = createCoupon({
      code: 'MIRACLESALE',
      discountType: 'PERCENTAGE',
      discountValue: 30,
      usableFrom: '04:00',
      usableTo: '07:00',
    });
    // 10:00Z = 19:00 KST → 구간 밖
    expect(coupon.isApplicable(ctx({ now }))).toBe(false);
  });

  test('MIRACLESALE: 사용 시간대 안이면 true(경계 포함, KST 기준)', () => {
    const coupon = createCoupon({
      code: 'MIRACLESALE',
      discountType: 'PERCENTAGE',
      discountValue: 30,
      usableFrom: '04:00',
      usableTo: '07:00',
    });
    // 19:00Z = 04:00 KST → 시작 경계 포함
    const at0400Kst = new Date('2026-06-19T19:00:00Z');
    expect(coupon.isApplicable(ctx({ now: at0400Kst }))).toBe(true);
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

  test('BOGO: buyQuantity가 없으면 적용 불가(false)', () => {
    const coupon = createCoupon({ code: 'BOGO', discountValue: 0 });
    const result = coupon.isApplicable(
      ctx({ selectedItems: [{ unitPrice: 1000, quantity: 5 }] }),
    );
    expect(result).toBe(false);
  });

  test('BOGO: 단일 항목 수량이 buyQuantity 미만이면 false', () => {
    const coupon = createCoupon({
      code: 'BOGO',
      discountValue: 0,
      buyQuantity: 3,
    });
    const result = coupon.isApplicable(
      ctx({ selectedItems: [{ unitPrice: 1000, quantity: 2 }] }),
    );
    expect(result).toBe(false);
  });

  test('BOGO: 수량이 buyQuantity 이상인 항목이 하나라도 있으면 true', () => {
    const coupon = createCoupon({
      code: 'BOGO',
      discountValue: 0,
      buyQuantity: 3,
    });
    const result = coupon.isApplicable(
      ctx({
        selectedItems: [
          { unitPrice: 1000, quantity: 1 },
          { unitPrice: 2000, quantity: 3 },
        ],
      }),
    );
    expect(result).toBe(true);
  });

  test('BOGO: 수량 합은 3이어도 단일 항목이 3 미만이면 false', () => {
    const coupon = createCoupon({
      code: 'BOGO',
      discountValue: 0,
      buyQuantity: 3,
    });
    const result = coupon.isApplicable(
      ctx({
        selectedItems: [
          { unitPrice: 1000, quantity: 2 },
          { unitPrice: 2000, quantity: 2 },
        ],
      }),
    );
    expect(result).toBe(false);
  });
});
