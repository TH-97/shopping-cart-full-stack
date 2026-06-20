import { Product } from '../../../src/modules/products/product.model.js';
import { createProductRepository } from '../../../src/modules/products/product.repository.js';
import { ProductService } from '../../../src/modules/products/product.service.js';

const createProduct = (productId = 'product-1') =>
  new Product({
    productId,
    productName: '콜라',
    productPrice: 1300,
    remainingQuantity: 25,
    imageUrl: 'src/assets/coke.png',
  });

describe('ProductService', () => {
  let productRepository: ReturnType<typeof createProductRepository>;
  let productService: ProductService;

  const addColaProduct = () =>
    productService.addProduct({
      productName: '콜라',
      productPrice: 1300,
      remainingQuantity: 25,
      imageUrl: 'src/assets/coke.png',
    });

  beforeEach(() => {
    productRepository = createProductRepository(new Map());
    productService = new ProductService(productRepository);
  });

  describe('추가/조회', () => {
    test('상품을 추가한다', () => {
      const response = addColaProduct();

      const products = productService.getProducts();

      expect(products).toHaveLength(1);
      expect(products[0].productId).toBe(response.productId);
    });

    test('상품 목록을 조회한다', () => {
      const productA = addColaProduct();
      const productB = productService.addProduct({
        productName: '사이다',
        productPrice: 1500,
        remainingQuantity: 10,
        imageUrl: 'src/assets/cider.png',
      });

      const products = productService.getProducts();

      expect(products).toHaveLength(2);
      expect(products[0].productId).toBe(productA.productId);
      expect(products[1].productId).toBe(productB.productId);
    });
  });

  describe('삭제', () => {
    test('상품을 삭제할 수 있다.', () => {
      const product = productRepository.save(createProduct());

      productService.deleteProduct(product.productId);

      expect(productRepository.findAll()).toHaveLength(0);
    });

    test('존재하는 상품 삭제는 에러를 반환하지 않는다.', () => {
      const product = productRepository.save(createProduct());

      expect(() =>
        productService.deleteProduct(product.productId),
      ).not.toThrow();
      expect(productRepository.findAll()).toHaveLength(0);
    });

    test('존재하지 않은 상품 삭제 시 에러를 반환한다.', () => {
      expect(() => productService.deleteProduct('1')).toThrow(
        '존재하지 않는 상품입니다.',
      );
    });
  });
});
