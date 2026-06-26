import { useQuery } from './useQuery';
import { queryKey } from '../queries/queryKey';
import { fetchOrderSummary } from '../api/orderApi';
import type { OrderSummaryRequest } from '../types/order';

// 요청 입력(선택 항목·쿠폰·도서산간)을 키로 직렬화 → 입력이 바뀌면 자동 재계산.
export const orderSummaryQueryKey = (request: OrderSummaryRequest) =>
  queryKey('orderSummary', request);

// 서버가 계산한 주문 요약(금액/배송비/할인/총액) 도메인 앵커.
// POST지만 부수효과 없는 계산이라 쿼리로 모델링한다.
export const useOrderSummary = (request: OrderSummaryRequest) =>
  useQuery(orderSummaryQueryKey(request), () => fetchOrderSummary(request));
