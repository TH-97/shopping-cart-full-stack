import { useCallback, useSyncExternalStore } from 'react';
import { queryStore, type QueryState } from '../queries/queryStore';

export type { QueryState };

// 범용 쿼리 훅. 컴포넌트는 store를 "구독"만 하고, 데이터는 store가 보유한다.
// 같은 key면 여러 컴포넌트가 같은 fetch 결과를 공유한다(SSOT).
export function useQuery<T>(
  key: string,
  queryFn: () => Promise<T>,
): QueryState<T> {
  // 캐시에 없으면 fetch를 시작한다. idempotent라 렌더 중 호출해도 안전하고,
  // invalidate가 같은 key로 재요청하면 store가 갱신된 데이터를 흘려보낸다.
  queryStore.ensureFetch(key, queryFn);

  const subscribe = useCallback(
    (listener: () => void) => queryStore.subscribe(key, listener),
    [key],
  );
  const getSnapshot = useCallback(
    () => queryStore.getState(key) as QueryState<T>,
    [key],
  );

  return useSyncExternalStore(subscribe, getSnapshot);
}
