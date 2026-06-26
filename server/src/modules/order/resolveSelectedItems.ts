import {
  cartItemNotFoundError,
  productNotFoundError,
} from '../../errors/domainErrors.js';
import type { CartItemRepository } from '../cart/cartItem.repository.js';
import type { ProductRepository } from '../products/product.repository.js';
import type { SelectedItem } from './order.calculation.js';

// 선택 cartItemId들을 조회(없으면 CART_ITEM_NOT_FOUND)하고 상품 단가와 조인한다.
// 장바구니엔 있으나 상품이 사라진 경우는 PRODUCT_NOT_FOUND로 구분한다.
// OrderSummaryUseCase와 GetOrderCouponsUseCase가 공유하는 조인 로직.
export const resolveSelectedItems = (
  cartItemRepository: CartItemRepository,
  productRepository: ProductRepository,
  selectedCartItemIds: string[],
): Promise<SelectedItem[]> =>
  Promise.all(
    selectedCartItemIds.map(async (cartItemId) => {
      const cartItem = await cartItemRepository.findById(cartItemId);
      if (!cartItem) throw cartItemNotFoundError();

      const product = await productRepository.findById(cartItem.productId);
      if (!product) throw productNotFoundError();

      return {
        unitPrice: product.productPrice,
        quantity: cartItem.purchaseQuantity,
      };
    }),
  );
