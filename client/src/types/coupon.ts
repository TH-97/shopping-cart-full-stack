// 쿠폰 할인 타입(머신값). 정액(FIXED) 먼저, 정율(PERCENTAGE) 나중에 적용된다.
// 한글 라벨이 필요하면 표시 시점에 매핑한다.
export type DiscountType = 'FIXED' | 'PERCENTAGE';

// GET /coupons 응답의 쿠폰 한 건.
export interface CouponData {
  couponId: string;
  couponName: string;
  discountType: DiscountType;
  isApplicable: boolean;
  // 현재 주문 기준 단독 적용 시 할인액(적용 불가 시 0).
  discountAmount: number;
  // 모달 표시용 메타. 조건이 없으면 null.
  expiresAt: string;
  minOrderAmount: number | null;
  usableFrom: string | null;
  usableTo: string | null;
}

// GET /coupons 응답 전체.
export interface CouponListResponse {
  orderAmount: number;
  coupons: CouponData[];
}
