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
import { calculateDeliveryFee, calculateOrderAmount } from '../cart/cart.utils';

const BASE_URL =
  'https://shopping-cart-full-stack-production-7ca8.up.railway.app';

interface CartItemData {
  cartItemId: string;
  productId: string;
  productName: string;
  productPrice: number;
  imageUrl: string;
  purchaseQuantity: number;
}

export function OrderConfirmPage() {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState<CartItemData[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchCartItems = async () => {
      const response = await fetch(`${BASE_URL}/cart/items`);
      if (response.ok) {
        const data: CartItemData[] = await response.json();
        setCartItems(data);

        const saved = localStorage.getItem('selectedIds');
        setSelectedIds(saved ? new Set(JSON.parse(saved)) : new Set());
      }
    };
    fetchCartItems();
  }, []);

  // 선택된 상품만 기준으로 다시 계산 (장바구니와 같은 소스 → SSOT)
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
