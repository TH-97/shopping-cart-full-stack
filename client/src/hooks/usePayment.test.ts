import { act, renderHook } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { usePayment } from './usePayment';
import { server } from '../mocks/server';
import { API_BASE_URL as BASE_URL } from '../api/config';

describe('usePayment', () => {
  test('초기 상태는 idle이다', () => {
    const { result } = renderHook(() => usePayment());

    expect(result.current.status).toBe('idle');
    expect(result.current.error).toBeNull();
  });

  test('validate 성공(204)이면 status가 idle로 돌아오고 true를 반환한다', async () => {
    const { result } = renderHook(() => usePayment());

    let succeeded = false;
    await act(async () => {
      succeeded = await result.current.pay(['FIXED5000']);
    });

    expect(succeeded).toBe(true);
    expect(result.current.status).toBe('idle');
    expect(result.current.error).toBeNull();
  });

  test('validate 실패(400)면 status=error와 서버 메시지를 담고 false를 반환한다', async () => {
    server.use(
      http.post(`${BASE_URL}/coupons/validate`, () =>
        HttpResponse.json(
          { code: 'COUPON_EXPIRED', message: '만료된 쿠폰입니다.' },
          { status: 400 },
        ),
      ),
    );

    const { result } = renderHook(() => usePayment());

    let succeeded = true;
    await act(async () => {
      succeeded = await result.current.pay(['expired']);
    });

    expect(succeeded).toBe(false);
    expect(result.current.status).toBe('error');
    expect(result.current.error).toBe('만료된 쿠폰입니다.');
  });
});
