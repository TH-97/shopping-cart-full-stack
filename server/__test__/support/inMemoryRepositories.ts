import type { CartItem } from '../../src/modules/cart/cartItem.model.js';
import type { CartItemRepository } from '../../src/modules/cart/cartItem.repository.js';
import type { Coupon } from '../../src/modules/coupon/coupon.model.js';
import type {
  CouponRepository,
  OwnedCoupon,
} from '../../src/modules/coupon/coupon.repository.js';
import type { Product } from '../../src/modules/products/product.model.js';
import type { ProductRepository } from '../../src/modules/products/product.repository.js';

// 인메모리 더블은 프로덕션 코드 경로에서 제거하고 테스트 전용으로만 유지한다.
// 프로덕션은 항상 Supabase 구현을 쓴다(container 참고).

// 테스트·로컬용 인메모리 구현. 인터페이스는 비동기이므로 Promise를 반환한다.
export const createInMemoryProductRepository = (
  store: Map<string, Product>,
): ProductRepository => ({
  async save(product) {
    store.set(product.productId, product);
    return product;
  },

  async findAll() {
    return Array.from(store.values());
  },

  async findById(productId) {
    return store.get(productId);
  },

  async deleteById(productId) {
    return store.delete(productId);
  },
});

export const createInMemoryCartItemRepository = (
  store: Map<string, CartItem>,
): CartItemRepository => ({
  async save(cartItem) {
    store.set(cartItem.cartItemId, cartItem);
    return cartItem;
  },

  async findAll() {
    return Array.from(store.values());
  },

  async findById(cartItemId) {
    return store.get(cartItemId);
  },

  async findByProductId(productId) {
    return [...store.values()].find(
      (cartItem) => cartItem.productId === productId,
    );
  },

  async deleteById(cartItemId) {
    return store.delete(cartItemId);
  },

  async deleteByProductId(productId) {
    [...store.values()]
      .filter((cartItem) => cartItem.productId === productId)
      .forEach((cartItem) => store.delete(cartItem.cartItemId));
  },
});

// 인메모리 더블이 참조하는 유저-쿠폰 보유 관계 row.
export type UserCouponRow = {
  userCouponId: string;
  couponId: string;
  userId: string;
  isUsed: boolean;
};

// 테스트·로컬용 인메모리 구현. coupon ⨝ user_coupon을 메모리에서 조인한다.
// findById/findByIds는 Supabase 구현과 동일하게 데모 유저 보유분으로 한정한다.
export const createInMemoryCouponRepository = (
  couponsDB: Map<string, Coupon>,
  userCouponsDB: Map<string, UserCouponRow>,
  userId: string = 'demo-user',
): CouponRepository => {
  const join = (row: UserCouponRow): OwnedCoupon | undefined => {
    const coupon = couponsDB.get(row.couponId);
    if (!coupon) return undefined;
    return { coupon, userCouponId: row.userCouponId, isUsed: row.isUsed };
  };

  const ownedRows = (ownerId: string): UserCouponRow[] =>
    [...userCouponsDB.values()].filter((row) => row.userId === ownerId);

  return {
    async findOwnedByUser(ownerId) {
      // Supabase 구현의 .order('coupon_id')와 동일하게 정렬해 반환 순서를 고정한다.
      // best-combo 추천의 동점 tie-break가 이 순서에 의존하므로 결정성이 필요하다.
      return ownedRows(ownerId)
        .map(join)
        .filter((owned): owned is OwnedCoupon => owned !== undefined)
        .sort((a, b) => a.coupon.couponId.localeCompare(b.coupon.couponId));
    },

    async findById(couponId) {
      return ownedRows(userId)
        .filter((row) => row.couponId === couponId)
        .map(join)
        .find((owned): owned is OwnedCoupon => owned !== undefined);
    },

    async findByIds(couponIds) {
      const ids = new Set(couponIds);
      return ownedRows(userId)
        .filter((row) => ids.has(row.couponId))
        .map(join)
        .filter((owned): owned is OwnedCoupon => owned !== undefined);
    },
  };
};
