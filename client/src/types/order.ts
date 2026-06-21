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

// 결제 확인 화면으로 넘기는 navigate state(직렬화 가능한 값만).
// 금액은 서버 summary 값을 그대로 전달 → complete 페이지는 표시만 한다.
export interface OrderCompleteState {
  typesCount: number;
  totalCount: number;
  totalPaymentAmount: number;
}
