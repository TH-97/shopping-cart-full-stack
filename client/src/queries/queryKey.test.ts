import { queryKey } from './queryKey';

describe('queryKey', () => {
  test('namespace를 접두로 붙인다', () => {
    expect(queryKey('coupons', ['a'])).toBe('coupons:["a"]');
  });

  test('배열 순서가 달라도 같은 키가 된다(집합으로 취급)', () => {
    expect(queryKey('coupons', ['a', 'b'])).toBe(queryKey('coupons', ['b', 'a']));
  });

  test('객체 안에 중첩된 배열의 순서도 정규화한다', () => {
    const a = queryKey('orderSummary', {
      selectedCartItemIds: ['x', 'y'],
      selectedCouponIds: ['c1', 'c2'],
      isRemoteArea: false,
    });
    const b = queryKey('orderSummary', {
      selectedCartItemIds: ['y', 'x'],
      selectedCouponIds: ['c2', 'c1'],
      isRemoteArea: false,
    });
    expect(a).toBe(b);
  });

  test('내용이 다르면 다른 키가 된다', () => {
    expect(queryKey('coupons', ['a'])).not.toBe(queryKey('coupons', ['a', 'b']));
  });
});
