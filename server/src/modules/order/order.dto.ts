import {
  invalidCartItemIdsError,
  invalidCouponIdsError,
} from '../../errors/domainErrors.js';
import { requireBody } from '../../shared/requestParsing.js';
import { requireStringArray } from '../coupon/coupon.dto.js';

export type OrderSummaryCommand = {
  selectedCartItemIds: string[];
  selectedCouponIds: string[];
  isRemoteArea: boolean;
};

// POST /orders/summary body 파싱(타입 검증만).
export const parseOrderSummaryDto = (body: unknown): OrderSummaryCommand => {
  const requestBody = requireBody(body, invalidCartItemIdsError);

  return {
    selectedCartItemIds: requireStringArray(
      requestBody.selectedCartItemIds,
      invalidCartItemIdsError,
    ),
    selectedCouponIds: requireStringArray(
      requestBody.selectedCouponIds,
      invalidCouponIdsError,
    ),
    isRemoteArea: requireBoolean(
      requestBody.isRemoteArea,
      invalidCartItemIdsError,
    ),
  };
};

const requireBoolean = (value: unknown, createError: () => Error): boolean => {
  if (typeof value !== 'boolean') throw createError();
  return value;
};

export type OrderSummary = {
  orderAmount: number;
  couponDiscountAmount: number;
  shippingFee: number;
  totalPaymentAmount: number;
};

export const toOrderSummaryResponse = (summary: OrderSummary) => ({
  orderAmount: summary.orderAmount,
  couponDiscountAmount: summary.couponDiscountAmount,
  shippingFee: summary.shippingFee,
  totalPaymentAmount: summary.totalPaymentAmount,
});
