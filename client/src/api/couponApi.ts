import { API_BASE_URL as BASE_URL } from './config';
import type { CouponListResponse } from '../types/coupon';

// 응답이 실패면 서버의 에러 메시지를 꺼내 던진다(없으면 fallback).
async function readErrorMessage(
  response: Response,
  fallback: string,
): Promise<string> {
  const body = (await response.json().catch(() => null)) as {
    message?: string;
  } | null;
  return body?.message ?? fallback;
}

// 선택된 장바구니 항목 기준으로 보유 쿠폰 목록과 각 쿠폰의 적용여부/할인액을 조회한다.
export async function fetchCoupons(
  selectedCartItemIds: string[],
): Promise<CouponListResponse> {
  const query = selectedCartItemIds.join(',');
  const response = await fetch(
    `${BASE_URL}/coupons?selectedCartItemIds=${query}`,
  );
  if (!response.ok) {
    throw new Error(await readErrorMessage(response, '쿠폰을 불러오지 못했습니다.'));
  }
  return response.json();
}

// 선택한 쿠폰들의 유효성(만료/사용/개수)을 검증한다. 통과하면 응답 본문 없음(204).
export async function validateCoupons(
  selectedCouponIds: string[],
): Promise<void> {
  const response = await fetch(`${BASE_URL}/coupons/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ selectedCouponIds }),
  });
  if (!response.ok) {
    throw new Error(await readErrorMessage(response, '쿠폰을 사용할 수 없습니다.'));
  }
}
