<script lang="ts">
  import { app } from '../lib/state.svelte';
  import Button from '../lib/ui/Button.svelte';
  import Segmented from '../lib/ui/Segmented.svelte';
  import { ask } from '../lib/ui/confirm.svelte';

  // Accès direct à n'importe quel point de l'API : tout ce que Freebox OS règle passe par ici.
  const known = [
    'system/', 'connection/', 'connection/config/', 'connection/ipv6/config/', 'connection/ftth/', 'connection/logs/',
    'lan/config/', 'lan/browser/interfaces/', 'lan/browser/pub/', 'wifi/config/', 'wifi/ap/', 'wifi/bss/', 'wifi/sta/',
    'wifi/planning/', 'wifi/mac_filter/', 'wifi/custom_key/', 'wifi/wps/config/', 'dhcp/config/', 'dhcp/static_lease/',
    'dhcp/dynamic_lease/', 'dhcpv6/config/', 'fw/redir/', 'fw/incoming/', 'fw/dmz/', 'upnpigd/config/', 'upnpigd/redir/',
    'vpn/', 'vpn/user/', 'vpn/connection/', 'vpn_client/config/', 'profile/', 'network_control/', 'call/log/',
    'contact/', 'freeplug/', 'storage/disk/', 'lcd/config/', 'notif/targets/', 'netshare/samba/', 'ftp/config/',
    'switch/status/', 'switch/port/1/stats/', 'rrd/',
  ];

  let method = $state('GET');
  let path = $state('system/');
  let body = $state('');
  let out = $state('');
  let status = $state<'idle' | 'ok' | 'err'>('idle');
  let ms = $state(0);
  let busy = $state(false);

  const bodyOk = $derived.by(() => {
    if (method === 'GET' || method === 'DELETE' || !body.trim()) return true;
    try {
      JSON.parse(body);
      return true;
    } catch {
      return false;
    }
  });

  async function send() {
    if (method !== 'GET') {
      const ok = await ask(`Envoyer ${method} ${path} ?`, 'Cette requête peut modifier la configuration de la box.', 'Envoyer');
      if (!ok) return;
    }
    busy = true;
    const t0 = performance.now();
    try {
      const b = method === 'GET' || method === 'DELETE' || !body.trim() ? undefined : JSON.parse(body);
      const r = await app.fb.api(method, path, b);
      out = JSON.stringify(r, null, 2) ?? 'null';
      status = 'ok';
    } catch (e: any) {
      out = `${e?.code ? e.code + ' : ' : ''}${e?.message ?? e}`;
      status = 'err';
    }
    ms = Math.round(performance.now() - t0);
    busy = false;
  }

  function reuse() {
    if (status === 'ok') {
      body = out;
      method = 'PUT';
    }
  }
</script>

<h1 class="page-title">API brute</h1>
<p class="page-sub">Pour tout réglage qui n'a pas encore son écran. Lis un point de l'API, modifie le JSON, renvoie-le en PUT.</p>

<form
  class="req"
  onsubmit={(e) => {
    e.preventDefault();
    send();
  }}
>
  <Segmented
    label="Méthode"
    bind:value={method}
    options={['GET', 'PUT', 'POST', 'DELETE'].map((m) => ({ value: m, label: m }))}
  />
  <div class="path">
    <span class="base">/api/v{app.fb.version?.api_version?.split('.')[0] ?? '?'}/</span>
    <input bind:value={path} list="endpoints" spellcheck="false" aria-label="Chemin" />
    <datalist id="endpoints">
      {#each known as k}<option value={k}></option>{/each}
    </datalist>
  </div>
  {#if method === 'PUT' || method === 'POST'}
    <textarea bind:value={body} rows="8" spellcheck="false" placeholder={'{ "enabled": true }'} aria-label="Corps JSON" class:bad={!bodyOk}></textarea>
  {/if}
  <div class="row">
    <Button type="submit" {busy} disabled={!bodyOk || !path}>Envoyer</Button>
    {#if status === 'ok' && method === 'GET'}<Button variant="quiet" onclick={reuse}>Modifier et renvoyer</Button>{/if}
    {#if status !== 'idle'}<span class="meta">{status === 'ok' ? 'Succès' : 'Échec'} en {ms} ms</span>{/if}
  </div>
</form>

{#if out}
  <pre class="out" class:err={status === 'err'}>{out}</pre>
{/if}

<style>
  .req {
    display: grid;
    gap: 14px;
  }
  .path {
    display: flex;
    align-items: center;
    height: 46px;
    border-radius: 12px;
    box-shadow: inset 0 0 0 1px var(--line-2);
    padding: 0 14px;
  }
  .path:focus-within {
    box-shadow: inset 0 0 0 1.5px var(--fg);
  }
  .base {
    color: var(--t3);
  }
  .path input {
    flex: 1;
    background: none;
    border: 0;
    outline: none;
    min-width: 0;
  }
  textarea {
    background: none;
    border: 0;
    border-radius: 12px;
    box-shadow: inset 0 0 0 1px var(--line-2);
    padding: 12px 14px;
    resize: vertical;
    font-size: 13.5px;
    line-height: 1.55;
    outline: none;
  }
  textarea:focus {
    box-shadow: inset 0 0 0 1.5px var(--fg);
  }
  textarea.bad {
    box-shadow: inset 0 0 0 1.5px var(--t3);
  }
  .row {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
  }
  .meta {
    color: var(--t3);
    font-size: 13px;
  }
  .out {
    margin: 22px 0 0;
    padding: 16px;
    border-radius: 14px;
    box-shadow: inset 0 0 0 1px var(--line);
    font-size: 13px;
    line-height: 1.6;
    color: var(--t2);
    overflow: auto;
    max-height: 60vh;
    animation: in 300ms var(--ease) both;
  }
  .out.err {
    box-shadow: inset 0 0 0 1.5px var(--fg);
    color: var(--fg);
    white-space: pre-wrap;
  }
  @keyframes in {
    from {
      opacity: 0;
    }
  }
</style>
