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
  // 진행 중 invalidate가 들어온 key. 현재 fetch가 끝나면 한 번 더 재요청한다.
  private dirty = new Set<string>();
  // fetch 진행 중에 마지막 구독자가 떠난 key. 인플라이트 결과를 유실하지 않도록
  // 바로 지우지 않고, fetch가 끝난 뒤 정리한다.
  private pendingEvict = new Set<string>();

  getState(key: string): QueryState<unknown> {
    return this.states.get(key) ?? LOADING;
  }

  // 캐시에 없을 때만 fetch를 시작한다. idempotent하므로 렌더 중 호출해도 안전하다.
  // 이미 진행 중이면 그 결과를 기다린다(트레일링 재요청은 invalidate만 한다).
  ensureFetch<T>(key: string, queryFn: () => Promise<T>): void {
    this.queryFns.set(key, queryFn as () => Promise<unknown>);
    if (this.states.get(key)?.status === 'ready') return;
    if (this.promises.has(key)) return;
    this.runFetch(key, queryFn);
  }

  // 캐시는 유지한 채 같은 queryFn으로 재요청한다(stale-while-revalidate).
  // 진행 중이면 dirty로 예약해, 그 fetch가 끝난 뒤 마지막 한 번을 반드시 반영한다.
  invalidate(key: string): void {
    const queryFn = this.queryFns.get(key);
    if (!queryFn) return;
    if (this.promises.has(key)) {
      this.dirty.add(key);
      return;
    }
    this.runFetch(key, queryFn);
  }

  // fetch를 시작한다(호출 전 진행 중이 아님이 보장됨). 결과를 캐시에 반영하고 알린다.
  private runFetch<T>(key: string, queryFn: () => Promise<T>): void {
    const promise = queryFn()
      .then((data) => this.set(key, { status: 'ready', data }))
      .catch((error: unknown) => this.handleError(key, error as Error))
      .finally(() => {
        this.promises.delete(key);
        // 진행 중 들어온 invalidate가 있으면 마지막 최신값으로 한 번 더 재요청.
        if (this.dirty.delete(key)) {
          const latest = this.queryFns.get(key);
          if (latest) {
            this.runFetch(key, latest);
            return; // 정리는 새 fetch의 finally로 미룬다(pendingEvict 유지).
          }
        }
        // fetch 도중 마지막 구독자가 떠났던 key는 여기서 정리를 마무리한다.
        // 단, 진행 중 다시 구독되었으면(remount) 살려둔다.
        if (
          this.pendingEvict.delete(key) &&
          (this.listeners.get(key)?.size ?? 0) === 0
        ) {
          this.evict(key);
        }
      });

    this.promises.set(key, promise);
  }

  // 재요청(stale-while-revalidate) 실패는 기존 ready 데이터를 덮지 않고 유지한다.
  // 최초 로드 실패(캐시 없음)일 때만 error 상태로 둔다.
  private handleError(key: string, error: Error): void {
    if (this.states.get(key)?.status === 'ready') return;
    this.set(key, { status: 'error', error });
  }

  subscribe(key: string, listener: () => void): () => void {
    const listeners = this.listeners.get(key) ?? new Set();
    listeners.add(listener);
    this.listeners.set(key, listeners);
    return () => {
      listeners.delete(listener);
      if (listeners.size > 0) return;
      // 마지막 구독자가 떠난 key의 캐시는 정리한다 → orderSummary처럼 입력마다
      // 새 key가 쌓이는 캐시가 무한정 불어나지 않게 한다.
      // fetch가 진행 중이면 인플라이트 결과 유실을 막기 위해 종료 후로 미룬다.
      if (this.promises.has(key)) {
        this.pendingEvict.add(key);
        return;
      }
      this.evict(key);
    };
  }

  // key의 캐시를 모든 자료구조에서 일관되게 제거한다.
  private evict(key: string): void {
    this.states.delete(key);
    this.listeners.delete(key);
    this.queryFns.delete(key);
    this.dirty.delete(key);
    this.pendingEvict.delete(key);
  }

  // 테스트 격리용: 전체 초기화.
  clear(): void {
    this.states.clear();
    this.promises.clear();
    this.listeners.clear();
    this.queryFns.clear();
    this.dirty.clear();
    this.pendingEvict.clear();
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
