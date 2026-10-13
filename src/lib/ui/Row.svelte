<script lang="ts">
  import type { Snippet } from 'svelte';
  import Icon from './Icon.svelte';

  // Une ligne de réglage : libellé à gauche, valeur ou contrôle à droite.
  let {
    label,
    hint,
    value,
    onclick,
    children,
    lead,
  }: {
    label: string;
    hint?: string;
    value?: string | number | null;
    onclick?: () => void;
    children?: Snippet;
    lead?: Snippet;
  } = $props();
</script>

{#if onclick}
  <!-- div + role="button" : permet d'y placer un interrupteur sans imbriquer des <button>. -->
  <div
    class="row tap"
    role="button"
    tabindex="0"
    onclick={onclick}
    onkeydown={(e) => {
      if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        onclick?.();
      }
    }}
  >
    {#if lead}<span class="lead">{@render lead()}</span>{/if}
    <span class="txt">
      <span class="label">{label}</span>
      {#if hint}<span class="hint">{hint}</span>{/if}
    </span>
    <span class="end">
      {#if value !== undefined && value !== null}<span class="value num">{value}</span>{/if}
      {#if children}{@render children()}{/if}
      <span class="chev"><Icon name="chevron" size={18} /></span>
    </span>
  </div>
{:else}
  <div class="row">
    {#if lead}<span class="lead">{@render lead()}</span>{/if}
    <span class="txt">
      <span class="label">{label}</span>
      {#if hint}<span class="hint">{hint}</span>{/if}
    </span>
    <span class="end">
      {#if value !== undefined && value !== null}<span class="value num">{value}</span>{/if}
      {#if children}{@render children()}{/if}
    </span>
  </div>
{/if}

<style>
  .row {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 16px;
    min-height: 62px;
    padding: 12px 0;
    border-bottom: 1px solid var(--line);
    text-align: left;
  }
  .tap {
    position: relative;
    margin: 0 -12px;
    padding: 12px;
    width: calc(100% + 24px);
    border-radius: 12px;
    border-bottom-color: transparent;
    transition: background 140ms var(--ease);
  }
  .tap::after {
    content: '';
    position: absolute;
    left: 12px;
    right: 12px;
    bottom: -1px;
    height: 1px;
    background: var(--line);
  }
  .tap:hover::after {
    opacity: 0;
  }
  .tap {
    cursor: pointer;
    user-select: none;
  }
  .tap:hover {
    background: var(--hover);
  }
  .tap:active {
    background: var(--press);
  }
  .lead {
    flex: none;
    display: grid;
    place-items: center;
    width: 24px;
    height: 24px;
    color: var(--t2);
  }
  .txt {
    flex: 1;
    min-width: 0;
    display: grid;
    gap: 2px;
  }
  .label {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .hint {
    color: var(--t3);
    font-size: 13px;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
  }
  .end {
    flex: none;
    display: flex;
    align-items: center;
    gap: 12px;
    max-width: 55%;
  }
  .value {
    color: var(--t2);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .chev {
    color: var(--t3);
    display: flex;
  }
</style>
