import { useState } from 'react';
import { pickBestCoupons } from '../utils/coupon.utils';
import type { CouponData } from '../types/coupon';

const MAX_SELECTED = 2;

// 쿠폰 선택은 화면 전용 클라이언트 상태(서버상태와 분리).
// 선택 가능 쿠폰 목록이 준비되면 best-combo로 1회 초기화하고, 이후엔 사용자 토글만 반영한다.
export function useCouponSelection(applicableCoupons: CouponData[]) {
  const [selectedCouponIds, setSelectedCouponIds] = useState<string[]>([]);
  const [initialized, setInitialized] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // best-combo 초기화는 렌더 중 상태 보정(React 공식 패턴)으로 1회만 수행한다.
  // 트리거(초기화 여부)를 state로 두어 ref-during-render/setState-in-effect를 모두 피한다.
  if (!initialized && applicableCoupons.length > 0) {
    setInitialized(true);
    setSelectedCouponIds(pickBestCoupons(applicableCoupons));
  }

  const open = () => setIsModalOpen(true);
  const close = () => setIsModalOpen(false);

  const toggleCoupon = (couponId: string) => {
    setSelectedCouponIds((prev) => {
      if (prev.includes(couponId)) {
        return prev.filter((id) => id !== couponId);
      }
      // 이미 최대치면 새 선택은 무시한다.
      if (prev.length >= MAX_SELECTED) return prev;
      return [...prev, couponId];
    });
  };

  return { selectedCouponIds, isModalOpen, open, close, toggleCoupon };
}
