// 쿠폰 할인 타입(머신값). 정액(FIXED) 먼저, 정율(PERCENTAGE) 나중에 적용된다.
// 한글 라벨이 필요하면 표시 시점에 매핑한다.
export type DiscountType = 'FIXED' | 'PERCENTAGE';

// GET /coupons 응답의 쿠폰 한 건.
export interface CouponData {
  couponId: string;
  couponName: string;
  discountType: DiscountType;
  isApplicable: boolean;
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
  // 서버가 계산한 실제 할인 최대 조합(적용 가능 쿠폰의 부분집합, 길이 0~2).
  // 클라이언트 초기 선택값으로 그대로 사용한다(클라 재계산 없음).
  recommendedCouponIds: string[];
}
