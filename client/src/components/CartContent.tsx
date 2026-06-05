import {
  CartItem,
  CartItemList,
  CheckBox,
  DeleteButton,
  Description,
  ItemBody,
  ItemImage,
  ItemInfo,
  ItemName,
  ItemPrice,
  ItemTopRow,
  Notice,
  PriceRow,
  PriceSummary,
  PriceValue,
  PrimaryButton,
  Quantity,
  QuantityButton,
  QuantityControl,
  SelectAllLabel,
  SelectAllText,
  TotalValue,
} from './styles';
import { calculateDeliveryFee, calculateOrderAmount } from '../utils/cart.utils';
import type { CartItemData } from '../types/cart';

interface CartContentProps {
  cartItems: CartItemData[];
  selectedIds: Set<string>;
  isAllChecked: boolean;
  onToggleAll: () => void;
  onToggleItem: (cartItemId: string) => void;
  onChangeQuantity: (cartItemId: string, newQuantity: number) => void;
  onDeleteItem: (cartItemId: string) => void;
  onOrder: () => void;
}

export function CartContent({
  cartItems,
  selectedIds,
  isAllChecked,
  onToggleAll,
  onToggleItem,
  onChangeQuantity,
  onDeleteItem,
  onOrder,
}: CartContentProps) {
  const priceSummry = calculateOrderAmount(cartItems, selectedIds);
  const deliveryCharge = calculateDeliveryFee(priceSummry);

  return (
    <>
      <Description>현재 {cartItems.length}종류의 상품이 담겨있습니다.</Description>

      <SelectAllLabel>
        <CheckBox
          type="checkbox"
          checked={isAllChecked}
          onChange={() => onToggleAll()}
        />
        <SelectAllText>전체 선택</SelectAllText>
      </SelectAllLabel>

      <CartItemList>
        {cartItems.map((item) => (
          <CartItem key={item.cartItemId}>
            <ItemTopRow>
              <CheckBox
                type="checkbox"
                checked={selectedIds.has(item.cartItemId)}
                onChange={() => onToggleItem(item.cartItemId)}
              />
              <DeleteButton onClick={() => onDeleteItem(item.cartItemId)}>
                삭제
              </DeleteButton>
            </ItemTopRow>
            <ItemBody>
              <ItemImage src={item.imageUrl} alt={item.productName} />
              <ItemInfo>
                <ItemName>{item.productName}</ItemName>
                <ItemPrice>{item.productPrice.toLocaleString()}원</ItemPrice>
                <QuantityControl>
                  <QuantityButton
                    aria-label="수량 감소"
                    onClick={() =>
                      onChangeQuantity(item.cartItemId, item.purchaseQuantity - 1)
                    }
                  >
                    -
                  </QuantityButton>
                  <Quantity>{item.purchaseQuantity}</Quantity>
                  <QuantityButton
                    aria-label="수량 증가"
                    onClick={() =>
                      onChangeQuantity(item.cartItemId, item.purchaseQuantity + 1)
                    }
                  >
                    +
                  </QuantityButton>
                </QuantityControl>
              </ItemInfo>
            </ItemBody>
          </CartItem>
        ))}
      </CartItemList>

      <Notice>ⓘ 총 주문 금액이 100,000원 이상일 경우 무료 배송됩니다.</Notice>

      <PriceSummary>
        <PriceRow>
          <span>주문 금액</span>
          <PriceValue>{priceSummry}원</PriceValue>
        </PriceRow>
        <PriceRow>
          <span>배송비</span>
          <PriceValue>{deliveryCharge}원</PriceValue>
        </PriceRow>
        <PriceRow>
          <span>총 결제 금액</span>
          <TotalValue>{priceSummry + deliveryCharge}원</TotalValue>
        </PriceRow>
      </PriceSummary>

      <PrimaryButton onClick={onOrder}>주문 확인</PrimaryButton>
    </>
  );
}
