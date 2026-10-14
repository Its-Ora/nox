import { isTauri } from './api/transport';

/** Ouvre un lien dans le navigateur du système (pas dans la fenêtre de Nox). */
export async function openExternal(url: string) {
  if (isTauri) {
    try {
      const { openUrl } = await import('@tauri-apps/plugin-opener');
      await openUrl(url);
      return;
    } catch {
      /* repli ci-dessous */
    }
  }
  window.open(url, '_blank', 'noopener');
}
