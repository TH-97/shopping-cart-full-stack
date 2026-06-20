import type { NextFunction, Request, Response } from 'express';

type RouteHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
) => void;

export const routeHandler =
  (handler: RouteHandler) =>
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      handler(req, res, next);
    } catch (error) {
      next(error);
    }
  };
