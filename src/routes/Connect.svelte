<script lang="ts">
  import { app } from '../lib/state.svelte';
  import Field from '../lib/ui/Field.svelte';
  import Button from '../lib/ui/Button.svelte';
  import Select from '../lib/ui/Select.svelte';

  let busy = $state(false);

  async function connect() {
    busy = true;
    app.settings.demo = false;
    app.persist();
    await app.start();
    busy = false;
  }

  async function demo() {
    app.settings.demo = true;
    app.persist();
    await app.start();
  }
</script>

<div class="gate">
  <div class="inner">
    <h1 class="page-title">Trouver ta Freebox</h1>
    <p class="page-sub">
      Chez toi, l'adresse locale suffit. Pour piloter la box hors de la maison, ajoute aussi son adresse d'accès à distance.
    </p>

    {#if app.bootError}
      <div class="err">{app.bootError}</div>
    {/if}

    <form
      class="form"
      onsubmit={(e) => {
        e.preventDefault();
        connect();
      }}
    >
      <Field label="Adresse locale" bind:value={app.settings.localUrl} placeholder="http://mafreebox.freebox.fr" inputmode="url" />
      <Field
        label="Adresse d'accès à distance (facultatif)"
        bind:value={app.settings.remoteUrl}
        placeholder="https://xxxxxxxx.fbxos.fr:12345"
        inputmode="url"
        hint="Dans Freebox OS : Paramètres → Gestion des ports / Accès à distance."
      />
      <Select
        label="Choix de l'adresse"
        bind:value={app.settings.mode}
        options={[
          { value: 'auto', label: 'Automatique (locale puis distante)' },
          { value: 'local', label: 'Toujours locale' },
          { value: 'remote', label: 'Toujours distante' },
        ]}
      />
      <div class="actions">
        <Button type="submit" {busy}>Se connecter</Button>
        <Button variant="quiet" onclick={demo}>Essayer avec une box simulée</Button>
      </div>
    </form>
  </div>
</div>

<style>
  .gate {
    min-height: 100dvh;
    display: grid;
    align-items: center;
    padding: calc(40px + var(--safe-t)) var(--gutter) calc(40px + var(--safe-b));
  }
  .inner {
    width: min(100%, 520px);
    margin: 0 auto;
    animation: in 500ms var(--ease) both;
  }
  @keyframes in {
    from {
      opacity: 0;
      transform: translateY(8px);
    }
  }
  .form {
    display: grid;
    gap: 22px;
  }
  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 8px;
  }
  .err {
    border: 1.5px solid var(--fg);
    border-radius: 14px;
    padding: 14px 16px;
    margin-bottom: 26px;
  }
</style>
