import type { Stores } from '../../db.js';
import { Coupon } from './coupon.model.js';

// 데모 유저가 보유한 쿠폰 4종(정액/정률/무료배송/증정)을 인메모리에 시드한다.
// dev·테스트에서 GET /coupons가 의미 있는 데이터를 반환하도록 한다.
export const seedDemoCoupons = (stores: Stores, userId: string): void => {
  // 만료일은 시드 시점 기준 1년 후로 둬 dev에서 만료되지 않게 한다.
  const expiresAt = new Date();
  expiresAt.setFullYear(expiresAt.getFullYear() + 1);

  const coupons: Coupon[] = [
    new Coupon({
      couponId: 'coupon-fixed',
      name: '5,000원 할인 쿠폰',
      discountType: 'FIXED',
      discountValue: 5000,
      expiresAt,
      minOrderAmount: 0,
    }),
    new Coupon({
      couponId: 'coupon-percent',
      name: '10% 할인 쿠폰',
      discountType: 'PERCENT',
      discountValue: 10,
      expiresAt,
      minOrderAmount: 0,
    }),
    new Coupon({
      couponId: 'coupon-free-shipping',
      name: '무료배송 쿠폰',
      discountType: 'FREE_SHIPPING',
      discountValue: 0,
      expiresAt,
      minOrderAmount: 0,
    }),
    new Coupon({
      couponId: 'coupon-buy-x-get-1',
      name: '2개 구매 시 1개 무료 쿠폰',
      discountType: 'BUY_X_GET_1',
      discountValue: 0,
      expiresAt,
      buyQuantity: 2,
      freeQuantity: 1,
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
