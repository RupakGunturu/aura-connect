export const API_URL =
  (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:4000";

export const SOCKET_URL =
  (import.meta.env.VITE_SOCKET_URL as string | undefined) ?? API_URL;

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

let refreshHandler: (() => Promise<string>) | null = null;
let refreshing: Promise<string> | null = null;

export function setRefreshHandler(h: () => Promise<string>) {
  refreshHandler = h;
}

export async function api<T = unknown>(
  path: string,
  opts: RequestInit & { token?: string | null } = {},
): Promise<T> {
  const { token, headers, ...rest } = opts;
  const doFetch = (t: string | null | undefined) =>
    fetch(`${API_URL}${path}`, {
      ...rest,
      headers: {
        "Content-Type": "application/json",
        ...(t ? { Authorization: `Bearer ${t}` } : {}),
        ...headers,
      },
    });

  let res = await doFetch(token);

  if (res.status === 401 && refreshHandler) {
    if (!refreshing) {
      refreshing = refreshHandler().finally(() => { refreshing = null; });
    }
    try {
      const newToken = await refreshing;
      res = await doFetch(newToken);
    } catch {
      // refresh failed — throw original error
    }
  }

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const msg = (data && (data.error || data.message)) || res.statusText;
    throw new ApiError(msg, res.status);
  }
  return data as T;
}
