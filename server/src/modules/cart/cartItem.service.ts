import {
  cartItemNotFoundError,
  exceedsRemainingQuantityError,
  productNotFoundError,
} from '../../errors/domainErrors.js';
import type { Product } from '../products/product.model.js';
import type { ProductRepository } from '../products/product.repository.js';
import { CartItem } from './cartItem.model.js';
import type { CartItemRepository } from './cartItem.repository.js';

type AddCartItemCommand = {
  productId: string;
  purchaseQuantity: number;
};

type ChangeCartItemQuantityCommand = {
  cartItemId: string;
  purchaseQuantity: number;
};

export class CartItemService {
  constructor(
    private readonly cartItemRepository: CartItemRepository,
    private readonly productRepository: ProductRepository,
  ) {}

  // 장바구니 항목과 그 상품을 조인해 도메인 데이터로 반환한다.
  // 응답 모양 변환은 경계(dto/controller)의 책임이므로 여기선 하지 않는다.
  async getCartItems() {
    const cartItems = await this.cartItemRepository.findAll();

    return Promise.all(
      cartItems.map(async (cartItem) => ({
        cartItem,
        product: await this.productRepository.findById(cartItem.productId),
      })),
    );
  }

  async addCartItem(command: AddCartItemCommand) {
    const product = await this.getExistingProduct(command.productId);

    const existing = await this.cartItemRepository.findByProductId(
      command.productId,
    );

    if (existing) return this.increaseQuantity(existing, command, product);

    return this.createCartItem(command, product);
  }

  async changeQuantity(command: ChangeCartItemQuantityCommand): Promise<void> {
    const cartItem = await this.cartItemRepository.findById(command.cartItemId);

    if (!cartItem) throw cartItemNotFoundError();

    const product = await this.getExistingProduct(cartItem.productId);
    this.assertWithinStock(product, command.purchaseQuantity);

    cartItem.changeQuantityTo(command.purchaseQuantity);
    await this.cartItemRepository.save(cartItem);
  }

  async deleteCartItem(cartItemId: string): Promise<void> {
    const cartItem = await this.cartItemRepository.findById(cartItemId);

    if (!cartItem) throw cartItemNotFoundError();

    await this.cartItemRepository.deleteById(cartItem.cartItemId);
  }

  async removeItemsByProductId(productId: string): Promise<void> {
    await this.cartItemRepository.deleteByProductId(productId);
  }

  private async getExistingProduct(productId: string): Promise<Product> {
    const product = await this.productRepository.findById(productId);
    if (!product) throw productNotFoundError();
    return product;
  }

  // 장바구니 수량은 상품의 남은 수량(remainingQuantity)을 넘을 수 없다.
  private assertWithinStock(product: Product, quantity: number): void {
    if (quantity > product.remainingQuantity) {
      throw exceedsRemainingQuantityError();
    }
  }

  private async increaseQuantity(
    cartItem: CartItem,
    command: AddCartItemCommand,
    product: Product,
  ) {
    const nextQuantity = cartItem.purchaseQuantity + command.purchaseQuantity;
    this.assertWithinStock(product, nextQuantity);

    cartItem.changeQuantityTo(nextQuantity);
    await this.cartItemRepository.save(cartItem);

    return { cartItemId: cartItem.cartItemId, isNew: false };
  }

  private async createCartItem(command: AddCartItemCommand, product: Product) {
    const cartItem = new CartItem({
      cartItemId: crypto.randomUUID(),
      productId: command.productId,
      purchaseQuantity: command.purchaseQuantity,
    });
    this.assertWithinStock(product, command.purchaseQuantity);

    await this.cartItemRepository.save(cartItem);

    return { cartItemId: cartItem.cartItemId, isNew: true };
  }
}
