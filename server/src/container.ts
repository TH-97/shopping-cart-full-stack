import { createApp } from './app.js';
import { createStores } from './db.js';
import { createSupabaseClient, hasSupabaseCredentials } from './supabase.js';
import {
  createInMemoryCartItemRepository,
  createSupabaseCartItemRepository,
} from './modules/cart/cartItem.repository.js';
import { CartItemService } from './modules/cart/cartItem.service.js';
import {
  createInMemoryProductRepository,
  createSupabaseProductRepository,
} from './modules/products/product.repository.js';
import { ProductService } from './modules/products/product.service.js';
import { DeleteProductUseCase } from './application/deleteProduct.usecase.js';

export const createRepositories = () => {
  // 자격증명이 있으면 Supabase, 없으면(테스트·로컬) 인메모리로 폴백한다.
  if (hasSupabaseCredentials()) {
    const client = createSupabaseClient();
    return {
      productRepository: createSupabaseProductRepository(client),
      cartItemRepository: createSupabaseCartItemRepository(client),
    };
  }

  const stores = createStores();
  return {
    productRepository: createInMemoryProductRepository(stores.productsDB),
    cartItemRepository: createInMemoryCartItemRepository(stores.cartItemsDB),
  };
};

export const createServices = ({
  productRepository,
  cartItemRepository,
}: ReturnType<typeof createRepositories>) => ({
  productService: new ProductService(productRepository),
  cartItemService: new CartItemService(cartItemRepository, productRepository),
});

export const bootstrapApp = () => {
  const repositories = createRepositories();
  const services = createServices(repositories);
  const deleteProductUseCase = new DeleteProductUseCase(
    services.productService,
    services.cartItemService,
  );

  return createApp({ ...services, deleteProductUseCase });
};
