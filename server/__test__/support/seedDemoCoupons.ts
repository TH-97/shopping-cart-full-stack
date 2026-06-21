import { Coupon } from '../../src/modules/coupon/coupon.model.js';
import type { Stores } from './stores.js';

// 데모 유저가 보유한 쿠폰 4종(FIXED5000/BOGO/FREESHIPPING/MIRACLESALE)을 인메모리에 시드한다.
// 테스트용 앱에서 GET /coupons가 의미 있는 데이터를 반환하도록 한다.
export const seedDemoCoupons = (stores: Stores, userId: string): void => {
  // 만료일은 시드 시점 기준 1년 후로 둬 테스트에서 만료되지 않게 한다.
  const expiresAt = new Date();
  expiresAt.setFullYear(expiresAt.getFullYear() + 1);

  const coupons: Coupon[] = [
    new Coupon({
      couponId: 'coupon-fixed5000',
      code: 'FIXED5000',
      name: '5,000원 할인 쿠폰',
      discountType: 'FIXED',
      discountValue: 5000,
      expiresAt,
      minOrderAmount: 100000,
    }),
    new Coupon({
      couponId: 'coupon-bogo',
      code: 'BOGO',
      name: '2개 구매 시 1개 무료 쿠폰',
      discountType: 'FIXED',
      discountValue: 0,
      expiresAt,
      buyQuantity: 3,
      freeQuantity: 1,
    }),
    new Coupon({
      couponId: 'coupon-freeshipping',
      code: 'FREESHIPPING',
      name: '무료배송 쿠폰',
      discountType: 'FIXED',
      discountValue: 0,
      expiresAt,
      minOrderAmount: 50000,
    }),
    new Coupon({
      couponId: 'coupon-miraclesale',
      code: 'MIRACLESALE',
      name: '30% 할인 쿠폰',
      discountType: 'PERCENTAGE',
      discountValue: 30,
      expiresAt,
      usableFrom: '04:00',
      usableTo: '07:00',
    }),
  ];

  coupons.forEach((coupon) => {
    stores.couponsDB.set(coupon.couponId, coupon);
    stores.userCouponsDB.set(`user-${coupon.couponId}`, {
      userCouponId: `user-${coupon.couponId}`,
      couponId: coupon.couponId,
      userId,
      isUsed: false,
    });
  });
};
