type RequestBody = Record<string, unknown>;

const isBody = (body: unknown): body is RequestBody =>
  typeof body === 'object' && body !== null;

export const requireBody = (
  body: unknown,
  createError: () => Error,
): RequestBody => {
  if (!isBody(body)) throw createError();
  return body;
};

// 타입만 검사한다(빈 문자열·공백 허용).
export const requireString = (
  value: unknown,
  createError: () => Error,
): string => {
  if (typeof value !== 'string') throw createError();
  return value;
};

// 타입에 더해 빈 문자열·공백 문자열을 거부한다.
export const requireNonEmptyString = (
  value: unknown,
  createError: () => Error,
): string => {
  if (typeof value !== 'string' || value.trim() === '') throw createError();
  return value;
};

export const requireNumber = (
  value: unknown,
  createError: () => Error,
): number => {
  if (typeof value !== 'number') throw createError();
  return value;
};
