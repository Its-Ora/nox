// Freebox Pop simulée : sert au mode démo (UI testable sans box).
import type { ApiVersion } from './client';

export const mockVersion: ApiVersion = {
  api_base_url: '/api/',
  api_version: '12.1',
  box_model: 'fbxgw8-r2',
  box_model_name: 'Freebox Pop',
  device_name: 'Freebox Pop (démo)',
  https_available: true,
  https_port: 41892,
  api_domain: 'demo1234.fbxos.fr',
};

const now = () => Math.floor(Date.now() / 1000);
const boot = now() - 3 * 86400 - 5 * 3600 - 17 * 60;

function host(id: number, name: string, type: string, vendor: string, mac: string, ip: string, active: boolean, conn: 'wifi' | 'ethernet', band = '5g', signal = -52) {
  return {
    id: `ether-${mac.toLowerCase()}`,
    primary_name: name,
    primary_name_manual: id % 3 === 0,
    host_type: type,
    vendor_name: vendor,
    persistent: true,
    active,
    reachable: active,
    last_activity: active ? now() - 4 : now() - 3600 * (id + 2),
    last_time_reachable: active ? now() - 4 : now() - 3600 * (id + 2),
    first_activity: now() - 86400 * (40 + id),
    l2ident: { id: mac, type: 'mac_address' },
    l3connectivities: [{ addr: ip, af: 'ipv4', active, reachable: active }],
    access_point: {
      connectivity_type: conn,
      type: 'gateway',
      ...(conn === 'wifi' ? { wifi_information: { band, signal, phy_tx_rate: band === '5g' ? 1201 : 286 } } : {}),
    },
  };
}

const db: Record<string, any> = {
  system: {
    firmware_version: '4.10.2',
    mac: '34:27:92:AA:10:5C',
    serial: '2930001234567890',
    board_name: 'fbxgw8r',
    disk_status: 'not_detected',
    box_authenticated: true,
    model_info: { pretty_name: 'Freebox Pop', name: 'fbxgw8-r2', has_vm: false, wifi_type: '2d4_5g_wifi6' },
    sensors: [
      { id: 'temp_cpu0', name: 'Processeur', value: 61 },
      { id: 'temp_t1', name: 'Carte mère', value: 47 },
      { id: 'temp_t2', name: 'Wi-Fi', value: 54 },
    ],
    fans: [{ id: 'fan0', name: 'Ventilateur', value: 1840 }],
  },
  connConfig: {
    ping: true,
    wol: false,
    adblock: false,
    allow_token_request: true,
    remote_access: true,
    remote_access_port: 41892,
    api_remote_access: true,
    is_secure_pass: true,
    sip_alg: 'disabled',
    https_available: true,
    https_port: 41892,
    api_domain: 'demo1234.fbxos.fr',
  },
  ipv6: { ipv6_enabled: true, ipv6_firewall: true },
  lan: { ip: '192.168.1.254', name: 'Freebox Pop', name_dns: 'freebox-pop', name_mdns: 'Freebox-Pop', name_netbios: 'Freebox_Pop', mode: 'router' },
  hosts: [
    host(1, 'PC de Théo', 'workstation', 'Micro-Star International', 'D8:BB:C1:4E:22:01', '192.168.1.20', true, 'ethernet'),
    host(2, 'Pixel de Théo', 'smartphone', 'Google', 'F2:6A:11:9C:04:3B', '192.168.1.31', true, 'wifi', '5g', -48),
    host(3, 'TV salon', 'television', 'TCL', 'A4:4E:31:72:9E:10', '192.168.1.42', true, 'wifi', '5g', -63),
    host(4, 'PS4', 'console', 'Sony Interactive', '70:9E:29:41:BB:02', '192.168.1.43', false, 'ethernet'),
    host(5, 'iPad', 'tablet', 'Apple', '3C:22:FB:10:00:7E', '192.168.1.55', true, 'wifi', '2d4g', -71),
    host(6, 'Imprimante', 'printer', 'HP', '9C:8E:99:12:AB:60', '192.168.1.60', false, 'wifi', '2d4g', -77),
    host(7, 'Portable', 'laptop', 'Lenovo', '58:96:1D:30:6F:44', '192.168.1.33', true, 'wifi', '5g', -57),
    host(8, 'Ampoule salon', 'other', 'Espressif', '24:6F:28:AA:00:91', '192.168.1.80', true, 'wifi', '2d4g', -66),
    host(9, 'Raspberry Pi', 'workstation', 'Raspberry Pi Trading', 'DC:A6:32:01:02:03', '192.168.1.10', false, 'ethernet'),
  ],
  wifiConfig: { enabled: true, mac_filter_state: 'disabled', power_saving: false },
  aps: [
    { id: 0, name: '2.4 GHz', status: { state: 'active', channel_width: '20', primary_channel: 6 }, config: { band: '2d4g', channel_width: '20', primary_channel: 0 } },
    { id: 1, name: '5 GHz', status: { state: 'active', channel_width: '160', primary_channel: 36 }, config: { band: '5g', channel_width: '160', primary_channel: 0 } },
  ],
  bss: [
    { id: '34:27:92:AA:10:5D', phy_id: 0, status: { state: 'active', sta_count: 2 }, config: { enabled: true, ssid: 'Freebox-THEO', hide_ssid: false, encryption: 'wpa23_psk_ccmp', key: 'c0rnemuse-bretonne-22', wps_enabled: false } },
    { id: '34:27:92:AA:10:5E', phy_id: 1, status: { state: 'active', sta_count: 4 }, config: { enabled: true, ssid: 'Freebox-THEO', hide_ssid: false, encryption: 'wpa23_psk_ccmp', key: 'c0rnemuse-bretonne-22', wps_enabled: false } },
  ],
  guest: [
    { id: 1, params: { description: 'Amis du week-end', key: 'ploumanach-29', max_use_count: 0, duration: 86400 * 3, access_type: 'net_only' }, remaining: 86400 * 2 + 3600 * 5, users_count: 1 },
  ],
  dhcp: { enabled: true, sticky_assign: true, gateway: '192.168.1.254', netmask: '255.255.255.0', ip_range_start: '192.168.1.1', ip_range_end: '192.168.1.199', always_broadcast: false, dns: ['192.168.1.254', '', '', '', ''] },
  leases: [
    { id: 'DC:A6:32:01:02:03', mac: 'DC:A6:32:01:02:03', ip: '192.168.1.10', comment: 'Pi-hole', hostname: 'raspberrypi' },
    { id: 'D8:BB:C1:4E:22:01', mac: 'D8:BB:C1:4E:22:01', ip: '192.168.1.20', comment: 'PC fixe', hostname: 'THEO-PC' },
  ],
  redirs: [
    { id: 1, enabled: true, ip_proto: 'tcp', wan_port_start: 47984, wan_port_end: 47990, lan_port: 47984, lan_ip: '192.168.1.20', src_ip: '0.0.0.0', comment: 'Sunshine', hostname: 'THEO-PC' },
    { id: 2, enabled: false, ip_proto: 'udp', wan_port_start: 51820, wan_port_end: 51820, lan_port: 51820, lan_ip: '192.168.1.10', src_ip: '0.0.0.0', comment: 'WireGuard Pi', hostname: 'raspberrypi' },
  ],
  dmz: { enabled: false, ip: '' },
  upnp: { enabled: true, version: 2 },
  upnpRedirs: [{ id: 'u1', int_ip: '192.168.1.43', int_port: 3478, ext_port: 3478, proto: 'udp', desc: 'PS4 NAT', remote_ip: '0.0.0.0', enabled: true }],
  profiles: [
    { id: 1, name: 'Petit frère', icon: '' },
    { id: 2, name: 'TV salon', icon: '' },
  ],
  netctl: [
    { profile_id: 1, current_mode: 'allowed', rule_mode: 'allowed', override: false, override_mode: 'allowed', override_until: 0, next_change: now() + 3 * 3600 },
    { profile_id: 2, current_mode: 'allowed', rule_mode: 'allowed', override: false, override_mode: 'allowed', override_until: 0, next_change: 0 },
  ],
  calls: [
    { id: 11, type: 'missed', datetime: now() - 1800, number: '0296234567', name: '', duration: 0, new: true },
    { id: 10, type: 'accepted', datetime: now() - 86400, number: '0612345678', name: 'Maman', duration: 312, new: false },
    { id: 9, type: 'outgoing', datetime: now() - 86400 * 2, number: '0296000000', name: 'Mairie', duration: 95, new: false },
    { id: 8, type: 'missed', datetime: now() - 86400 * 4, number: '0912121212', name: '', duration: 0, new: false },
  ],
  vpn: [
    { name: 'wireguard', type: 'wireguard', state: 'stopped', connection_count: 0, auth_connection_count: 0 },
    { name: 'openvpn_routed', type: 'openvpn', state: 'stopped', connection_count: 0, auth_connection_count: 0 },
  ],
  vpnUsers: [{ login: 'theo-tel', ip_reservation: '' }],
  vpnConfig: { wireguard: { enabled: false, port: 51821 }, openvpn_routed: { enabled: false, port: 1194 } } as Record<string, any>,
};

let bytesDown = 182_000_000_000;
let bytesUp = 21_000_000_000;
let t = 0;
function connection() {
  t += 1;
  // Débit simulé : base + vagues + rafales, pour que le graphe vive.
  const burst = Math.random() < 0.08 ? 40_000_000 + Math.random() * 60_000_000 : 0;
  const down = Math.max(0, 2_400_000 + Math.sin(t / 7) * 1_800_000 + Math.random() * 1_200_000 + burst);
  const up = Math.max(0, 380_000 + Math.sin(t / 5 + 1) * 250_000 + Math.random() * 200_000 + burst / 12);
  bytesDown += down * 2;
  bytesUp += up * 2;
  return {
    type: 'ethernet',
    media: 'ftth',
    state: 'up',
    ipv4: '82.64.143.27',
    ipv6: '2a01:e0a:2f1:4c40::1',
    rate_down: Math.round(down),
    rate_up: Math.round(up),
    bandwidth_down: 5_000_000_000,
    bandwidth_up: 900_000_000,
    bytes_down: bytesDown,
    bytes_up: bytesUp,
    ipv4_port_range: [0, 65535],
  };
}

let nextId = 100;

export function mockApi(method: string, path: string, body: any): any {
  const p = path.replace(/^\//, '').replace(/\/$/, '');
  const m = method.toUpperCase();
  const seg = p.split('/');

  const crud = (list: any[], key = 'id') => {
    const id = seg[seg.length - 1];
    const idx = list.findIndex((x) => String(x[key]) === decodeURIComponent(id));
    if (m === 'GET') return idx >= 0 && seg.length > 2 ? list[idx] : list;
    if (m === 'POST') {
      const item = { ...body, [key]: body?.[key] ?? nextId++ };
      list.push(item);
      return item;
    }
    if (idx < 0) throw fail('noent', 'Élément introuvable');
    if (m === 'PUT') return (list[idx] = deepMerge(list[idx], body));
    if (m === 'DELETE') {
      list.splice(idx, 1);
      return {};
    }
  };

  switch (true) {
    case p === 'system':
      return { ...db.system, uptime_val: now() - boot, sensors: db.system.sensors.map((s: any) => ({ ...s, value: s.value + Math.round(Math.random() * 2) })) };
    case p === 'system/reboot':
      return {};
    case p === 'connection':
      return connection();
    case p === 'connection/config':
      return m === 'PUT' ? Object.assign(db.connConfig, body) : db.connConfig;
    case p === 'connection/ipv6/config':
      return m === 'PUT' ? Object.assign(db.ipv6, body) : db.ipv6;
    case p === 'lan/config':
      return m === 'PUT' ? Object.assign(db.lan, body) : db.lan;
    case p === 'lan/browser/interfaces':
      return [{ name: 'pub', host_count: db.hosts.length }];
    case p.startsWith('lan/browser/pub'):
      if (m === 'GET' && seg.length === 3) return db.hosts;
      if (m === 'PUT') return crud(db.hosts);
      return db.hosts.find((h: any) => h.id === seg[3]);
    case p === 'lan/wol/pub':
      return {};
    case p === 'wifi/config':
      return m === 'PUT' ? Object.assign(db.wifiConfig, body) : db.wifiConfig;
    case p.startsWith('wifi/ap'):
      return crud(db.aps);
    case p.startsWith('wifi/bss'):
      return crud(db.bss);
    case p.startsWith('wifi/custom_key'):
      if (m === 'POST') {
        const item = { id: nextId++, params: body.params, remaining: body.params.duration || 0, users_count: 0 };
        db.guest.push(item);
        return item;
      }
      return crud(db.guest);
    case p === 'dhcp/config':
      return m === 'PUT' ? Object.assign(db.dhcp, body) : db.dhcp;
    case p.startsWith('dhcp/static_lease'):
      if (m === 'POST') {
        const item = { ...body, id: body.mac };
        db.leases.push(item);
        return item;
      }
      return crud(db.leases);
    case p === 'dhcp/dynamic_lease':
      return db.hosts
        .filter((h: any) => h.active)
        .map((h: any) => ({ mac: h.l2ident.id, hostname: h.primary_name, ip: h.l3connectivities[0].addr, lease_remaining: 40000, is_static: db.leases.some((l: any) => l.mac === h.l2ident.id) }));
    case p.startsWith('fw/redir'):
      return crud(db.redirs);
    case p === 'fw/dmz':
      return m === 'PUT' ? Object.assign(db.dmz, body) : db.dmz;
    case p === 'upnpigd/config':
      return m === 'PUT' ? Object.assign(db.upnp, body) : db.upnp;
    case p.startsWith('upnpigd/redir'):
      return crud(db.upnpRedirs);
    case p.startsWith('profile'):
      return crud(db.profiles);
    case p.startsWith('network_control'): {
      if (m === 'GET' && seg.length === 1) return db.netctl;
      const n = db.netctl.find((x: any) => String(x.profile_id) === seg[1]);
      if (m === 'PUT' && n) {
        Object.assign(n, body);
        n.current_mode = n.override ? n.override_mode : n.rule_mode;
      }
      return n;
    }
    case p === 'call/log/mark_all_as_read':
      db.calls.forEach((c: any) => (c.new = false));
      return {};
    case p === 'call/log/delete_all':
      db.calls.length = 0;
      return {};
    case p.startsWith('call/log'):
      return crud(db.calls);
    case p === 'vpn':
      return db.vpn;
    case p.startsWith('vpn/user'):
      if (m === 'POST') {
        const u = { login: body.login, ip_reservation: body.ip_reservation ?? '' };
        db.vpnUsers.push(u);
        return u;
      }
      return crud(db.vpnUsers, 'login');
    case p.startsWith('vpn/download_config'):
      return `[Interface]\nPrivateKey = (démo)\nAddress = 192.168.27.65/32\nDNS = 192.168.27.64\n\n[Peer]\nPublicKey = (démo)\nEndpoint = 82.64.143.27:51821\nAllowedIPs = 0.0.0.0/0, ::/0\n`;
    case /^vpn\/[^/]+\/config$/.test(p): {
      const name = seg[1];
      if (m === 'PUT') {
        Object.assign(db.vpnConfig[name], body);
        const s = db.vpn.find((v: any) => v.name === name);
        if (s) s.state = db.vpnConfig[name].enabled ? 'started' : 'stopped';
      }
      return db.vpnConfig[name];
    }
    case p === 'login/logout':
      return {};
    default:
      throw fail('invalid_request', `Point d'API non simulé en démo : ${p}`);
  }
}

function fail(code: string, msg: string) {
  const e: any = new Error(msg);
  e.code = code;
  return e;
}

function deepMerge(a: any, b: any): any {
  if (typeof a !== 'object' || a === null || Array.isArray(a) || typeof b !== 'object' || b === null || Array.isArray(b)) return b;
  const r = { ...a };
  for (const k of Object.keys(b)) r[k] = deepMerge(a[k], b[k]);
  return r;
}
