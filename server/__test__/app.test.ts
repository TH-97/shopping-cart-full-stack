import request from 'supertest';
import { createTestApp } from './support/createTestApp.js';

const app = createTestApp();

describe('app', () => {
  it('GET /health 는 200과 상태를 반환한다', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });

  it('매칭되지 않는 경로는 JSON 형식의 404를 반환한다', async () => {
    const response = await request(app).get('/unknown-route');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      code: 'NOT_FOUND',
      message: '요청한 리소스를 찾을 수 없습니다.',
    });
  });
});
