<script lang="ts">
  import { app, useResource, act } from '../lib/state.svelte';
  import { band, duration } from '../lib/format';
  import Async from '../lib/ui/Async.svelte';
  import Row from '../lib/ui/Row.svelte';
  import Toggle from '../lib/ui/Toggle.svelte';
  import Sheet from '../lib/ui/Sheet.svelte';
  import Field from '../lib/ui/Field.svelte';
  import Select from '../lib/ui/Select.svelte';
  import Button from '../lib/ui/Button.svelte';
  import Qr from '../lib/ui/Qr.svelte';
  import { ask } from '../lib/ui/confirm.svelte';

  const cfg = useResource<any>('wifi/config/');
  const aps = useResource<any[]>('wifi/ap/');
  const bss = useResource<any[]>('wifi/bss/', { poll: 15000 });
  const guests = useResource<any[]>('wifi/custom_key/');

  const encOptions = [
    { value: 'wpa23_psk_ccmp', label: 'WPA2 + WPA3 (recommandé)' },
    { value: 'wpa3_psk_ccmp', label: 'WPA3 seulement' },
    { value: 'wpa2_psk_ccmp', label: 'WPA2 seulement' },
    { value: 'wpa12_psk_auto', label: 'WPA + WPA2 (anciens appareils)' },
  ];
  const qrEnc = (e: string) => (e?.startsWith('wpa3') ? 'SAE' : 'WPA');

  const apOf = (b: any) => aps.data?.find((a) => a.id === b.phy_id);
  const bandOf = (b: any) => band(apOf(b)?.config?.band) || `Radio ${b.phy_id}`;

  /* ---- Réseau (BSS) ---- */
  let netOpen = $state(false);
  let cur = $state<any>(null);
  let form = $state({ ssid: '', key: '', encryption: 'wpa23_psk_ccmp', hide_ssid: false, enabled: true, both: true });
  let saving = $state(false);

  function editNet(b: any) {
    cur = b;
    const c = b.config ?? {};
    form = { ssid: c.ssid ?? '', key: c.key ?? '', encryption: c.encryption ?? 'wpa23_psk_ccmp', hide_ssid: !!c.hide_ssid, enabled: c.enabled !== false, both: (bss.data?.length ?? 0) > 1 };
    if (!encOptions.some((o) => o.value === form.encryption)) encOptions.push({ value: form.encryption, label: form.encryption });
    netOpen = true;
  }

  async function saveNet() {
    if (form.key.length < 8) return;
    if (app.where === 'local') {
      const ok = await ask('Appliquer les changements ?', 'Les appareils en Wi-Fi vont se déconnecter quelques secondes, puis devront utiliser le nouveau nom ou mot de passe.', 'Appliquer');
      if (!ok) return;
    }
    saving = true;
    const config = { ssid: form.ssid, key: form.key, encryption: form.encryption, hide_ssid: form.hide_ssid, enabled: form.enabled };
    const targets = form.both ? bss.data ?? [] : [cur];
    await act(
      { busy: 'Application des réglages Wi-Fi…', done: 'Wi-Fi mis à jour' },
      async () => {
        for (const t of targets) await app.fb.api('PUT', `wifi/bss/${encodeURIComponent(t.id)}`, { config });
      },
      ['wifi/'],
    );
    saving = false;
    netOpen = false;
  }

  /* ---- Partage QR ---- */
  let shareOpen = $state(false);
  let share = $state({ ssid: '', key: '', enc: 'WPA', hidden: false });
  const esc = (s: string) => s.replace(/([\\;,:"])/g, '\\$1');
  const qrText = $derived(`WIFI:T:${share.enc};S:${esc(share.ssid)};P:${esc(share.key)};${share.hidden ? 'H:true;' : ''};`);

  function shareNet(c: any) {
    share = { ssid: c.ssid, key: c.key, enc: qrEnc(c.encryption), hidden: !!c.hide_ssid };
    shareOpen = true;
  }

  /* ---- Radios ---- */
  let apOpen = $state(false);
  let apCur = $state<any>(null);
  let apForm = $state({ primary_channel: 0, channel_width: '20' });

  const channels = (b: string) =>
    b?.startsWith('2') ? [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13] : [36, 40, 44, 48, 52, 56, 60, 64, 100, 104, 108, 112, 116, 120, 124, 128, 132, 136, 140];
  const widths = (b: string) => (b?.startsWith('2') ? ['20', '40'] : ['20', '40', '80', '160']);

  function editAp(a: any) {
    apCur = a;
    apForm = { primary_channel: a.config?.primary_channel ?? 0, channel_width: String(a.config?.channel_width ?? '20') };
    apOpen = true;
  }

  async function saveAp() {
    saving = true;
    await act(
      { busy: 'Réglage de la radio…', done: 'Radio mise à jour' },
      () => app.fb.api('PUT', `wifi/ap/${apCur.id}`, { config: { primary_channel: Number(apForm.primary_channel), channel_width: apForm.channel_width } }),
      ['wifi/ap'],
    );
    saving = false;
    apOpen = false;
  }

  /* ---- Accès invités ---- */
  let gOpen = $state(false);
  let gForm = $state({ description: '', key: '', duration: '86400', access_type: 'net_only' });

  function randomKey() {
    const words = 'phare,granit,goemon,maree,lande,embrun,menhir,crepe,brume,sable,aber,kouign'.split(',');
    const pick = () => words[crypto.getRandomValues(new Uint32Array(1))[0] % words.length];
    return `${pick()}-${pick()}-${(crypto.getRandomValues(new Uint32Array(1))[0] % 90) + 10}`;
  }

  function newGuest() {
    gForm = { description: 'Invités', key: randomKey(), duration: '86400', access_type: 'net_only' };
    gOpen = true;
  }

  async function saveGuest() {
    if (gForm.key.length < 8) return;
    saving = true;
    await act(
      { busy: 'Création de l’accès invité…', done: 'Accès invité créé' },
      () => app.fb.api('POST', 'wifi/custom_key/', { params: { description: gForm.description, key: gForm.key, max_use_count: 0, duration: Number(gForm.duration), access_type: gForm.access_type } }),
      ['wifi/custom_key'],
    );
    saving = false;
    gOpen = false;
  }

  async function delGuest(g: any) {
    const ok = await ask('Supprimer cet accès invité ?', 'Les appareils qui l’utilisent perdront la connexion.', 'Supprimer');
    if (!ok) return;
    guests.patch((d) => d.filter((x) => x.id !== g.id));
    await act({ busy: 'Suppression…', done: 'Accès invité supprimé' }, () => app.fb.api('DELETE', `wifi/custom_key/${g.id}`), ['wifi/custom_key']);
  }

  function shareGuest(g: any) {
    const main = bss.data?.[0]?.config;
    share = { ssid: main?.ssid ?? '', key: g.params.key, enc: 'WPA', hidden: false };
    shareOpen = true;
  }

  async function toggleWifi(v: boolean) {
    if (!v && app.where === 'local') {
      const ok = await ask('Couper le Wi-Fi ?', "Tous les appareils en Wi-Fi seront déconnectés, y compris celui-ci s'il n'est pas en câble.", 'Couper le Wi-Fi');
      if (!ok) return;
    }
    cfg.patch((d) => ({ ...d, enabled: v }));
    await act({ busy: v ? 'Activation du Wi-Fi…' : 'Arrêt du Wi-Fi…', done: v ? 'Wi-Fi activé' : 'Wi-Fi coupé' }, () => app.fb.api('PUT', 'wifi/config/', { enabled: v }), ['wifi/config']);
  }
</script>

<h1 class="page-title">Wi-Fi</h1>
<p class="page-sub">Nom, mot de passe, radios et accès pour tes invités.</p>

<Row label="Wi-Fi" hint={cfg.data ? (cfg.data.enabled ? 'Les deux bandes émettent' : 'Aucune bande n’émet') : 'Chargement…'}>
  <Toggle label="Wi-Fi" checked={!!cfg.data?.enabled} disabled={!cfg.data} onchange={toggleWifi} />
</Row>

<h2 class="group-title">Réseaux</h2>
<Async r={bss} rows={2}>
  {#snippet children(list)}
    {#each list as b (b.id)}
      <Row
        label={b.config?.ssid ?? '—'}
        hint={`${bandOf(b)}, ${b.status?.sta_count ?? 0} appareil${(b.status?.sta_count ?? 0) > 1 ? 's' : ''}${b.config?.enabled === false ? ', désactivé' : ''}`}
        onclick={() => editNet(b)}
      />
    {/each}
    {#if list[0]}
      <div class="inline">
        <Button variant="ghost" small onclick={() => shareNet(list[0].config)}>Partager par QR code</Button>
      </div>
    {/if}
  {/snippet}
</Async>

<h2 class="group-title">Radios</h2>
<Async r={aps} rows={2}>
  {#snippet children(list)}
    {#each list as a (a.id)}
      <Row
        label={band(a.config?.band) || a.name}
        hint={a.config?.primary_channel ? `Canal ${a.config.primary_channel} fixé` : 'Canal automatique'}
        value={a.status?.primary_channel ? `Canal ${a.status.primary_channel}, ${a.status.channel_width} MHz` : a.status?.state}
        onclick={() => editAp(a)}
      />
    {/each}
  {/snippet}
</Async>

<h2 class="group-title">Accès invités</h2>
<Async r={guests} rows={1}>
  {#snippet children(list)}
    {#if list.length === 0}
      <p class="empty">Aucun accès invité. Crée un mot de passe temporaire à donner à tes visiteurs.</p>
    {/if}
    {#each list as g (g.id)}
      <Row label={g.params?.description || 'Invités'} hint={`${g.params?.access_type === 'full' ? 'Accès complet' : 'Internet seulement'}, ${g.remaining ? `encore ${duration(g.remaining)}` : 'sans limite'}`}>
        <Button variant="quiet" small onclick={() => shareGuest(g)}>QR code</Button>
        <Button variant="quiet" small onclick={() => delGuest(g)}>Supprimer</Button>
      </Row>
    {/each}
  {/snippet}
</Async>
<div class="inline">
  <Button variant="ghost" small onclick={newGuest}>Créer un accès invité</Button>
</div>

<Sheet bind:open={netOpen} title={cur ? `Réseau ${bandOf(cur)}` : 'Réseau'}>
  <Field label="Nom du réseau" bind:value={form.ssid} />
  <Field label="Mot de passe" bind:value={form.key} secret hint={form.key.length < 8 ? '8 caractères minimum.' : `${form.key.length} caractères.`} />
  <Select label="Sécurité" bind:value={form.encryption} options={encOptions} />
  <Row label="Réseau activé"><Toggle label="Réseau activé" checked={form.enabled} onchange={(v) => (form.enabled = v)} /></Row>
  <Row label="Masquer le nom" hint="Il faudra le taper à la main sur chaque appareil."><Toggle label="Masquer le nom" checked={form.hide_ssid} onchange={(v) => (form.hide_ssid = v)} /></Row>
  {#if (bss.data?.length ?? 0) > 1}
    <Row label="Appliquer aux deux bandes" hint="Même nom et mot de passe en 2,4 et 5 GHz."><Toggle label="Appliquer aux deux bandes" checked={form.both} onchange={(v) => (form.both = v)} /></Row>
  {/if}
  {#snippet footer()}
    <Button variant="ghost" onclick={() => (netOpen = false)}>Annuler</Button>
    <Button busy={saving} disabled={form.key.length < 8 || !form.ssid} onclick={saveNet}>Appliquer</Button>
  {/snippet}
</Sheet>

<Sheet bind:open={apOpen} title={apCur ? `Radio ${band(apCur.config?.band)}` : 'Radio'}>
  <Select
    label="Canal"
    bind:value={apForm.primary_channel}
    options={[{ value: 0, label: 'Automatique' }, ...channels(apCur?.config?.band).map((c) => ({ value: c, label: `Canal ${c}` }))]}
  />
  <Select label="Largeur de canal" bind:value={apForm.channel_width} options={widths(apCur?.config?.band).map((w) => ({ value: w, label: `${w} MHz` }))} />
  <p class="note">Une largeur plus grande donne plus de débit près de la box, une plus petite tient mieux à travers les murs.</p>
  {#snippet footer()}
    <Button variant="ghost" onclick={() => (apOpen = false)}>Annuler</Button>
    <Button busy={saving} onclick={saveAp}>Appliquer</Button>
  {/snippet}
</Sheet>

<Sheet bind:open={gOpen} title="Nouvel accès invité">
  <Field label="Description" bind:value={gForm.description} />
  <div class="keyrow">
    <Field label="Mot de passe" bind:value={gForm.key} hint="8 caractères minimum." />
    <Button variant="quiet" small onclick={() => (gForm.key = randomKey())}>Générer</Button>
  </div>
  <Select
    label="Durée"
    bind:value={gForm.duration}
    options={[
      { value: '3600', label: '1 heure' },
      { value: '86400', label: '1 jour' },
      { value: '259200', label: '3 jours' },
      { value: '604800', label: '1 semaine' },
      { value: '0', label: 'Sans limite' },
    ]}
  />
  <Select
    label="Accès"
    bind:value={gForm.access_type}
    options={[
      { value: 'net_only', label: 'Internet seulement' },
      { value: 'full', label: 'Internet et réseau local' },
    ]}
  />
  {#snippet footer()}
    <Button variant="ghost" onclick={() => (gOpen = false)}>Annuler</Button>
    <Button busy={saving} disabled={gForm.key.length < 8} onclick={saveGuest}>Créer l'accès</Button>
  {/snippet}
</Sheet>

<Sheet bind:open={shareOpen} title={share.ssid}>
  <p class="note">Vise ce code avec l'appareil photo du téléphone pour rejoindre le réseau.</p>
  <Qr text={qrText} label="QR code du réseau {share.ssid}" />
  <Field label="Mot de passe" value={share.key} secret />
</Sheet>

<style>
  .inline {
    padding-top: 16px;
  }
  .empty {
    color: var(--t2);
    margin: 10px 0;
  }
  .note {
    margin: 0;
    color: var(--t2);
    font-size: 14px;
  }
  .keyrow {
    display: grid;
    grid-template-columns: 1fr auto;
    align-items: start;
    gap: 6px;
  }
  .keyrow :global(.btn) {
    margin-top: 30px;
  }
</style>
