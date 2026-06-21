import { Modal } from '../../../components/Modal';
import { IsLoding } from '../../../components/IsLoding';
import { ErrorView } from '../../../components/ErrorView';
import { CouponItem } from './CouponItem';
import { CouponList, CouponNotice, CouponUseButton } from '../styles';
import type { QueryState } from '../../../hooks/useQuery';
import type { CouponListResponse } from '../../../types/coupon';

const MAX_SELECTED = 2;
const TITLE_ID = 'coupon-modal-title';

interface CouponModalProps {
  couponsState: QueryState<CouponListResponse>;
  selectedCouponIds: string[];
  onToggle: (couponId: string) => void;
  // 서버 summary가 계산한 쿠폰 할인 합. 모달이 직접 합산하지 않는다.
  couponDiscountAmount: number;
  onClose: () => void;
}

export function CouponModal({
  couponsState,
  selectedCouponIds,
  onToggle,
  couponDiscountAmount,
  onClose,
}: CouponModalProps) {
  return (
    <Modal title="쿠폰을 선택해 주세요" titleId={TITLE_ID} onClose={onClose}>
      <CouponNotice>쿠폰은 최대 2개까지 사용할 수 있습니다.</CouponNotice>

      {couponsState.status === 'loading' && <IsLoding />}
      {couponsState.status === 'error' && (
        <ErrorView message={couponsState.error.message} />
      )}
      {couponsState.status === 'ready' && (
        <CouponList>
          {couponsState.data.coupons.map((coupon) => {
            const checked = selectedCouponIds.includes(coupon.couponId);
            // 이미 선택된 쿠폰은 항상 해제 가능. 선택 안 된 것만 적용불가/최대치로 비활성.
            const disabled =
              !checked &&
              (!coupon.isApplicable ||
                selectedCouponIds.length >= MAX_SELECTED);
            return (
              <CouponItem
                key={coupon.couponId}
                coupon={coupon}
                checked={checked}
                disabled={disabled}
                onToggle={() => onToggle(coupon.couponId)}
              />
            );
          })}
        </CouponList>
      )}

      <CouponUseButton type="button" onClick={onClose}>
        총 {couponDiscountAmount.toLocaleString()}원 할인 쿠폰 사용하기
      </CouponUseButton>
    </Modal>
  );
}
