import express from 'express';
import cors from 'cors';
import { errorHandler } from './middlewares/errorHandlers.js';
import { cartItemRepository } from './modules/cart/cartItem.repository.js';
import { createCartItemRouter } from './modules/cart/cartItem.routes.js';
import { CartItemService } from './modules/cart/cartItem.service.js';
import { productRepository } from './modules/products/product.repository.js';
import { createProductRouter } from './modules/products/product.routes.js';
import { ProductService } from './modules/products/product.service.js';

const app = express();

// 컴포지션 루트: 여기서만 구현체(repository)를 선택해 의존성을 조립한다.
// DB를 바꾸려면 아래 repository만 교체하면 되고, service/routes는 그대로 둔다.
const productService = new ProductService(productRepository);
const cartItemService = new CartItemService(cartItemRepository, productRepository);

app.use(
  cors({
    origin: ['http://localhost:8080', 'https://th-97.github.io'],
    credentials: true,
  }),
);
app.use(express.json());
app.use(createProductRouter(productService, cartItemService));
app.use(createCartItemRouter(cartItemService));
app.use(errorHandler);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

export default app;
