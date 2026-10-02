export type Result<T> =
  | { ok: true; data: T }
  | { ok: false; error: { message: string; fields?: Record<string, string[]> | undefined } };

export function ok<T>(data: T): Result<T> {
  return { ok: true, data };
}

export function err<T>(
  message: string,
  fields?: Record<string, string[]> | undefined
): Result<T> {
  return fields !== undefined
    ? { ok: false, error: { message, fields } }
    : { ok: false, error: { message } };
}
