<script lang="ts">
  import QRCode from 'qrcode';

  let { text, label }: { text: string; label: string } = $props();
  let svg = $state('');

  $effect(() => {
    const t = text;
    QRCode.toString(t, { type: 'svg', margin: 2, errorCorrectionLevel: 'M', color: { dark: '#000000', light: '#ffffff' } }).then((s) => {
      if (t === text) svg = s;
    });
  });
</script>

<figure class="qr" aria-label={label}>
  {#if svg}{@html svg}{/if}
</figure>

<style>
  .qr {
    margin: 0;
    width: min(100%, 260px);
    aspect-ratio: 1;
    border-radius: 20px;
    overflow: hidden;
    background: #fff;
    animation: in 380ms var(--ease) both;
  }
  .qr :global(svg) {
    display: block;
    width: 100%;
    height: 100%;
  }
  @keyframes in {
    from {
      opacity: 0;
      transform: scale(0.97);
    }
  }
</style>
