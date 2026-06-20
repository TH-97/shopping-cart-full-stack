import type { NextFunction, Request, Response } from 'express';

type RouteHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
) => void | Promise<void>;

// 동기/비동기 핸들러 모두 지원한다.
// 핸들러가 던지거나(reject) 하면 errorHandler로 전달한다.
export const routeHandler =
  (handler: RouteHandler) =>
  (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
