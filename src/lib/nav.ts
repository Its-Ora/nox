export type NavItem = { id: string; label: string; icon: string; mobile?: boolean };

export const NAV: NavItem[][] = [
  [
    { id: 'home', label: 'Accueil', icon: 'home', mobile: true },
    { id: 'devices', label: 'Appareils', icon: 'devices', mobile: true },
    { id: 'wifi', label: 'Wi-Fi', icon: 'wifi', mobile: true },
  ],
  [
    { id: 'lan', label: 'Réseau local', icon: 'network', mobile: true },
    { id: 'ports', label: 'Ports', icon: 'ports' },
    { id: 'internet', label: 'Connexion', icon: 'globe' },
    { id: 'vpn', label: 'VPN', icon: 'vpn' },
    { id: 'parental', label: 'Contrôle parental', icon: 'shield' },
    { id: 'calls', label: 'Appels', icon: 'phone' },
  ],
  [
    { id: 'system', label: 'Freebox', icon: 'box' },
    { id: 'explorer', label: 'API brute', icon: 'code' },
    { id: 'app', label: "Réglages de l'app", icon: 'settings' },
  ],
];

export const ALL = NAV.flat();
