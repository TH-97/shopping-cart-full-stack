import { DomainError } from '../../../src/errors/DomainError.js';
import { Product } from '../../../src/modules/products/product.model.js';

describe('product 모델 테스트', () => {
  test('상품 생성', () => {
    const mockProduct = {
      productId: '1',
      productName: '콜라',
      productPrice: 1300,
      remainingQuantity: 25,
      imageUrl: 'src/assets/coke.png',
    };
    const product = new Product(mockProduct);

    expect(product.productId).toEqual('1');
    expect(product.productName).toEqual('콜라');
    expect(product.productPrice).toEqual(1300);
    expect(product.remainingQuantity).toEqual(25);
    expect(product.imageUrl).toEqual('src/assets/coke.png');
  });

  test('상품 가격이 0원인 경우 에러 발생', () => {
    const mockProduct = {
      productId: '1',
      productName: '콜라',
      productPrice: 0,
      remainingQuantity: 25,
      imageUrl: 'src/assets/coke.png',
    };

    expect(() => {
      new Product(mockProduct);
    }).toThrow('유효하지 않은 상품 가격입니다.');
  });

  test('상품 이름이 공백인 경우 에러 발생', () => {
    const mockProduct = {
      productId: '1',
      productName: ' ',
      productPrice: 1300,
      remainingQuantity: 25,
      imageUrl: 'src/assets/coke.png',
    };

    expect(() => {
      new Product(mockProduct);
    }).toThrow('유효하지 않은 상품 이름입니다.');
  });

  test('상품 이름이 100자를 초과하면 에러 발생', () => {
    const mockProduct = {
      productId: '1',
      productName: '콜'.repeat(101),
      productPrice: 1300,
      remainingQuantity: 25,
      imageUrl: 'src/assets/coke.png',
    };

    expect(() => {
      new Product(mockProduct);
    }).toThrow('유효하지 않은 상품 이름입니다.');
  });

  test('상품 수량이 0일때 에러 발생', () => {
    const mockProduct = {
      productId: '1',
      productName: '콜라',
      productPrice: 1300,
      remainingQuantity: 0,
      imageUrl: 'src/assets/coke.png',
    };

    expect(() => {
      new Product(mockProduct);
    }).toThrow('유효하지 않은 상품 수량입니다.');
  });

  test('상품 수량이 100일때 에러 발생', () => {
    const mockProduct = {
      productId: '1',
      productName: '콜라',
      productPrice: 1300,
      remainingQuantity: 100,
      imageUrl: 'src/assets/coke.png',
    };

    expect(() => {
      new Product(mockProduct);
    }).toThrow('유효하지 않은 상품 수량입니다.');
  });

  test('상품 수량이 정수가 아닐 때 에러 발생', () => {
    const mockProduct = {
      productId: '1',
      productName: '콜라',
      productPrice: 1300,
      remainingQuantity: 1.5,
      imageUrl: 'src/assets/coke.png',
    };

    expect(() => {
      new Product(mockProduct);
    }).toThrow('유효하지 않은 상품 수량입니다.');
  });

  test('상품 가격이 숫자가 아닐 때 에러 발생', () => {
    const mockProduct = {
      productId: '1',
      productName: '콜라',
      productPrice: NaN,
      remainingQuantity: 25,
      imageUrl: 'src/assets/coke.png',
    };

    expect(() => {
      new Product(mockProduct);
    }).toThrow('유효하지 않은 상품 가격입니다.');
  });

  test('상품 이름 도메인 검증 실패 시 INVALID_PRODUCT_NAME 코드를 가진 DomainError를 던진다', () => {
    const mockProduct = {
      productId: '1',
      productName: ' ',
      productPrice: 1300,
      remainingQuantity: 25,
      imageUrl: 'src/assets/coke.png',
    };

    try {
      new Product(mockProduct);
    } catch (error) {
      expect(error).toBeInstanceOf(DomainError);
      expect((error as DomainError).code).toBe('INVALID_PRODUCT_NAME');
    }
  });
});
