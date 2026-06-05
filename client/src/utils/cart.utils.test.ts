import { calculateDeliveryFee, calculateOrderAmount } from './cart.utils';
import type { CartItemData } from '../types/cart';

const makeItem = (overrides: Partial<CartItemData> = {}): CartItemData => ({
  cartItemId: '1',
  productId: '1',
  productName: '상품',
  productPrice: 10000,
  imageUrl: 'https://placehold.co/80x80',
  purchaseQuantity: 1,
  ...overrides,
});

describe('calculateOrderAmount', () => {
  test('선택된 상품의 가격 × 수량을 모두 더한다', () => {
    const items = [
      makeItem({ cartItemId: '1', productPrice: 35000, purchaseQuantity: 2 }),
      makeItem({ cartItemId: '2', productPrice: 25000, purchaseQuantity: 2 }),
    ];

    const amount = calculateOrderAmount(items, new Set(['1', '2']));

    expect(amount).toBe(120000); // 35000*2 + 25000*2
  });

  test('선택되지 않은 상품은 합계에서 제외한다', () => {
    const items = [
      makeItem({ cartItemId: '1', productPrice: 35000, purchaseQuantity: 2 }),
      makeItem({ cartItemId: '2', productPrice: 25000, purchaseQuantity: 2 }),
    ];

    const amount = calculateOrderAmount(items, new Set(['1']));

    expect(amount).toBe(70000); // 35000*2 만
  });

  test('아무것도 선택하지 않으면 0원이다', () => {
    const items = [makeItem({ cartItemId: '1' })];

    expect(calculateOrderAmount(items, new Set())).toBe(0);
  });

  test('장바구니가 비어 있으면 0원이다', () => {
    expect(calculateOrderAmount([], new Set(['1']))).toBe(0);
  });
});

describe('calculateDeliveryFee', () => {
  test('주문 금액이 10만원 미만이면 배송비 3,000원이다', () => {
    expect(calculateDeliveryFee(99999)).toBe(3000);
  });

  test('주문 금액이 정확히 10만원이면 무료 배송이다', () => {
    expect(calculateDeliveryFee(100000)).toBe(0);
  });

  test('주문 금액이 10만원을 초과하면 무료 배송이다', () => {
    expect(calculateDeliveryFee(150000)).toBe(0);
  });

  test('주문 금액이 0원이면 배송비 3,000원이다', () => {
    expect(calculateDeliveryFee(0)).toBe(3000);
  });
});
