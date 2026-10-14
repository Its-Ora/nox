<script lang="ts">
  import type { Snippet } from 'svelte';

  let {
    variant = 'solid',
    busy = false,
    disabled = false,
    type = 'button',
    onclick,
    children,
    small = false,
  }: {
    variant?: 'solid' | 'ghost' | 'danger' | 'quiet';
    busy?: boolean;
    disabled?: boolean;
    type?: 'button' | 'submit';
    onclick?: (e: MouseEvent) => void;
    children: Snippet;
    small?: boolean;
  } = $props();
</script>

<button {type} class="btn {variant}" class:small class:busy disabled={disabled || busy} {onclick}>
  <span class="label">{@render children()}</span>
  {#if busy}<span class="dots" aria-hidden="true"><i></i><i></i><i></i></span>{/if}
</button>

<style>
  .btn {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    height: 42px;
    padding: 0 20px;
    border-radius: 999px;
    font-weight: 700;
    white-space: nowrap;
    transition:
      background 160ms var(--ease),
      color 160ms var(--ease),
      transform 120ms var(--ease),
      opacity 160ms;
  }
  .small {
    height: 34px;
    padding: 0 14px;
    font-size: 14px;
  }
  .btn:active:not(:disabled) {
    transform: scale(0.97);
  }
  .btn:disabled {
    cursor: default;
  }
  .btn:disabled:not(.busy) {
    opacity: 0.35;
  }
  .solid {
    background: var(--fg);
    color: var(--bg);
  }
  .solid:hover:not(:disabled) {
    background: #dcdcdc;
  }
  .ghost {
    box-shadow: inset 0 0 0 1px var(--line-2);
  }
  .ghost:hover:not(:disabled) {
    background: var(--hover);
  }
  .quiet {
    color: var(--t2);
    padding: 0 10px;
  }
  .quiet:hover:not(:disabled) {
    color: var(--fg);
  }
  .danger {
    box-shadow: inset 0 0 0 1px var(--fg);
  }
  .danger:hover:not(:disabled) {
    background: var(--fg);
    color: var(--bg);
  }
  .busy .label {
    opacity: 0;
  }
  .dots {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
  }
  .dots i {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: currentColor;
    animation: d 1.2s var(--ease-in-out) infinite;
  }
  .dots i:nth-child(2) {
    animation-delay: 0.15s;
  }
  .dots i:nth-child(3) {
    animation-delay: 0.3s;
  }
  @keyframes d {
    0%,
    100% {
      opacity: 0.25;
    }
    50% {
      opacity: 1;
    }
  }
</style>
