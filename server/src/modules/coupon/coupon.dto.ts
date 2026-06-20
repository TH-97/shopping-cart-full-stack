import {
  invalidCartItemIdsError,
  invalidCouponIdsError,
} from '../../errors/domainErrors.js';
import { requireBody } from '../../shared/requestParsing.js';
import type { DiscountType } from './coupon.model.js';

// discount_type(영문 enum) → 응답용 한글 라벨.
const DISCOUNT_TYPE_LABEL: Record<DiscountType, string> = {
  FIXED: '정액',
  PERCENT: '정률',
  FREE_SHIPPING: '무료배송',
  BUY_X_GET_1: '증정',
};

export const toDiscountTypeLabel = (discountType: DiscountType): string =>
  DISCOUNT_TYPE_LABEL[discountType];

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

// 문자열 배열 + 각 원소가 비어있지 않은 문자열인지 검증한다(타입 검증).
export const requireStringArray = (
  value: unknown,
  createError: () => Error,
): string[] => {
  if (!Array.isArray(value)) throw createError();
  return value.map((item) => {
    if (typeof item !== 'string' || item.trim() === '') throw createError();
    return item;
  });
};

export type CouponSummaryItem = {
  couponId: string;
  couponName: string;
  discountType: string;
  isApplicable: boolean;
  discountAmount: number;
};

export const toCouponsResponse = (
  orderAmount: number,
  coupons: CouponSummaryItem[],
) => ({
  orderAmount,
  coupons,
});
