import { Freebox, loadSettings, saveSettings, ApiError, type Settings } from './api/client';

export type Phase = 'boot' | 'setup' | 'pair' | 'ready' | 'unreachable';

class AppState {
  settings = $state<Settings>(loadSettings());
  fb = new Freebox(this.settings);
  phase = $state<Phase>('boot');
  bootError = $state('');
  route = $state(initialRoute());
  boxName = $state('Freebox');
  where = $state<'local' | 'remote' | 'demo' | null>(null);
  permissions = $state<Record<string, boolean>>({});

  /** Démarrage : découverte, puis session si l'app est déjà autorisée. */
  async start() {
    this.bootError = '';
    this.fb = new Freebox(this.settings);
    try {
      const v = await this.fb.discover();
      this.where = this.fb.where;
      this.boxName = v.box_model_name || v.device_name || 'Freebox';
      if (!this.settings.appToken && !this.settings.demo) {
        this.phase = 'pair';
        return;
      }
      await this.fb.login();
      this.permissions = { ...this.fb.permissions };
      this.phase = 'ready';
    } catch (e: any) {
      if (e instanceof ApiError && (e.code === 'invalid_token' || e.code === 'no_token')) {
        this.settings.appToken = null;
        this.persist();
        this.phase = 'pair';
        return;
      }
      this.bootError = e?.message ?? String(e);
      this.phase = this.settings.localUrl || this.settings.remoteUrl ? 'unreachable' : 'setup';
    }
  }

  persist() {
    saveSettings($state.snapshot(this.settings) as Settings);
  }

  go(route: string) {
    if (route === this.route) return;
    const swap = () => {
      this.route = route;
      try {
        history.replaceState(null, '', '#' + route);
      } catch {
        /* ignoré */
      }
    };
    // Transition native quand dispo : fondu propre, sans bloquer le thread.
    const d = document as any;
    if (d.startViewTransition && !matchMedia('(prefers-reduced-motion: reduce)').matches) d.startViewTransition(swap);
    else swap();
  }

  async forget() {
    await this.fb.logout();
    this.settings.appToken = null;
    this.persist();
    clearCache();
    this.phase = 'pair';
  }
}

function initialRoute() {
  const h = location.hash.replace('#', '');
  return h || 'home';
}

export const app = new AppState();

/* ---------- Données avec cache (affichage instantané, rafraîchi en arrière-plan) ---------- */

const cache = new Map<string, { data: unknown; at: number }>();
const live = new Set<Resource<any>>();

export function clearCache() {
  cache.clear();
}

export class Resource<T> {
  data = $state<T | undefined>(undefined);
  error = $state<string | null>(null);
  loading = $state(false);
  /** vrai tant qu'aucune donnée n'a jamais été affichée */
  pending = $derived(this.data === undefined && this.error === null);
  private inflight = false;

  constructor(public path: string) {
    const c = cache.get(path);
    if (c) this.data = c.data as T;
  }

  async refresh() {
    if (this.inflight) return;
    this.inflight = true;
    this.loading = true;
    try {
      const d = await app.fb.api<T>('GET', this.path);
      cache.set(this.path, { data: d, at: Date.now() });
      this.data = d;
      this.error = null;
    } catch (e: any) {
      this.error = e?.message ?? String(e);
    } finally {
      this.loading = false;
      this.inflight = false;
    }
  }

  /** Mise à jour optimiste locale (l'UI réagit tout de suite). */
  patch(fn: (d: T) => T) {
    if (this.data === undefined) return;
    this.data = fn($state.snapshot(this.data) as T);
    cache.set(this.path, { data: this.data, at: Date.now() });
  }
}

/** À appeler à l'initialisation d'un composant. */
export function useResource<T>(path: string, opts: { poll?: number } = {}): Resource<T> {
  const r = new Resource<T>(path);
  $effect(() => {
    live.add(r);
    // Laisse le navigateur peindre la page avant de lancer la requête.
    const kick = setTimeout(() => r.refresh(), 0);
    let timer: ReturnType<typeof setInterval> | undefined;
    if (opts.poll) {
      timer = setInterval(() => {
        if (document.visibilityState === 'visible') r.refresh();
      }, opts.poll);
    }
    return () => {
      clearTimeout(kick);
      if (timer) clearInterval(timer);
      live.delete(r);
    };
  });
  return r;
}

export function invalidate(prefix: string) {
  for (const r of live) if (r.path.startsWith(prefix)) r.refresh();
}

/* ---------- Notifications ---------- */

export type Toast = { id: number; text: string; kind: 'busy' | 'ok' | 'err' };
export const toasts = $state<Toast[]>([]);
let tid = 0;

function pushToast(text: string, kind: Toast['kind']) {
  const t = { id: ++tid, text, kind };
  toasts.push(t);
  return t.id;
}
function setToast(id: number, text: string, kind: Toast['kind'], ttl: number) {
  const t = toasts.find((x) => x.id === id);
  if (t) {
    t.text = text;
    t.kind = kind;
  }
  setTimeout(() => {
    const i = toasts.findIndex((x) => x.id === id);
    if (i >= 0) toasts.splice(i, 1);
  }, ttl);
}

/** Exécute une action sur la box avec retour visuel. */
export async function act<T>(
  labels: { busy: string; done: string },
  fn: () => Promise<T>,
  refresh: string[] = [],
): Promise<T | undefined> {
  const id = pushToast(labels.busy, 'busy');
  try {
    const r = await fn();
    setToast(id, labels.done, 'ok', 1800);
    refresh.forEach(invalidate);
    return r;
  } catch (e: any) {
    setToast(id, e?.message ?? String(e), 'err', 6000);
    refresh.forEach(invalidate);
    return undefined;
  }
}

export function notify(text: string, kind: Toast['kind'] = 'ok') {
  const id = pushToast(text, kind);
  setToast(id, text, kind, kind === 'err' ? 6000 : 2200);
}
