import { CartItem } from '../../../src/modules/cart/cartItem.model.js';
import { createCartItemRepository } from '../../../src/modules/cart/cartItem.repository.js';

const createCartItem = (cartItemId = '1', productId = '1') =>
  new CartItem({
    cartItemId,
    productId,
    purchaseQuantity: 25,
  });

describe('CartItemRepository', () => {
  let cartItemRepository: ReturnType<typeof createCartItemRepository>;

  beforeEach(() => {
    cartItemRepository = createCartItemRepository(new Map());
  });

  test('장바구니에 상품을 저장한다', () => {
    const cartItem = createCartItem();

    const savedCartItem = cartItemRepository.save(cartItem);

    expect(savedCartItem).toBe(cartItem);
  });

  test('장바구니에 담긴 전체 상품 목록을 조회한다', () => {
    const cartItemA = createCartItem('1');
    const cartItemB = createCartItem('2');

    cartItemRepository.save(cartItemA);
    cartItemRepository.save(cartItemB);

    expect(cartItemRepository.findAll()).toEqual([cartItemA, cartItemB]);
  });

  test('상품 id로 상품을 조회한다', () => {
    const cartItem = createCartItem();

    cartItemRepository.save(cartItem);

    expect(cartItemRepository.findById('1')).toBe(cartItem);
  });

  test('존재하지 않는 상품 id로 조회하면 undefined를 반환한다', () => {
    expect(cartItemRepository.findById('unknown')).toBeUndefined();
  });

  test('productId로 장바구니 상품을 조회한다', () => {
    const cartItem = createCartItem('1', 'p1');
    cartItemRepository.save(cartItem);

    expect(cartItemRepository.findByProductId('p1')).toBe(cartItem);
  });

  test('존재하지 않는 productId로 조회하면 undefined를 반환한다', () => {
    expect(cartItemRepository.findByProductId('unknown')).toBeUndefined();
  });

  test('상품을 삭제한다', () => {
    const cartItem = createCartItem();

    cartItemRepository.save(cartItem);
    cartItemRepository.deleteById('1');

    expect(cartItemRepository.findById('1')).toBeUndefined();
    expect(cartItemRepository.findAll()).toEqual([]);
  });

  test('productId로 동일 상품의 장바구니 항목을 모두 삭제한다', () => {
    cartItemRepository.save(createCartItem('1', 'p1'));
    cartItemRepository.save(createCartItem('2', 'p1'));
    cartItemRepository.save(createCartItem('3', 'p2'));

    cartItemRepository.deleteByProductId('p1');

    expect(cartItemRepository.findByProductId('p1')).toBeUndefined();
    expect(cartItemRepository.findAll()).toHaveLength(1);
    expect(cartItemRepository.findById('3')).toBeDefined();
  });

  test('해당 productId 항목이 없어도 에러 없이 동작한다', () => {
    cartItemRepository.save(createCartItem('1', 'p1'));

    expect(() => cartItemRepository.deleteByProductId('unknown')).not.toThrow();
    expect(cartItemRepository.findAll()).toHaveLength(1);
  });

});
