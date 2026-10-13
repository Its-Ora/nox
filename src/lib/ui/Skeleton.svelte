<script lang="ts">
  // Squelette qui "respire" lentement : aucune animation de position, que de l'opacité (GPU, zéro saccade).
  let { rows = 3, height = 14, widths = [62, 40, 78, 52, 70] }: { rows?: number; height?: number; widths?: number[] } = $props();
</script>

<div class="sk" aria-busy="true" aria-label="Chargement">
  {#each Array(rows) as _, i}
    <div class="row">
      <span class="bar" style="width:{widths[i % widths.length]}%;height:{height}px;animation-delay:{i * 140}ms"></span>
      <span class="bar small" style="width:{14 + ((i * 7) % 12)}%;animation-delay:{i * 140 + 70}ms"></span>
    </div>
  {/each}
</div>

<style>
  .sk {
    display: grid;
  }
  .row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 24px;
    padding: 20px 0;
    border-bottom: 1px solid var(--line);
  }
  .bar {
    display: block;
    border-radius: 99px;
    background: #fff;
    opacity: 0.06;
    animation: breathe 2.2s var(--ease-in-out) infinite;
  }
  .small {
    height: 10px;
  }
  @keyframes breathe {
    50% {
      opacity: 0.13;
    }
  }
</style>
