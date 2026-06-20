import { CartItem } from '../../../src/modules/cart/cartItem.model.js';
import { toCartItemResponse } from '../../../src/modules/cart/cartItem.dto.js';
import { Product } from '../../../src/modules/products/product.model.js';

const cartItem = new CartItem({
  cartItemId: 'c1',
  productId: 'p1',
  purchaseQuantity: 2,
});

const product = new Product({
  productId: 'p1',
  productName: '콜라',
  productPrice: 1300,
  remainingQuantity: 25,
  imageUrl: 'src/assets/coke.png',
});

describe('toCartItemResponse', () => {
  test('장바구니 항목과 상품을 응답 모양으로 변환한다', () => {
    expect(toCartItemResponse(cartItem, product)).toEqual({
      cartItemId: 'c1',
      productId: 'p1',
      productName: '콜라',
      productPrice: 1300,
      imageUrl: 'src/assets/coke.png',
      purchaseQuantity: 2,
    });
  });

  test('상품이 없으면 상품 필드를 undefined로 내려보낸다', () => {
    expect(toCartItemResponse(cartItem, undefined)).toEqual({
      cartItemId: 'c1',
      productId: 'p1',
      productName: undefined,
      productPrice: undefined,
      imageUrl: undefined,
      purchaseQuantity: 2,
    });
  });
});
