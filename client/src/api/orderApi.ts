import { API_BASE_URL as BASE_URL } from './config';
import type { OrderSummary, OrderSummaryRequest } from '../types/order';

// 선택 항목·쿠폰·도서산간 여부로 주문 요약(금액/배송비/할인/총액)을 서버에서 계산한다.
export async function fetchOrderSummary(
  request: OrderSummaryRequest,
): Promise<OrderSummary> {
  const response = await fetch(`${BASE_URL}/orders/summary`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      message?: string;
    } | null;
    throw new Error(body?.message ?? '주문 정보를 불러오지 못했습니다.');
  }
  return response.json();
}
