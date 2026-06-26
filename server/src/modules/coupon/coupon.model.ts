// 쿠폰 할인 타입. DB에도 영문으로 저장하고, 응답 직렬화에서 한글로 변환한다.
// 순차 계산에서 FIXED(정액)를 먼저, PERCENTAGE(정율)를 나중에 적용한다.
export type DiscountType = 'FIXED' | 'PERCENTAGE';

// 쿠폰 식별 코드. 할인액·적용 조건 분기의 단일 기준이다(discountType은 정렬 순서용).
export type CouponCode = 'FIXED5000' | 'BOGO' | 'FREESHIPPING' | 'MIRACLESALE';

export type CouponProps = {
  couponId: string;
  code: CouponCode;
  name: string;
  discountType: DiscountType;
  discountValue: number;
  expiresAt: Date;
  minOrderAmount?: number;
  usableFrom?: string;
  usableTo?: string;
  buyQuantity?: number;
  freeQuantity?: number;
};

// 쿠폰 적용 여부·할인액 계산에 필요한 주문 맥락.
// now는 만료/시간대 판정에 쓰며, 테스트에서 주입할 수 있도록 노출한다.
// orderAmount는 순차 계산 시점 금액(앞선 쿠폰 적용 후 갱신된 값)일 수 있다.
export type CouponContext = {
  orderAmount: number;
  shippingFee: number;
  selectedItems: { unitPrice: number; quantity: number }[];
  isUsed?: boolean;
  now?: Date;
};

export class Coupon {
  couponId;
  code;
  name;
  discountType;
  discountValue;
  expiresAt;
  minOrderAmount;
  usableFrom;
  usableTo;
  buyQuantity;
  freeQuantity;

  constructor(coupon: CouponProps) {
    this.couponId = coupon.couponId;
    this.code = coupon.code;
    this.name = coupon.name;
    this.discountType = coupon.discountType;
    this.discountValue = coupon.discountValue;
    this.expiresAt = coupon.expiresAt;
    this.minOrderAmount = coupon.minOrderAmount;
    this.usableFrom = coupon.usableFrom;
    this.usableTo = coupon.usableTo;
    this.buyQuantity = coupon.buyQuantity;
    this.freeQuantity = coupon.freeQuantity;
  }

  // 코드별 할인액을 계산한다. 적용 가능 여부는 isApplicable에서 별도로 판정한다.
  // orderAmount는 순차 계산 시점 금액이므로, 정율(MIRACLESALE)은 그 시점 금액 기준으로 계산된다.
  calculateDiscount(ctx: CouponContext): number {
    switch (this.code) {
      case 'FIXED5000':
        return this.discountValue;
      case 'BOGO':
        return this.highestUnitPrice(ctx) * (this.freeQuantity ?? 1);
      case 'FREESHIPPING':
        return ctx.shippingFee;
      case 'MIRACLESALE':
        return Math.floor((ctx.orderAmount * this.discountValue) / 100);
    }
  }

  // 만료·사용여부·최소주문금액·사용시간대·코드별 조건을 모두 만족하는지.
  isApplicable(ctx: CouponContext): boolean {
    const now = ctx.now ?? new Date();

    if (this.isExpired(now)) return false;
    if (ctx.isUsed) return false;
    if (!this.meetsMinOrderAmount(ctx.orderAmount)) return false;
    if (!this.withinUsableTime(now)) return false;

    return this.meetsCodeCondition(ctx);
  }

  // 만료 판정의 단일 출처. isApplicable(목록/추천)과 service.validate(검증) 양쪽이 함께 쓴다.
  isExpired(now: Date): boolean {
    return this.expiresAt.getTime() < now.getTime();
  }

  private meetsMinOrderAmount(orderAmount: number): boolean {
    if (this.minOrderAmount == null) return true;
    return orderAmount >= this.minOrderAmount;
  }

  // usableFrom/usableTo가 모두 지정된 경우에만 now의 시:분(KST)이 구간 안인지 검사한다.
  // 자정 횡단 구간(from > to)도 지원하며 경계를 포함한다.
  private withinUsableTime(now: Date): boolean {
    if (this.usableFrom == null || this.usableTo == null) return true;

    // usableFrom/usableTo는 'HH:MM'(KST 의미)이므로 now도 KST 시:분으로 변환해 비교한다.
    const current = toKstMinutes(now);
    const from = toMinutes(this.usableFrom);
    const to = toMinutes(this.usableTo);

    if (from <= to) return current >= from && current <= to;
    // 자정 횡단: [from, 24:00) ∪ [00:00, to]
    return current >= from || current <= to;
  }

  // 코드별 추가 적용 조건. (만료·사용여부·최소주문·시간대는 isApplicable에서 공통 처리)
  private meetsCodeCondition(ctx: CouponContext): boolean {
    if (this.code === 'BOGO') {
      // "2개 구매 시 1개 무료" = 카트에 3개 있을 때 1개 무료.
      // buyQuantity가 지정되지 않은 BOGO 쿠폰은 조건이 불완전하므로 적용 불가.
      if (this.buyQuantity == null) return false;

      return ctx.selectedItems.some((item) => item.quantity >= this.buyQuantity!);
    }

    return true;
  }

  private highestUnitPrice(ctx: CouponContext): number {
    return ctx.selectedItems.reduce(
      (max, item) => Math.max(max, item.unitPrice),
      0,
    );
  }
}

// 'HH:MM' → 자정 기준 분 단위로 변환한다.
const toMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

// 절대시각(Date)을 KST(Asia/Seoul) 기준 시:분(자정 기준 분)으로 변환한다.
// 서버 로컬 TZ에 의존하지 않도록 Intl로 KST의 시·분을 추출한다.
const KST_TIME_FORMAT = new Intl.DateTimeFormat('en-US', {
  timeZone: 'Asia/Seoul',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

const toKstMinutes = (date: Date): number => {
  const parts = KST_TIME_FORMAT.formatToParts(date);
  const hour = Number(parts.find((part) => part.type === 'hour')?.value ?? '0');
  const minute = Number(
    parts.find((part) => part.type === 'minute')?.value ?? '0',
  );
  // hour12:false에서 자정이 '24'로 나오는 환경을 0으로 정규화한다.
  return (hour % 24) * 60 + minute;
};
