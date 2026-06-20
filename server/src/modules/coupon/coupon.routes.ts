import { Router } from 'express';
import type { GetOrderCouponsUseCase } from '../../application/getOrderCoupons.usecase.js';
import { createCouponController } from './coupon.controller.js';
import type { CouponService } from './coupon.service.js';

type CouponRouterDeps = {
  getOrderCouponsUseCase: GetOrderCouponsUseCase;
  couponService: CouponService;
  userId: string;
};

export const createCouponRouter = (deps: CouponRouterDeps) => {
  const controller = createCouponController(deps);
  const router = Router();

  router.get('/coupons', controller.list);
  router.post('/coupons/validate', controller.validate);

  return router;
};
