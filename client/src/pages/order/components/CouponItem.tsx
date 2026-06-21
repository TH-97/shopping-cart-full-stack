import { CheckBox } from '../../../components/styles';
import {
  CouponInfo,
  CouponItemRow,
  CouponMeta,
  CouponName,
} from '../styles';
import {
  formatExpiry,
  formatMinOrder,
  formatUsableTime,
} from '../../../utils/coupon.utils';
import type { CouponData } from '../../../types/coupon';

interface CouponItemProps {
  coupon: CouponData;
  checked: boolean;
  disabled: boolean;
  onToggle: () => void;
}

// 쿠폰 한 건을 체크박스 + 이름 + 메타로 표시한다. discountType은 표시하지 않는다(이름이 정보 전달).
export function CouponItem({
  coupon,
  checked,
  disabled,
  onToggle,
}: CouponItemProps) {
  const minOrder = formatMinOrder(coupon.minOrderAmount);
  const usableTime = formatUsableTime(coupon.usableFrom, coupon.usableTo);

  return (
    <CouponItemRow disabled={disabled}>
      <CheckBox
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={onToggle}
        aria-label={coupon.couponName}
      />
      <CouponInfo>
        <CouponName>{coupon.couponName}</CouponName>
        <CouponMeta>만료일: {formatExpiry(coupon.expiresAt)}</CouponMeta>
        {minOrder && <CouponMeta>{minOrder}</CouponMeta>}
        {usableTime && <CouponMeta>사용 가능 시간: {usableTime}</CouponMeta>}
      </CouponInfo>
    </CouponItemRow>
  );
}
