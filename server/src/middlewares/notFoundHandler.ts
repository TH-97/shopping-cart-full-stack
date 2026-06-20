import type { RequestHandler } from 'express';

// 어떤 라우트에도 매칭되지 않은 요청을 JSON 형식의 404로 응답한다.
// 도메인 404(PRODUCT_NOT_FOUND 등)와 달리 "경로 없음"이라는 전송 계층 관심사다.
export const notFoundHandler: RequestHandler = (_req, res) => {
  res.status(404).json({
    code: 'NOT_FOUND',
    message: '요청한 리소스를 찾을 수 없습니다.',
  });
};
