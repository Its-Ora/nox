<script lang="ts">
  let { name, size = 20, stroke = 1.5 }: { name: string; size?: number; stroke?: number } = $props();

  // Pictos maison, trait fin, cohérents entre eux.
  const P: Record<string, string> = {
    home: 'M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-4.5v-6h-5v6H5a1 1 0 0 1-1-1z',
    devices: 'M3 5.5h13v9H3zM7 18.5h5M9.5 14.5v4M18.5 8.5h3v11h-3z',
    wifi: 'M2.5 9a14 14 0 0 1 19 0M5.5 12.3a9.5 9.5 0 0 1 13 0M8.6 15.6a5 5 0 0 1 6.8 0M12 19.2h.01',
    network: 'M12 3v5M5 13v-2.5h14V13M12 8v2.5M3 13h4v4H3zM10 13h4v4h-4zM17 13h4v4h-4zM12 3h0',
    ports: 'M4 7h11M11 3l4 4-4 4M20 17H9M13 13l-4 4 4 4',
    globe: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z',
    shield: 'M12 3 4.5 6v5.5c0 4.6 3.1 8.2 7.5 9.5 4.4-1.3 7.5-4.9 7.5-9.5V6z',
    phone: 'M6.6 3.5h3l1.5 4-2 1.3a10.5 10.5 0 0 0 6.1 6.1l1.3-2 4 1.5v3a2 2 0 0 1-2.2 2A17 17 0 0 1 4.6 5.7a2 2 0 0 1 2-2.2z',
    box: 'M4 7.5 12 3l8 4.5v9L12 21l-8-4.5zM4 7.5l8 4.5 8-4.5M12 12v9',
    code: 'M8.5 7 3.5 12l5 5M15.5 7l5 5-5 5M13.5 4.5l-3 15',
    vpn: 'M7 11V8a5 5 0 0 1 10 0v3M5.5 11h13v9.5h-13zM12 15v2',
    more: 'M5 12h.01M12 12h.01M19 12h.01',
    chevron: 'M9.5 6l6 6-6 6',
    back: 'M14.5 6l-6 6 6 6',
    close: 'M6 6l12 12M18 6 6 18',
    plus: 'M12 5v14M5 12h14',
    trash: 'M4.5 7h15M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13',
    power: 'M12 3v8M7 5.8a8 8 0 1 0 10 0',
    eye: 'M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
    eyeoff: 'M4 4l16 16M9.9 5.8A9 9 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a16 16 0 0 1-3 3.6M14.1 14.2A3 3 0 0 1 9.8 9.9M6.2 7.6A16 16 0 0 0 2.5 12S6 18.5 12 18.5a9 9 0 0 0 4-.9',
    search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4',
    copy: 'M8.5 8.5h11v11h-11zM15.5 8.5v-4h-11v11h4',
    check: 'M5 12.5l4.5 4.5L19 7.5',
    refresh: 'M20 11a8 8 0 0 0-14.7-4.4L4 8.5M4 13a8 8 0 0 0 14.7 4.4L20 15.5M4 4v4.5h4.5M20 20v-4.5h-4.5',
    zap: 'M13 3 5 13.5h6L10.5 21 19 10.5h-6z',
    qr: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2.5v2.5H14zM17.5 17.5H20V20h-2.5zM14 18.5h1.5M18.5 14H20',
    arrowdown: 'M12 4v15M6 13l6 6 6-6',
    arrowup: 'M12 20V5M6 11l6-6 6 6',
    pause: 'M8 5v14M16 5v14',
    play: 'M7 4.5v15l12-7.5z',
    settings: 'M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM19.4 13.5l1.6 1.2-2 3.4-1.9-.7a7.6 7.6 0 0 1-2.1 1.2L14.7 21h-4l-.3-2.4a7.6 7.6 0 0 1-2.1-1.2l-1.9.7-2-3.4 1.6-1.2a7.4 7.4 0 0 1 0-2.4L4.4 9.9l2-3.4 1.9.7a7.6 7.6 0 0 1 2.1-1.2L10.7 3h4l.3 2.4a7.6 7.6 0 0 1 2.1 1.2l1.9-.7 2 3.4-1.6 1.2a7.4 7.4 0 0 1 0 2.4z',
    missed: 'M5 5l6 6M11 5.5V11H5.5M20 15.5c-4.5-4-11.5-4-16 0l2 2.5 3-1.2v-2.4a12 12 0 0 1 6 0v2.4l3 1.2z',
    incoming: 'M10 4.5v6h-6M10 10.5 4.5 5M6.6 12.5h0',
    outgoing: 'M13.5 4.5h6v6M19.5 4.5 13 11',
    link: 'M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1 1M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1-1',
  };
</script>

<svg
  width={size}
  height={size}
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width={stroke}
  stroke-linecap="round"
  stroke-linejoin="round"
  aria-hidden="true"
>
  <path d={P[name] ?? P.more} />
</svg>
