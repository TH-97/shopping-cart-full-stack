import {
  formatExpiry,
  formatMinOrder,
  formatUsableTime,
} from './coupon.utils';

describe('formatExpiry', () => {
  test('ISO 문자열을 "YYYY년 M월 D일"로 표기한다', () => {
    expect(formatExpiry('2026-11-30T23:59:59')).toBe('2026년 11월 30일');
  });
});

describe('formatMinOrder', () => {
  test('null이면 null', () => {
    expect(formatMinOrder(null)).toBeNull();
  });

  test('금액이 있으면 천단위 구분 안내 문구', () => {
    expect(formatMinOrder(50000)).toBe('50,000원 이상 구매 시 사용 가능');
  });
});

describe('formatUsableTime', () => {
  test('둘 중 하나라도 없으면 null', () => {
    expect(formatUsableTime(null, '07:00')).toBeNull();
    expect(formatUsableTime('04:00', null)).toBeNull();
  });

  test('시작·끝이 같은 오전/오후면 끝 시각은 시각만 표기한다', () => {
    expect(formatUsableTime('04:00', '07:00')).toBe('오전 4시부터 7시까지');
  });

  test('시작·끝의 오전/오후가 다르면 끝 시각도 오전/오후를 표기한다', () => {
    expect(formatUsableTime('04:00', '19:00')).toBe('오전 4시부터 오후 7시까지');
  });

  test('자정 횡단 구간도 오전/오후를 각각 표기한다', () => {
    expect(formatUsableTime('22:00', '04:00')).toBe('오후 10시부터 오전 4시까지');
  });
});
