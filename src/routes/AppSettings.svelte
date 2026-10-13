<script lang="ts">
  import { app, notify } from '../lib/state.svelte';
  import { APP_VERSION } from '../lib/api/client';
  import Field from '../lib/ui/Field.svelte';
  import Select from '../lib/ui/Select.svelte';
  import Row from '../lib/ui/Row.svelte';
  import Button from '../lib/ui/Button.svelte';
  import { ask } from '../lib/ui/confirm.svelte';

  let busy = $state(false);

  async function reconnect() {
    app.persist();
    busy = true;
    await app.start();
    busy = false;
    if (app.phase === 'ready') notify(app.where === 'local' ? 'Connecté en local' : app.where === 'remote' ? 'Connecté à distance' : 'Connecté');
  }

  async function forget() {
    const ok = await ask('Dissocier Nox de la Freebox ?', "Il faudra refaire la demande d'accès depuis la maison. Pense aussi à supprimer Nox dans Freebox OS → Gestion des accès.", 'Dissocier');
    if (ok) app.forget();
  }

  async function leaveDemo() {
    app.settings.demo = false;
    app.persist();
    await app.start();
  }
</script>

<h1 class="page-title">Réglages de l'app</h1>
<p class="page-sub">Où trouver la box, et comment Nox s'y connecte.</p>

<div class="form">
  <Field label="Adresse locale" bind:value={app.settings.localUrl} inputmode="url" />
  <Field label="Adresse d'accès à distance" bind:value={app.settings.remoteUrl} inputmode="url" placeholder="https://xxxxxxxx.fbxos.fr:12345" />
  <Select
    label="Choix de l'adresse"
    bind:value={app.settings.mode}
    options={[
      { value: 'auto', label: 'Automatique (locale puis distante)' },
      { value: 'local', label: 'Toujours locale' },
      { value: 'remote', label: 'Toujours distante' },
    ]}
  />
  <Field label="Nom de cet appareil" bind:value={app.settings.deviceName} hint="Affiché dans Freebox OS lors de l'association." />
  <div><Button {busy} onclick={reconnect}>Enregistrer et se reconnecter</Button></div>
</div>

<h2 class="group-title">Session</h2>
<Row label="Connexion actuelle" value={app.where === 'local' ? 'Réseau local' : app.where === 'remote' ? 'À distance' : 'Box simulée'} />
<Row label="Version de l'API" value={app.fb.version?.api_version ?? '—'} />
<Row label="Version de Nox" value={APP_VERSION} />

<div class="actions">
  {#if app.settings.demo}
    <Button variant="ghost" onclick={leaveDemo}>Quitter la démo</Button>
  {:else}
    <Button variant="danger" onclick={forget}>Dissocier de la Freebox</Button>
  {/if}
</div>

<style>
  .form {
    display: grid;
    gap: 20px;
    max-width: 560px;
  }
  .actions {
    margin-top: 32px;
  }
</style>
