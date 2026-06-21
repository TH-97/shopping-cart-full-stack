import { useNavigate } from 'react-router-dom';
import {
  BackButton,
  Content,
  CouponButton,
  Description,
  EmptyNotice,
  Header,
  PayButton,
  Title,
  Wrapper,
} from './styles';
import { OrderItemList } from './components/OrderItemList';
import { OrderSummaryBox } from './components/OrderSummaryBox';
import { RemoteAreaCheckbox } from './components/RemoteAreaCheckbox';
import { useCartQuery } from '../../hooks/useCartQuery';
import { useSelectedIds } from '../../hooks/useSelectedIds';
import { useRemoteArea } from '../../hooks/useRemoteArea';
import { useOrderSummary } from '../../hooks/useOrderSummary';
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
  const selectedCartItemIds = [...selectedIds];

  // 빈 선택 분기는 컴포넌트 경계로 분리해 useOrderSummary가 조건부로 호출되지 않게 한다(훅 규칙).
  if (selectedCartItemIds.length === 0) {
    return (
      <Wrapper>
        <OrderHeader />
        <Content>
          <Title>주문 확인</Title>
          <EmptyNotice>선택된 상품이 없습니다.</EmptyNotice>
        </Content>
        <PayButton disabled>결제하기</PayButton>
      </Wrapper>
    );
  }

  return (
    <SelectedOrderConfirm
      selectedItems={selectedItems}
      selectedCartItemIds={selectedCartItemIds}
    />
  );
}

interface SelectedOrderConfirmProps {
  selectedItems: CartItemData[];
  selectedCartItemIds: string[];
}

function SelectedOrderConfirm({
  selectedItems,
  selectedCartItemIds,
}: SelectedOrderConfirmProps) {
  const { isRemoteArea, toggle } = useRemoteArea();

  // 쿠폰 선택은 4b에서 연결한다(현재는 빈 배열 고정).
  const summaryState = useOrderSummary({
    selectedCartItemIds,
    selectedCouponIds: [],
    isRemoteArea,
  });

  const totalCount = selectedItems.reduce(
    (sum, item) => sum + item.purchaseQuantity,
    0,
  );

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

        <OrderItemList items={selectedItems} />

        {/* 4b에서 쿠폰 모달과 연결한다. */}
        <CouponButton type="button" onClick={() => {}}>
          쿠폰 적용
        </CouponButton>

        <RemoteAreaCheckbox checked={isRemoteArea} onChange={toggle} />

        <OrderSummaryBox state={summaryState} />
      </Content>

      {/* 4c에서 결제 액션과 연결한다. */}
      <PayButton type="button" onClick={() => {}}>
        결제하기
      </PayButton>
    </Wrapper>
  );
}
