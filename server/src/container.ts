import { createApp } from './app.js';
import { createStores } from './db.js';
import { createCartItemRepository } from './modules/cart/cartItem.repository.js';
import { CartItemService } from './modules/cart/cartItem.service.js';
import { createProductRepository } from './modules/products/product.repository.js';
import { ProductService } from './modules/products/product.service.js';
import { DeleteProductUseCase } from './application/deleteProduct.usecase.js';

export const createRepositories = () => {
  const stores = createStores();
  const productRepository = createProductRepository(stores.productsDB);
  const cartItemRepository = createCartItemRepository(stores.cartItemsDB);

  return { productRepository, cartItemRepository };
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
