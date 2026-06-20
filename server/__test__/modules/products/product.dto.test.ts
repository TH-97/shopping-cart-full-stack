import {
  parseProductIdDto,
  toProductResponse,
} from '../../../src/modules/products/product.dto.js';
import { Product } from '../../../src/modules/products/product.model.js';

describe('parseProductIdDto', () => {
  test('유효한 productId를 파싱한다', () => {
    expect(parseProductIdDto({ productId: 'p1' })).toEqual({ productId: 'p1' });
  });

  test('productId가 없으면 INVALID_PRODUCT_ID 에러를 던진다', () => {
    expect(() => parseProductIdDto({})).toThrow('유효하지 않은 상품 id입니다.');
  });

  test('productId가 빈 문자열이면 INVALID_PRODUCT_ID 에러를 던진다', () => {
    expect(() => parseProductIdDto({ productId: '   ' })).toThrow(
      '유효하지 않은 상품 id입니다.',
    );
  });
});

describe('toProductResponse', () => {
  test('상품 엔티티를 응답 모양으로 변환한다', () => {
    const product = new Product({
      productId: 'p1',
      productName: '콜라',
      productPrice: 1300,
      remainingQuantity: 25,
      imageUrl: 'src/assets/coke.png',
    });

    expect(toProductResponse(product)).toEqual({
      productId: 'p1',
      productName: '콜라',
      productPrice: 1300,
      remainingQuantity: 25,
      imageUrl: 'src/assets/coke.png',
    });
  });
});
