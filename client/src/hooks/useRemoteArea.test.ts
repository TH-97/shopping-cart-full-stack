import { act, renderHook } from '@testing-library/react';
import { useRemoteArea } from './useRemoteArea';

describe('useRemoteArea', () => {
  test('저장값이 없으면 기본 false', () => {
    const { result } = renderHook(() => useRemoteArea());
    expect(result.current.isRemoteArea).toBe(false);
  });

  test('toggle하면 값이 뒤집히고 localStorage에 저장된다', () => {
    const { result } = renderHook(() => useRemoteArea());

    act(() => result.current.toggle());

    expect(result.current.isRemoteArea).toBe(true);
    expect(localStorage.getItem('isRemoteArea')).toBe('true');
  });

  test('mount 시 localStorage 값을 복원한다', () => {
    localStorage.setItem('isRemoteArea', 'true');

    const { result } = renderHook(() => useRemoteArea());

    expect(result.current.isRemoteArea).toBe(true);
  });
});
