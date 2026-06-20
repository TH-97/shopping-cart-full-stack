import { routeHandler } from '../../middlewares/routeHandler.js';
import type { OrderSummaryUseCase } from '../../application/orderSummary.usecase.js';
import { parseOrderSummaryDto, toOrderSummaryResponse } from './order.dto.js';

export const createOrderController = (
  orderSummaryUseCase: OrderSummaryUseCase,
) => ({
  summary: routeHandler(async (req, res) => {
    const command = parseOrderSummaryDto(req.body);

    const summary = await orderSummaryUseCase.execute(command);

    res.status(200).json(toOrderSummaryResponse(summary));
  }),
});
