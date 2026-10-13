<script lang="ts">
  import { app, useResource, act, notify } from '../lib/state.svelte';
  import Async from '../lib/ui/Async.svelte';
  import Row from '../lib/ui/Row.svelte';
  import Toggle from '../lib/ui/Toggle.svelte';
  import Sheet from '../lib/ui/Sheet.svelte';
  import Field from '../lib/ui/Field.svelte';
  import Select from '../lib/ui/Select.svelte';
  import Button from '../lib/ui/Button.svelte';
  import Qr from '../lib/ui/Qr.svelte';
  import { ask } from '../lib/ui/confirm.svelte';

  const servers = useResource<any[]>('vpn/');
  const users = useResource<any[]>('vpn/user/');

  const nice = (n: string) =>
    ({ wireguard: 'WireGuard', openvpn_routed: 'OpenVPN routé', openvpn_bridge: 'OpenVPN bridge', pptp: 'PPTP', ipsec: 'IPsec' })[n] ?? n;
  const running = (s: any) => s.state === 'started' || s.state === 'running';

  async function toggle(s: any, v: boolean) {
    servers.patch((d) => d.map((x) => (x.name === s.name ? { ...x, state: v ? 'started' : 'stopped' } : x)));
    await act({ busy: v ? 'Démarrage du serveur…' : 'Arrêt du serveur…', done: v ? `${nice(s.name)} démarré` : `${nice(s.name)} arrêté` }, () => app.fb.api('PUT', `vpn/${s.name}/config/`, { enabled: v }), ['vpn/']);
  }

  let uOpen = $state(false);
  let uf = $state({ login: '', password: '' });
  let saving = $state(false);
  async function addUser() {
    saving = true;
    await act({ busy: 'Création du compte…', done: 'Compte VPN créé' }, () => app.fb.api('POST', 'vpn/user/', { login: uf.login, password: uf.password }), ['vpn/user']);
    saving = false;
    uOpen = false;
  }
  async function delUser(u: any) {
    const ok = await ask('Supprimer ce compte VPN ?', `${u.login} ne pourra plus se connecter.`, 'Supprimer');
    if (!ok) return;
    users.patch((d) => d.filter((x) => x.login !== u.login));
    await act({ busy: 'Suppression…', done: 'Compte supprimé' }, () => app.fb.api('DELETE', `vpn/user/${encodeURIComponent(u.login)}`), ['vpn/user']);
  }

  let cOpen = $state(false);
  let conf = $state('');
  let confFor = $state({ server: 'wireguard', login: '' });
  let loadingConf = $state(false);
  async function showConfig(u: any) {
    confFor = { server: servers.data?.find((s) => s.name === 'wireguard') ? 'wireguard' : servers.data?.[0]?.name ?? 'wireguard', login: u.login };
    conf = '';
    cOpen = true;
    await loadConf();
  }
  async function loadConf() {
    loadingConf = true;
    try {
      conf = await app.fb.api<string>('GET', `vpn/download_config/${confFor.server}/${encodeURIComponent(confFor.login)}`);
    } catch (e: any) {
      conf = '';
      notify(e?.message ?? String(e), 'err');
    }
    loadingConf = false;
  }
</script>

<h1 class="page-title">VPN</h1>
<p class="page-sub">Revenir sur ton réseau de chez toi, depuis n'importe où.</p>

<h2 class="group-title">Serveurs</h2>
<Async r={servers} rows={2}>
  {#snippet children(list)}
    {#each list as s (s.name)}
      <Row label={nice(s.name)} hint={running(s) ? `En marche, ${s.connection_count ?? 0} connexion${(s.connection_count ?? 0) > 1 ? 's' : ''}` : 'Arrêté'}>
        <Toggle label={nice(s.name)} checked={running(s)} onchange={(v) => toggle(s, v)} />
      </Row>
    {/each}
  {/snippet}
</Async>

<h2 class="group-title">Comptes</h2>
<Async r={users} rows={1}>
  {#snippet children(list)}
    {#if !list.length}<p class="empty">Aucun compte. Crée-en un par appareil qui doit se connecter.</p>{/if}
    {#each list as u (u.login)}
      <Row label={u.login} hint={u.ip_reservation || 'Adresse automatique'}>
        <Button variant="quiet" small onclick={() => showConfig(u)}>Configuration</Button>
        <Button variant="quiet" small onclick={() => delUser(u)}>Supprimer</Button>
      </Row>
    {/each}
  {/snippet}
</Async>
<div class="inline"><Button variant="ghost" small onclick={() => ((uf = { login: '', password: '' }), (uOpen = true))}>Créer un compte</Button></div>

<Sheet bind:open={uOpen} title="Nouveau compte VPN">
  <Field label="Identifiant" bind:value={uf.login} placeholder="theo-pc" />
  <Field label="Mot de passe" bind:value={uf.password} secret hint="Utile pour OpenVPN. WireGuard utilise des clés générées par la box." />
  {#snippet footer()}
    <Button variant="ghost" onclick={() => (uOpen = false)}>Annuler</Button>
    <Button busy={saving} disabled={!uf.login} onclick={addUser}>Créer</Button>
  {/snippet}
</Sheet>

<Sheet bind:open={cOpen} title="Configuration de {confFor.login}">
  <Select label="Serveur" bind:value={confFor.server} options={(servers.data ?? []).map((s) => ({ value: s.name, label: nice(s.name) }))} />
  <Button variant="ghost" small busy={loadingConf} onclick={loadConf}>Charger</Button>
  {#if conf}
    {#if confFor.server === 'wireguard'}
      <p class="note">Dans l'app WireGuard du téléphone : Ajouter, puis Scanner un QR code.</p>
      <Qr text={conf} label="Configuration WireGuard" />
    {/if}
    <pre class="conf">{conf}</pre>
    <Button variant="ghost" small onclick={() => navigator.clipboard?.writeText(conf)}>Copier</Button>
  {/if}
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
  .conf {
    margin: 0;
    padding: 14px;
    border-radius: 12px;
    box-shadow: inset 0 0 0 1px var(--line-2);
    font-size: 12.5px;
    line-height: 1.6;
    white-space: pre-wrap;
    word-break: break-all;
    color: var(--t2);
  }
</style>
