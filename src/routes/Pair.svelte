<script lang="ts">
  import { app } from '../lib/state.svelte';
  import Button from '../lib/ui/Button.svelte';

  let status = $state<'idle' | 'pending' | 'granted' | 'error'>('idle');
  let error = $state('');
  let ctrl: AbortController | null = null;

  async function request() {
    status = 'pending';
    error = '';
    ctrl = new AbortController();
    try {
      await app.fb.authorize((s) => {
        if (s === 'granted') status = 'granted';
      }, ctrl.signal);
      status = 'granted';
      setTimeout(() => app.start(), 700);
    } catch (e: any) {
      status = 'error';
      error = e?.message ?? String(e);
    }
  }

  function cancel() {
    ctrl?.abort();
    status = 'idle';
  }
</script>

<div class="gate">
  <div class="inner">
    <div class="ring" class:pending={status === 'pending'} class:granted={status === 'granted'}>
      <span></span>
    </div>

    <h1 class="page-title">Associer Nox à ta {app.boxName}</h1>
    <p class="page-sub">À faire une seule fois, depuis le Wi-Fi ou le câble de la maison.</p>

    <ol class="steps">
      <li class:now={status === 'idle' || status === 'error'}>Lance la demande d'accès ci-dessous.</li>
      <li class:now={status === 'pending'}>
        Valide-la sur la Freebox : sur la Pop, appuie sur le bouton en façade quand le voyant clignote (ou accepte la demande dans Freebox Connect si elle s'y affiche).
      </li>
      <li class:now={status === 'granted'}>
        Dans Freebox OS → Paramètres → Gestion des accès → Applications, donne à Nox tous les droits, surtout « Modification des réglages ».
      </li>
    </ol>

    {#if status === 'error'}<div class="err">{error}</div>{/if}

    <div class="actions">
      {#if status === 'pending'}
        <Button variant="ghost" onclick={cancel}>Annuler</Button>
        <span class="wait">En attente de validation sur la box…</span>
      {:else if status === 'granted'}
        <span class="wait">Accès accordé.</span>
      {:else}
        <Button onclick={request}>Demander l'accès</Button>
        <Button variant="quiet" onclick={() => (app.phase = 'setup')}>Changer d'adresse</Button>
      {/if}
    </div>
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
    width: min(100%, 560px);
    margin: 0 auto;
  }
  .ring {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    box-shadow: inset 0 0 0 1.5px var(--line-2);
    margin-bottom: 36px;
    display: grid;
    place-items: center;
    transition: box-shadow 400ms var(--ease);
  }
  .ring span {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: var(--t3);
    transition:
      transform 500ms var(--ease),
      background 300ms;
  }
  .pending span {
    background: var(--fg);
    animation: blink 1.6s var(--ease-in-out) infinite;
  }
  .granted {
    box-shadow: inset 0 0 0 1.5px var(--fg);
  }
  .granted span {
    background: var(--fg);
    transform: scale(2.4);
  }
  @keyframes blink {
    50% {
      opacity: 0.15;
    }
  }
  .steps {
    margin: 0 0 32px;
    padding: 0;
    list-style: none;
    counter-reset: s;
    display: grid;
    gap: 14px;
  }
  .steps li {
    counter-increment: s;
    display: grid;
    grid-template-columns: 28px 1fr;
    color: var(--t3);
    transition: color 300ms var(--ease);
  }
  .steps li::before {
    content: counter(s);
    font-variant-numeric: tabular-nums;
  }
  .steps li.now {
    color: var(--fg);
  }
  .actions {
    display: flex;
    gap: 14px;
    align-items: center;
    flex-wrap: wrap;
  }
  .wait {
    color: var(--t2);
  }
  .err {
    border: 1.5px solid var(--fg);
    border-radius: 14px;
    padding: 14px 16px;
    margin-bottom: 22px;
  }
</style>
