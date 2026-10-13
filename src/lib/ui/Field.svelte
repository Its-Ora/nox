<script lang="ts">
  import Icon from './Icon.svelte';

  let {
    label,
    value = $bindable(''),
    type = 'text',
    placeholder = '',
    hint = '',
    secret = false,
    mono = false,
    inputmode,
    autocomplete = 'off',
  }: {
    label: string;
    value?: string | number;
    type?: string;
    placeholder?: string;
    hint?: string;
    secret?: boolean;
    mono?: boolean;
    inputmode?: 'text' | 'numeric' | 'decimal' | 'url' | 'email';
    autocomplete?: AutoFill;
  } = $props();

  let shown = $state(false);
  const id = 'f' + Math.random().toString(36).slice(2, 8);
</script>

<div class="field">
  <label for={id}>{label}</label>
  <div class="wrap">
    <input
      {id}
      type={secret && !shown ? 'password' : type}
      bind:value
      {placeholder}
      {inputmode}
      {autocomplete}
      spellcheck="false"
      class:mono
    />
    {#if secret}
      <button type="button" class="eye" aria-label={shown ? 'Masquer' : 'Afficher'} onclick={() => (shown = !shown)}>
        <Icon name={shown ? 'eyeoff' : 'eye'} size={18} />
      </button>
    {/if}
  </div>
  {#if hint}<p class="hint">{hint}</p>{/if}
</div>

<style>
  .field {
    display: grid;
    gap: 8px;
  }
  label {
    font-size: 13px;
    color: var(--t2);
  }
  .wrap {
    position: relative;
  }
  input {
    width: 100%;
    height: 46px;
    padding: 0 14px;
    background: transparent;
    border: 0;
    border-radius: 12px;
    box-shadow: inset 0 0 0 1px var(--line-2);
    outline: none;
    transition: box-shadow 160ms var(--ease);
  }
  input:focus {
    box-shadow: inset 0 0 0 1.5px var(--fg);
  }
  input::placeholder {
    color: var(--t3);
  }
  .mono {
    font-variant-numeric: tabular-nums;
    letter-spacing: 0.02em;
  }
  .eye {
    position: absolute;
    right: 6px;
    top: 6px;
    width: 34px;
    height: 34px;
    display: grid;
    place-items: center;
    color: var(--t2);
    border-radius: 8px;
  }
  .eye:hover {
    color: var(--fg);
  }
  input:has(+ .eye) {
    padding-right: 46px;
  }
  .hint {
    margin: 0;
    font-size: 13px;
    color: var(--t3);
  }
</style>
