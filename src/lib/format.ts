const fr = (s: string) => s.replace('.', ',');

/** Débit en octets/s → valeur + unité en bits (comme les box). */
export function rate(bytesPerSec: number | undefined): [string, string] {
  const b = (bytesPerSec ?? 0) * 8;
  if (b >= 1e9) return [fr((b / 1e9).toFixed(2)), 'Gb/s'];
  if (b >= 1e6) return [fr((b / 1e6).toFixed(b >= 1e8 ? 0 : 1)), 'Mb/s'];
  if (b >= 1e3) return [(b / 1e3).toFixed(0), 'kb/s'];
  return [b.toFixed(0), 'b/s'];
}

export function bandwidth(bits: number | undefined) {
  const b = bits ?? 0;
  if (b >= 1e9) return `${fr(String(+(b / 1e9).toFixed(1)))} Gb/s`;
  return `${Math.round(b / 1e6)} Mb/s`;
}

export function bytes(n: number | undefined) {
  let v = n ?? 0;
  const u = ['o', 'Ko', 'Mo', 'Go', 'To'];
  let i = 0;
  while (v >= 1024 && i < u.length - 1) {
    v /= 1024;
    i++;
  }
  return `${fr(v.toFixed(v >= 100 || i === 0 ? 0 : 1))} ${u[i]}`;
}

export function duration(sec: number | undefined) {
  let s = Math.max(0, Math.floor(sec ?? 0));
  const d = Math.floor(s / 86400);
  s %= 86400;
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (d) return `${d} j ${h} h`;
  if (h) return `${h} h ${m} min`;
  return `${m} min`;
}

export function ago(ts: number | undefined) {
  if (!ts) return '—';
  const diff = Date.now() / 1000 - ts;
  if (diff < 60) return "à l'instant";
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} h`;
  const d = Math.floor(diff / 86400);
  return d === 1 ? 'hier' : `il y a ${d} jours`;
}

export function dateTime(ts: number) {
  const d = new Date(ts * 1000);
  const today = new Date();
  const sameDay = d.toDateString() === today.toDateString();
  const t = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  if (sameDay) return `Aujourd'hui, ${t}`;
  return `${d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}, ${t}`;
}

export function phone(n: string) {
  const c = n.replace(/\D/g, '');
  return c.length === 10 ? c.replace(/(\d{2})(?=\d)/g, '$1 ') : n;
}

export const hostTypes: Record<string, string> = {
  workstation: 'Ordinateur',
  laptop: 'Portable',
  smartphone: 'Téléphone',
  tablet: 'Tablette',
  television: 'Télévision',
  console: 'Console',
  printer: 'Imprimante',
  nas: 'NAS',
  multimedia_device: 'Multimédia',
  freebox_player: 'Player Freebox',
  freebox_hd: 'Freebox HD',
  networking_device: 'Équipement réseau',
  ip_camera: 'Caméra',
  ip_phone: 'Téléphone IP',
  car: 'Voiture',
  vacuum_robot: 'Aspirateur',
  watch: 'Montre',
  other: 'Autre',
};

export function band(b?: string) {
  if (!b) return '';
  if (b.startsWith('2')) return '2,4 GHz';
  if (b === '5g') return '5 GHz';
  if (b === '6g') return '6 GHz';
  return b;
}

export function signalBars(dbm?: number) {
  if (dbm === undefined) return 0;
  if (dbm >= -55) return 4;
  if (dbm >= -65) return 3;
  if (dbm >= -75) return 2;
  return 1;
}
