import { useEffect, useState } from 'react';

// 서버 상태의 로딩/에러/성공을 한 곳에서 다루는 범용 쿼리 훅.
// "무엇을 가져오나(queryFn)"만 주입받고, 상태 관리는 내부에 숨긴다.
export type QueryState<T> =
  | { status: 'loading' }
  | { status: 'error'; error: Error }
  | { status: 'ready'; data: T };

export function useQuery<T>(
  queryFn: () => Promise<T>,
  deps: unknown[] = [],
): QueryState<T> {
  const [state, setState] = useState<QueryState<T>>({ status: 'loading' });

  useEffect(() => {
    // 요청이 끝나기 전에 deps가 바뀌거나 언마운트되면 결과를 버린다(경쟁 상태 방지).
    // deps 변경 시 loading으로 리셋하지 않아, 새 결과가 올 때까지 이전 상태를 유지한다.
    let active = true;

    queryFn()
      .then((data) => {
        if (active) setState({ status: 'ready', data });
      })
      .catch((error: unknown) => {
        if (active) setState({ status: 'error', error: error as Error });
      });

    return () => {
      active = false;
    };
    // queryFn은 호출부에서 deps로 식별한다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return state;
}
