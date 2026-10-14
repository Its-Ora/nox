<script lang="ts">
  import { app, notify } from '../state.svelte';
  import { missingPerms, permLabels } from '../perms';
  import { openExternal } from '../open';
  import Button from './Button.svelte';

  const missing = $derived(missingPerms(app.permissions));
  let hidden = $state(false);
  let checking = $state(false);

  function openOs() {
    const host = app.fb.host || app.settings.localUrl || 'http://mafreebox.freebox.fr';
    openExternal(host + '/');
  }

  async function recheck() {
    checking = true;
    await app.start();
    checking = false;
    const left = missingPerms(app.permissions).length;
    notify(left ? `Il manque encore ${left} droit${left > 1 ? 's' : ''}` : 'Nox a tous les droits', left ? 'err' : 'ok');
  }
</script>

{#if missing.length && !hidden}
  <aside class="perm" aria-label="Droits manquants">
    <div class="txt">
      <strong>Nox n'a pas tous les droits</strong>
      <p>
        Il manque : {missing.map((k) => permLabels[k] ?? k).join(', ')}. Une app ne peut pas se les donner seule, c'est la box qui décide.
        Dans Freebox OS, ouvre Paramètres, puis Gestion des accès, onglet Applications, et coche tout pour Nox.
      </p>
    </div>
    <div class="acts">
      <Button small onclick={openOs}>Ouvrir Freebox OS</Button>
      <Button small variant="ghost" busy={checking} onclick={recheck}>C'est fait, vérifier</Button>
      <Button small variant="quiet" onclick={() => (hidden = true)}>Plus tard</Button>
    </div>
  </aside>
{/if}

<style>
  .perm {
    border: 1.5px solid var(--fg);
    border-radius: 20px;
    padding: 18px 20px;
    margin-bottom: 32px;
    display: grid;
    gap: 14px;
    animation: in 420ms var(--ease) both;
  }
  strong {
    font-family: var(--display);
    font-weight: 600;
    font-size: 18px;
  }
  p {
    margin: 6px 0 0;
    color: var(--t2);
    max-width: 68ch;
  }
  .acts {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
  @keyframes in {
    from {
      opacity: 0;
      transform: translateY(-6px);
    }
  }
</style>
