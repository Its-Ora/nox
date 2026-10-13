// Transport HTTP : plugin HTTP de Tauri (pas de CORS, certificats Freebox acceptés) ou fetch natif hors Tauri.

export const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

type TauriFetch = (input: string, init?: RequestInit & Record<string, unknown>) => Promise<Response>;
let tauriFetch: TauriFetch | null = null;

async function getFetch(): Promise<TauriFetch> {
  if (!isTauri) return (u, i) => fetch(u, i);
  if (!tauriFetch) {
    const mod = await import('@tauri-apps/plugin-http');
    tauriFetch = mod.fetch as unknown as TauriFetch;
  }
  return tauriFetch;
}

export class HttpError extends Error {
  constructor(message: string, public status = 0) {
    super(message);
  }
}

export async function httpJson(
  url: string,
  opts: { method?: string; body?: unknown; headers?: Record<string, string>; timeout?: number } = {},
): Promise<any> {
  const f = await getFetch();
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), opts.timeout ?? 12000);
  const init: RequestInit & Record<string, unknown> = {
    method: opts.method ?? 'GET',
    headers: { ...(opts.body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...opts.headers },
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    signal: ctrl.signal,
  };
  if (isTauri) {
    init.connectTimeout = opts.timeout ?? 12000;
    // La Freebox présente un certificat signé par l'autorité Freebox, pas par une CA publique.
    if (url.startsWith('https://')) init.danger = { acceptInvalidCerts: true, acceptInvalidHostnames: false };
  }
  let res: Response;
  try {
    res = await f(url, init);
  } catch (e: any) {
    if (ctrl.signal.aborted) throw new HttpError('La Freebox ne répond pas (délai dépassé).');
    throw new HttpError(`Freebox injoignable : ${e?.message ?? e}`);
  } finally {
    clearTimeout(timer);
  }
  const text = await res.text();
  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    throw new HttpError(`Réponse illisible (HTTP ${res.status}).`, res.status);
  }
  return json;
}
