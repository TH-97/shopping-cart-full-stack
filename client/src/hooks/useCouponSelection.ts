import { useCallback, useState } from 'react';
import type { CouponData } from '../types/coupon';

const MAX_SELECTED = 2;

// 쿠폰 선택은 화면 전용 클라이언트 상태(서버상태와 분리).
// 선택 가능 쿠폰 목록이 준비되면 서버 추천 조합(recommendedCouponIds)으로 1회 초기화하고,
// 이후엔 사용자 토글만 반영한다.
export function useCouponSelection(
  applicableCoupons: CouponData[],
  recommendedCouponIds: string[],
) {
  const [selectedCouponIds, setSelectedCouponIds] = useState<string[]>([]);
  const [initialized, setInitialized] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 초기화는 렌더 중 상태 보정(React 공식 패턴)으로 1회만 수행한다.
  // 트리거(초기화 여부)를 state로 두어 ref-during-render/setState-in-effect를 모두 피한다.
  // recommendedCouponIds는 서버가 계산한 실제 할인 최대 조합(applicable의 부분집합)이라
  // 클라에서 재계산하지 않고 그대로 초기 선택으로 둔다.
  if (!initialized && applicableCoupons.length > 0) {
    setInitialized(true);
    setSelectedCouponIds(recommendedCouponIds);
  }

  // 핸들러는 참조 안정화(useCallback) — Modal의 keydown 리스너가 onClose 새 참조마다
  // 재등록되어 포커스가 튀는 문제를 막는다.
  const open = useCallback(() => setIsModalOpen(true), []);
  const close = useCallback(() => setIsModalOpen(false), []);

  const toggleCoupon = useCallback((couponId: string) => {
    setSelectedCouponIds((prev) => {
      if (prev.includes(couponId)) {
        return prev.filter((id) => id !== couponId);
      }
      // 이미 최대치면 새 선택은 무시한다.
      if (prev.length >= MAX_SELECTED) return prev;
      return [...prev, couponId];
    });
  }, []);

  // 적용 가능 집합이 바뀌면(선택 항목 변경 등) selectedCouponIds에 이제는 못 쓰는
  // 쿠폰 ID가 남을 수 있어, 내보낼 때 현재 적용 가능한 것만 거른다.
  const validSelectedIds = selectedCouponIds.filter((id) =>
    applicableCoupons.some((c) => c.couponId === id),
  );

  return { selectedCouponIds: validSelectedIds, isModalOpen, open, close, toggleCoupon };
}
