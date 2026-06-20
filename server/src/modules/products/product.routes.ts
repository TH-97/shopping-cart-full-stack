import { Router } from 'express';
import { createProductController } from './product.controller.js';
import type { ProductService } from './product.service.js';
import type { DeleteProductUseCase } from '../../application/deleteProduct.usecase.js';

export const createProductRouter = (
  productService: ProductService,
  deleteProductUseCase: DeleteProductUseCase,
) => {
  const controller = createProductController(productService, deleteProductUseCase);
  const router = Router();

  router.get('/products', controller.list);
  router.post('/products', controller.create);
  router.delete('/products/:productId', controller.remove);

  return router;
};
