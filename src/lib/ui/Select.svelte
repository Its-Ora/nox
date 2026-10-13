<script lang="ts">
  let {
    label,
    value = $bindable(),
    options,
  }: { label: string; value?: string | number; options: { value: string | number; label: string }[] } = $props();
  const id = 's' + Math.random().toString(36).slice(2, 8);
</script>

<div class="field">
  <label for={id}>{label}</label>
  <select {id} bind:value>
    {#each options as o}
      <option value={o.value}>{o.label}</option>
    {/each}
  </select>
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
  select {
    appearance: none;
    height: 46px;
    padding: 0 40px 0 14px;
    background: transparent
      url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='%23a8a8a8' stroke-width='1.5' stroke-linecap='round'%3E%3Cpath d='M6 9.5l6 6 6-6'/%3E%3C/svg%3E")
      no-repeat right 12px center;
    border: 0;
    border-radius: 12px;
    box-shadow: inset 0 0 0 1px var(--line-2);
    outline: none;
  }
  select:focus {
    box-shadow: inset 0 0 0 1.5px var(--fg);
  }
  option {
    background: #000;
  }
</style>
