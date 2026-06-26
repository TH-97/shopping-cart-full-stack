import { http, HttpResponse } from 'msw';
import { API_BASE_URL as BASE_URL } from '../api/config';

interface MockCartItem {
  cartItemId: string;
  productId: string;
  productName: string;
  productPrice: number;
  imageUrl: string;
  purchaseQuantity: number;
}

const initialCart = (): MockCartItem[] => [
  {
    cartItemId: '1',
    productId: '1',
    productName: '상품이름A',
    productPrice: 35000,
    imageUrl: 'https://placehold.co/80x80',
    purchaseQuantity: 2,
  },
  {
    cartItemId: '2',
    productId: '2',
    productName: '상품이름B',
    productPrice: 25000,
    imageUrl: 'https://placehold.co/80x80',
    purchaseQuantity: 2,
  },
];

// 기본 핸들러는 stateful: PATCH/DELETE가 이 배열을 갱신하고 GET이 그 결과를 반환한다.
// 테스트 간 격리를 위해 resetMockCart()로 초기 상태로 되돌린다.
let cart: MockCartItem[] = initialCart();

export const resetMockCart = (): void => {
  cart = initialCart();
};

// 고정 쿠폰 fixture(적용가능/불가 혼합). 각 쿠폰의 단독 고정 할인액은 fixedDiscount로 둔다.
const MOCK_COUPONS = [
  {
    couponId: 'FIXED5000',
    couponName: '5,000원 할인 쿠폰',
    discountType: 'FIXED' as const,
    isApplicable: true,
    expiresAt: '2026-11-30T23:59:59',
    minOrderAmount: null,
    usableFrom: null,
    usableTo: null,
    fixedDiscount: 5000,
  },
  {
    couponId: 'FIXED3000',
    couponName: '3,000원 할인 쿠폰',
    discountType: 'FIXED' as const,
    isApplicable: true,
    expiresAt: '2026-12-31T23:59:59',
    minOrderAmount: 50000,
    usableFrom: null,
    usableTo: null,
    fixedDiscount: 3000,
  },
  {
    couponId: 'MIRACLESALE',
    couponName: '미라클모닝 50% 쿠폰',
    discountType: 'PERCENTAGE' as const,
    isApplicable: false,
    expiresAt: '2026-10-31T23:59:59',
    minOrderAmount: null,
    usableFrom: '04:00',
    usableTo: '07:00',
    fixedDiscount: 0,
  },
];

// 쿠폰 응답은 fixedDiscount(목 내부 계산값)를 제외하고 내보낸다.
const toCouponResponse = ({
  fixedDiscount,
  ...rest
}: (typeof MOCK_COUPONS)[number]) => {
  void fixedDiscount;
  return rest;
};

// 대부분의 테스트가 공유하는 기본 핸들러.
// 특정 테스트에서 다른 응답이 필요하면 그 테스트에서 server.use()로 덮어쓴다(override 우선).
export const handlers = [
  http.get(`${BASE_URL}/cart/items`, () => HttpResponse.json(cart)),

  http.patch(`${BASE_URL}/cart/items/:cartItemId`, async ({ params, request }) => {
    const { cartItemId } = params;
    const { purchaseQuantity } = (await request.json()) as {
      purchaseQuantity: number;
    };
    cart = cart.map((item) =>
      item.cartItemId === cartItemId ? { ...item, purchaseQuantity } : item,
    );
    return new HttpResponse(null, { status: 204 });
  }),

  http.delete(`${BASE_URL}/cart/items/:cartItemId`, ({ params }) => {
    const { cartItemId } = params;
    cart = cart.filter((item) => item.cartItemId !== cartItemId);
    return new HttpResponse(null, { status: 204 });
  }),

  // 선택 쿠폰 유효성 검증. 통과하면 204. 'expired' id가 포함되면 만료 에러(400).
  http.post(`${BASE_URL}/coupons/validate`, async ({ request }) => {
    const { selectedCouponIds } = (await request.json()) as {
      selectedCouponIds: string[];
    };

    if (selectedCouponIds.includes('expired')) {
      return HttpResponse.json(
        { code: 'COUPON_EXPIRED', message: '만료된 쿠폰입니다.' },
        { status: 400 },
      );
    }

    return new HttpResponse(null, { status: 204 });
  }),

  // 보유 쿠폰 목록(+적용여부/할인액). 고정 fixture를 반환한다.
  // recommendedCouponIds는 서버가 계산한 실제 할인 최대 조합(적용 가능 쿠폰의 부분집합).
  // 목에서는 적용 가능한 두 고정 쿠폰(5,000+3,000)을 추천값으로 둔다.
  http.get(`${BASE_URL}/coupons`, () => {
    const coupons = MOCK_COUPONS.map(toCouponResponse);
    const orderAmount = cart.reduce(
      (sum, item) => sum + item.productPrice * item.purchaseQuantity,
      0,
    );
    const recommendedCouponIds = ['FIXED5000', 'FIXED3000'];
    return HttpResponse.json({ orderAmount, coupons, recommendedCouponIds });
  }),

  // 서버 주문 요약 계산을 흉내낸다(클라이언트는 표시만). 선택 항목 합으로 주문 금액을,
  // 도서산간/무료배송 임계로 배송비를 정한다. 쿠폰 할인은 선택 쿠폰의 고정 할인 합.
  http.post(`${BASE_URL}/orders/summary`, async ({ request }) => {
    const { selectedCartItemIds, selectedCouponIds, isRemoteArea } =
      (await request.json()) as {
        selectedCartItemIds: string[];
        selectedCouponIds: string[];
        isRemoteArea: boolean;
      };

    const orderAmount = cart
      .filter((item) => selectedCartItemIds.includes(item.cartItemId))
      .reduce(
        (sum, item) => sum + item.productPrice * item.purchaseQuantity,
        0,
      );

    // 선택된 쿠폰들의 고정 할인 합(목 단순화). 적용가능 쿠폰만 합산한다.
    const couponDiscountAmount = MOCK_COUPONS.filter(
      (coupon) =>
        coupon.isApplicable && selectedCouponIds.includes(coupon.couponId),
    ).reduce((sum, coupon) => sum + coupon.fixedDiscount, 0);

    const shippingFee =
      orderAmount >= 100000 ? 0 : isRemoteArea ? 6000 : 3000;
    const totalPaymentAmount =
      orderAmount - couponDiscountAmount + shippingFee;

    return HttpResponse.json({
      orderAmount,
      couponDiscountAmount,
      shippingFee,
      totalPaymentAmount,
    });
  }),
];
