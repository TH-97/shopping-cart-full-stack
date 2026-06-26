import type { SupabaseClient } from '@supabase/supabase-js';
import {
  Coupon,
  type CouponCode,
  type DiscountType,
} from './coupon.model.js';

// demo user가 보유한 쿠폰(coupon ⨝ user_coupon) 1건.
// userCouponId/isUsed는 보유 관계(user_coupon)에서, 나머지는 쿠폰 자체에서 온다.
export type OwnedCoupon = {
  coupon: Coupon;
  userCouponId: string;
  isUsed: boolean;
};

export interface CouponRepository {
  findById(couponId: string): Promise<OwnedCoupon | undefined>;
  findByIds(couponIds: string[]): Promise<OwnedCoupon[]>;
  findOwnedByUser(userId: string): Promise<OwnedCoupon[]>;
}

const TABLE = 'user_coupon';
const SELECT =
  'user_coupon_id, is_used, coupon:coupon_id (coupon_id, code, name, discount_type, discount_value, expires_at, min_order_amount, usable_from, usable_to, buy_quantity, free_quantity)';

type CouponRow = {
  coupon_id: string;
  code: string;
  name: string;
  discount_type: string;
  discount_value: number;
  expires_at: string;
  min_order_amount: number | null;
  usable_from: string | null;
  usable_to: string | null;
  buy_quantity: number | null;
  free_quantity: number | null;
};

type JoinedRow = {
  user_coupon_id: string;
  is_used: boolean;
  // Supabase는 단일 외래키 조인을 객체 또는 단일 원소 배열로 돌려줄 수 있다.
  coupon: CouponRow | CouponRow[] | null;
};

const toCoupon = (row: CouponRow): Coupon =>
  new Coupon({
    couponId: row.coupon_id,
    code: row.code as CouponCode,
    name: row.name,
    discountType: row.discount_type as DiscountType,
    discountValue: row.discount_value,
    expiresAt: new Date(row.expires_at),
    minOrderAmount: row.min_order_amount ?? undefined,
    usableFrom: row.usable_from ?? undefined,
    usableTo: row.usable_to ?? undefined,
    buyQuantity: row.buy_quantity ?? undefined,
    freeQuantity: row.free_quantity ?? undefined,
  });

const toOwnedCoupon = (row: JoinedRow): OwnedCoupon | undefined => {
  const couponRow = Array.isArray(row.coupon) ? row.coupon[0] : row.coupon;
  if (!couponRow) return undefined;
  return {
    coupon: toCoupon(couponRow),
    userCouponId: row.user_coupon_id,
    isUsed: row.is_used,
  };
};

const toOwnedCoupons = (rows: JoinedRow[]): OwnedCoupon[] =>
  rows
    .map(toOwnedCoupon)
    .filter((owned): owned is OwnedCoupon => owned !== undefined);

export const createSupabaseCouponRepository = (
  client: SupabaseClient,
  userId: string,
): CouponRepository => ({
  async findOwnedByUser(ownerId) {
    // coupon_id로 정렬해 반환 순서를 고정한다. best-combo 추천의 동점 tie-break가
    // 이 순서(인덱스)에 의존하므로, 정렬이 없으면 동점 추천이 비결정적이 된다.
    const { data, error } = await client
      .from(TABLE)
      .select(SELECT)
      .eq('user_id', ownerId)
      .order('coupon_id');
    if (error) throw new Error(error.message);
    return toOwnedCoupons((data ?? []) as JoinedRow[]);
  },

  async findById(couponId) {
    const { data, error } = await client
      .from(TABLE)
      .select(SELECT)
      .eq('user_id', userId)
      .eq('coupon_id', couponId)
      .limit(1)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ? toOwnedCoupon(data as JoinedRow) : undefined;
  },

  async findByIds(couponIds) {
    const { data, error } = await client
      .from(TABLE)
      .select(SELECT)
      .eq('user_id', userId)
      .in('coupon_id', couponIds);
    if (error) throw new Error(error.message);
    return toOwnedCoupons((data ?? []) as JoinedRow[]);
  },
});
