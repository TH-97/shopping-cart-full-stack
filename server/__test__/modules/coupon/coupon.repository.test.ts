import { Coupon } from '../../../src/modules/coupon/coupon.model.js';
import {
  createInMemoryCouponRepository,
  type UserCouponRow,
} from '../../support/inMemoryRepositories.js';

const future = new Date('2099-12-31T23:59:59Z');

const createCoupon = (couponId: string) =>
  new Coupon({
    couponId,
    name: '쿠폰',
    discountType: 'FIXED',
    discountValue: 5000,
    expiresAt: future,
  });

const createOwnership = (
  couponId: string,
  userId: string,
  isUsed = false,
): UserCouponRow => ({
  userCouponId: `uc-${couponId}`,
  couponId,
  userId,
  isUsed,
});

describe('InMemoryCouponRepository', () => {
  let couponsDB: Map<string, Coupon>;
  let userCouponsDB: Map<string, UserCouponRow>;
  let repository: ReturnType<typeof createInMemoryCouponRepository>;

  beforeEach(() => {
    couponsDB = new Map();
    userCouponsDB = new Map();
    repository = createInMemoryCouponRepository(couponsDB, userCouponsDB);

    couponsDB.set('c1', createCoupon('c1'));
    couponsDB.set('c2', createCoupon('c2'));
    userCouponsDB.set('uc-c1', createOwnership('c1', 'demo-user'));
    userCouponsDB.set('uc-c2', createOwnership('c2', 'demo-user', true));
    userCouponsDB.set('uc-c1-other', {
      userCouponId: 'uc-c1-other',
      couponId: 'c1',
      userId: 'other-user',
      isUsed: false,
    });
  });

  test('findOwnedByUser는 해당 유저 보유 쿠폰을 조인해 반환한다', async () => {
    const owned = await repository.findOwnedByUser('demo-user');

    expect(owned).toHaveLength(2);
    const ids = owned.map((o) => o.coupon.couponId).sort();
    expect(ids).toEqual(['c1', 'c2']);
  });

  test('findOwnedByUser는 isUsed 플래그를 함께 반환한다', async () => {
    const owned = await repository.findOwnedByUser('demo-user');
    const c2 = owned.find((o) => o.coupon.couponId === 'c2');

    expect(c2?.isUsed).toBe(true);
    expect(c2?.userCouponId).toBe('uc-c2');
  });

  test('findById는 보유한 쿠폰을 OwnedCoupon으로 반환한다', async () => {
    const owned = await repository.findById('c1');

    expect(owned?.coupon.couponId).toBe('c1');
    expect(owned?.isUsed).toBe(false);
  });

  test('findById는 존재하지 않는 쿠폰이면 undefined', async () => {
    expect(await repository.findById('missing')).toBeUndefined();
  });

  test('findByIds는 일치하는 보유 쿠폰만 반환한다', async () => {
    const owned = await repository.findByIds(['c1', 'missing']);

    expect(owned).toHaveLength(1);
    expect(owned[0].coupon.couponId).toBe('c1');
  });

  test('보유 관계가 있어도 쿠폰 정의가 없으면(orphan) 제외한다', async () => {
    userCouponsDB.set('uc-orphan', createOwnership('orphan', 'demo-user'));

    const owned = await repository.findOwnedByUser('demo-user');
    expect(owned.map((o) => o.coupon.couponId)).not.toContain('orphan');
  });
});
