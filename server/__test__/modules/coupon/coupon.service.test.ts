import { Coupon } from '../../../src/modules/coupon/coupon.model.js';
import { CouponService } from '../../../src/modules/coupon/coupon.service.js';
import {
  createInMemoryCouponRepository,
  type UserCouponRow,
} from '../../support/inMemoryRepositories.js';

const future = new Date('2099-12-31T23:59:59Z');
const past = new Date('2020-01-01T00:00:00Z');
const now = new Date('2026-06-20T10:00:00Z');

describe('CouponService.validate', () => {
  let couponsDB: Map<string, Coupon>;
  let userCouponsDB: Map<string, UserCouponRow>;
  let service: CouponService;

  const addCoupon = (
    couponId: string,
    expiresAt: Date,
    isUsed = false,
  ) => {
    couponsDB.set(
      couponId,
      new Coupon({
        couponId,
        code: 'FIXED5000',
        name: '쿠폰',
        discountType: 'FIXED',
        discountValue: 5000,
        expiresAt,
      }),
    );
    userCouponsDB.set(`uc-${couponId}`, {
      userCouponId: `uc-${couponId}`,
      couponId,
      userId: 'demo-user',
      isUsed,
    });
  };

  beforeEach(() => {
    couponsDB = new Map();
    userCouponsDB = new Map();
    service = new CouponService(
      createInMemoryCouponRepository(couponsDB, userCouponsDB),
    );
  });

  test('유효한 쿠폰이면 통과한다(void)', async () => {
    addCoupon('valid', future);

    await expect(service.validate(['valid'], now)).resolves.toBeUndefined();
  });

  test('쿠폰이 2장을 초과하면 EXCEEDS_COUPON_LIMIT을 던진다', async () => {
    addCoupon('a', future);
    addCoupon('b', future);
    addCoupon('c', future);

    await expect(
      service.validate(['a', 'b', 'c'], now),
    ).rejects.toThrow('쿠폰은 최대 2장까지 사용할 수 있습니다.');
  });

  test('존재하지 않는 쿠폰이면 COUPON_NOT_FOUND를 던진다', async () => {
    await expect(service.validate(['missing'], now)).rejects.toThrow(
      '존재하지 않는 쿠폰입니다.',
    );
  });

  test('만료된 쿠폰이면 COUPON_EXPIRED를 던진다', async () => {
    addCoupon('expired', past);

    await expect(service.validate(['expired'], now)).rejects.toThrow(
      '만료된 쿠폰입니다.',
    );
  });

  test('이미 사용한 쿠폰이면 COUPON_ALREADY_USED를 던진다', async () => {
    addCoupon('used', future, true);

    await expect(service.validate(['used'], now)).rejects.toThrow(
      '이미 사용한 쿠폰입니다.',
    );
  });

  test('개수 검증이 존재 검증보다 먼저 수행된다', async () => {
    await expect(
      service.validate(['x', 'y', 'z'], now),
    ).rejects.toThrow('쿠폰은 최대 2장까지 사용할 수 있습니다.');
  });

  test('중복 ID는 제거 후 limit을 검사한다(중복 3개라도 unique 1개면 통과)', async () => {
    addCoupon('dup', future);

    await expect(
      service.validate(['dup', 'dup', 'dup'], now),
    ).resolves.toBeUndefined();
  });

  test('만료 검증이 사용완료 검증보다 먼저 수행된다', async () => {
    addCoupon('expired-used', past, true);

    await expect(
      service.validate(['expired-used'], now),
    ).rejects.toThrow('만료된 쿠폰입니다.');
  });
});
