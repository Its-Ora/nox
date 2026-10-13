<script lang="ts">
  import { app, useResource, act } from '../lib/state.svelte';
  import { ago, band, hostTypes, signalBars, dateTime } from '../lib/format';
  import Async from '../lib/ui/Async.svelte';
  import Row from '../lib/ui/Row.svelte';
  import Sheet from '../lib/ui/Sheet.svelte';
  import Field from '../lib/ui/Field.svelte';
  import Select from '../lib/ui/Select.svelte';
  import Button from '../lib/ui/Button.svelte';
  import Segmented from '../lib/ui/Segmented.svelte';
  import Icon from '../lib/ui/Icon.svelte';

  const hosts = useResource<any[]>('lan/browser/pub/', { poll: 10000 });
  const leases = useResource<any[]>('dhcp/static_lease/');

  let filter = $state('online');
  let q = $state('');
  let open = $state(false);
  let sel = $state<any>(null);
  let name = $state('');
  let type = $state('other');
  let saving = $state(false);

  const ip = (h: any) => h.l3connectivities?.find((c: any) => c.af === 'ipv4' && c.active)?.addr ?? h.l3connectivities?.find((c: any) => c.af === 'ipv4')?.addr;
  const mac = (h: any) => h.l2ident?.id ?? '';
  const wifiInfo = (h: any) => h.access_point?.wifi_information;

  const list = $derived.by(() => {
    const all = hosts.data ?? [];
    const s = q.trim().toLowerCase();
    return all
      .filter((h) => (filter === 'online' ? h.active : filter === 'offline' ? !h.active : true))
      .filter((h) => !s || [h.primary_name, ip(h), mac(h), h.vendor_name].some((x) => x?.toLowerCase().includes(s)))
      .sort((a, b) => Number(b.active) - Number(a.active) || (a.primary_name ?? '').localeCompare(b.primary_name ?? ''));
  });

  const counts = $derived({
    on: hosts.data?.filter((h) => h.active).length ?? 0,
    all: hosts.data?.length ?? 0,
  });

  const typeOptions = Object.entries(hostTypes).map(([value, label]) => ({ value, label }));
  const reserved = $derived(sel ? leases.data?.find((l) => l.mac?.toLowerCase() === mac(sel).toLowerCase()) : null);

  function openHost(h: any) {
    sel = h;
    name = h.primary_name ?? '';
    type = h.host_type ?? 'other';
    open = true;
  }

  function hint(h: any) {
    const parts = [ip(h)];
    const w = wifiInfo(h);
    if (h.access_point?.connectivity_type === 'ethernet') parts.push('Câble');
    else if (w) parts.push(`Wi-Fi ${band(w.band)}`);
    return parts.filter(Boolean).join(', ');
  }

  async function save() {
    saving = true;
    const id = sel.id;
    hosts.patch((d) => d.map((h) => (h.id === id ? { ...h, primary_name: name, host_type: type } : h)));
    await act({ busy: 'Enregistrement…', done: 'Appareil enregistré' }, () => app.fb.api('PUT', `lan/browser/pub/${encodeURIComponent(id)}`, { primary_name: name, host_type: type }), ['lan/browser']);
    saving = false;
    open = false;
  }

  async function wake() {
    await act({ busy: 'Envoi du signal de réveil…', done: 'Signal de réveil envoyé' }, () => app.fb.api('POST', 'lan/wol/pub/', { mac: mac(sel), password: '' }));
  }

  async function reserve() {
    const addr = ip(sel);
    if (!addr) return;
    await act(
      { busy: 'Réservation de l’adresse…', done: `${addr} réservée pour cet appareil` },
      () => app.fb.api('POST', 'dhcp/static_lease/', { mac: mac(sel), ip: addr, comment: sel.primary_name ?? '' }),
      ['dhcp/static_lease'],
    );
  }
</script>

<h1 class="page-title">Appareils</h1>
<p class="page-sub">
  {#if hosts.data}{counts.on} en ligne sur {counts.all} connus.{:else}Ceux qui sont passés par ta box.{/if}
</p>

<div class="tools">
  <Segmented
    label="Filtre"
    bind:value={filter}
    options={[
      { value: 'online', label: 'En ligne' },
      { value: 'all', label: 'Tous' },
      { value: 'offline', label: 'Hors ligne' },
    ]}
  />
  <label class="search">
    <Icon name="search" size={18} />
    <input bind:value={q} placeholder="Nom, IP, MAC, fabricant" aria-label="Rechercher un appareil" spellcheck="false" />
  </label>
</div>

<Async r={hosts} rows={6}>
  {#snippet children()}
    {#if list.length === 0}
      <p class="empty">{q ? 'Aucun appareil ne correspond à cette recherche.' : filter === 'offline' ? 'Tout le monde est en ligne.' : 'Aucun appareil en ligne pour le moment.'}</p>
    {/if}
    {#each list as h (h.id)}
      <Row label={h.primary_name || mac(h)} hint={hint(h)} value={h.active ? null : ago(h.last_activity)} onclick={() => openHost(h)}>
        {#snippet lead()}
          <span class="state" class:on={h.active} title={h.active ? 'En ligne' : 'Hors ligne'}></span>
        {/snippet}
        {#if h.active && wifiInfo(h)}
          <span class="bars" aria-label="Signal {signalBars(wifiInfo(h).signal)} sur 4">
            {#each [1, 2, 3, 4] as b}<i class:lit={b <= signalBars(wifiInfo(h).signal)} style="height:{b * 3 + 2}px"></i>{/each}
          </span>
        {/if}
      </Row>
    {/each}
  {/snippet}
</Async>

<Sheet bind:open title={sel?.primary_name || 'Appareil'}>
  {#if sel}
    <Field label="Nom" bind:value={name} />
    <Select label="Type" bind:value={type} options={typeOptions} />
    <div class="facts">
      <Row label="État" value={sel.active ? 'En ligne' : `Vu ${ago(sel.last_activity)}`} />
      <Row label="Adresse IP" value={ip(sel) ?? '—'} />
      <Row label="Adresse MAC" value={mac(sel)} />
      {#if sel.vendor_name}<Row label="Fabricant" value={sel.vendor_name} />{/if}
      <Row label="Liaison" value={sel.access_point?.connectivity_type === 'ethernet' ? 'Câble' : wifiInfo(sel) ? `Wi-Fi ${band(wifiInfo(sel).band)}` : '—'} />
      {#if wifiInfo(sel)?.signal}<Row label="Signal" value={`${wifiInfo(sel).signal} dBm`} />{/if}
      {#if sel.first_activity}<Row label="Première connexion" value={dateTime(sel.first_activity)} />{/if}
      <Row label="Adresse réservée" value={reserved ? reserved.ip : 'Non'} />
    </div>
    <div class="more">
      <Button variant="ghost" small onclick={wake}>Réveiller (Wake-on-LAN)</Button>
      {#if !reserved && ip(sel)}<Button variant="ghost" small onclick={reserve}>Réserver son IP</Button>{/if}
    </div>
  {/if}
  {#snippet footer()}
    <Button variant="ghost" onclick={() => (open = false)}>Fermer</Button>
    <Button busy={saving} onclick={save}>Enregistrer</Button>
  {/snippet}
</Sheet>

<style>
  .tools {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    align-items: center;
    margin-bottom: 18px;
  }
  .search {
    flex: 1;
    min-width: 200px;
    display: flex;
    align-items: center;
    gap: 10px;
    height: 40px;
    padding: 0 14px;
    border-radius: 99px;
    box-shadow: inset 0 0 0 1px var(--line-2);
    color: var(--t3);
  }
  .search:focus-within {
    box-shadow: inset 0 0 0 1.5px var(--fg);
  }
  .search input {
    flex: 1;
    min-width: 0;
    background: none;
    border: 0;
    outline: none;
    color: var(--fg);
  }
  .search input::placeholder {
    color: var(--t3);
  }
  .state {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    box-shadow: inset 0 0 0 1.5px var(--t3);
  }
  .state.on {
    background: var(--fg);
    box-shadow: none;
  }
  .bars {
    display: flex;
    align-items: flex-end;
    gap: 2px;
  }
  .bars i {
    width: 3px;
    border-radius: 1px;
    background: var(--line-2);
  }
  .bars i.lit {
    background: var(--fg);
  }
  .empty {
    color: var(--t2);
    padding: 24px 0;
  }
  .facts {
    margin-top: 6px;
  }
  .more {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }
</style>
