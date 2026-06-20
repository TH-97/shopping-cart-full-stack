import type { CartItemService } from '../modules/cart/cartItem.service.js';
import type { ProductService } from '../modules/products/product.service.js';

// 상품 삭제와 장바구니 정리를 조율하는 횡단 use-case.
// ProductService와 CartItemService는 서로를 모르고, 조율 책임만 여기서 진다.
// 순서: 상품 삭제(없으면 PRODUCT_NOT_FOUND throw) → 장바구니 정리.
export class DeleteProductUseCase {
  constructor(
    private readonly productService: ProductService,
    private readonly cartItemService: CartItemService,
  ) {}

  async execute(productId: string): Promise<void> {
    await this.productService.deleteProduct(productId);
    await this.cartItemService.removeItemsByProductId(productId);
  }
}
