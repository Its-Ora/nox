<script lang="ts">
  import { app, useResource, act } from '../lib/state.svelte';
  import { dateTime, phone } from '../lib/format';
  import Async from '../lib/ui/Async.svelte';
  import Row from '../lib/ui/Row.svelte';
  import Button from '../lib/ui/Button.svelte';
  import Icon from '../lib/ui/Icon.svelte';
  import { ask } from '../lib/ui/confirm.svelte';

  const calls = useResource<any[]>('call/log/', { poll: 60000 });

  const unread = $derived(calls.data?.filter((c) => c.new).length ?? 0);
  const kind = (t: string) => (t === 'missed' ? 'Manqué' : t === 'outgoing' ? 'Émis' : 'Reçu');
  const icon = (t: string) => (t === 'missed' ? 'missed' : t === 'outgoing' ? 'outgoing' : 'incoming');
  const dur = (s: number) => (s >= 60 ? `${Math.floor(s / 60)} min ${String(s % 60).padStart(2, '0')}` : `${s} s`);

  async function markRead() {
    calls.patch((d) => d.map((c) => ({ ...c, new: false })));
    await act({ busy: 'Marquage…', done: 'Appels marqués comme vus' }, () => app.fb.api('POST', 'call/log/mark_all_as_read/'), ['call/log']);
  }
  async function clearAll() {
    const ok = await ask('Effacer tout le journal ?', 'Tous les appels de la liste seront supprimés de la box.', 'Tout effacer');
    if (!ok) return;
    calls.patch(() => []);
    await act({ busy: 'Suppression…', done: 'Journal effacé' }, () => app.fb.api('POST', 'call/log/delete_all/'), ['call/log']);
  }
</script>

<h1 class="page-title">Appels</h1>
<p class="page-sub">{unread ? `${unread} appel${unread > 1 ? 's' : ''} manqué${unread > 1 ? 's' : ''} pas encore vu${unread > 1 ? 's' : ''}.` : 'Le journal de la ligne fixe.'}</p>

<Async r={calls} rows={5}>
  {#snippet children(list)}
    {#if !list.length}<p class="empty">Aucun appel dans le journal.</p>{/if}
    {#each list as c (c.id)}
      <Row label={c.name || phone(c.number) || 'Numéro masqué'} hint={`${kind(c.type)}, ${dateTime(c.datetime)}`} value={c.duration ? dur(c.duration) : null}>
        {#snippet lead()}<span class:new={c.new}><Icon name={icon(c.type)} size={18} /></span>{/snippet}
      </Row>
    {/each}
    {#if list.length}
      <div class="inline">
        {#if unread}<Button variant="ghost" small onclick={markRead}>Tout marquer comme vu</Button>{/if}
        <Button variant="quiet" small onclick={clearAll}>Effacer le journal</Button>
      </div>
    {/if}
  {/snippet}
</Async>

<style>
  .new {
    color: var(--fg);
  }
  .inline {
    padding-top: 16px;
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
  .empty {
    color: var(--t2);
  }
</style>
