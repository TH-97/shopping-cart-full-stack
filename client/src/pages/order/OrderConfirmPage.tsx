import { useNavigate } from 'react-router-dom';
import {
  BackButton,
  Content,
  CouponButton,
  Description,
  EmptyNotice,
  Header,
  PayButton,
  PayError,
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
import { useCoupons } from '../../hooks/useCoupons';
import { useCouponSelection } from '../../hooks/useCouponSelection';
import { CouponModal } from './components/CouponModal';
import { IsLoding } from '../../components/IsLoding';
import { ErrorView } from '../../components/ErrorView';
import { usePayment } from '../../hooks/usePayment';
import type { CartItemData } from '../../types/cart';
import type { CouponData } from '../../types/coupon';
import type { OrderCompleteState } from '../../types/order';

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
  const navigate = useNavigate();
  const { pay, status: payStatus, error: payError } = usePayment();
  const { isRemoteArea, toggle } = useRemoteArea();

  // 보유 쿠폰(서버상태). 선택 항목 기준 적용여부/할인액을 가져온다.
  const couponsState = useCoupons(selectedCartItemIds);

  // 적용 가능 쿠폰만 추려 best-combo 초기화 입력으로 넘긴다.
  // useCouponSelection은 이 배열의 값(length/포함 여부)만 보고 참조 식별자에
  // 기대지 않으므로, memo 없이 매 렌더 계산한다(작은 배열 filter).
  const applicableCoupons: CouponData[] =
    couponsState.status === 'ready'
      ? couponsState.data.coupons.filter((coupon) => coupon.isApplicable)
      : [];

  // 초기 선택은 서버 추천 조합(실제 할인 최대 ≤2)을 그대로 사용한다(클라 재계산 없음).
  const recommendedCouponIds =
    couponsState.status === 'ready'
      ? couponsState.data.recommendedCouponIds
      : [];

  const { selectedCouponIds, isModalOpen, open, close, toggleCoupon } =
    useCouponSelection(applicableCoupons, recommendedCouponIds);

  // 선택 항목·쿠폰·도서산간이 바뀌면 서버 요약이 자동 재계산된다.
  const summaryState = useOrderSummary({
    selectedCartItemIds,
    selectedCouponIds,
    isRemoteArea,
  });

  const couponDiscountAmount =
    summaryState.status === 'ready'
      ? summaryState.data.couponDiscountAmount
      : 0;

  const totalCount = selectedItems.reduce(
    (sum, item) => sum + item.purchaseQuantity,
    0,
  );

  // summary가 준비되지 않으면 표시할 금액이 없어 결제할 수 없다.
  const isSummaryReady = summaryState.status === 'ready';
  const isPayDisabled = !isSummaryReady || payStatus === 'loading';

  // 결제 = 선택 쿠폰 유효성 검증만(주문 저장 없음). 통과하면 확인 화면으로 이동한다.
  // 금액은 서버 summary 값을 그대로 넘긴다(클라 재계산 없음).
  const handlePay = async () => {
    if (summaryState.status !== 'ready') return;

    const succeeded = await pay(selectedCouponIds);
    if (!succeeded) return;

    const completeState: OrderCompleteState = {
      typesCount: selectedItems.length,
      totalCount,
      totalPaymentAmount: summaryState.data.totalPaymentAmount,
    };
    navigate('/order/complete', { state: completeState });
  };

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

        <CouponButton type="button" onClick={open}>
          쿠폰 적용
        </CouponButton>

        <RemoteAreaCheckbox checked={isRemoteArea} onChange={toggle} />

        <OrderSummaryBox state={summaryState} />
      </Content>

      {isModalOpen && (
        <CouponModal
          couponsState={couponsState}
          selectedCouponIds={selectedCouponIds}
          onToggle={toggleCoupon}
          couponDiscountAmount={couponDiscountAmount}
          onClose={close}
        />
      )}

      {payStatus === 'error' && payError && <PayError role="alert">{payError}</PayError>}

      <PayButton type="button" onClick={handlePay} disabled={isPayDisabled}>
        결제하기
      </PayButton>
    </Wrapper>
  );
}
