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

  addProduct(command: AddProductCommand) {
    const product = new Product({ productId: crypto.randomUUID(), ...command });

    this.productRepository.save(product);

    return { productId: product.productId };
  }

  deleteProduct(productId: string): void {
    const product = this.productRepository.findById(productId);

    if (!product) throw productNotFoundError();

    this.productRepository.deleteById(productId);
  }
}
