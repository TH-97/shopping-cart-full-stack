import { Product } from '../../../src/modules/products/product.model.js';
import { ProductService } from '../../../src/modules/products/product.service.js';
import { createInMemoryProductRepository } from '../../support/inMemoryRepositories.js';

const createProduct = (productId = 'product-1') =>
  new Product({
    productId,
    productName: '콜라',
    productPrice: 1300,
    remainingQuantity: 25,
    imageUrl: 'src/assets/coke.png',
  });

describe('ProductService', () => {
  let productRepository: ReturnType<typeof createInMemoryProductRepository>;
  let productService: ProductService;

  const addColaProduct = () =>
    productService.addProduct({
      productName: '콜라',
      productPrice: 1300,
      remainingQuantity: 25,
      imageUrl: 'src/assets/coke.png',
    });

  beforeEach(() => {
    productRepository = createInMemoryProductRepository(new Map());
    productService = new ProductService(productRepository);
  });

  describe('추가/조회', () => {
    test('상품을 추가한다', async () => {
      const response = await addColaProduct();

      const products = await productService.getProducts();

      expect(products).toHaveLength(1);
      expect(products[0].productId).toBe(response.productId);
    });

    test('상품 목록을 조회한다', async () => {
      const productA = await addColaProduct();
      const productB = await productService.addProduct({
        productName: '사이다',
        productPrice: 1500,
        remainingQuantity: 10,
        imageUrl: 'src/assets/cider.png',
      });

      const products = await productService.getProducts();

      expect(products).toHaveLength(2);
      expect(products[0].productId).toBe(productA.productId);
      expect(products[1].productId).toBe(productB.productId);
    });
  });

  describe('삭제', () => {
    test('상품을 삭제할 수 있다.', async () => {
      const product = await productRepository.save(createProduct());

      await productService.deleteProduct(product.productId);

      expect(await productRepository.findAll()).toHaveLength(0);
    });

    test('존재하는 상품 삭제는 에러를 반환하지 않는다.', async () => {
      const product = await productRepository.save(createProduct());

      await expect(
        productService.deleteProduct(product.productId),
      ).resolves.toBeUndefined();
      expect(await productRepository.findAll()).toHaveLength(0);
    });

    test('존재하지 않은 상품 삭제 시 에러를 반환한다.', async () => {
      await expect(productService.deleteProduct('1')).rejects.toThrow(
        '존재하지 않는 상품입니다.',
      );
    });
  });
});
