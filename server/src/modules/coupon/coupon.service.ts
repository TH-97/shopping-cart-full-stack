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
    // 중복 ID는 제거 후 검증한다(limit도 unique 개수 기준).
    const uniqueCouponIds = [...new Set(couponIds)];
    this.assertWithinLimit(uniqueCouponIds);

    for (const couponId of uniqueCouponIds) {
      const owned = await this.couponRepository.findById(couponId);
      if (!owned) throw couponNotFoundError();
      // 만료 판정은 model을 단일 출처로 빌려 쓴다(isApplicable과 규칙이 어긋나지 않게).
      if (owned.coupon.isExpired(now)) throw couponExpiredError();
      if (owned.isUsed) throw couponAlreadyUsedError();
    }
  }

  private assertWithinLimit(couponIds: string[]): void {
    if (couponIds.length > MAX_COUPON_COUNT) throw exceedsCouponLimitError();
  }
}
