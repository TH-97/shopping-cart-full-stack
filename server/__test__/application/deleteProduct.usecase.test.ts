import { CartItem } from '../../src/modules/cart/cartItem.model.js';
import { createCartItemRepository } from '../../src/modules/cart/cartItem.repository.js';
import { CartItemService } from '../../src/modules/cart/cartItem.service.js';
import { Product } from '../../src/modules/products/product.model.js';
import { createProductRepository } from '../../src/modules/products/product.repository.js';
import { ProductService } from '../../src/modules/products/product.service.js';
import { DeleteProductUseCase } from '../../src/application/deleteProduct.usecase.js';

const createProduct = (productId = 'product-1') =>
  new Product({
    productId,
    productName: '콜라',
    productPrice: 1300,
    remainingQuantity: 25,
    imageUrl: 'src/assets/coke.png',
  });

describe('DeleteProductUseCase', () => {
  let productRepository: ReturnType<typeof createProductRepository>;
  let cartItemRepository: ReturnType<typeof createCartItemRepository>;
  let deleteProductUseCase: DeleteProductUseCase;

  beforeEach(() => {
    productRepository = createProductRepository(new Map());
    cartItemRepository = createCartItemRepository(new Map());
    const productService = new ProductService(productRepository);
    const cartItemService = new CartItemService(
      cartItemRepository,
      productRepository,
    );
    deleteProductUseCase = new DeleteProductUseCase(
      productService,
      cartItemService,
    );
  });

  test('상품을 삭제하면 장바구니에 담긴 동일한 상품도 함께 삭제된다.', () => {
    const product = productRepository.save(createProduct());
    cartItemRepository.save(
      new CartItem({
        cartItemId: 'cart-item-1',
        productId: product.productId,
        purchaseQuantity: 2,
      }),
    );

    deleteProductUseCase.execute(product.productId);

    expect(productRepository.findAll()).toHaveLength(0);
    expect(
      cartItemRepository.findByProductId(product.productId),
    ).toBeUndefined();
  });

  test('상품 삭제 시 동일한 productId를 가진 장바구니 항목을 모두 제거한다.', () => {
    const product = productRepository.save(createProduct());
    cartItemRepository.save(
      new CartItem({
        cartItemId: 'cart-item-1',
        productId: product.productId,
        purchaseQuantity: 2,
      }),
    );
    cartItemRepository.save(
      new CartItem({
        cartItemId: 'cart-item-2',
        productId: product.productId,
        purchaseQuantity: 3,
      }),
    );

    deleteProductUseCase.execute(product.productId);

    expect(cartItemRepository.findAll()).toHaveLength(0);
  });

  test('장바구니에 없는 상품을 삭제하더라도 에러를 반환하지 않는다.', () => {
    const product = productRepository.save(createProduct());

    expect(() =>
      deleteProductUseCase.execute(product.productId),
    ).not.toThrow();
    expect(productRepository.findAll()).toHaveLength(0);
    expect(cartItemRepository.findAll()).toEqual([]);
  });

  test('존재하지 않은 상품 삭제 시 에러를 반환한다.', () => {
    expect(() => deleteProductUseCase.execute('1')).toThrow(
      '존재하지 않는 상품입니다.',
    );
  });
});
