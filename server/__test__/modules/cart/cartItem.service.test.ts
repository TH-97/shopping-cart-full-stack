import { CartItem } from '../../../src/modules/cart/cartItem.model.js';
import type { CartItemRepository } from '../../../src/modules/cart/cartItem.repository.js';
import { CartItemService } from '../../../src/modules/cart/cartItem.service.js';
import { Product } from '../../../src/modules/products/product.model.js';
import type { ProductRepository } from '../../../src/modules/products/product.repository.js';
import {
  createInMemoryCartItemRepository,
  createInMemoryProductRepository,
} from '../../support/inMemoryRepositories.js';

const createProduct = (productId: string, remainingQuantity = 25) =>
  new Product({
    productId,
    productName: '콜라',
    productPrice: 1300,
    remainingQuantity,
    imageUrl: 'src/assets/coke.png',
  });

describe('CartItemService', () => {
  let productRepository: ReturnType<typeof createInMemoryProductRepository>;
  let cartItemRepository: ReturnType<typeof createInMemoryCartItemRepository>;
  let cartItemService: CartItemService;

  beforeEach(async () => {
    productRepository = createInMemoryProductRepository(new Map());
    cartItemRepository = createInMemoryCartItemRepository(new Map());
    cartItemService = new CartItemService(
      cartItemRepository,
      productRepository,
    );

    await productRepository.save(createProduct('1'));
    await productRepository.save(createProduct('2'));
  });

  describe('목록 조회', () => {
    test('담긴 순서대로 장바구니 목록을 조회한다', async () => {
      const cartItemA = await cartItemService.addCartItem({
        productId: '1',
        purchaseQuantity: 1,
      });
      const cartItemB = await cartItemService.addCartItem({
        productId: '2',
        purchaseQuantity: 1,
      });

      const cartItems = await cartItemService.getCartItems();

      expect(cartItems).toHaveLength(2);
      expect(cartItems[0].cartItem.cartItemId).toBe(cartItemA.cartItemId);
      expect(cartItems[1].cartItem.cartItemId).toBe(cartItemB.cartItemId);
    });

    test('장바구니 목록 조회 시 항목과 상품을 조인해 반환한다', async () => {
      await cartItemService.addCartItem({ productId: '1', purchaseQuantity: 2 });

      const cartItems = await cartItemService.getCartItems();

      expect(cartItems[0].cartItem.productId).toBe('1');
      expect(cartItems[0].cartItem.purchaseQuantity).toBe(2);
      expect(cartItems[0].product?.productName).toBe('콜라');
    });

    test('상품 정보가 누락된 장바구니 항목은 product를 undefined로 반환한다', async () => {
      await cartItemRepository.save(
        new CartItem({
          cartItemId: 'orphan-1',
          productId: 'missing-product',
          purchaseQuantity: 3,
        }),
      );

      const cartItems = await cartItemService.getCartItems();

      expect(cartItems[0].cartItem.cartItemId).toBe('orphan-1');
      expect(cartItems[0].product).toBeUndefined();
    });
  });

  describe('추가', () => {
    test('상품을 장바구니에 추가한다', async () => {
      const response = await cartItemService.addCartItem({
        productId: '1',
        purchaseQuantity: 1,
      });

      const cartItems = await cartItemService.getCartItems();

      expect(cartItems).toHaveLength(1);
      expect(cartItems[0].cartItem.cartItemId).toBe(response.cartItemId);
      expect(response.isNew).toBe(true);
    });

    test('이미 존재하는 상품을 다시 추가하면 수량을 합산한다', async () => {
      await cartItemService.addCartItem({ productId: '1', purchaseQuantity: 1 });

      const response = await cartItemService.addCartItem({
        productId: '1',
        purchaseQuantity: 1,
      });
      const cartItems = await cartItemService.getCartItems();

      expect(cartItems).toHaveLength(1);
      expect(cartItems[0].cartItem.purchaseQuantity).toBe(2);
      expect(response.isNew).toBe(false);
    });

    test('구매 수량 경계값 1을 추가할 수 있다', async () => {
      await expect(
        cartItemService.addCartItem({ productId: '1', purchaseQuantity: 1 }),
      ).resolves.toBeDefined();
    });

    test('구매 수량 0은 INVALID_PURCHASE_QUANTITY 에러를 던진다', async () => {
      await expect(
        cartItemService.addCartItem({ productId: '1', purchaseQuantity: 0 }),
      ).rejects.toThrow('유효하지 않은 구매 수량입니다.');
    });

    test('구매 수량 100은 INVALID_PURCHASE_QUANTITY 에러를 던진다', async () => {
      await productRepository.save(createProduct('99', 99));

      await expect(
        cartItemService.addCartItem({ productId: '99', purchaseQuantity: 100 }),
      ).rejects.toThrow('유효하지 않은 구매 수량입니다.');
    });

    test('구매 수량이 소수이면 INVALID_PURCHASE_QUANTITY 에러를 던진다', async () => {
      await expect(
        cartItemService.addCartItem({ productId: '1', purchaseQuantity: 1.5 }),
      ).rejects.toThrow('유효하지 않은 구매 수량입니다.');
    });

    test('구매 수량이 상품의 남은 수량을 초과하면 EXCEEDS_REMAINING_QUANTITY 에러를 던진다', async () => {
      await productRepository.save(createProduct('limited', 1));

      await expect(
        cartItemService.addCartItem({
          productId: 'limited',
          purchaseQuantity: 2,
        }),
      ).rejects.toThrow('상품의 남은 수량을 초과했습니다.');
    });

    test('이미 담긴 상품을 다시 담을 때 합산 수량이 남은 수량을 초과하면 EXCEEDS_REMAINING_QUANTITY 에러를 던진다', async () => {
      await productRepository.save(createProduct('limited', 2));
      await cartItemService.addCartItem({
        productId: 'limited',
        purchaseQuantity: 1,
      });

      await expect(
        cartItemService.addCartItem({
          productId: 'limited',
          purchaseQuantity: 2,
        }),
      ).rejects.toThrow('상품의 남은 수량을 초과했습니다.');
    });
  });

  describe('삭제', () => {
    test('장바구니 항목을 삭제한다', async () => {
      const response = await cartItemService.addCartItem({
        productId: '1',
        purchaseQuantity: 1,
      });

      await cartItemService.deleteCartItem(response.cartItemId);

      const cartItems = await cartItemService.getCartItems();
      expect(cartItems).toHaveLength(0);
    });

    test('존재하지 않은 장바구니 상품 삭제 시 에러를 반환한다', async () => {
      await expect(cartItemService.deleteCartItem('1')).rejects.toThrow(
        '존재하지 않는 장바구니 상품입니다.',
      );
    });
  });

  describe('수량 변경', () => {
    test('수량을 변경한다', async () => {
      const response = await cartItemService.addCartItem({
        productId: '1',
        purchaseQuantity: 1,
      });

      await cartItemService.changeQuantity({
        cartItemId: response.cartItemId,
        purchaseQuantity: 2,
      });

      const cartItem = await cartItemRepository.findById(response.cartItemId);
      expect(cartItem?.purchaseQuantity).toEqual(2);
    });

    test('수량 변경 경계값 99로 변경할 수 있다', async () => {
      await productRepository.save(createProduct('99', 99));
      const response = await cartItemService.addCartItem({
        productId: '99',
        purchaseQuantity: 1,
      });

      await expect(
        cartItemService.changeQuantity({
          cartItemId: response.cartItemId,
          purchaseQuantity: 99,
        }),
      ).resolves.toBeUndefined();
    });

    test('변경 수량이 상품의 남은 수량을 초과하면 EXCEEDS_REMAINING_QUANTITY 에러를 던진다', async () => {
      await productRepository.save(createProduct('limited', 1));
      const response = await cartItemService.addCartItem({
        productId: 'limited',
        purchaseQuantity: 1,
      });

      await expect(
        cartItemService.changeQuantity({
          cartItemId: response.cartItemId,
          purchaseQuantity: 2,
        }),
      ).rejects.toThrow('상품의 남은 수량을 초과했습니다.');

      const cartItem = await cartItemRepository.findById(response.cartItemId);
      expect(cartItem?.purchaseQuantity).toBe(1);
    });
  });

  describe('repository 주입', () => {
    test('주입한 repository로 장바구니 목록을 조회한다', async () => {
      const storedCartItem = new CartItem({
        cartItemId: 'c1',
        productId: 'p1',
        purchaseQuantity: 3,
      });

      const fakeCartItemRepository: CartItemRepository = {
        findAll: async () => [storedCartItem],
        save: async (cartItem) => cartItem,
        findById: async () => undefined,
        findByProductId: async () => undefined,
        deleteById: async () => true,
        deleteByProductId: async () => undefined,
      };
      const fakeProductRepository: ProductRepository = {
        findById: async () => createProduct('p1'),
        findAll: async () => [],
        save: async (product) => product,
        deleteById: async () => true,
      };

      const service = new CartItemService(
        fakeCartItemRepository,
        fakeProductRepository,
      );

      const cartItems = await service.getCartItems();

      expect(cartItems).toHaveLength(1);
      expect(cartItems[0].cartItem).toBe(storedCartItem);
      expect(cartItems[0].product?.productId).toBe('p1');
    });
  });
});
