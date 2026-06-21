const STORAGE_KEY = 'isRemoteArea';

// 문자열 'true'/'false'로 저장한다(JSON.parse 불필요 → 손상 입력에도 안전).
export function loadRemoteArea(): boolean {
  return localStorage.getItem(STORAGE_KEY) === 'true';
}

export function saveRemoteArea(isRemoteArea: boolean): void {
  localStorage.setItem(STORAGE_KEY, String(isRemoteArea));
}
