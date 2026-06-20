import { DomainError } from '../../../src/errors/DomainError.js';
import { CartItem } from '../../../src/modules/cart/cartItem.model.js';

describe('cart 모델 테스트', () => {
  test('상품 생성', () => {
    const mockCartItem = {
      cartItemId: '10',
      productId: '1',
      purchaseQuantity: 25,
    };
    const cartItem = new CartItem(mockCartItem);

    expect(cartItem.cartItemId).toEqual('10');
    expect(cartItem.productId).toEqual('1');
    expect(cartItem.purchaseQuantity).toEqual(25);
  });

  test('상품 수량이 정수가 아닐 때 에러 발생', () => {
    const mockCartItem = {
      cartItemId: '10',
      productId: '1',
      purchaseQuantity: 1.5,
    };

    expect(() => {
      new CartItem(mockCartItem);
    }).toThrow('유효하지 않은 구매 수량입니다.');
  });

  test('상품 수량이 유효하지 않으면 INVALID_PURCHASE_QUANTITY 코드를 가진 DomainError를 던진다', () => {
    const mockCartItem = {
      cartItemId: '10',
      productId: '1',
      purchaseQuantity: 0,
    };

    try {
      new CartItem(mockCartItem);
    } catch (error) {
      expect(error).toBeInstanceOf(DomainError);
      expect((error as DomainError).code).toBe('INVALID_PURCHASE_QUANTITY');
    }
  });

  test('changeQuantityTo로 유효하지 않은 수량을 설정하면 에러를 던지고 기존 수량을 유지한다', () => {
    const cartItem = new CartItem({
      cartItemId: '10',
      productId: '1',
      purchaseQuantity: 3,
    });

    expect(() => {
      cartItem.changeQuantityTo(100);
    }).toThrow('유효하지 않은 구매 수량입니다.');
    expect(cartItem.purchaseQuantity).toEqual(3);
  });
});
