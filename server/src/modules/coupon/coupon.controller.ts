import { routeHandler } from '../../middlewares/routeHandler.js';
import type { GetOrderCouponsUseCase } from '../../application/getOrderCoupons.usecase.js';
import {
  parseSelectedCartItemIdsQuery,
  parseSelectedCouponIdsDto,
  toCouponsResponse,
} from './coupon.dto.js';
import type { CouponService } from './coupon.service.js';

type CouponControllerDeps = {
  getOrderCouponsUseCase: GetOrderCouponsUseCase;
  couponService: CouponService;
  userId: string;
};

export const createCouponController = ({
  getOrderCouponsUseCase,
  couponService,
  userId,
}: CouponControllerDeps) => ({
  list: routeHandler(async (req, res) => {
    const selectedCartItemIds = parseSelectedCartItemIdsQuery(req.query);

    const result = await getOrderCouponsUseCase.execute({
      selectedCartItemIds,
      userId,
    });

    res
      .status(200)
      .json(
        toCouponsResponse(
          result.orderAmount,
          result.coupons,
          result.recommendedCouponIds,
        ),
      );
  }),

  validate: routeHandler(async (req, res) => {
    const selectedCouponIds = parseSelectedCouponIdsDto(req.body);

    await couponService.validate(selectedCouponIds);

    res.status(204).send();
  }),
});
