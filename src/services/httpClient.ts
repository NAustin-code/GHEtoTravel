// NOTE: the app runs fully offline against services/localStore.ts — no HTTP
// calls are made at runtime. This module now only provides the auth-token
// helpers and ApiClientError used by the store and its tests. The `api`
// fetch wrapper below is dormant legacy kept for the httpClient unit tests.

const TOKEN_KEY = "ghe.auth.token";
// Cached signed-in user profile. Lives outside the `trp.v1.` store namespace
// for legacy reasons — resetLocalStore() removes it explicitly (see localStore).
export const CACHED_USER_KEY = "ghe.auth.user";

function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getAuthToken(): string | null {
  return getToken();
}

export function setToken(token: string | null): void {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

/** Removes all auth state (token + cached user), e.g. on logout or store reset. */
export function clearAuthState(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(CACHED_USER_KEY);
}

interface ApiError {
  status: number;
  error: string;
}

export class ApiClientError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  timeoutMs = 30000,
): Promise<T> {
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
  const headers: Record<string, string> = isFormData ? {} : { "Content-Type": "application/json" };
  const token = getToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let res: Response;
  try {
    res = await fetch(path, {
      method,
      headers,
      body: body ? (isFormData ? body as FormData : JSON.stringify(body)) : undefined,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    let errorBody: ApiError | null = null;
    try {
      errorBody = await res.json();
    } catch { /* ignore parse errors */ }
    throw new ApiClientError(
      res.status,
      errorBody?.error || `Request failed with status ${res.status}`,
    );
  }

  // 204 No Content — return undefined (callers must handle)
  if (res.status === 204) return undefined as T;
  return res.json();
}

/**
 * @deprecated Dormant legacy — the app runs offline against services/localStore
 * via services/api. Do not wire new features to this; it is kept only for the
 * httpClient unit tests.
 */
export const api = {
  get: <T>(path: string) => request<T>("GET", path),
  post: <T>(path: string, body?: unknown) => request<T>("POST", path, body),
  postForm: <T>(path: string, body: FormData) => request<T>("POST", path, body),
  put: <T>(path: string, body?: unknown) => request<T>("PUT", path, body),
  patch: <T>(path: string, body?: unknown) => request<T>("PATCH", path, body),
  del: <T>(path: string) => request<T>("DELETE", path),
};
