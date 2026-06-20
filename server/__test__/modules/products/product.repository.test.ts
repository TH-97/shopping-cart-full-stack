import { Product } from '../../../src/modules/products/product.model.js';
import { createProductRepository } from '../../../src/modules/products/product.repository.js';

const createProduct = (productId = '1') =>
  new Product({
    productId,
    productName: '콜라',
    productPrice: 1300,
    remainingQuantity: 25,
    imageUrl: 'src/assets/coke.png',
  });

describe('ProductRepository', () => {
  let productRepository: ReturnType<typeof createProductRepository>;

  beforeEach(() => {
    productRepository = createProductRepository(new Map());
  });

  test('상품을 저장한다', () => {
    const product = createProduct();

    const savedProduct = productRepository.save(product);

    expect(savedProduct).toBe(product);
  });

  test('저장된 전체 상품 목록을 조회한다', () => {
    const productA = createProduct('1');
    const productB = new Product({
      productId: '2',
      productName: '사이다',
      productPrice: 1500,
      remainingQuantity: 10,
      imageUrl: 'src/assets/cider.png',
    });

    productRepository.save(productA);
    productRepository.save(productB);

    expect(productRepository.findAll()).toEqual([productA, productB]);
  });

  test('상품 id로 상품을 조회한다', () => {
    const product = createProduct();

    productRepository.save(product);

    expect(productRepository.findById('1')).toBe(product);
  });

  test('존재하지 않는 상품 id로 조회하면 undefined를 반환한다', () => {
    expect(productRepository.findById('unknown')).toBeUndefined();
  });

  test('상품을 삭제한다', () => {
    const product = createProduct();

    productRepository.save(product);
    productRepository.deleteById('1');

    expect(productRepository.findById('1')).toBeUndefined();
    expect(productRepository.findAll()).toEqual([]);
  });
});
