import type { ErrorCode } from './errorCodes.js';

// 도메인 전반에서 쓰는 단일 에러 타입.
// HTTP 상태코드는 도메인이 모르므로 보유하지 않는다(STATUS_BY_CODE에서 결정).
export class DomainError extends Error {
  readonly code: ErrorCode;

  constructor(code: ErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}
