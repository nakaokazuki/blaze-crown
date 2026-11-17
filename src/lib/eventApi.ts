export function eventApiBase(slug: string): string {
  return `/api/events/${encodeURIComponent(slug)}`;
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit & { accessToken?: string | null } = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.accessToken) headers.set('Authorization', `Bearer ${options.accessToken}`);
  const res = await fetch(path, { ...options, headers, cache: 'no-store' });
  const text = await res.text();
  let data: T & { error?: string };
  try {
    data = JSON.parse(text) as T & { error?: string };
  } catch {
    const hint =
      res.status === 404
        ? 'イベント API は未起動です。`npm run build` のあと `npx wrangler pages dev dist` で開いてください（`npm run dev` だけでは API がありません）。'
        : 'サーバー応答が JSON ではありません';
    throw new Error(hint);
  }
  if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
  return data;
}