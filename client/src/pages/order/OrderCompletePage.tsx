import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import {
  CompleteTotalAmount,
  CompleteTotalLabel,
  Content,
  Description,
  Header,
  PayButton,
  Title,
  Wrapper,
} from './styles';
import type { OrderCompleteState } from '../../types/order';

export function OrderCompletePage() {
  const navigate = useNavigate();
  // 결제 직전 화면이 navigate state로 넘긴 표시값을 받는다.
  const state = useLocation().state as OrderCompleteState | null;

  // 새로고침/직접 진입 등 state가 없으면 장바구니로 리다이렉트(가드).
  if (!state) {
    return <Navigate to="/cart" replace />;
  }

  const { typesCount, totalCount, totalPaymentAmount } = state;

  return (
    <Wrapper>
      <Header />

      <Content>
        <Title>결제 확인</Title>
        <Description>
          총 {typesCount}종류의 상품 {totalCount}개를 주문했습니다.
          <br />
          최종 결제 금액을 확인해 주세요.
        </Description>

        <CompleteTotalLabel>총 결제 금액</CompleteTotalLabel>
        <CompleteTotalAmount>
          {totalPaymentAmount.toLocaleString()}원
        </CompleteTotalAmount>
      </Content>

      <PayButton type="button" onClick={() => navigate('/cart')}>
        장바구니로 돌아가기
      </PayButton>
    </Wrapper>
  );
}
