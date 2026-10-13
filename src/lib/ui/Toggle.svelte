<script lang="ts">
  let {
    checked = false,
    disabled = false,
    label,
    onchange,
  }: { checked?: boolean; disabled?: boolean; label: string; onchange?: (v: boolean) => void } = $props();
</script>

<button
  type="button"
  role="switch"
  aria-checked={checked}
  aria-label={label}
  class="sw"
  class:on={checked}
  {disabled}
  onclick={() => onchange?.(!checked)}
>
  <span class="knob"></span>
</button>

<style>
  .sw {
    flex: none;
    width: 46px;
    height: 28px;
    border-radius: 99px;
    box-shadow: inset 0 0 0 1.5px var(--line-2);
    position: relative;
    transition:
      background 220ms var(--ease),
      box-shadow 220ms var(--ease);
  }
  .knob {
    position: absolute;
    top: 5px;
    left: 5px;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: var(--t3);
    transition:
      transform 280ms var(--ease),
      background 220ms var(--ease);
  }
  .on {
    background: var(--fg);
    box-shadow: inset 0 0 0 1.5px var(--fg);
  }
  .on .knob {
    transform: translateX(18px);
    background: var(--bg);
  }
  .sw:disabled {
    opacity: 0.4;
    cursor: default;
  }
</style>
