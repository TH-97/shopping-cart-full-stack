// POST /orders/summary 요청 바디.
export interface OrderSummaryRequest {
  selectedCartItemIds: string[];
  selectedCouponIds: string[];
  isRemoteArea: boolean;
}

// POST /orders/summary 응답(서버가 계산한 금액).
export interface OrderSummary {
  orderAmount: number;
  couponDiscountAmount: number;
  shippingFee: number;
  totalPaymentAmount: number;
}
