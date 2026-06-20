import {
  couponAlreadyUsedError,
  couponExpiredError,
  couponNotFoundError,
  exceedsCouponLimitError,
} from '../../errors/domainErrors.js';
import type { CouponRepository, OwnedCoupon } from './coupon.repository.js';

export const MAX_COUPON_COUNT = 2;

export class CouponService {
  constructor(private readonly couponRepository: CouponRepository) {}

  findOwnedByUser(userId: string): Promise<OwnedCoupon[]> {
    return this.couponRepository.findOwnedByUser(userId);
  }

  findByIds(couponIds: string[]): Promise<OwnedCoupon[]> {
    return this.couponRepository.findByIds(couponIds);
  }

  // 쿠폰 사용 가능성 검증. 검증 순서: 개수 → 존재 → 만료 → 사용완료.
  // (적용 조건 isApplicable 판정은 주문 요약 흐름에서 별도로 한다)
  async validate(
    couponIds: string[],
    now: Date = new Date(),
  ): Promise<void> {
    this.assertWithinLimit(couponIds);

    for (const couponId of couponIds) {
      const owned = await this.couponRepository.findById(couponId);
      if (!owned) throw couponNotFoundError();
      if (owned.coupon.expiresAt.getTime() < now.getTime()) {
        throw couponExpiredError();
      }
      if (owned.isUsed) throw couponAlreadyUsedError();
    }
  }

  private assertWithinLimit(couponIds: string[]): void {
    if (couponIds.length > MAX_COUPON_COUNT) throw exceedsCouponLimitError();
  }
}
