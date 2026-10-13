<script lang="ts">
  import { app, useResource, act } from '../lib/state.svelte';
  import Async from '../lib/ui/Async.svelte';
  import Row from '../lib/ui/Row.svelte';
  import Toggle from '../lib/ui/Toggle.svelte';
  import Sheet from '../lib/ui/Sheet.svelte';
  import Field from '../lib/ui/Field.svelte';
  import Select from '../lib/ui/Select.svelte';
  import Button from '../lib/ui/Button.svelte';
  import { ask } from '../lib/ui/confirm.svelte';

  const redirs = useResource<any[]>('fw/redir/');
  const dmz = useResource<any>('fw/dmz/');
  const upnp = useResource<any>('upnpigd/config/');
  const upnpList = useResource<any[]>('upnpigd/redir/', { poll: 30000 });
  const hosts = useResource<any[]>('lan/browser/pub/');

  const devices = $derived(
    (hosts.data ?? [])
      .map((h) => ({ name: h.primary_name, ip: h.l3connectivities?.find((c: any) => c.af === 'ipv4')?.addr }))
      .filter((d) => d.ip)
      .sort((a, b) => a.name.localeCompare(b.name)),
  );

  const ports = (r: any) => (r.wan_port_start === r.wan_port_end ? `${r.wan_port_start}` : `${r.wan_port_start}–${r.wan_port_end}`);
  const proto = (p: string) => (p === 'tcp' ? 'TCP' : p === 'udp' ? 'UDP' : p?.toUpperCase());

  let saving = $state(false);

  /* ---- Redirection ---- */
  let open = $state(false);
  let cur = $state<any>(null);
  let f = $state({ comment: '', ip_proto: 'tcp', wan_port_start: '', wan_port_end: '', lan_port: '', lan_ip: '', src_ip: '0.0.0.0', enabled: true });

  function edit(r: any | null) {
    cur = r;
    f = r
      ? { comment: r.comment ?? '', ip_proto: r.ip_proto, wan_port_start: String(r.wan_port_start), wan_port_end: String(r.wan_port_end), lan_port: String(r.lan_port), lan_ip: r.lan_ip, src_ip: r.src_ip || '0.0.0.0', enabled: !!r.enabled }
      : { comment: '', ip_proto: 'tcp', wan_port_start: '', wan_port_end: '', lan_port: '', lan_ip: devices[0]?.ip ?? '', src_ip: '0.0.0.0', enabled: true };
    open = true;
  }

  const valid = $derived(+f.wan_port_start > 0 && +f.wan_port_start < 65536 && !!f.lan_ip && (+f.lan_port || +f.wan_port_start) > 0);

  async function save() {
    saving = true;
    const body = {
      comment: f.comment,
      ip_proto: f.ip_proto,
      wan_port_start: +f.wan_port_start,
      wan_port_end: +(f.wan_port_end || f.wan_port_start),
      lan_port: +(f.lan_port || f.wan_port_start),
      lan_ip: f.lan_ip,
      src_ip: f.src_ip || '0.0.0.0',
      enabled: f.enabled,
    };
    await act(
      { busy: 'Enregistrement…', done: cur ? 'Redirection modifiée' : 'Redirection ajoutée' },
      () => (cur ? app.fb.api('PUT', `fw/redir/${cur.id}`, body) : app.fb.api('POST', 'fw/redir/', body)),
      ['fw/redir'],
    );
    saving = false;
    open = false;
  }

  async function del() {
    const ok = await ask('Supprimer cette redirection ?', `Le port ${ports(cur)} ne sera plus ouvert vers ${cur.lan_ip}.`, 'Supprimer');
    if (!ok) return;
    const id = cur.id;
    redirs.patch((d) => d.filter((x) => x.id !== id));
    open = false;
    await act({ busy: 'Suppression…', done: 'Redirection supprimée' }, () => app.fb.api('DELETE', `fw/redir/${id}`), ['fw/redir']);
  }

  async function toggle(r: any, v: boolean) {
    redirs.patch((d) => d.map((x) => (x.id === r.id ? { ...x, enabled: v } : x)));
    await act({ busy: 'Enregistrement…', done: v ? 'Redirection activée' : 'Redirection désactivée' }, () => app.fb.api('PUT', `fw/redir/${r.id}`, { enabled: v }), ['fw/redir']);
  }

  /* ---- DMZ ---- */
  let dmzOpen = $state(false);
  let dmzIp = $state('');
  async function toggleDmz(v: boolean) {
    if (v) {
      dmzIp = dmz.data?.ip || devices[0]?.ip || '';
      dmzOpen = true;
      return;
    }
    dmz.patch((d) => ({ ...d, enabled: false }));
    await act({ busy: 'Enregistrement…', done: 'DMZ désactivée' }, () => app.fb.api('PUT', 'fw/dmz/', { enabled: false }), ['fw/dmz']);
  }
  async function saveDmz() {
    const ok = await ask('Activer la DMZ ?', `Tout ce qui arrive d'internet sans redirection précise sera envoyé à ${dmzIp}. Cet appareil sera directement exposé.`, 'Activer la DMZ');
    if (!ok) return;
    saving = true;
    await act({ busy: 'Enregistrement…', done: 'DMZ activée' }, () => app.fb.api('PUT', 'fw/dmz/', { enabled: true, ip: dmzIp }), ['fw/dmz']);
    saving = false;
    dmzOpen = false;
  }

  async function toggleUpnp(v: boolean) {
    upnp.patch((d) => ({ ...d, enabled: v }));
    await act({ busy: 'Enregistrement…', done: v ? 'UPnP activé' : 'UPnP coupé' }, () => app.fb.api('PUT', 'upnpigd/config/', { enabled: v }), ['upnpigd/']);
  }
</script>

<h1 class="page-title">Ports</h1>
<p class="page-sub">Ce qui peut entrer depuis internet, et vers quel appareil.</p>

<h2 class="group-title">Redirections</h2>
<Async r={redirs} rows={2}>
  {#snippet children(list)}
    {#if !list.length}<p class="empty">Aucun port ouvert. Ajoute une redirection pour joindre un appareil de chez toi depuis internet.</p>{/if}
    {#each list as r (r.id)}
      <Row label={r.comment || `Port ${ports(r)}`} hint={`${proto(r.ip_proto)} ${ports(r)} vers ${r.hostname || r.lan_ip}:${r.lan_port}`} onclick={() => edit(r)}>
        <span role="presentation" onclick={(e) => e.stopPropagation()}>
          <Toggle label="Activer" checked={!!r.enabled} onchange={(v) => toggle(r, v)} />
        </span>
      </Row>
    {/each}
  {/snippet}
</Async>
<div class="inline"><Button variant="ghost" small onclick={() => edit(null)}>Ajouter une redirection</Button></div>

<h2 class="group-title">DMZ</h2>
<Async r={dmz} rows={1}>
  {#snippet children(d)}
    <Row label="DMZ" hint={d.enabled ? `Tout est envoyé vers ${d.ip}` : 'Désactivée'}>
      <Toggle label="DMZ" checked={!!d.enabled} onchange={toggleDmz} />
    </Row>
  {/snippet}
</Async>

<h2 class="group-title">UPnP</h2>
<Async r={upnp} rows={1}>
  {#snippet children(u)}
    <Row label="Ouverture automatique (UPnP)" hint="Les consoles et certains logiciels ouvrent eux-mêmes leurs ports.">
      <Toggle label="UPnP" checked={!!u.enabled} onchange={toggleUpnp} />
    </Row>
  {/snippet}
</Async>
{#if upnp.data?.enabled}
  <Async r={upnpList} rows={1}>
    {#snippet children(list)}
      {#each list as u (u.id ?? `${u.int_ip}:${u.ext_port}:${u.proto}`)}
        <Row label={u.desc || 'Sans nom'} hint={`${proto(u.proto)} ${u.ext_port} vers ${u.int_ip}:${u.int_port}`} />
      {/each}
      {#if !list.length}<p class="empty">Aucun port ouvert par UPnP en ce moment.</p>{/if}
    {/snippet}
  </Async>
{/if}

<Sheet bind:open title={cur ? 'Redirection' : 'Nouvelle redirection'}>
  <Field label="Nom" bind:value={f.comment} placeholder="Serveur Minecraft" />
  <Select
    label="Protocole"
    bind:value={f.ip_proto}
    options={[
      { value: 'tcp', label: 'TCP' },
      { value: 'udp', label: 'UDP' },
    ]}
  />
  <div class="two">
    <Field label="Port externe" bind:value={f.wan_port_start} inputmode="numeric" mono />
    <Field label="Jusqu'au port (plage)" bind:value={f.wan_port_end} inputmode="numeric" mono placeholder="facultatif" />
  </div>
  <Select label="Appareil" bind:value={f.lan_ip} options={[...devices.map((d) => ({ value: d.ip, label: `${d.name} (${d.ip})` })), ...(f.lan_ip && !devices.some((d) => d.ip === f.lan_ip) ? [{ value: f.lan_ip, label: f.lan_ip }] : [])]} />
  <Field label="Ou adresse IP" bind:value={f.lan_ip} inputmode="decimal" mono />
  <Field label="Port de l'appareil" bind:value={f.lan_port} inputmode="numeric" mono placeholder="identique au port externe" />
  <Field label="Limiter à l'IP source" bind:value={f.src_ip} inputmode="decimal" mono hint="0.0.0.0 pour tout internet." />
  {#snippet footer()}
    {#if cur}<Button variant="danger" onclick={del}>Supprimer</Button>{/if}
    <Button variant="ghost" onclick={() => (open = false)}>Annuler</Button>
    <Button busy={saving} disabled={!valid} onclick={save}>Enregistrer</Button>
  {/snippet}
</Sheet>

<Sheet bind:open={dmzOpen} title="DMZ">
  <Select label="Appareil exposé" bind:value={dmzIp} options={devices.map((d) => ({ value: d.ip, label: `${d.name} (${d.ip})` }))} />
  <Field label="Ou adresse IP" bind:value={dmzIp} inputmode="decimal" mono />
  {#snippet footer()}
    <Button variant="ghost" onclick={() => (dmzOpen = false)}>Annuler</Button>
    <Button busy={saving} disabled={!dmzIp} onclick={saveDmz}>Activer</Button>
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
  .two {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }
</style>
