<script lang="ts">
  import { toasts } from '../state.svelte';
  import { confirmState } from './confirm.svelte';
  import Sheet from './Sheet.svelte';
  import Button from './Button.svelte';
  import Icon from './Icon.svelte';

  function answer(v: boolean) {
    confirmState.resolve?.(v);
    confirmState.resolve = undefined;
    confirmState.open = false;
  }

  // Si le panneau se ferme autrement (Échap, clic dehors) : on considère "non".
  $effect(() => {
    if (!confirmState.open && confirmState.resolve) answer(false);
  });
</script>

<div class="toasts" aria-live="polite">
  {#each toasts as t (t.id)}
    <div class="toast {t.kind}">
      {#if t.kind === 'busy'}<span class="spin"></span>{:else if t.kind === 'ok'}<Icon name="check" size={16} />{/if}
      <span>{t.text}</span>
    </div>
  {/each}
</div>

<Sheet bind:open={confirmState.open} title={confirmState.title}>
  <p class="cbody">{confirmState.body}</p>
  {#snippet footer()}
    <Button variant="ghost" onclick={() => answer(false)}>Annuler</Button>
    <Button variant="solid" onclick={() => answer(true)}>{confirmState.action}</Button>
  {/snippet}
</Sheet>

<style>
  .toasts {
    position: fixed;
    z-index: 60;
    left: 50%;
    transform: translateX(-50%);
    bottom: calc(88px + var(--safe-b));
    display: grid;
    gap: 8px;
    justify-items: center;
    pointer-events: none;
    width: min(92vw, 460px);
  }
  @media (min-width: 860px) {
    .toasts {
      bottom: 28px;
      left: calc(50% + var(--rail) / 2);
    }
  }
  .toast {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 11px 16px;
    border-radius: 14px;
    background: var(--bg);
    box-shadow: inset 0 0 0 1px var(--line-2);
    font-size: 14px;
    animation: tin 320ms var(--ease) both;
    max-width: 100%;
  }
  .toast.ok {
    background: var(--fg);
    color: var(--bg);
    box-shadow: none;
  }
  .toast.err {
    box-shadow: inset 0 0 0 1.5px var(--fg);
  }
  @keyframes tin {
    from {
      opacity: 0;
      transform: translateY(10px) scale(0.98);
    }
  }
  .spin {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    border: 1.5px solid var(--line-2);
    border-top-color: var(--fg);
    animation: r 0.9s linear infinite;
    flex: none;
  }
  @keyframes r {
    to {
      transform: rotate(1turn);
    }
  }
  .cbody {
    margin: 0;
    color: var(--t2);
    max-width: 52ch;
  }
</style>
