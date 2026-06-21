import { useState } from 'react';
import { validateCoupons } from '../api/couponApi';

// 결제하기 액션 상태(화면 전용 클라이언트 상태).
// 주문 생성 API가 없으므로 결제 = 선택 쿠폰 유효성 검증뿐이다(주문 저장 없음).
type PayStatus = 'idle' | 'loading' | 'error';

// navigate는 호출부가 담당한다(책임 분리/테스트 용이).
// pay는 성공 시 resolve, 실패 시 status='error'로 두고 reject하지 않는다.
export function usePayment() {
  const [status, setStatus] = useState<PayStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const pay = async (selectedCouponIds: string[]): Promise<boolean> => {
    setStatus('loading');
    setError(null);
    try {
      await validateCoupons(selectedCouponIds);
      setStatus('idle');
      return true;
    } catch (err) {
      setStatus('error');
      setError((err as Error).message);
      return false;
    }
  };

  return { pay, status, error };
}
