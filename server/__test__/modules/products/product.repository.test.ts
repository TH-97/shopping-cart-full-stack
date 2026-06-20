import { Product } from '../../../src/modules/products/product.model.js';
import { createInMemoryProductRepository } from '../../support/inMemoryRepositories.js';

const createProduct = (productId = '1') =>
  new Product({
    productId,
    productName: '콜라',
    productPrice: 1300,
    remainingQuantity: 25,
    imageUrl: 'src/assets/coke.png',
  });

describe('ProductRepository', () => {
  let productRepository: ReturnType<typeof createInMemoryProductRepository>;

  beforeEach(() => {
    productRepository = createInMemoryProductRepository(new Map());
  });

  test('상품을 저장한다', async () => {
    const product = createProduct();

    const savedProduct = await productRepository.save(product);

    expect(savedProduct).toBe(product);
  });

  test('저장된 전체 상품 목록을 조회한다', async () => {
    const productA = createProduct('1');
    const productB = new Product({
      productId: '2',
      productName: '사이다',
      productPrice: 1500,
      remainingQuantity: 10,
      imageUrl: 'src/assets/cider.png',
    });

    await productRepository.save(productA);
    await productRepository.save(productB);

    expect(await productRepository.findAll()).toEqual([productA, productB]);
  });

  test('상품 id로 상품을 조회한다', async () => {
    const product = createProduct();

    await productRepository.save(product);

    expect(await productRepository.findById('1')).toBe(product);
  });

  test('존재하지 않는 상품 id로 조회하면 undefined를 반환한다', async () => {
    expect(await productRepository.findById('unknown')).toBeUndefined();
  });

  test('상품을 삭제한다', async () => {
    const product = createProduct();

    await productRepository.save(product);
    await productRepository.deleteById('1');

    expect(await productRepository.findById('1')).toBeUndefined();
    expect(await productRepository.findAll()).toEqual([]);
  });
});
