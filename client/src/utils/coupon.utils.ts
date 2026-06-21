import type { CouponData } from '../types/coupon';

// 적용 가능한 쿠폰 중 단독 할인액이 큰 순으로 최대 2개의 couponId를 고른다.
// 그리디 근사(조합 최적이 아닌 단독 할인액 기준 상위 2개)로 best-combo 초기값을 만든다.
export function pickBestCoupons(coupons: CouponData[]): string[] {
  return coupons
    .filter((coupon) => coupon.isApplicable)
    .slice()
    .sort((a, b) => b.discountAmount - a.discountAmount)
    .slice(0, 2)
    .map((coupon) => coupon.couponId);
}

// ISO 문자열을 "2026년 11월 30일" 형태로 표기한다.
export function formatExpiry(iso: string): string {
  const date = new Date(iso);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${year}년 ${month}월 ${day}일`;
}

// 최소 주문 금액 안내 문구. 조건이 없으면 null.
export function formatMinOrder(minOrderAmount: number | null): string | null {
  if (minOrderAmount === null) return null;
  return `${minOrderAmount.toLocaleString()}원 이상 구매 시 사용 가능`;
}

// "HH:MM" 문자열을 "오전 4시"/"오후 7시" 형태로 표기한다.
function formatHour(time: string): string {
  const hour = Number(time.split(':')[0]);
  const meridiem = hour < 12 ? '오전' : '오후';
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${meridiem} ${displayHour}시`;
}

// 사용 가능 시간대 안내. 둘 다 없으면 null.
export function formatUsableTime(
  from: string | null,
  to: string | null,
): string | null {
  if (from === null || to === null) return null;
  return `${formatHour(from)}부터 ${formatHour(to).replace(/^(오전|오후) /, '')}까지`;
}
