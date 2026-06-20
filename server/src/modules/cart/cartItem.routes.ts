import { Router } from 'express';
import { createCartItemController } from './cartItem.controller.js';
import type { CartItemService } from './cartItem.service.js';

export const createCartItemRouter = (cartItemService: CartItemService) => {
  const controller = createCartItemController(cartItemService);
  const router = Router();

  router.get('/cart/items', controller.list);
  router.post('/cart/items', controller.add);
  router.delete('/cart/items/:cartItemId', controller.remove);
  router.patch('/cart/items/:cartItemId', controller.changeQuantity);

  return router;
};
