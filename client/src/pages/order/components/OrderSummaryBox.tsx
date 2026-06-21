import { IsLoding } from '../../../components/IsLoding';
import { ErrorView } from '../../../components/ErrorView';
import {
  SummaryBox,
  SummaryRow,
  SummaryTotalValue,
  SummaryValue,
} from '../styles';
import type { QueryState } from '../../../hooks/useQuery';
import type { OrderSummary } from '../../../types/order';

interface OrderSummaryBoxProps {
  state: QueryState<OrderSummary>;
}

// 서버가 계산한 주문 요약을 그대로 표시한다. 클라이언트에서 금액을 재계산하지 않는다.
export function OrderSummaryBox({ state }: OrderSummaryBoxProps) {
  if (state.status === 'loading') return <IsLoding />;
  if (state.status === 'error')
    return <ErrorView message={state.error.message} />;

  const { orderAmount, couponDiscountAmount, shippingFee, totalPaymentAmount } =
    state.data;

  return (
    <SummaryBox>
      <SummaryRow>
        <span>주문 금액</span>
        <SummaryValue>{orderAmount.toLocaleString()}원</SummaryValue>
      </SummaryRow>
      <SummaryRow>
        <span>쿠폰 할인 금액</span>
        <SummaryValue>{couponDiscountAmount.toLocaleString()}원</SummaryValue>
      </SummaryRow>
      <SummaryRow>
        <span>배송비</span>
        <SummaryValue>{shippingFee.toLocaleString()}원</SummaryValue>
      </SummaryRow>
      <SummaryRow>
        <span>총 결제 금액</span>
        <SummaryTotalValue>
          {totalPaymentAmount.toLocaleString()}원
        </SummaryTotalValue>
      </SummaryRow>
    </SummaryBox>
  );
}
