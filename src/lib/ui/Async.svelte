<script lang="ts" generics="T">
  import { untrack, type Snippet } from 'svelte';
  import type { Resource } from '../state.svelte';
  import Skeleton from './Skeleton.svelte';
  import Button from './Button.svelte';

  // Affiche le squelette, puis fond le contenu dès que les données arrivent.
  // Si les données sont déjà en cache, le contenu s'affiche directement, sans squelette.
  let {
    r,
    rows = 3,
    children,
    skeleton,
  }: { r: Resource<T>; rows?: number; children: Snippet<[T]>; skeleton?: Snippet } = $props();

  const fromCache = untrack(() => r.data !== undefined);
</script>

{#if r.data !== undefined}
  <div class:reveal={!fromCache}>
    {@render children(r.data)}
  </div>
  {#if r.error}
    <p class="stale">Données affichées non à jour : {r.error}</p>
  {/if}
{:else if r.error}
  <div class="err">
    <p>{r.error}</p>
    <Button variant="ghost" onclick={() => r.refresh()} busy={r.loading}>Réessayer</Button>
  </div>
{:else if skeleton}
  {@render skeleton()}
{:else}
  <Skeleton {rows} />
{/if}

<style>
  .reveal {
    animation: in 420ms var(--ease) both;
  }
  @keyframes in {
    from {
      opacity: 0;
    }
  }
  .err {
    border: 1px solid var(--line-2);
    border-radius: 14px;
    padding: 18px 20px;
    display: flex;
    gap: 16px;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
  }
  .err p {
    margin: 0;
    max-width: 60ch;
  }
  .stale {
    color: var(--t3);
    font-size: 13px;
    margin: 10px 0 0;
  }
</style>
