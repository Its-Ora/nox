<script lang="ts">
  import type { Snippet } from 'svelte';
  import Icon from './Icon.svelte';

  // Panneau : glisse du bas sur mobile, de la droite sur grand écran.
  let {
    open = $bindable(false),
    title,
    children,
    footer,
  }: { open?: boolean; title: string; children: Snippet; footer?: Snippet } = $props();

  let closing = $state(false);
  let panel: HTMLElement | undefined = $state();

  function close() {
    closing = true;
    setTimeout(() => {
      open = false;
      closing = false;
    }, 240);
  }

  $effect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
    window.addEventListener('keydown', onKey);
    const prev = document.activeElement as HTMLElement | null;
    queueMicrotask(() => panel?.focus());
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      prev?.focus?.();
    };
  });
</script>

{#if open}
  <div class="scrim" class:closing onclick={close} role="presentation"></div>
  <div class="panel" class:closing role="dialog" aria-modal="true" aria-label={title} tabindex="-1" bind:this={panel}>
    <header>
      <h2>{title}</h2>
      <button class="x" aria-label="Fermer" onclick={close}><Icon name="close" /></button>
    </header>
    <div class="body">{@render children()}</div>
    {#if footer}<footer>{@render footer()}</footer>{/if}
  </div>
{/if}

<style>
  .scrim {
    position: fixed;
    inset: 0;
    z-index: 40;
    background: rgba(0, 0, 0, 0.72);
    animation: fade 260ms var(--ease) both;
  }
  .panel {
    position: fixed;
    z-index: 41;
    background: var(--bg);
    display: flex;
    flex-direction: column;
    outline: none;
    left: 0;
    right: 0;
    bottom: 0;
    max-height: 92dvh;
    border-radius: 24px 24px 0 0;
    box-shadow: 0 -1px 0 var(--line-2);
    padding-bottom: var(--safe-b);
    animation: up 360ms var(--ease) both;
  }
  .closing.scrim {
    animation: fade 240ms var(--ease) reverse both;
  }
  .closing.panel {
    animation: up 240ms var(--ease-in-out) reverse both;
  }
  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 22px 24px 10px;
  }
  h2 {
    margin: 0;
    font-weight: 400;
    font-size: 24px;
    font-variation-settings: 'wdth' 80;
  }
  .x {
    width: 40px;
    height: 40px;
    display: grid;
    place-items: center;
    border-radius: 50%;
    color: var(--t2);
    margin-right: -8px;
  }
  .x:hover {
    color: var(--fg);
    background: var(--hover);
  }
  .body {
    overflow-y: auto;
    padding: 8px 24px 24px;
    display: grid;
    gap: 18px;
    align-content: start;
  }
  footer {
    display: flex;
    gap: 10px;
    justify-content: flex-end;
    padding: 14px 24px 20px;
    border-top: 1px solid var(--line);
    flex-wrap: wrap;
  }

  @media (min-width: 860px) {
    .panel {
      left: auto;
      top: 0;
      width: 460px;
      max-height: none;
      border-radius: 0;
      box-shadow: -1px 0 0 var(--line-2);
      animation-name: side;
    }
  }
  @keyframes fade {
    from {
      opacity: 0;
    }
  }
  @keyframes up {
    from {
      transform: translateY(100%);
    }
  }
  @keyframes side {
    from {
      transform: translateX(100%);
    }
  }
</style>
