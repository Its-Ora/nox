<script lang="ts">
  let {
    value = $bindable(),
    options,
    label,
  }: { value: string; options: { value: string; label: string }[]; label: string } = $props();

  let el: HTMLElement | undefined = $state();
  let pill = $state({ x: 0, w: 0 });

  // La pastille glisse vers l'option choisie.
  $effect(() => {
    value;
    const b = el?.querySelector<HTMLElement>(`[data-v="${CSS.escape(value)}"]`);
    if (b) pill = { x: b.offsetLeft, w: b.offsetWidth };
  });
</script>

<div class="seg" role="radiogroup" aria-label={label} bind:this={el}>
  <span class="pill" style="transform:translateX({pill.x}px);width:{pill.w}px"></span>
  {#each options as o}
    <button role="radio" aria-checked={value === o.value} data-v={o.value} class:on={value === o.value} onclick={() => (value = o.value)}>
      {o.label}
    </button>
  {/each}
</div>

<style>
  .seg {
    position: relative;
    display: inline-flex;
    padding: 4px;
    border-radius: 99px;
    box-shadow: inset 0 0 0 1px var(--line-2);
  }
  .pill {
    position: absolute;
    top: 4px;
    left: 0;
    height: calc(100% - 8px);
    border-radius: 99px;
    background: var(--fg);
    transition:
      transform 320ms var(--ease),
      width 320ms var(--ease);
  }
  button {
    position: relative;
    height: 32px;
    padding: 0 14px;
    border-radius: 99px;
    color: var(--t2);
    font-size: 14px;
    transition: color 220ms var(--ease);
    white-space: nowrap;
  }
  button.on {
    color: var(--bg);
  }
</style>
