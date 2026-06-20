import { CartItem } from '../../src/modules/cart/cartItem.model.js';
import { CartItemService } from '../../src/modules/cart/cartItem.service.js';
import { Product } from '../../src/modules/products/product.model.js';
import { ProductService } from '../../src/modules/products/product.service.js';
import {
  createInMemoryCartItemRepository,
  createInMemoryProductRepository,
} from '../support/inMemoryRepositories.js';
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
  let productRepository: ReturnType<typeof createInMemoryProductRepository>;
  let cartItemRepository: ReturnType<typeof createInMemoryCartItemRepository>;
  let deleteProductUseCase: DeleteProductUseCase;

  beforeEach(() => {
    productRepository = createInMemoryProductRepository(new Map());
    cartItemRepository = createInMemoryCartItemRepository(new Map());
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

  test('상품을 삭제하면 장바구니에 담긴 동일한 상품도 함께 삭제된다.', async () => {
    const product = await productRepository.save(createProduct());
    await cartItemRepository.save(
      new CartItem({
        cartItemId: 'cart-item-1',
        productId: product.productId,
        purchaseQuantity: 2,
      }),
    );

    await deleteProductUseCase.execute(product.productId);

    expect(await productRepository.findAll()).toHaveLength(0);
    expect(
      await cartItemRepository.findByProductId(product.productId),
    ).toBeUndefined();
  });

  test('상품 삭제 시 동일한 productId를 가진 장바구니 항목을 모두 제거한다.', async () => {
    const product = await productRepository.save(createProduct());
    await cartItemRepository.save(
      new CartItem({
        cartItemId: 'cart-item-1',
        productId: product.productId,
        purchaseQuantity: 2,
      }),
    );
    await cartItemRepository.save(
      new CartItem({
        cartItemId: 'cart-item-2',
        productId: product.productId,
        purchaseQuantity: 3,
      }),
    );

    await deleteProductUseCase.execute(product.productId);

    expect(await cartItemRepository.findAll()).toHaveLength(0);
  });

  test('장바구니에 없는 상품을 삭제하더라도 에러를 반환하지 않는다.', async () => {
    const product = await productRepository.save(createProduct());

    await expect(
      deleteProductUseCase.execute(product.productId),
    ).resolves.toBeUndefined();
    expect(await productRepository.findAll()).toHaveLength(0);
    expect(await cartItemRepository.findAll()).toEqual([]);
  });

  test('존재하지 않은 상품 삭제 시 에러를 반환한다.', async () => {
    await expect(deleteProductUseCase.execute('1')).rejects.toThrow(
      '존재하지 않는 상품입니다.',
    );
  });
});
