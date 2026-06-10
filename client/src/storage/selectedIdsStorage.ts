const STORAGE_KEY = 'selectedIds';

export function loadSelectedIds(): Set<string> | null {
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved ? new Set<string>(JSON.parse(saved)) : null;
}

export function saveSelectedIds(selectedIds: Set<string>): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...selectedIds]));
}
