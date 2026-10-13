<script lang="ts">
  import { app, useResource, act, notify } from '../lib/state.svelte';
  import Async from '../lib/ui/Async.svelte';
  import Row from '../lib/ui/Row.svelte';
  import Toggle from '../lib/ui/Toggle.svelte';
  import Sheet from '../lib/ui/Sheet.svelte';
  import Field from '../lib/ui/Field.svelte';
  import Button from '../lib/ui/Button.svelte';
  import { ask } from '../lib/ui/confirm.svelte';

  const cfg = useResource<any>('connection/config/');
  const v6 = useResource<any>('connection/ipv6/config/');

  async function set(key: string, v: any, label: string) {
    cfg.patch((d) => ({ ...d, [key]: v }));
    await act({ busy: 'Enregistrement…', done: label }, () => app.fb.api('PUT', 'connection/config/', { [key]: v }), ['connection/config']);
  }

  async function setRemote(v: boolean) {
    if (!v && app.where === 'remote') {
      const ok = await ask("Couper l'accès à distance ?", 'Tu es connecté à distance en ce moment : Nox perdra la box jusqu’à ton retour à la maison.', 'Couper');
      if (!ok) return;
    }
    set('remote_access', v, v ? 'Accès à distance activé' : 'Accès à distance coupé');
  }

  async function setV6(key: string, v: boolean, label: string) {
    v6.patch((d) => ({ ...d, [key]: v }));
    await act({ busy: 'Enregistrement…', done: label }, () => app.fb.api('PUT', 'connection/ipv6/config/', { [key]: v }), ['connection/ipv6']);
  }

  let portOpen = $state(false);
  let port = $state('');
  let saving = $state(false);
  async function savePort() {
    saving = true;
    await act({ busy: 'Enregistrement…', done: 'Port modifié' }, () => app.fb.api('PUT', 'connection/config/', { remote_access_port: +port }), ['connection/config']);
    saving = false;
    portOpen = false;
  }

  const remoteUrl = $derived(cfg.data?.api_domain && cfg.data?.https_port ? `https://${cfg.data.api_domain}:${cfg.data.https_port}` : '');

  function useRemote() {
    app.settings.remoteUrl = remoteUrl;
    app.persist();
    notify('Adresse distante enregistrée dans Nox');
  }
</script>

<h1 class="page-title">Connexion</h1>
<p class="page-sub">Comment ta box se comporte face à internet.</p>

<h2 class="group-title">Accès à distance</h2>
<Async r={cfg} rows={4}>
  {#snippet children(c)}
    <Row label="Accès à distance à Freebox OS" hint="Permet de gérer la box hors de chez toi, Nox compris.">
      <Toggle label="Accès à distance" checked={!!c.remote_access} onchange={setRemote} />
    </Row>
    <Row label="Accès distant à l'API" hint="Nécessaire pour que Nox marche hors de la maison.">
      <Toggle label="API à distance" checked={!!c.api_remote_access} onchange={(v) => set('api_remote_access', v, v ? 'API joignable à distance' : 'API locale seulement')} />
    </Row>
    <Row label="Port d'accès à distance" value={c.remote_access_port ?? c.https_port} onclick={() => ((port = String(c.remote_access_port ?? '')), (portOpen = true))} />
    {#if remoteUrl}
      <Row label="Adresse distante" hint={remoteUrl}>
        {#if app.settings.remoteUrl !== remoteUrl}<Button variant="ghost" small onclick={useRemote}>Utiliser dans Nox</Button>{:else}<span class="faint">Utilisée par Nox</span>{/if}
      </Row>
    {/if}
    <Row label="Nouvelles demandes d'accès d'apps" hint="Coupe-le une fois toutes tes apps associées.">
      <Toggle label="Demandes d'accès" checked={!!c.allow_token_request} onchange={(v) => set('allow_token_request', v, v ? 'Demandes d’accès autorisées' : 'Demandes d’accès bloquées')} />
    </Row>

    <h2 class="group-title">Réponse à internet</h2>
    <Row label="Répondre au ping" hint="Utile pour tester ta ligne de l'extérieur.">
      <Toggle label="Ping" checked={!!c.ping} onchange={(v) => set('ping', v, v ? 'La box répond au ping' : 'La box ignore le ping')} />
    </Row>
    <Row label="Wake-on-LAN depuis internet">
      <Toggle label="Wake-on-LAN" checked={!!c.wol} onchange={(v) => set('wol', v, v ? 'Wake-on-LAN distant activé' : 'Wake-on-LAN distant coupé')} />
    </Row>
    {#if 'adblock' in c}
      <Row label="Blocage de publicité" hint="Filtrage DNS intégré à la box.">
        <Toggle label="Blocage de publicité" checked={!!c.adblock} onchange={(v) => set('adblock', v, v ? 'Blocage de publicité activé' : 'Blocage de publicité coupé')} />
      </Row>
    {/if}
  {/snippet}
</Async>

<h2 class="group-title">IPv6</h2>
<Async r={v6} rows={2}>
  {#snippet children(c)}
    <Row label="IPv6">
      <Toggle label="IPv6" checked={!!c.ipv6_enabled} onchange={(v) => setV6('ipv6_enabled', v, v ? 'IPv6 activé' : 'IPv6 coupé')} />
    </Row>
    {#if 'ipv6_firewall' in c}
      <Row label="Pare-feu IPv6" hint="Bloque les connexions entrantes non sollicitées.">
        <Toggle label="Pare-feu IPv6" checked={!!c.ipv6_firewall} onchange={(v) => setV6('ipv6_firewall', v, v ? 'Pare-feu IPv6 activé' : 'Pare-feu IPv6 coupé')} />
      </Row>
    {/if}
  {/snippet}
</Async>

<Sheet bind:open={portOpen} title="Port d'accès à distance">
  <Field label="Port" bind:value={port} inputmode="numeric" mono hint="Entre 1024 et 65535. Pense à mettre à jour l'adresse distante dans Nox ensuite." />
  {#snippet footer()}
    <Button variant="ghost" onclick={() => (portOpen = false)}>Annuler</Button>
    <Button busy={saving} disabled={!(+port >= 1024 && +port <= 65535)} onclick={savePort}>Enregistrer</Button>
  {/snippet}
</Sheet>
