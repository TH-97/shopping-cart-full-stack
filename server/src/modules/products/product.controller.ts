import { routeHandler } from '../../middlewares/routeHandler.js';
import {
  parseCreateProductDto,
  parseProductIdDto,
  toProductResponse,
} from './product.dto.js';
import type { ProductService } from './product.service.js';
import type { DeleteProductUseCase } from '../../application/deleteProduct.usecase.js';

// 요청을 받아 dto 파싱 → service/use-case 호출 → 응답 직렬화까지 담당한다.
// 라우터(product.routes.ts)는 경로와 이 핸들러의 연결만 맡는다.
export const createProductController = (
  productService: ProductService,
  deleteProductUseCase: DeleteProductUseCase,
) => ({
  list: routeHandler(async (_req, res) => {
    const products = await productService.getProducts();
    res.status(200).json(products.map(toProductResponse));
  }),

  create: routeHandler(async (req, res) => {
    const command = parseCreateProductDto(req.body);
    const product = await productService.addProduct(command);
    res.status(201).json(product);
  }),

  remove: routeHandler(async (req, res) => {
    const command = parseProductIdDto(req.params);
    await deleteProductUseCase.execute(command.productId);
    res.status(204).send();
  }),
});
