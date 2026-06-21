import {
  Item,
  ItemImage,
  ItemInfo,
  ItemList,
  ItemMeta,
  ItemName,
} from '../styles';
import type { CartItemData } from '../../../types/cart';

interface OrderItemListProps {
  items: CartItemData[];
}

// 선택한 주문 상품을 표시 전용으로 나열한다(수량 변경/삭제 없음).
export function OrderItemList({ items }: OrderItemListProps) {
  return (
    <ItemList>
      {items.map((item) => (
        <Item key={item.cartItemId}>
          <ItemImage src={item.imageUrl} alt={item.productName} />
          <ItemInfo>
            <ItemName>{item.productName}</ItemName>
            <ItemMeta>{item.productPrice.toLocaleString()}원</ItemMeta>
            <ItemMeta>{item.purchaseQuantity}개</ItemMeta>
          </ItemInfo>
        </Item>
      ))}
    </ItemList>
  );
}
