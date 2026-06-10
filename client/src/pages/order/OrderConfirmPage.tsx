import { useEffect, useState } from 'react';
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
import { fetchCartItems } from '../../api/cartApi';
import { loadSelectedIds } from '../../storage/selectedIdsStorage';
import type { CartItemData } from '../../types/cart';

export function OrderConfirmPage() {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState<CartItemData[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const loadOrder = async () => {
      try {
        const data = await fetchCartItems();
        setCartItems(data);
        setSelectedIds(loadSelectedIds() ?? new Set());
      } catch {
        // 주문 정보를 불러오지 못하면 빈 상태를 유지한다
      }
    };
    loadOrder();
  }, []);

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
      <Header>
        <BackButton aria-label="뒤로 가기" onClick={() => navigate(-1)}>
          ←
        </BackButton>
      </Header>

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
