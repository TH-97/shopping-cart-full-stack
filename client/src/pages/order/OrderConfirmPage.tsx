import { useNavigate } from 'react-router-dom';
import {
  BackButton,
  Content,
  Description,
  Header,
  PayButton,
  Title,
  TotalAmount,
  TotalLabel,
  Wrapper,
} from './styles';
import {
  calculateDeliveryFee,
  calculateOrderAmount,
} from '../../utils/cart.utils';
import { useCartQuery } from '../../hooks/useCartQuery';
import { useSelectedIds } from '../../hooks/useSelectedIds';
import { IsLoding } from '../../components/IsLoding';
import { ErrorView } from '../../components/ErrorView';
import type { CartItemData } from '../../types/cart';

function OrderHeader() {
  const navigate = useNavigate();
  return (
    <Header>
      <BackButton aria-label="뒤로 가기" onClick={() => navigate(-1)}>
        ←
      </BackButton>
    </Header>
  );
}

export function OrderConfirmPage() {
  // cart 서버상태는 store 단일 출처를 공유한다(장바구니 페이지와 동일).
  const state = useCartQuery();

  if (state.status === 'loading')
    return (
      <Wrapper>
        <OrderHeader />
        <Content>
          <IsLoding />
        </Content>
      </Wrapper>
    );

  if (state.status === 'error')
    return (
      <Wrapper>
        <OrderHeader />
        <Content>
          <ErrorView message={state.error.message} />
        </Content>
      </Wrapper>
    );

  return <LoadedOrderConfirm cartItems={state.data} />;
}

function LoadedOrderConfirm({ cartItems }: { cartItems: CartItemData[] }) {
  // 선택 복원 규칙(저장값 또는 전체 선택)을 장바구니와 동일하게 useSelectedIds로 통일.
  const { selectedIds } = useSelectedIds(cartItems);

  const selectedItems = cartItems.filter((item) =>
    selectedIds.has(item.cartItemId),
  );
  const totalCount = selectedItems.reduce(
    (sum, item) => sum + item.purchaseQuantity,
    0,
  );

  const orderAmount = calculateOrderAmount(cartItems, selectedIds);
  const deliveryCharge = calculateDeliveryFee(orderAmount);
  const totalAmount = orderAmount + deliveryCharge;

  return (
    <Wrapper>
      <OrderHeader />

      <Content>
        <Title>주문 확인</Title>
        <Description>
          총 {selectedItems.length}종류의 상품 {totalCount}개를 주문합니다.
          <br />
          최종 결제 금액을 확인해 주세요.
        </Description>
        <TotalLabel>총 결제 금액</TotalLabel>
        <TotalAmount>{totalAmount.toLocaleString()}원</TotalAmount>
      </Content>

      <PayButton>결제하기</PayButton>
    </Wrapper>
  );
}
