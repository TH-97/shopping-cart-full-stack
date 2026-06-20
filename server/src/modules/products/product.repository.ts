import type { Product } from './product.model.js';

export interface ProductRepository {
  save(product: Product): Product;
  findAll(): Product[];
  findById(productId: string): Product | undefined;
  deleteById(productId: string): boolean;
}

const createMemoryProductRepository = (
  store: Map<string, Product>,
): ProductRepository => ({
  save(product: Product) {
    store.set(product.productId, product);
    return product;
  },

  findAll() {
    return Array.from(store.values());
  },

  findById(productId: string) {
    return store.get(productId);
  },

  deleteById(productId: string) {
    return store.delete(productId);
  },
});

export const createProductRepository = createMemoryProductRepository;
