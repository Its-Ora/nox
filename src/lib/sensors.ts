/** Températures et ventilateurs, quel que soit le format renvoyé par la box (récent ou ancien). */
export function sensorsOf(s: any): { id: string; name: string; value: number }[] {
  if (Array.isArray(s?.sensors) && s.sensors.length) return s.sensors;
  const out = [];
  if (typeof s?.temp_cpum === 'number') out.push({ id: 'temp_cpum', name: 'Processeur principal', value: s.temp_cpum });
  if (typeof s?.temp_cpub === 'number') out.push({ id: 'temp_cpub', name: 'Processeur secondaire', value: s.temp_cpub });
  if (typeof s?.temp_sw === 'number') out.push({ id: 'temp_sw', name: 'Switch', value: s.temp_sw });
  return out;
}

export function fansOf(s: any): { id: string; name: string; value: number }[] {
  if (Array.isArray(s?.fans) && s.fans.length) return s.fans;
  return typeof s?.fan_rpm === 'number' ? [{ id: 'fan', name: 'Ventilateur', value: s.fan_rpm }] : [];
}
