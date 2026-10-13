<script lang="ts">
  import { onMount } from 'svelte';
  import { app } from './lib/state.svelte';
  import { NAV, ALL } from './lib/nav';
  import Icon from './lib/ui/Icon.svelte';
  import Overlays from './lib/ui/Overlays.svelte';
  import Connect from './routes/Connect.svelte';
  import Pair from './routes/Pair.svelte';
  import Home from './routes/Home.svelte';
  import Devices from './routes/Devices.svelte';
  import Wifi from './routes/Wifi.svelte';
  import Lan from './routes/Lan.svelte';
  import Ports from './routes/Ports.svelte';
  import Internet from './routes/Internet.svelte';
  import Vpn from './routes/Vpn.svelte';
  import Parental from './routes/Parental.svelte';
  import Calls from './routes/Calls.svelte';
  import System from './routes/System.svelte';
  import Explorer from './routes/Explorer.svelte';
  import AppSettings from './routes/AppSettings.svelte';
  import More from './routes/More.svelte';

  const pages: Record<string, any> = {
    home: Home,
    devices: Devices,
    wifi: Wifi,
    lan: Lan,
    ports: Ports,
    internet: Internet,
    vpn: Vpn,
    parental: Parental,
    calls: Calls,
    system: System,
    explorer: Explorer,
    app: AppSettings,
    more: More,
  };

  const Page = $derived(pages[app.route] ?? Home);
  const mobileTabs = ALL.filter((n) => n.mobile);
  const inMore = $derived(!mobileTabs.some((t) => t.id === app.route));

  onMount(() => {
    app.start();
    const onHash = () => {
      const r = location.hash.slice(1);
      if (r && r !== app.route) app.route = r;
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  });

  // Remonte en haut à chaque changement de page.
  $effect(() => {
    app.route;
    window.scrollTo({ top: 0 });
  });
</script>

{#if app.phase === 'boot'}
  <div class="splash" aria-label="Connexion à la Freebox">
    <div class="orb"></div>
  </div>
{:else if app.phase === 'setup' || app.phase === 'unreachable'}
  <Connect />
{:else if app.phase === 'pair'}
  <Pair />
{:else}
  <div class="shell">
    <nav class="rail" aria-label="Navigation">
      <div class="brand">
        <span class="mark"></span>
        <span class="bname">{app.boxName}</span>
      </div>
      {#each NAV as group}
        <div class="group">
          {#each group as n}
            <button class="nav" class:active={app.route === n.id} aria-current={app.route === n.id ? 'page' : undefined} onclick={() => app.go(n.id)}>
              <Icon name={n.icon} size={19} />
              <span>{n.label}</span>
            </button>
          {/each}
        </div>
      {/each}
      <div class="where">
        <span class="dot" class:hollow={app.where !== 'local'}></span>
        {app.where === 'local' ? 'Réseau local' : app.where === 'remote' ? 'Accès à distance' : 'Mode démo'}
      </div>
    </nav>

    <main class="main">
      <div class="page">
        {#key app.route}
          <Page />
        {/key}
      </div>
    </main>

    <nav class="tabs" aria-label="Navigation">
      {#each mobileTabs as n}
        <button class="tab" class:active={app.route === n.id} onclick={() => app.go(n.id)}>
          <Icon name={n.icon} size={22} />
          <span>{n.label === 'Réseau local' ? 'Réseau' : n.label}</span>
        </button>
      {/each}
      <button class="tab" class:active={inMore} onclick={() => app.go('more')}>
        <Icon name="more" size={22} stroke={2.4} />
        <span>Plus</span>
      </button>
    </nav>
  </div>
{/if}

<Overlays />

<style>
  .splash {
    position: fixed;
    inset: 0;
    display: grid;
    place-items: center;
  }
  .orb {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    box-shadow: inset 0 0 0 1.5px #fff;
    animation: orb 2.4s var(--ease-in-out) infinite;
  }
  @keyframes orb {
    0%,
    100% {
      transform: scale(0.9);
      opacity: 0.35;
    }
    50% {
      transform: scale(1);
      opacity: 1;
    }
  }

  .shell {
    min-height: 100dvh;
  }

  /* ---------- Rail (grand écran) ---------- */
  .rail {
    display: none;
  }
  @media (min-width: 860px) {
    .rail {
      display: flex;
      flex-direction: column;
      position: fixed;
      inset: 0 auto 0 0;
      width: var(--rail);
      padding: 26px 14px 20px;
      border-right: 1px solid var(--line);
      overflow-y: auto;
    }
    .main {
      margin-left: var(--rail);
    }
    .tabs {
      display: none !important;
    }
  }
  .brand {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 0 10px 22px;
  }
  .mark {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    box-shadow: inset 0 0 0 1.5px #fff;
    position: relative;
  }
  .mark::after {
    content: '';
    position: absolute;
    inset: 6px;
    border-radius: 50%;
    background: #fff;
  }
  .bname {
    font-weight: 500;
    font-variation-settings: 'wdth' 85;
    font-size: 17px;
  }
  .group {
    display: grid;
    gap: 2px;
    padding: 10px 0;
    border-top: 1px solid var(--line);
  }
  .group:first-of-type {
    border-top: 0;
  }
  .nav {
    display: flex;
    align-items: center;
    gap: 12px;
    height: 40px;
    padding: 0 12px;
    border-radius: 10px;
    color: var(--t2);
    text-align: left;
    transition:
      color 140ms var(--ease),
      background 140ms var(--ease);
  }
  .nav:hover {
    color: var(--fg);
    background: var(--hover);
  }
  .nav.active {
    color: var(--bg);
    background: var(--fg);
  }
  .where {
    margin-top: auto;
    padding: 16px 12px 0;
    font-size: 13px;
    color: var(--t3);
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--fg);
  }
  .dot.hollow {
    background: none;
    box-shadow: inset 0 0 0 1.5px var(--t2);
  }

  /* ---------- Contenu ---------- */
  .main {
    padding: calc(28px + var(--safe-t)) var(--gutter) calc(110px + var(--safe-b));
  }
  .page {
    max-width: 940px;
    margin: 0 auto;
  }
  @media (min-width: 860px) {
    .main {
      padding-top: 56px;
      padding-bottom: 80px;
    }
  }

  /* ---------- Onglets (téléphone) ---------- */
  .tabs {
    position: fixed;
    z-index: 30;
    left: 0;
    right: 0;
    bottom: 0;
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    padding: 6px 6px calc(6px + var(--safe-b));
    background: rgba(0, 0, 0, 0.92);
    backdrop-filter: blur(12px);
    border-top: 1px solid var(--line);
  }
  .tab {
    display: grid;
    justify-items: center;
    gap: 3px;
    padding: 8px 0 6px;
    color: var(--t3);
    font-size: 11px;
    border-radius: 12px;
    transition: color 160ms var(--ease);
  }
  .tab.active {
    color: var(--fg);
  }
</style>
