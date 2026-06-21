// React 바깥에 서버상태를 보관하는 store(가벼운 전역 캐시 + 구독).
// 같은 key는 한 번만 fetch(dedup)하고, 모든 구독자가 같은 스냅샷을 공유한다.
// Suspense는 쓰지 않고 status 유니온으로 로딩/에러/성공을 표현한다.
export type QueryState<T> =
  | { status: 'loading' }
  | { status: 'error'; error: Error }
  | { status: 'ready'; data: T };

// 미조회 key의 기본 스냅샷. useSyncExternalStore가 같은 참조를 받도록 싱글톤으로 고정.
const LOADING: QueryState<never> = { status: 'loading' };

class QueryStore {
  private states = new Map<string, QueryState<unknown>>();
  private promises = new Map<string, Promise<unknown>>();
  private listeners = new Map<string, Set<() => void>>();
  // key별 마지막 queryFn을 보관 → invalidate가 같은 fetch를 재실행할 수 있게.
  private queryFns = new Map<string, () => Promise<unknown>>();

  getState(key: string): QueryState<unknown> {
    return this.states.get(key) ?? LOADING;
  }

  // 캐시에 없고 진행 중도 아닐 때만 fetch를 시작한다.
  // idempotent하므로 렌더 중 호출해도 안전하다(중복 fetch 방지).
  ensureFetch<T>(key: string, queryFn: () => Promise<T>): void {
    this.queryFns.set(key, queryFn as () => Promise<unknown>);
    if (this.states.get(key)?.status === 'ready') return;
    this.runFetch(key, queryFn);
  }

  // 캐시는 유지한 채 같은 queryFn으로 재요청한다(stale-while-revalidate).
  // 옛 데이터는 새 결과가 도착할 때까지 그대로 보여 로딩 깜빡임이 없다.
  invalidate(key: string): void {
    const queryFn = this.queryFns.get(key);
    if (!queryFn) return;
    this.runFetch(key, queryFn);
  }

  // 진행 중이 아니면 fetch를 시작한다. 결과는 캐시에 반영하고 구독자에게 알린다.
  private runFetch<T>(key: string, queryFn: () => Promise<T>): void {
    if (this.promises.has(key)) return;

    const promise = queryFn()
      .then((data) => this.set(key, { status: 'ready', data }))
      .catch((error: unknown) =>
        this.set(key, { status: 'error', error: error as Error }),
      )
      .finally(() => this.promises.delete(key));

    this.promises.set(key, promise);
  }

  subscribe(key: string, listener: () => void): () => void {
    const listeners = this.listeners.get(key) ?? new Set();
    listeners.add(listener);
    this.listeners.set(key, listeners);
    return () => listeners.delete(listener);
  }

  // 테스트 격리용: 전체 초기화.
  clear(): void {
    this.states.clear();
    this.promises.clear();
    this.listeners.clear();
    this.queryFns.clear();
  }

  private set(key: string, state: QueryState<unknown>): void {
    this.states.set(key, state);
    this.notify(key);
  }

  private notify(key: string): void {
    this.listeners.get(key)?.forEach((listener) => listener());
  }
}

export const queryStore = new QueryStore();
