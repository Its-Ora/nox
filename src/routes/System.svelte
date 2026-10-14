<script lang="ts">
  import { app, useResource, act } from '../lib/state.svelte';
  import { duration } from '../lib/format';
  import Async from '../lib/ui/Async.svelte';
  import Row from '../lib/ui/Row.svelte';
  import Button from '../lib/ui/Button.svelte';
  import { ask } from '../lib/ui/confirm.svelte';
  import { permLabels } from '../lib/perms';
  import { sensorsOf, fansOf } from '../lib/sensors';
  import { openExternal } from '../lib/open';

  const sys = useResource<any>('system/', { poll: 10000 });


  async function reboot() {
    const ok = await ask('Redémarrer la Freebox ?', 'Internet, le Wi-Fi et le téléphone seront coupés environ deux minutes.', 'Redémarrer');
    if (!ok) return;
    await act({ busy: 'Redémarrage demandé…', done: 'La Freebox redémarre' }, () => app.fb.api('POST', 'system/reboot/'));
  }
</script>

<h1 class="page-title">{app.boxName}</h1>
<p class="page-sub">Matériel, logiciel et droits accordés à Nox.</p>

<Async r={sys} rows={5}>
  {#snippet children(s)}
    <Row label="Modèle" value={s.model_info?.pretty_name ?? s.board_name} />
    <Row label="Version du logiciel" value={s.firmware_version} />
    <Row label="Allumée depuis" value={s.uptime_val ? duration(s.uptime_val) : s.uptime} />
    <Row label="Adresse MAC" value={s.mac} />
    <Row label="Numéro de série" value={s.serial} />

    {#if sensorsOf(s).length || fansOf(s).length}
      <h2 class="group-title">Températures</h2>
      <div class="temps">
        {#each sensorsOf(s) as t (t.id)}
          <div class="temp">
            <span class="tv num">{t.value}<small>°C</small></span>
            <span class="tl">{t.name}</span>
            <span class="track"><span class="fill" style="transform:scaleX({Math.min(1, t.value / 100)})"></span></span>
          </div>
        {/each}
        {#each fansOf(s) as f (f.id)}
          <div class="temp">
            <span class="tv num">{f.value}<small> tr/min</small></span>
            <span class="tl">{f.name}</span>
          </div>
        {/each}
      </div>
    {/if}
  {/snippet}
</Async>

<h2 class="group-title">Mise à jour</h2>
<p class="note">
  Free ne laisse aucune app lancer elle-même une mise à jour du Freebox Server : la box télécharge les nouvelles versions toute seule.
  Une mise à jour déjà téléchargée s'installe au redémarrage suivant.
</p>
<div class="inline">
  <Button variant="ghost" small onclick={reboot}>Redémarrer pour installer</Button>
  <Button variant="quiet" small onclick={() => openExternal('https://dev.freebox.fr/blog/?cat=12')}>Voir les nouveautés des versions</Button>
</div>

<h2 class="group-title">Droits de Nox</h2>
{#each Object.entries(app.permissions).filter(([k]) => permLabels[k]) as [k, v]}
  <Row label={permLabels[k]} value={v ? 'Accordé' : 'Refusé'} />
{/each}
{#if app.permissions.settings === false}
  <p class="warn">
    Sans « Modifier les réglages », Nox ne peut que lire. Ouvre Freebox OS → Paramètres → Gestion des accès → Applications et coche ce droit pour Nox.
  </p>
{/if}

<div class="actions">
  <Button variant="ghost" onclick={reboot}>Redémarrer la Freebox</Button>
</div>

<style>
  .temps {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 1px;
    background: var(--line);
    border-block: 1px solid var(--line);
    margin-top: 10px;
  }
  .temp {
    background: var(--bg);
    padding: 18px 16px 18px 0;
    display: grid;
    gap: 4px;
  }
  .tv {
    font-size: 44px;
    font-family: var(--display);
    font-weight: 500;
    line-height: 1;
  }
  .tv small {
    font-size: 16px;
    color: var(--t2);
    margin-left: 2px;
  }
  .tl {
    color: var(--t2);
    font-size: 13px;
  }
  .track {
    height: 2px;
    background: var(--line-2);
    margin-top: 10px;
    margin-right: 16px;
    overflow: hidden;
  }
  .fill {
    display: block;
    height: 100%;
    background: var(--fg);
    transform-origin: left;
    transition: transform 900ms var(--ease);
  }
  .note {
    margin: 10px 0 0;
    color: var(--t2);
    max-width: 66ch;
  }
  .inline {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    padding-top: 14px;
  }
  .warn {
    border: 1.5px solid var(--fg);
    border-radius: 14px;
    padding: 14px 16px;
    margin: 18px 0 0;
  }
  .actions {
    margin-top: 32px;
  }
</style>
