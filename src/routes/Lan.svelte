<script lang="ts">
  import { app, useResource, act } from '../lib/state.svelte';
  import { duration } from '../lib/format';
  import Async from '../lib/ui/Async.svelte';
  import Row from '../lib/ui/Row.svelte';
  import Toggle from '../lib/ui/Toggle.svelte';
  import Sheet from '../lib/ui/Sheet.svelte';
  import Field from '../lib/ui/Field.svelte';
  import Select from '../lib/ui/Select.svelte';
  import Button from '../lib/ui/Button.svelte';
  import { ask } from '../lib/ui/confirm.svelte';

  const lan = useResource<any>('lan/config/');
  const dhcp = useResource<any>('dhcp/config/');
  const statics = useResource<any[]>('dhcp/static_lease/');
  const dyn = useResource<any[]>('dhcp/dynamic_lease/', { poll: 30000 });

  let saving = $state(false);

  /* ---- Box ---- */
  let lanOpen = $state(false);
  let lf = $state({ name: '', ip: '', mode: 'router', name_dns: '', name_mdns: '', name_netbios: '' });
  function editLan() {
    const d = lan.data;
    lf = { name: d.name ?? '', ip: d.ip ?? '', mode: d.mode ?? 'router', name_dns: d.name_dns ?? '', name_mdns: d.name_mdns ?? '', name_netbios: d.name_netbios ?? '' };
    lanOpen = true;
  }
  async function saveLan() {
    const risky = lf.ip !== lan.data.ip || lf.mode !== lan.data.mode;
    if (risky) {
      const ok = await ask(
        'Changer le fonctionnement du réseau ?',
        lf.mode === 'bridge'
          ? 'En mode bridge, la box ne distribue plus d’adresses et Nox ne la retrouvera peut-être plus sur le réseau local.'
          : 'Changer l’adresse de la box coupe le réseau local un instant. Les appareils devront renouveler leur adresse.',
        'Appliquer',
      );
      if (!ok) return;
    }
    saving = true;
    await act({ busy: 'Enregistrement…', done: 'Réseau local mis à jour' }, () => app.fb.api('PUT', 'lan/config/', lf), ['lan/config']);
    saving = false;
    lanOpen = false;
  }

  /* ---- DHCP ---- */
  let dOpen = $state(false);
  let df = $state({ ip_range_start: '', ip_range_end: '', dns1: '', dns2: '', sticky_assign: true, always_broadcast: false });
  function editDhcp() {
    const d = dhcp.data;
    df = { ip_range_start: d.ip_range_start, ip_range_end: d.ip_range_end, dns1: d.dns?.[0] ?? '', dns2: d.dns?.[1] ?? '', sticky_assign: !!d.sticky_assign, always_broadcast: !!d.always_broadcast };
    dOpen = true;
  }
  async function saveDhcp() {
    saving = true;
    const dns = [df.dns1, df.dns2, '', '', ''];
    await act(
      { busy: 'Enregistrement…', done: 'DHCP mis à jour' },
      () => app.fb.api('PUT', 'dhcp/config/', { ip_range_start: df.ip_range_start, ip_range_end: df.ip_range_end, dns, sticky_assign: df.sticky_assign, always_broadcast: df.always_broadcast }),
      ['dhcp/'],
    );
    saving = false;
    dOpen = false;
  }
  async function toggleDhcp(v: boolean) {
    if (!v) {
      const ok = await ask('Couper le serveur DHCP ?', 'Les nouveaux appareils n’obtiendront plus d’adresse, sauf si un autre serveur DHCP tourne sur le réseau.', 'Couper le DHCP');
      if (!ok) return;
    }
    dhcp.patch((d) => ({ ...d, enabled: v }));
    await act({ busy: 'Enregistrement…', done: v ? 'DHCP activé' : 'DHCP coupé' }, () => app.fb.api('PUT', 'dhcp/config/', { enabled: v }), ['dhcp/config']);
  }

  /* ---- Baux statiques ---- */
  let sOpen = $state(false);
  let sCur = $state<any>(null);
  let sf = $state({ mac: '', ip: '', comment: '' });
  function editStatic(l: any | null) {
    sCur = l;
    sf = l ? { mac: l.mac, ip: l.ip, comment: l.comment ?? '' } : { mac: '', ip: '', comment: '' };
    sOpen = true;
  }
  async function saveStatic() {
    saving = true;
    await act(
      { busy: 'Enregistrement…', done: sCur ? 'Réservation modifiée' : 'Adresse réservée' },
      () => (sCur ? app.fb.api('PUT', `dhcp/static_lease/${encodeURIComponent(sCur.id)}`, { ip: sf.ip, comment: sf.comment }) : app.fb.api('POST', 'dhcp/static_lease/', sf)),
      ['dhcp/'],
    );
    saving = false;
    sOpen = false;
  }
  async function delStatic() {
    const ok = await ask('Supprimer cette réservation ?', `L’appareil pourra recevoir une autre adresse que ${sCur.ip}.`, 'Supprimer');
    if (!ok) return;
    const id = sCur.id;
    statics.patch((d) => d.filter((x) => x.id !== id));
    sOpen = false;
    await act({ busy: 'Suppression…', done: 'Réservation supprimée' }, () => app.fb.api('DELETE', `dhcp/static_lease/${encodeURIComponent(id)}`), ['dhcp/']);
  }
</script>

<h1 class="page-title">Réseau local</h1>
<p class="page-sub">Adresse de la box, distribution des adresses et réservations.</p>

<h2 class="group-title">Box</h2>
<Async r={lan} rows={3}>
  {#snippet children(l)}
    <Row label="Nom" value={l.name} onclick={editLan} />
    <Row label="Adresse de la box" value={l.ip} onclick={editLan} />
    <Row label="Mode" value={l.mode === 'bridge' ? 'Bridge' : 'Routeur'} onclick={editLan} />
  {/snippet}
</Async>

<h2 class="group-title">DHCP</h2>
<Async r={dhcp} rows={3}>
  {#snippet children(d)}
    <Row label="Serveur DHCP" hint={d.enabled ? 'Distribue les adresses aux appareils' : 'Coupé'}>
      <Toggle label="Serveur DHCP" checked={!!d.enabled} onchange={toggleDhcp} />
    </Row>
    <Row label="Plage d'adresses" value={`${d.ip_range_start} à ${d.ip_range_end}`} onclick={editDhcp} />
    <Row label="Serveurs DNS donnés aux appareils" value={(d.dns ?? []).filter(Boolean).join(', ') || 'La box'} onclick={editDhcp} />
  {/snippet}
</Async>

<h2 class="group-title">Adresses réservées</h2>
<Async r={statics} rows={2}>
  {#snippet children(list)}
    {#if !list.length}<p class="empty">Aucune réservation. Un appareil réservé garde toujours la même adresse.</p>{/if}
    {#each list as l (l.id)}
      <Row label={l.comment || l.hostname || l.mac} hint={l.mac} value={l.ip} onclick={() => editStatic(l)} />
    {/each}
  {/snippet}
</Async>
<div class="inline"><Button variant="ghost" small onclick={() => editStatic(null)}>Réserver une adresse</Button></div>

<h2 class="group-title">Baux en cours</h2>
<Async r={dyn} rows={3}>
  {#snippet children(list)}
    {#each list as l (l.mac)}
      <Row label={l.hostname || l.mac} hint={l.mac} value={l.is_static ? `${l.ip}, réservée` : `${l.ip}, ${duration(l.lease_remaining)}`} />
    {/each}
  {/snippet}
</Async>

<Sheet bind:open={lanOpen} title="Box">
  <Field label="Nom" bind:value={lf.name} />
  <Field label="Adresse de la box" bind:value={lf.ip} inputmode="decimal" mono />
  <Select
    label="Mode"
    bind:value={lf.mode}
    options={[
      { value: 'router', label: 'Routeur' },
      { value: 'bridge', label: 'Bridge (un autre routeur gère le réseau)' },
    ]}
  />
  <Field label="Nom DNS" bind:value={lf.name_dns} />
  <Field label="Nom mDNS" bind:value={lf.name_mdns} />
  <Field label="Nom NetBIOS" bind:value={lf.name_netbios} />
  {#snippet footer()}
    <Button variant="ghost" onclick={() => (lanOpen = false)}>Annuler</Button>
    <Button busy={saving} onclick={saveLan}>Enregistrer</Button>
  {/snippet}
</Sheet>

<Sheet bind:open={dOpen} title="DHCP">
  <Field label="Première adresse" bind:value={df.ip_range_start} inputmode="decimal" mono />
  <Field label="Dernière adresse" bind:value={df.ip_range_end} inputmode="decimal" mono />
  <Field label="DNS 1" bind:value={df.dns1} inputmode="decimal" mono hint="Vide pour utiliser la box. Mets l’IP de ton Pi-hole ici si tu en as un." />
  <Field label="DNS 2" bind:value={df.dns2} inputmode="decimal" mono />
  <Row label="Toujours redonner la même adresse"><Toggle label="Attribution persistante" checked={df.sticky_assign} onchange={(v) => (df.sticky_assign = v)} /></Row>
  <Row label="Réponses en broadcast" hint="Utile pour certains vieux appareils."><Toggle label="Broadcast" checked={df.always_broadcast} onchange={(v) => (df.always_broadcast = v)} /></Row>
  {#snippet footer()}
    <Button variant="ghost" onclick={() => (dOpen = false)}>Annuler</Button>
    <Button busy={saving} onclick={saveDhcp}>Enregistrer</Button>
  {/snippet}
</Sheet>

<Sheet bind:open={sOpen} title={sCur ? 'Réservation' : 'Réserver une adresse'}>
  {#if sCur}
    <Row label="Adresse MAC" value={sCur.mac} />
  {:else}
    <Field label="Adresse MAC" bind:value={sf.mac} placeholder="AA:BB:CC:DD:EE:FF" mono />
  {/if}
  <Field label="Adresse IP" bind:value={sf.ip} placeholder="192.168.1.10" inputmode="decimal" mono />
  <Field label="Commentaire" bind:value={sf.comment} />
  {#snippet footer()}
    {#if sCur}<Button variant="danger" onclick={delStatic}>Supprimer</Button>{/if}
    <Button variant="ghost" onclick={() => (sOpen = false)}>Annuler</Button>
    <Button busy={saving} disabled={!sf.ip || (!sCur && !sf.mac)} onclick={saveStatic}>Enregistrer</Button>
  {/snippet}
</Sheet>

<style>
  .inline {
    padding-top: 16px;
  }
  .empty {
    color: var(--t2);
    margin: 10px 0;
  }
</style>
