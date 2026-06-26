// 쿼리 캐시 키를 만드는 규칙을 한 곳에 모은다.
// coupons/orderSummary가 제각각 join/JSON.stringify로 직렬화하면,
// "키에서 순서 영향을 없애자" 같은 규칙을 손볼 때 한쪽만 고쳐 조용히 어긋날 수 있다.
// 직렬화 규칙은 serializeKey에서만 바꾸고, namespace로 키 충돌을 막는다.

// 키에 담기는 배열(선택 항목·쿠폰 id)은 "집합"이라 순서가 의미 없다.
// 정렬해 정규화하지 않으면 같은 선택이라도 담긴 순서만 달라도 다른 키가 되어
// 같은 계산을 서버에 다시 요청하고 캐시도 중복으로 쌓인다.
const canonicalize = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value
      .map(canonicalize)
      .sort((a, b) => (JSON.stringify(a) < JSON.stringify(b) ? -1 : 1));
  }
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, canonicalize(v)]),
    );
  }
  return value;
};

const serializeKey = (value: unknown): string =>
  JSON.stringify(canonicalize(value));

export const queryKey = (namespace: string, value: unknown): string =>
  `${namespace}:${serializeKey(value)}`;
