import { productNotFoundError } from '../../errors/domainErrors.js';
import { Product } from './product.model.js';
import type { ProductRepository } from './product.repository.js';

type AddProductCommand = {
  productName: string;
  productPrice: number;
  remainingQuantity: number;
  imageUrl?: string;
};

export class ProductService {
  constructor(private readonly productRepository: ProductRepository) {}

  getProducts() {
    return this.productRepository.findAll();
  }

  async addProduct(command: AddProductCommand) {
    const product = new Product({ productId: crypto.randomUUID(), ...command });

    await this.productRepository.save(product);

    return { productId: product.productId };
  }

  async deleteProduct(productId: string): Promise<void> {
    const product = await this.productRepository.findById(productId);

    if (!product) throw productNotFoundError();

    await this.productRepository.deleteById(productId);
  }
}
