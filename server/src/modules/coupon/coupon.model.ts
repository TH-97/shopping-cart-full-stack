// 쿠폰 할인 타입. DB에도 영문으로 저장하고, 응답 직렬화에서 한글로 변환한다.
export type DiscountType =
  | 'FIXED'
  | 'PERCENT'
  | 'FREE_SHIPPING'
  | 'BUY_X_GET_1';

export type Type = {
  couponId: string;
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
export type CouponContext = {
  orderAmount: number;
  shippingFee: number;
  selectedItems: { unitPrice: number; quantity: number }[];
  isUsed?: boolean;
  now?: Date;
};

export class Coupon {
  couponId;
  name;
  discountType;
  discountValue;
  expiresAt;
  minOrderAmount;
  usableFrom;
  usableTo;
  buyQuantity;
  freeQuantity;

  constructor(coupon: Type) {
    this.couponId = coupon.couponId;
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

  // 타입별 할인액을 계산한다. 적용 가능 여부는 isApplicable에서 별도로 판정한다.
  calculateDiscount(ctx: CouponContext): number {
    switch (this.discountType) {
      case 'FIXED':
        return this.discountValue;
      case 'PERCENT':
        return Math.floor((ctx.orderAmount * this.discountValue) / 100);
      case 'FREE_SHIPPING':
        return ctx.shippingFee;
      case 'BUY_X_GET_1':
        return this.highestUnitPrice(ctx) * (this.freeQuantity ?? 1);
    }
  }

  // 만료·사용여부·최소주문금액·사용시간대·타입별 조건을 모두 만족하는지.
  isApplicable(ctx: CouponContext): boolean {
    const now = ctx.now ?? new Date();

    if (this.isExpired(now)) return false;
    if (ctx.isUsed) return false;
    if (!this.meetsMinOrderAmount(ctx.orderAmount)) return false;
    if (!this.withinUsableTime(now)) return false;

    return this.meetsTypeCondition(ctx);
  }

  private isExpired(now: Date): boolean {
    return this.expiresAt.getTime() < now.getTime();
  }

  private meetsMinOrderAmount(orderAmount: number): boolean {
    if (this.minOrderAmount == null) return true;
    return orderAmount >= this.minOrderAmount;
  }

  // usableFrom/usableTo가 모두 지정된 경우에만 now의 시:분이 구간 안인지 검사한다.
  private withinUsableTime(now: Date): boolean {
    if (this.usableFrom == null || this.usableTo == null) return true;

    const current = now.getHours() * 60 + now.getMinutes();
    const from = toMinutes(this.usableFrom);
    const to = toMinutes(this.usableTo);

    return current >= from && current <= to;
  }

  private meetsTypeCondition(ctx: CouponContext): boolean {
    if (this.discountType === 'BUY_X_GET_1') {
      const totalQuantity = ctx.selectedItems.reduce(
        (sum, item) => sum + item.quantity,
        0,
      );
      return totalQuantity >= (this.buyQuantity ?? 0);
    }

    if (this.discountType === 'FREE_SHIPPING') {
      return ctx.shippingFee > 0;
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
