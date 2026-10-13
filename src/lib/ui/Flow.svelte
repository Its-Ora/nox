<script lang="ts">
  // Graphe de débit en continu : le temps défile en douceur à 60 i/s,
  // les nouveaux points glissent depuis la droite au lieu d'apparaître d'un coup.
  let {
    samples,
    windowMs = 90_000,
    lagMs = 2_200,
  }: { samples: { t: number; down: number; up: number }[]; windowMs?: number; lagMs?: number } = $props();

  let canvas: HTMLCanvasElement | undefined = $state();
  let scaleMax = 1;
  let span = 20_000;

  $effect(() => {
    const c = canvas!;
    const ctx = c.getContext('2d')!;
    let raf = 0;
    let visible = true;
    let w = 0;
    let h = 0;
    let dpr = 1;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = c.clientWidth;
      h = c.clientHeight;
      c.width = Math.round(w * dpr);
      c.height = Math.round(h * dpr);
    };
    const ro = new ResizeObserver(resize);
    ro.observe(c);
    resize();
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(c);

    const line = (pts: [number, number][]) => {
      if (pts.length < 2) return;
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      // Courbe lissée (milieux + quadratiques) : pas d'angles secs.
      for (let i = 1; i < pts.length - 1; i++) {
        const mx = (pts[i][0] + pts[i + 1][0]) / 2;
        const my = (pts[i][1] + pts[i + 1][1]) / 2;
        ctx.quadraticCurveTo(pts[i][0], pts[i][1], mx, my);
      }
      const l = pts[pts.length - 1];
      ctx.lineTo(l[0], l[1]);
    };

    const draw = () => {
      raf = requestAnimationFrame(draw);
      if (!visible || !w) return;
      const now = Date.now() - lagMs;
      const s = samples;
      // Fenêtre qui s'élargit avec l'historique : pas de grand vide au démarrage.
      const have = s.length ? now - s[0].t : 0;
      span += (Math.min(windowMs, Math.max(20_000, have)) - span) * 0.05;
      const peak = Math.max(1, ...s.map((p) => Math.max(p.down, p.up)));
      // Échelle qui suit le pic tranquillement (pas de saut brutal).
      scaleMax += (peak * 1.25 - scaleMax) * 0.06;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      const top = 8;
      const bottom = h - 2;
      const X = (t: number) => w - ((now - t) / span) * w;
      const Y = (v: number) => bottom - (v / scaleMax) * (bottom - top);

      // Repères horizontaux discrets
      ctx.strokeStyle = '#151515';
      ctx.lineWidth = 1;
      for (let i = 1; i <= 3; i++) {
        const y = Math.round(top + ((bottom - top) * i) / 4) + 0.5;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      const vis = s.filter((p) => p.t >= now - span - 4000);
      // Le dernier point "en cours" est interpolé pour que la ligne avance en continu.
      const pts = (k: 'down' | 'up') => {
        const out: [number, number][] = [];
        for (let i = 0; i < vis.length; i++) {
          const p = vis[i];
          if (p.t > now) {
            const prev = vis[i - 1];
            if (prev) {
              const f = (now - prev.t) / (p.t - prev.t);
              out.push([X(now), Y(prev[k] + (p[k] - prev[k]) * f)]);
            }
            break;
          }
          out.push([X(p.t), Y(p[k])]);
        }
        return out;
      };

      const d = pts('down');
      if (d.length > 1) {
        const g = ctx.createLinearGradient(0, top, 0, bottom);
        g.addColorStop(0, 'rgba(255,255,255,0.16)');
        g.addColorStop(1, 'rgba(255,255,255,0)');
        line(d);
        ctx.lineTo(d[d.length - 1][0], bottom);
        ctx.lineTo(d[0][0], bottom);
        ctx.closePath();
        ctx.fillStyle = g;
        ctx.fill();
        line(d);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.6;
        ctx.stroke();
        const last = d[d.length - 1];
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(last[0], last[1], 3, 0, Math.PI * 2);
        ctx.fill();
      }
      const u = pts('up');
      if (u.length > 1) {
        line(u);
        ctx.setLineDash([3, 4]);
        ctx.strokeStyle = '#8c8c8c';
        ctx.lineWidth = 1.3;
        ctx.stroke();
        ctx.setLineDash([]);
      }
    };
    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
    };
  });
</script>

<canvas bind:this={canvas} aria-label="Graphe du débit en temps réel"></canvas>

<style>
  canvas {
    display: block;
    width: 100%;
    height: 100%;
  }
</style>
