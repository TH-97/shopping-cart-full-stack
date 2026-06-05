import { useEffect, useRef, useState } from 'react';
import { isAllChecked, toggleId } from './cart.utils';

interface CartItemData {
  cartItemId: string;
  productId: string;
  productName: string;
  productPrice: number;
  imageUrl: string;
  purchaseQuantity: number;
}

export function useSelectedIds(cartItems: CartItemData[]) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const initialized = useRef(false);

  useEffect(() => {
    if (cartItems.length === 0) return;

    // 최초 로드 시 한 번만: 저장된 선택을 복원, 없으면 전체 선택
    if (!initialized.current) {
      const saved = localStorage.getItem('selectedIds');
      setSelectedIds(
        saved
          ? new Set<string>(JSON.parse(saved))
          : new Set(cartItems.map((item) => item.cartItemId)),
      );
      initialized.current = true;
      return;
    }

    // 그 이후(삭제 등)로 사라진 상품의 id는 선택에서 자동 제거
    setSelectedIds((prev) => {
      const validIds = new Set(cartItems.map((item) => item.cartItemId));
      const next = new Set([...prev].filter((id) => validIds.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [cartItems]);

  // 선택이 바뀔 때마다 localStorage에 저장
  useEffect(() => {
    if (cartItems.length === 0) return;
    localStorage.setItem('selectedIds', JSON.stringify([...selectedIds]));
  }, [selectedIds, cartItems]);

  const toggleItem = (cartItemId: string) => {
    setSelectedIds((prev) => toggleId(prev, cartItemId));
  };

  const toggleAll = () => {
    if (isAllChecked(cartItems, selectedIds)) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(cartItems.map((item) => item.cartItemId)));
    }
  };

  return { selectedIds, toggleItem, toggleAll };
}
