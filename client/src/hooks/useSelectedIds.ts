import { useEffect, useRef, useState } from 'react';
import { isAllChecked, toggleId } from '../utils/cart.utils';
import { loadSelectedIds, saveSelectedIds } from '../storage/selectedIdsStorage';
import type { CartItemData } from '../types/cart';

export function useSelectedIds(cartItems: CartItemData[]) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const initialized = useRef(false);

  useEffect(() => {
    if (cartItems.length === 0) return;

    // 최초 로드 시 한 번만: 저장된 선택을 복원, 없으면 전체 선택
    if (!initialized.current) {
      const validIds = new Set(cartItems.map((item) => item.cartItemId));
      const saved = loadSelectedIds();
      // 복원 시에도 현재 장바구니에 없는(재시드 등으로 사라진) stale id는 제거한다.
      // 거르지 않으면 화면 목록(교집합)엔 안 보이면서 summary 요청엔 실려 CART_ITEM_NOT_FOUND가 난다.
      setSelectedIds(
        saved ? new Set([...saved].filter((id) => validIds.has(id))) : validIds,
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
    saveSelectedIds(selectedIds);
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
