import type { ErrorRequestHandler } from 'express';
import { DomainError } from '../errors/DomainError.js';
import { STATUS_BY_CODE } from '../errors/errorCodes.js';

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof DomainError) {
    // 상태코드는 에러 코드 → STATUS_BY_CODE 매핑에서 결정된다.
    res.status(STATUS_BY_CODE[error.code]).json({
      code: error.code,
      message: error.message,
    });
    return;
  }

  // 예상치 못한 예외는 원인 추적을 위해 로깅한 뒤 500 fallback.
  console.error('[unhandled error]', error);

  res.status(500).json({
    code: 'INTERNAL_SERVER_ERROR',
    message: '서버 오류가 발생했습니다.',
  });
};
