import { queryStore } from './queryStore';

// 수동으로 resolve/reject할 수 있는 promise(비동기 순서를 결정적으로 제어).
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

// then/finally 체인의 마이크로태스크가 모두 비워질 때까지 양보한다.
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('queryStore', () => {
  test('최초 fetch 성공이 ready로 반영된다', async () => {
    const d = deferred<number>();
    queryStore.ensureFetch('k', () => d.promise);

    expect(queryStore.getState('k')).toEqual({ status: 'loading' });

    d.resolve(1);
    await flush();

    expect(queryStore.getState('k')).toEqual({ status: 'ready', data: 1 });
  });

  test('최초 로드 실패는 error 상태가 된다', async () => {
    const d = deferred<number>();
    queryStore.ensureFetch('k', () => d.promise);

    d.reject(new Error('실패'));
    await flush();

    expect(queryStore.getState('k').status).toBe('error');
  });

  test('진행 중 invalidate는 현재 fetch가 끝난 뒤 마지막으로 한 번 더 재요청한다', async () => {
    const first = deferred<number>();
    const second = deferred<number>();
    let calls = 0;
    const queryFn = () => {
      calls += 1;
      return calls === 1 ? first.promise : second.promise;
    };

    queryStore.ensureFetch('k', queryFn); // fetch#1 시작(진행 중)
    queryStore.invalidate('k'); // 진행 중 → dirty 예약(즉시 재요청 X)

    expect(calls).toBe(1);

    first.resolve(1); // fetch#1 완료 → 예약된 fetch#2 자동 시작
    await flush();

    expect(calls).toBe(2);

    second.resolve(2);
    await flush();

    expect(queryStore.getState('k')).toEqual({ status: 'ready', data: 2 });
  });

  test('재요청(invalidate) 실패 시 기존 ready 데이터를 유지한다', async () => {
    const first = deferred<number>();
    const second = deferred<number>();
    let calls = 0;
    const queryFn = () => {
      calls += 1;
      return calls === 1 ? first.promise : second.promise;
    };

    queryStore.ensureFetch('k', queryFn);
    first.resolve(10);
    await flush();
    expect(queryStore.getState('k')).toEqual({ status: 'ready', data: 10 });

    queryStore.invalidate('k'); // fetch#2 시작
    second.reject(new Error('재요청 실패'));
    await flush();

    // 에러로 덮지 않고 옛 데이터 유지
    expect(queryStore.getState('k')).toEqual({ status: 'ready', data: 10 });
  });

  test('진행 중 ensureFetch는 추가 fetch 없이 진행 중 결과를 공유한다(dedup)', async () => {
    const d = deferred<number>();
    let calls = 0;
    const queryFn = () => {
      calls += 1;
      return d.promise;
    };

    queryStore.ensureFetch('k', queryFn);
    queryStore.ensureFetch('k', queryFn); // 진행 중 → 재요청 안 함

    expect(calls).toBe(1);

    d.resolve(1);
    await flush();

    expect(calls).toBe(1);
    expect(queryStore.getState('k')).toEqual({ status: 'ready', data: 1 });
  });
});
