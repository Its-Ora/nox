import { hmacSha1Hex } from './hmac';
import { httpJson, HttpError } from './transport';
import { mockApi, mockVersion } from './mock';

export const APP_ID = 'fr.theo.nox';
export const APP_NAME = 'Nox';
export const APP_VERSION = '0.1.0';

declare const __DEMO_ONLY__: boolean;

export type Mode = 'auto' | 'local' | 'remote';

export interface Settings {
  localUrl: string;
  remoteUrl: string;
  mode: Mode;
  appToken: string | null;
  demo: boolean;
  deviceName: string;
}

const KEY = 'nox.settings.v1';

function defaults(): Settings {
  return {
    localUrl: 'http://mafreebox.freebox.fr',
    remoteUrl: '',
    mode: 'auto',
    appToken: null,
    demo: __DEMO_ONLY__,
    deviceName: guessDevice(),
  };
}

function guessDevice() {
  const ua = navigator.userAgent;
  if (/Android/i.test(ua)) return 'Téléphone Android';
  if (/Windows/i.test(ua)) return 'PC Windows';
  if (/Mac/i.test(ua)) return 'Mac';
  return 'Appareil';
}

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const s = { ...defaults(), ...JSON.parse(raw) };
      if (__DEMO_ONLY__) s.demo = true;
      return s;
    }
  } catch {
    /* stockage indisponible : valeurs par défaut */
  }
  return defaults();
}

export function saveSettings(s: Settings) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* ignoré */
  }
}

export class ApiError extends Error {
  constructor(message: string, public code: string = 'error') {
    super(message);
  }
}

export interface ApiVersion {
  api_base_url: string;
  api_version: string;
  box_model?: string;
  box_model_name?: string;
  device_name?: string;
  https_available?: boolean;
  https_port?: number;
  api_domain?: string;
}

export type Permissions = Record<string, boolean>;

const AUTH_CODES = new Set(['auth_required', 'invalid_session', 'invalid_token']);

export class Freebox {
  settings: Settings;
  host = '';
  base = '';
  version: ApiVersion | null = null;
  where: 'local' | 'remote' | 'demo' | null = null;
  private session: string | null = null;
  permissions: Permissions = {};
  private sessionPromise: Promise<void> | null = null;

  constructor(settings: Settings) {
    this.settings = settings;
  }

  get demo() {
    return this.settings.demo;
  }

  /** Trouve la box (locale puis distante en mode auto) et lit la version de l'API. */
  async discover(): Promise<ApiVersion> {
    if (this.demo) {
      this.version = mockVersion;
      this.where = 'demo';
      this.base = '/api/v12/';
      return mockVersion;
    }
    const { mode, localUrl, remoteUrl } = this.settings;
    const candidates: [string, 'local' | 'remote'][] = [];
    if (mode !== 'remote' && localUrl) candidates.push([clean(localUrl), 'local']);
    if (mode !== 'local' && remoteUrl) candidates.push([clean(remoteUrl), 'remote']);
    if (!candidates.length) throw new ApiError("Aucune adresse de Freebox configurée.");
    let last: unknown;
    for (const [url, where] of candidates) {
      try {
        const v = (await httpJson(`${url}/api_version`, { timeout: where === 'local' ? 2500 : 8000 })) as ApiVersion;
        if (!v?.api_version) throw new ApiError("Ce n'est pas une Freebox.");
        this.host = url;
        this.version = v;
        this.where = where;
        const major = v.api_version.split('.')[0];
        this.base = `${url}${v.api_base_url || '/api/'}v${major}/`;
        return v;
      } catch (e) {
        last = e;
      }
    }
    throw last instanceof Error ? last : new ApiError('Freebox introuvable.');
  }

  /** Demande d'autorisation : à valider physiquement sur la box. */
  async authorize(onStatus: (s: string) => void, signal?: AbortSignal): Promise<string> {
    if (this.demo) {
      for (const s of ['pending', 'pending', 'granted']) {
        onStatus(s);
        await sleep(900);
      }
      this.settings.appToken = 'demo-token';
      saveSettings(this.settings);
      return 'demo-token';
    }
    const r = await this.raw('POST', 'login/authorize/', {
      app_id: APP_ID,
      app_name: APP_NAME,
      app_version: APP_VERSION,
      device_name: this.settings.deviceName,
    });
    const token: string = r.app_token;
    const track: number = r.track_id;
    for (;;) {
      if (signal?.aborted) throw new ApiError('Demande annulée.');
      const s = await this.raw('GET', `login/authorize/${track}`);
      onStatus(s.status);
      if (s.status === 'granted') break;
      if (s.status === 'denied') throw new ApiError('Demande refusée sur la Freebox.');
      if (s.status === 'timeout') throw new ApiError("Pas de validation à temps. Relance la demande.");
      if (s.status === 'unknown') throw new ApiError('Jeton inconnu de la Freebox. Relance la demande.');
      await sleep(1500);
    }
    this.settings.appToken = token;
    saveSettings(this.settings);
    return token;
  }

  async login(): Promise<void> {
    if (this.sessionPromise) return this.sessionPromise;
    this.sessionPromise = (async () => {
      if (this.demo) {
        this.session = 'demo';
        this.permissions = { settings: true, contacts: true, calls: true, explorer: true, downloader: true, parental: true, pvr: true, home: true, camera: true, vm: false, wdo: true, tv: true, profile: true };
        return;
      }
      const token = this.settings.appToken;
      if (!token) throw new ApiError("L'app n'est pas encore autorisée sur cette Freebox.", 'no_token');
      const ch = await this.raw('GET', 'login/');
      const password = await hmacSha1Hex(token, ch.challenge);
      const s = await this.raw('POST', 'login/session/', { app_id: APP_ID, app_version: APP_VERSION, password });
      this.session = s.session_token;
      this.permissions = s.permissions ?? {};
    })();
    try {
      await this.sessionPromise;
    } finally {
      this.sessionPromise = null;
    }
  }

  async logout() {
    if (!this.demo && this.session) {
      try {
        await this.api('POST', 'login/logout/');
      } catch {
        /* sans importance */
      }
    }
    this.session = null;
  }

  /** Appel API authentifié, avec reconnexion automatique si la session a expiré. */
  async api<T = any>(method: string, path: string, body?: unknown): Promise<T> {
    if (this.demo) {
      await sleep(120 + Math.random() * 260);
      try {
        return structuredClone(mockApi(method, path, body)) as T;
      } catch (e: any) {
        throw new ApiError(e.message, e.code);
      }
    }
    if (!this.session) await this.login();
    try {
      return await this.raw(method, path, body);
    } catch (e) {
      if (e instanceof ApiError && AUTH_CODES.has(e.code)) {
        this.session = null;
        await this.login();
        return this.raw(method, path, body);
      }
      throw e;
    }
  }

  private async raw(method: string, path: string, body?: unknown): Promise<any> {
    if (!this.base) await this.discover();
    const url = this.base + path.replace(/^\//, '');
    const headers: Record<string, string> = {};
    if (this.session) headers['X-Fbx-App-Auth'] = this.session;
    let j: any;
    try {
      j = await httpJson(url, { method, body, headers });
    } catch (e) {
      if (e instanceof HttpError) throw new ApiError(e.message, 'network');
      throw e;
    }
    if (!j || j.success === false) {
      throw new ApiError(explain(j?.error_code, j?.msg), j?.error_code ?? 'error');
    }
    return j.result;
  }
}

function explain(code?: string, msg?: string): string {
  switch (code) {
    case 'insufficient_rights':
      return "Droit manquant pour cette action. Ouvre Freebox OS → Paramètres → Gestion des accès → Applications, puis coche les droits de Nox.";
    case 'auth_required':
    case 'invalid_session':
      return 'Session expirée.';
    case 'invalid_token':
      return "Le jeton de l'app a été révoqué. Refais l'association.";
    case 'denied_from_external_ip':
      return "Cette action n'est possible que depuis le réseau local.";
    case 'ratelimited':
      return 'Trop de requêtes, réessaie dans quelques secondes.';
    case 'invalid_request':
      return msg ? `Requête refusée : ${msg}` : 'Requête refusée par la Freebox.';
    default:
      return msg || 'Erreur inconnue renvoyée par la Freebox.';
  }
}

function clean(u: string) {
  u = u.trim().replace(/\/+$/, '');
  if (!/^https?:\/\//.test(u)) u = 'http://' + u;
  return u;
}

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
