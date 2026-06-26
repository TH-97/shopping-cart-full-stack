import {
  invalidCartItemIdsError,
  invalidCouponIdsError,
} from '../../errors/domainErrors.js';
import {
  requireBody,
  requireStringArray,
} from '../../shared/requestParsing.js';
import type { DiscountType } from './coupon.model.js';

// GET /coupons?selectedCartItemIds=10,12 → 쉼표 분리 후 빈 토큰 제거.
// 쿼리가 없으면 빈 배열로 본다(선택 항목 없음).
export const parseSelectedCartItemIdsQuery = (
  query: { selectedCartItemIds?: unknown },
): string[] => {
  const raw = query.selectedCartItemIds;
  if (raw === undefined) return [];
  if (typeof raw !== 'string') throw invalidCartItemIdsError();

  return raw
    .split(',')
    .map((id) => id.trim())
    .filter((id) => id !== '');
};

// POST /coupons/validate body { selectedCouponIds: string[] }
export const parseSelectedCouponIdsDto = (body: unknown): string[] => {
  const requestBody = requireBody(body, invalidCouponIdsError);
  return requireStringArray(requestBody.selectedCouponIds, invalidCouponIdsError);
};

export type CouponSummaryItem = {
  couponId: string;
  couponName: string;
  discountType: DiscountType;
  isApplicable: boolean;
  // 모달 표시용 메타. usableFrom/usableTo는 사용 가능 시간대가 없으면 null.
  expiresAt: string;
  minOrderAmount: number | null;
  usableFrom: string | null;
  usableTo: string | null;
};

export const toCouponsResponse = (
  orderAmount: number,
  coupons: CouponSummaryItem[],
  recommendedCouponIds: string[],
) => ({
  orderAmount,
  coupons,
  recommendedCouponIds,
});
