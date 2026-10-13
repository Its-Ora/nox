<script lang="ts">
  import { app, useResource, act } from '../lib/state.svelte';
  import Async from '../lib/ui/Async.svelte';
  import Row from '../lib/ui/Row.svelte';
  import Sheet from '../lib/ui/Sheet.svelte';
  import Button from '../lib/ui/Button.svelte';

  const profiles = useResource<any[]>('profile/');
  const ctl = useResource<any[]>('network_control/', { poll: 30000 });

  const ctlOf = (p: any) => ctl.data?.find((c) => c.profile_id === p.id);
  const modeLabel = (m?: string) => (m === 'denied' ? 'Internet coupé' : m === 'webonly' ? 'Web seulement' : 'Internet autorisé');
  const until = (ts?: number) =>
    ts ? new Date(ts * 1000).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '';

  function hint(p: any) {
    const c = ctlOf(p);
    if (!c) return 'État inconnu';
    if (c.override && c.override_until) return `${modeLabel(c.override_mode)} jusqu'à ${until(c.override_until)}`;
    if (c.override) return `${modeLabel(c.override_mode)}, jusqu'à nouvel ordre`;
    return `${modeLabel(c.current_mode)}, selon le planning`;
  }

  let open = $state(false);
  let cur = $state<any>(null);
  let saving = $state(false);

  async function apply(mode: 'denied' | 'allowed' | null, minutes = 0) {
    saving = true;
    const id = cur.id;
    const body =
      mode === null
        ? { override: false }
        : { override: true, override_mode: mode, override_until: minutes ? Math.floor(Date.now() / 1000) + minutes * 60 : 0 };
    await act(
      { busy: 'Application…', done: mode === 'denied' ? `Internet coupé pour ${cur.name}` : mode === 'allowed' ? `Internet autorisé pour ${cur.name}` : 'Retour au planning' },
      () => app.fb.api('PUT', `network_control/${id}`, body),
      ['network_control'],
    );
    saving = false;
    open = false;
  }

  function tonight() {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(7, 0, 0, 0);
    return Math.round((d.getTime() - Date.now()) / 60000);
  }
</script>

<h1 class="page-title">Contrôle parental</h1>
<p class="page-sub">Couper ou rendre internet à un groupe d'appareils, tout de suite ou pour un temps.</p>

<Async r={profiles} rows={2}>
  {#snippet children(list)}
    {#if !list.length}
      <p class="empty">Aucun profil. Les profils (appareils regroupés et planning) se créent dans Freebox OS, puis se pilotent ici.</p>
    {/if}
    {#each list as p (p.id)}
      <Row label={p.name} hint={hint(p)} onclick={() => ((cur = p), (open = true))}>
        {#snippet lead()}
          <span class="st" class:off={ctlOf(p)?.current_mode === 'denied'}></span>
        {/snippet}
      </Row>
    {/each}
  {/snippet}
</Async>

<Sheet bind:open title={cur?.name ?? 'Profil'}>
  {#if cur}
    <p class="now">{hint(cur)}</p>
    <h3 class="group-title">Couper internet</h3>
    <div class="grid">
      <Button variant="ghost" onclick={() => apply('denied', 30)}>30 min</Button>
      <Button variant="ghost" onclick={() => apply('denied', 60)}>1 h</Button>
      <Button variant="ghost" onclick={() => apply('denied', 120)}>2 h</Button>
      <Button variant="ghost" onclick={() => apply('denied', tonight())}>Jusqu'à 7 h</Button>
      <Button variant="solid" onclick={() => apply('denied')}>Jusqu'à nouvel ordre</Button>
    </div>
    <h3 class="group-title">Autoriser</h3>
    <div class="grid">
      <Button variant="ghost" onclick={() => apply('allowed', 60)}>1 h de bonus</Button>
      <Button variant="ghost" onclick={() => apply('allowed')}>Jusqu'à nouvel ordre</Button>
      <Button variant="ghost" busy={saving} onclick={() => apply(null)}>Revenir au planning</Button>
    </div>
  {/if}
</Sheet>

<style>
  .empty {
    color: var(--t2);
  }
  .st {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: var(--fg);
  }
  .st.off {
    background: none;
    box-shadow: inset 0 0 0 1.5px var(--t2);
  }
  .now {
    margin: 0;
    color: var(--t2);
  }
  .grid {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  h3.group-title {
    margin: 12px 0 0;
  }
</style>
