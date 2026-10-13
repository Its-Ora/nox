<script lang="ts">
  import { app } from '../lib/state.svelte';
  import { ALL } from '../lib/nav';
  import Row from '../lib/ui/Row.svelte';
  import Icon from '../lib/ui/Icon.svelte';

  const items = ALL.filter((n) => !n.mobile);
</script>

<h1 class="page-title">Plus</h1>
<p class="page-sub">{app.boxName}, {app.where === 'local' ? 'en local' : app.where === 'remote' ? 'à distance' : 'simulée'}.</p>

{#each items as n}
  <Row label={n.label} onclick={() => app.go(n.id)}>
    {#snippet lead()}<Icon name={n.icon} size={19} />{/snippet}
  </Row>
{/each}
