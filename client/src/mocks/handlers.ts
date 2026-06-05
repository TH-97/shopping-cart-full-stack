import { http, HttpResponse } from 'msw';

const BASE_URL =
  'https://shopping-cart-full-stack-production-7ca8.up.railway.app';

// 대부분의 테스트가 공유하는 기본 핸들러.
// 특정 테스트에서 다른 응답이 필요하면 그 테스트에서 server.use()로 덮어쓴다.
export const handlers = [
  http.get(`${BASE_URL}/cart/items`, () =>
    HttpResponse.json([
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
    ]),
  ),

  http.patch(
    `${BASE_URL}/cart/items/:cartItemId`,
    () => new HttpResponse(null, { status: 204 }),
  ),

  http.delete(
    `${BASE_URL}/cart/items/:cartItemId`,
    () => new HttpResponse(null, { status: 204 }),
  ),
];
