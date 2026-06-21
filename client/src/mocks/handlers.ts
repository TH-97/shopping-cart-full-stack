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
];
