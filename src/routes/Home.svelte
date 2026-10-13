<script module lang="ts">
  // Historique gardé entre les pages : en revenant sur l'accueil, le graphe est déjà rempli.
  const history: { t: number; down: number; up: number }[] = [];
</script>

<script lang="ts">
  import { app, useResource, act } from '../lib/state.svelte';
  import { rate, bandwidth, duration, bytes } from '../lib/format';
  import Flow from '../lib/ui/Flow.svelte';
  import Row from '../lib/ui/Row.svelte';
  import Toggle from '../lib/ui/Toggle.svelte';
  import Button from '../lib/ui/Button.svelte';
  import Async from '../lib/ui/Async.svelte';
  import { ask } from '../lib/ui/confirm.svelte';

  const conn = useResource<any>('connection/', { poll: 2000 });
  const sys = useResource<any>('system/', { poll: 15000 });
  const hosts = useResource<any[]>('lan/browser/pub/', { poll: 20000 });
  const wifi = useResource<any>('wifi/config/');

  let samples = $state(history.slice());

  $effect(() => {
    const c = conn.data;
    if (!c) return;
    history.push({ t: Date.now(), down: c.rate_down ?? 0, up: c.rate_up ?? 0 });
    while (history.length > 80) history.shift();
    samples = history.slice();
  });

  const down = $derived(rate(conn.data?.rate_down));
  const up = $derived(rate(conn.data?.rate_up));
  const online = $derived(hosts.data?.filter((h) => h.active).length);
  const hottest = $derived(sys.data?.sensors?.length ? Math.max(...sys.data.sensors.map((s: any) => s.value)) : undefined);

  async function toggleWifi(v: boolean) {
    if (!v && app.where === 'local') {
      const ok = await ask(
        'Couper le Wi-Fi ?',
        "Tous les appareils en Wi-Fi seront déconnectés, y compris celui-ci s'il n'est pas en câble.",
        'Couper le Wi-Fi',
      );
      if (!ok) return;
    }
    wifi.patch((d) => ({ ...d, enabled: v }));
    await act({ busy: v ? 'Activation du Wi-Fi…' : 'Arrêt du Wi-Fi…', done: v ? 'Wi-Fi activé' : 'Wi-Fi coupé' }, () => app.fb.api('PUT', 'wifi/config/', { enabled: v }), ['wifi/']);
  }

  async function reboot() {
    const ok = await ask('Redémarrer la Freebox ?', 'Internet, le Wi-Fi et le téléphone seront coupés environ deux minutes.', 'Redémarrer');
    if (!ok) return;
    await act({ busy: 'Redémarrage demandé…', done: 'La Freebox redémarre' }, () => app.fb.api('POST', 'system/reboot/'));
  }
</script>

<section class="hero">
  <div class="figures">
    <div class="fig">
      <span class="big num">{conn.data ? down[0] : '—'}</span>
      <span class="unit">{down[1]} reçus</span>
    </div>
    <div class="fig up">
      <span class="mid num">{conn.data ? up[0] : '—'}</span>
      <span class="unit">{up[1]} envoyés</span>
    </div>
  </div>
  <div class="chart">
    <Flow {samples} />
  </div>
  <div class="legend">
    <span><i class="solid"></i>Réception</span>
    <span><i class="dash"></i>Envoi</span>
    <span class="faint">Temps réel</span>
  </div>
</section>

<h2 class="group-title">Connexion</h2>
<Async r={conn} rows={3}>
  {#snippet children(c)}
    <Row label="État" value={c.state === 'up' ? 'Connectée' : c.state === 'going_up' ? 'Connexion…' : 'Déconnectée'} hint={`${c.media === 'ftth' ? 'Fibre' : c.media === 'xdsl' ? 'ADSL / VDSL' : c.media ?? ''}, jusqu'à ${bandwidth(c.bandwidth_down)} en réception et ${bandwidth(c.bandwidth_up)} en envoi`} />
    <Row label="Adresse IPv4" value={c.ipv4 ?? '—'} />
    <Row label="Adresse IPv6" value={c.ipv6 ?? '—'} />
    <Row label="Reçu depuis l'allumage" value={bytes(c.bytes_down)} />
    <Row label="Envoyé depuis l'allumage" value={bytes(c.bytes_up)} />
  {/snippet}
</Async>

<h2 class="group-title">Maison</h2>
<Row label="Appareils connectés" value={online ?? '…'} hint={hosts.data ? `${hosts.data.length} appareils connus` : undefined} onclick={() => app.go('devices')} />
<Row label="Wi-Fi" hint={wifi.data ? (wifi.data.enabled ? 'Allumé' : 'Éteint') : 'Chargement…'}>
  <Toggle label="Wi-Fi" checked={!!wifi.data?.enabled} disabled={!wifi.data} onchange={toggleWifi} />
</Row>
<Row
  label={app.boxName}
  value={hottest !== undefined ? `${hottest} °C` : '…'}
  hint={sys.data ? `Allumée depuis ${duration(sys.data.uptime_val)}, logiciel ${sys.data.firmware_version}` : 'Chargement…'}
  onclick={() => app.go('system')}
/>

<div class="actions">
  <Button variant="ghost" onclick={reboot}>Redémarrer la Freebox</Button>
</div>

<style>
  .hero {
    margin-bottom: 8px;
  }
  .figures {
    display: flex;
    align-items: flex-end;
    gap: clamp(24px, 6vw, 64px);
    flex-wrap: wrap;
  }
  .fig {
    display: grid;
  }
  .big {
    font-size: clamp(76px, 15vw, 132px);
    font-weight: 200;
    font-variation-settings: 'wdth' 62;
    line-height: 0.86;
    letter-spacing: -0.02em;
  }
  .mid {
    font-size: clamp(40px, 7vw, 60px);
    font-weight: 200;
    font-variation-settings: 'wdth' 62;
    line-height: 0.9;
    color: var(--t2);
  }
  .unit {
    margin-top: 10px;
    color: var(--t2);
    font-size: 14px;
  }
  .chart {
    height: clamp(150px, 26vw, 220px);
    margin: 28px calc(var(--gutter) * -1) 0;
  }
  @media (min-width: 860px) {
    .chart {
      margin: 32px 0 0;
    }
  }
  .legend {
    display: flex;
    gap: 18px;
    flex-wrap: wrap;
    font-size: 13px;
    color: var(--t2);
    padding-top: 12px;
    border-top: 1px solid var(--line);
  }
  .legend span {
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }
  .legend .faint {
    margin-left: auto;
  }
  .legend i {
    width: 16px;
    height: 0;
    border-top: 1.6px solid #fff;
  }
  .legend i.dash {
    border-top: 1.4px dashed #8c8c8c;
  }
  .actions {
    margin-top: 32px;
  }
</style>
