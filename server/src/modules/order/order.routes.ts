import { Router } from 'express';
import type { OrderSummaryUseCase } from '../../application/orderSummary.usecase.js';
import { createOrderController } from './order.controller.js';

export const createOrderRouter = (
  orderSummaryUseCase: OrderSummaryUseCase,
) => {
  const controller = createOrderController(orderSummaryUseCase);
  const router = Router();

  router.post('/orders/summary', controller.summary);

  return router;
};
