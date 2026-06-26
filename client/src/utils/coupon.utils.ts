// ISO 문자열을 "2026년 11월 30일" 형태로 표기한다.
export function formatExpiry(iso: string): string {
  const date = new Date(iso);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${year}년 ${month}월 ${day}일`;
}

// 최소 주문 금액 안내 문구. 조건이 없으면 null.
export function formatMinOrder(minOrderAmount: number | null): string | null {
  if (minOrderAmount === null) return null;
  return `${minOrderAmount.toLocaleString()}원 이상 구매 시 사용 가능`;
}

// "HH:MM" 문자열을 "오전 4시"/"오후 7시" 형태로 표기한다.
function formatHour(time: string): string {
  const hour = Number(time.split(':')[0]);
  const meridiem = hour < 12 ? '오전' : '오후';
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${meridiem} ${displayHour}시`;
}

// 사용 가능 시간대 안내. 둘 다 없으면 null.
// from·to의 오전/오후가 같으면 끝 시각의 중복 표기를 생략하고(예: 오전 4시부터 7시까지),
// 다르면(예: 04:00~19:00) 둘 다 표기해 오전/오후가 헷갈리지 않게 한다.
export function formatUsableTime(
  from: string | null,
  to: string | null,
): string | null {
  if (from === null || to === null) return null;
  const sameMeridiem = isMorning(from) === isMorning(to);
  const toText = sameMeridiem
    ? formatHour(to).replace(/^(오전|오후) /, '')
    : formatHour(to);
  return `${formatHour(from)}부터 ${toText}까지`;
}

// 'HH:MM'의 시각이 오전(자정~정오 전)인지. formatHour의 오전/오후 기준과 동일.
function isMorning(time: string): boolean {
  return Number(time.split(':')[0]) < 12;
}
