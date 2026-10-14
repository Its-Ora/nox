export const permLabels: Record<string, string> = {
  settings: 'Modifier les réglages',
  contacts: 'Contacts',
  calls: 'Journal d’appels',
  explorer: 'Fichiers',
  downloader: 'Téléchargements',
  parental: 'Contrôle parental',
  pvr: 'Enregistrements TV',
  home: 'Maison connectée',
  camera: 'Caméras',
  tv: 'Télévision',
  profile: 'Profils',
  player: 'Player',
  wdo: 'Accès distant',
  vm: 'Machines virtuelles',
};

// Droits qui n'existent pas sur une Pop : on ne les réclame pas.
const IGNORED = new Set(['vm']);

export function missingPerms(p: Record<string, boolean>): string[] {
  return Object.entries(p)
    .filter(([k, v]) => v === false && !IGNORED.has(k))
    .map(([k]) => k);
}
