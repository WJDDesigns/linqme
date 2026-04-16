"use client";

import { useEffect, useRef } from "react";

/**
 * Animated rocket (matching the SiteLaunch logo style) hovering with
 * smoke billowing downward. Theme-adaptive — works in both light & dark.
 * Renders as a full-viewport background layer (z-0) behind auth dialogs.
 */
export default function RocketAnimation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    if (!ctx) return;

    let W = 0;
    let H = 0;
    let t = 0;

    /* ── particles ─────────────────────────────────── */
    interface P {
      x: number; y: number; vx: number; vy: number;
      r: number; life: number; max: number; o: number;
    }
    let smoke: P[] = [];

    /* ── stars ──────────────────────────────────────── */
    interface S { x: number; y: number; r: number; speed: number; phase: number; }
    let stars: S[] = [];

    /* ── 4-point diamond stars (like the reference image) ── */
    interface D { x: number; y: number; size: number; speed: number; phase: number; }
    let diamonds: D[] = [];

    function resize() {
      const dpr = window.devicePixelRatio || 1;
      W = canvas!.clientWidth;
      H = canvas!.clientHeight;
      canvas!.width = W * dpr;
      canvas!.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      initStars();
    }

    function initStars() {
      stars = [];
      diamonds = [];
      const n = Math.floor((W * H) / 12000);
      for (let i = 0; i < n; i++) {
        stars.push({
          x: Math.random() * W, y: Math.random() * H,
          r: Math.random() * 1.2 + 0.3,
          speed: Math.random() * 2 + 0.8,
          phase: Math.random() * Math.PI * 2,
        });
      }
      // Larger diamond-shaped stars (like the reference image)
      const nd = Math.floor(n * 0.15);
      for (let i = 0; i < nd; i++) {
        diamonds.push({
          x: Math.random() * W, y: Math.random() * H,
          size: Math.random() * 4 + 2,
          speed: Math.random() * 1.5 + 0.5,
          phase: Math.random() * Math.PI * 2,
        });
      }
    }

    function dark() { return document.documentElement.classList.contains("dark"); }

    function col() {
      const d = dark();
      return {
        // Body — matches the logo purple
        body1: d ? "#c0c1ff" : "#696cf8",
        body2: d ? "#8b8ddb" : "#4e50c7",
        bodyDark: d ? "#3e4080" : "#2d2f8e",
        bodyHighlight: d ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.3)",
        // Window — teal accent like the logo
        win: d ? "#3cddc7" : "#006d62",
        winGlow: d ? "rgba(60,221,199,0.25)" : "rgba(0,109,98,0.15)",
        winBright: d ? "rgba(180,255,245,0.9)" : "rgba(140,240,220,0.85)",
        // Flame
        fCore: "rgba(255,255,255,0.95)",
        fInner: d ? "rgba(255,210,120,0.9)" : "rgba(255,190,70,0.9)",
        fOuter: d ? "rgba(255,130,70,0.55)" : "rgba(255,110,50,0.55)",
        // Exhaust / smoke
        smoke: d ? "rgba(192,193,255," : "rgba(105,108,248,",
        // Stars
        star: d ? "rgba(192,193,255," : "rgba(105,108,248,",
        // Clouds
        cloud: d ? "rgba(192,193,255," : "rgba(105,108,248,",
        // Side booster accent
        booster: d ? "#6d6fbd" : "#5456c0",
        boosterDark: d ? "#3a3c78" : "#2a2c72",
        // Ring
        ring: d ? "rgba(192,193,255,0.18)" : "rgba(105,108,248,0.12)",
      };
    }

    /* ── rocket position ───────────────────────────── */
    function rocketPos() {
      const cx = W / 2;
      const baseY = H * 0.2; // higher up
      const bob = Math.sin(t * 0.7) * 5 + Math.sin(t * 1.2) * 2.5;
      const sway = Math.sin(t * 0.45) * 1.8;
      return { x: cx + sway, y: baseY + bob };
    }

    /* ── draw diamond star shape ───────────────────── */
    function drawDiamond(x: number, y: number, size: number, alpha: number, c: ReturnType<typeof col>) {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = `${c.star}0.6)`;
      ctx.beginPath();
      // 4-point star shape
      ctx.moveTo(x, y - size);
      ctx.lineTo(x + size * 0.3, y - size * 0.3);
      ctx.lineTo(x + size, y);
      ctx.lineTo(x + size * 0.3, y + size * 0.3);
      ctx.lineTo(x, y + size);
      ctx.lineTo(x - size * 0.3, y + size * 0.3);
      ctx.lineTo(x - size, y);
      ctx.lineTo(x - size * 0.3, y - size * 0.3);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    /* ── draw the rocket (logo style) ──────────────── */
    function drawRocket(cx: number, cy: number, c: ReturnType<typeof col>) {
      ctx.save();
      ctx.translate(cx, cy);
      const tilt = Math.sin(t * 0.45) * 0.025;
      ctx.rotate(tilt);

      // Scale factor — the rocket is drawn at a canonical size then scaled
      const S = 1.1;
      ctx.scale(S, S);

      // ─── Glow beneath rocket ───
      const glow = ctx.createRadialGradient(0, 20, 5, 0, 20, 80);
      glow.addColorStop(0, c.winGlow);
      glow.addColorStop(1, "transparent");
      ctx.fillStyle = glow;
      ctx.fillRect(-80, -60, 160, 160);

      // ─── Side boosters (behind body) ───
      // Left booster
      ctx.beginPath();
      ctx.moveTo(-18, -10);
      ctx.lineTo(-28, 10);
      ctx.lineTo(-32, 40);
      ctx.lineTo(-30, 48);
      ctx.lineTo(-22, 50);
      ctx.lineTo(-16, 44);
      ctx.lineTo(-14, 10);
      ctx.closePath();
      const lbGrad = ctx.createLinearGradient(-32, 0, -14, 0);
      lbGrad.addColorStop(0, c.boosterDark);
      lbGrad.addColorStop(0.5, c.booster);
      lbGrad.addColorStop(1, c.bodyDark);
      ctx.fillStyle = lbGrad;
      ctx.fill();

      // Left booster nose cone
      ctx.beginPath();
      ctx.moveTo(-22, -10);
      ctx.quadraticCurveTo(-21, -18, -18, -10);
      ctx.closePath();
      ctx.fillStyle = c.bodyDark;
      ctx.fill();

      // Right booster
      ctx.beginPath();
      ctx.moveTo(18, -10);
      ctx.lineTo(28, 10);
      ctx.lineTo(32, 40);
      ctx.lineTo(30, 48);
      ctx.lineTo(22, 50);
      ctx.lineTo(16, 44);
      ctx.lineTo(14, 10);
      ctx.closePath();
      const rbGrad = ctx.createLinearGradient(14, 0, 32, 0);
      rbGrad.addColorStop(0, c.bodyDark);
      rbGrad.addColorStop(0.5, c.booster);
      rbGrad.addColorStop(1, c.boosterDark);
      ctx.fillStyle = rbGrad;
      ctx.fill();

      // Right booster nose cone
      ctx.beginPath();
      ctx.moveTo(22, -10);
      ctx.quadraticCurveTo(21, -18, 18, -10);
      ctx.closePath();
      ctx.fillStyle = c.bodyDark;
      ctx.fill();

      // ─── Main body ───
      ctx.beginPath();
      ctx.moveTo(0, -55); // sharp nose tip
      ctx.bezierCurveTo(5, -48, 12, -35, 15, -18);
      ctx.lineTo(16, 35);
      ctx.lineTo(12, 44);
      ctx.lineTo(-12, 44);
      ctx.lineTo(-16, 35);
      ctx.lineTo(-15, -18);
      ctx.bezierCurveTo(-12, -35, -5, -48, 0, -55);
      ctx.closePath();

      const bGrad = ctx.createLinearGradient(-16, 0, 16, 0);
      bGrad.addColorStop(0, c.body2);
      bGrad.addColorStop(0.25, c.body1);
      bGrad.addColorStop(0.5, c.body1);
      bGrad.addColorStop(0.75, c.body1);
      bGrad.addColorStop(1, c.body2);
      ctx.fillStyle = bGrad;
      ctx.fill();

      // Body highlight strip (left side specular)
      ctx.beginPath();
      ctx.moveTo(0, -55);
      ctx.bezierCurveTo(2, -48, 5, -35, 6, -18);
      ctx.lineTo(6, 35);
      ctx.lineTo(4, 40);
      ctx.lineTo(-2, 40);
      ctx.lineTo(-2, -18);
      ctx.bezierCurveTo(-1, -35, 0, -48, 0, -55);
      ctx.closePath();
      ctx.fillStyle = c.bodyHighlight;
      ctx.fill();

      // Center stripe (like the logo "S" path area)
      ctx.beginPath();
      ctx.moveTo(-3, 5);
      ctx.lineTo(3, 5);
      ctx.lineTo(3, 32);
      ctx.lineTo(-3, 32);
      ctx.closePath();
      ctx.fillStyle = c.bodyDark;
      ctx.globalAlpha = 0.3;
      ctx.fill();
      ctx.globalAlpha = 1;

      // ─── Window ───
      const wy = -20;
      const wr = 8;
      // Outer rim
      ctx.beginPath();
      ctx.arc(0, wy, wr + 2.5, 0, Math.PI * 2);
      ctx.fillStyle = c.bodyDark;
      ctx.fill();
      // Window glass
      ctx.beginPath();
      ctx.arc(0, wy, wr, 0, Math.PI * 2);
      const wGrad = ctx.createRadialGradient(-2, wy - 2, 1, 0, wy, wr);
      wGrad.addColorStop(0, c.winBright);
      wGrad.addColorStop(1, c.win);
      ctx.fillStyle = wGrad;
      ctx.fill();
      // Glint
      ctx.beginPath();
      ctx.arc(-2.5, wy - 2.5, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.fill();

      // ─── Fins / swept wings ───
      // Left fin
      ctx.beginPath();
      ctx.moveTo(-14, 28);
      ctx.lineTo(-24, 52);
      ctx.quadraticCurveTo(-20, 50, -13, 44);
      ctx.closePath();
      ctx.fillStyle = c.bodyDark;
      ctx.fill();

      // Right fin
      ctx.beginPath();
      ctx.moveTo(14, 28);
      ctx.lineTo(24, 52);
      ctx.quadraticCurveTo(20, 50, 13, 44);
      ctx.closePath();
      ctx.fillStyle = c.bodyDark;
      ctx.fill();

      // ─── Nozzle ───
      ctx.beginPath();
      ctx.moveTo(-8, 44);
      ctx.lineTo(-10, 52);
      ctx.lineTo(10, 52);
      ctx.lineTo(8, 44);
      ctx.closePath();
      ctx.fillStyle = c.bodyDark;
      ctx.fill();

      // ─── Flame ───
      const flicker1 = Math.sin(t * 14) * 5 + Math.sin(t * 19) * 3;
      const flicker2 = Math.sin(t * 11) * 3;
      const flameH = 35 + flicker1;

      // Outer flame
      const fGrad = ctx.createLinearGradient(0, 52, 0, 52 + flameH);
      fGrad.addColorStop(0, c.fCore);
      fGrad.addColorStop(0.25, c.fInner);
      fGrad.addColorStop(0.65, c.fOuter);
      fGrad.addColorStop(1, "transparent");

      ctx.beginPath();
      ctx.moveTo(-8, 52);
      ctx.quadraticCurveTo(
        -6 + Math.sin(t * 16) * 2, 52 + flameH * 0.5,
        Math.sin(t * 11) * 2, 52 + flameH
      );
      ctx.quadraticCurveTo(
        6 + Math.sin(t * 14) * 2, 52 + flameH * 0.5,
        8, 52
      );
      ctx.closePath();
      ctx.fillStyle = fGrad;
      ctx.fill();

      // Inner flame
      const ifH = flameH * 0.55;
      ctx.beginPath();
      ctx.moveTo(-4, 52);
      ctx.quadraticCurveTo(
        -2 + Math.sin(t * 20) * 1.5, 52 + ifH * 0.5,
        Math.sin(t * 15) * 1, 52 + ifH
      );
      ctx.quadraticCurveTo(
        2 + Math.sin(t * 18) * 1.5, 52 + ifH * 0.5,
        4, 52
      );
      ctx.closePath();
      ctx.globalAlpha = 0.8;
      ctx.fillStyle = c.fCore;
      ctx.fill();
      ctx.globalAlpha = 1;

      // Side booster flames (smaller)
      const sfH = 18 + flicker2;
      for (const sx of [-26, 26]) {
        const sfGrad = ctx.createLinearGradient(sx, 48, sx, 48 + sfH);
        sfGrad.addColorStop(0, c.fInner);
        sfGrad.addColorStop(0.5, c.fOuter);
        sfGrad.addColorStop(1, "transparent");
        ctx.beginPath();
        ctx.moveTo(sx - 3, 48);
        ctx.quadraticCurveTo(
          sx + Math.sin(t * 18 + sx) * 1.5, 48 + sfH * 0.5,
          sx + Math.sin(t * 13 + sx) * 1, 48 + sfH
        );
        ctx.quadraticCurveTo(
          sx + Math.sin(t * 15 + sx) * 1.5, 48 + sfH * 0.5,
          sx + 3, 48
        );
        ctx.closePath();
        ctx.fillStyle = sfGrad;
        ctx.fill();
      }

      ctx.restore();
    }

    /* ── smoke particles ───────────────────────────── */
    function spawnSmoke(rx: number, ry: number) {
      // Main exhaust
      for (let i = 0; i < 3; i++) {
        smoke.push({
          x: rx + (Math.random() - 0.5) * 14,
          y: ry + Math.random() * 6,
          vx: (Math.random() - 0.5) * 1.0,
          vy: 1.8 + Math.random() * 2.2,
          r: 6 + Math.random() * 10,
          life: 0,
          max: 140 + Math.random() * 100,
          o: 0.35 + Math.random() * 0.25,
        });
      }
      // Side booster exhaust (wider spread)
      for (let i = 0; i < 2; i++) {
        const side = i === 0 ? -1 : 1;
        smoke.push({
          x: rx + side * (28 * 1.1) + (Math.random() - 0.5) * 6,
          y: ry - 6 + Math.random() * 4,
          vx: side * 0.4 + (Math.random() - 0.5) * 0.6,
          vy: 1.2 + Math.random() * 1.8,
          r: 5 + Math.random() * 8,
          life: 0,
          max: 100 + Math.random() * 80,
          o: 0.25 + Math.random() * 0.2,
        });
      }
    }

    function updateSmoke() {
      smoke = smoke.filter((p) => {
        p.life++;
        if (p.life > p.max) return false;
        p.x += p.vx;
        p.y += p.vy;
        p.vy *= 0.997;
        p.vx += (Math.random() - 0.5) * 0.12;
        p.vx *= 0.99;
        p.r += 0.35;
        return true;
      });
      // Cap particles
      if (smoke.length > 500) smoke.splice(0, smoke.length - 500);
    }

    function drawSmoke(c: ReturnType<typeof col>) {
      for (const p of smoke) {
        const prog = p.life / p.max;
        const a = p.o * (prog < 0.08 ? prog / 0.08 : 1 - (prog - 0.08) / 0.92);
        if (a <= 0.005) continue;
        ctx.save();
        ctx.globalAlpha = a;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `${c.smoke}0.15)`;
        ctx.fill();
        ctx.restore();
      }
    }

    /* ── clouds at bottom ──────────────────────────── */
    function drawClouds(c: ReturnType<typeof col>) {
      const baseY = H * 0.84;
      for (let layer = 0; layer < 3; layer++) {
        const y = baseY + layer * 22;
        const alpha = 0.06 + layer * 0.04;
        ctx.beginPath();
        ctx.moveTo(-10, H + 10);
        ctx.lineTo(-10, y + 20);
        const bumps = 14;
        const bw = (W + 20) / bumps;
        for (let i = 0; i <= bumps; i++) {
          const bx = i * bw - 10;
          const bh = 14 + Math.sin(i * 1.4 + layer * 2.2 + t * 0.18) * 9;
          ctx.quadraticCurveTo(bx - bw * 0.5, y - bh, bx, y + Math.sin(i * 0.9 + t * 0.12) * 4);
        }
        ctx.lineTo(W + 10, H + 10);
        ctx.closePath();
        ctx.fillStyle = `${c.cloud}${alpha.toFixed(3)})`;
        ctx.fill();
      }
    }

    /* ── main loop ─────────────────────────────────── */
    function frame() {
      t += 0.016;
      ctx.clearRect(0, 0, W, H);

      const c = col();
      const { x: rx, y: ry } = rocketPos();

      // Stars
      for (const s of stars) {
        const tw = 0.3 + 0.7 * ((Math.sin(t * s.speed + s.phase) + 1) / 2);
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `${c.star}${(tw * 0.3).toFixed(2)})`;
        ctx.fill();
      }

      // Diamond stars
      for (const d of diamonds) {
        const tw = 0.3 + 0.7 * ((Math.sin(t * d.speed + d.phase) + 1) / 2);
        drawDiamond(d.x, d.y, d.size * tw, tw * 0.4, c);
      }

      // Smoke (behind rocket)
      drawSmoke(c);

      // Clouds
      drawClouds(c);

      // Rocket
      drawRocket(rx, ry, c);

      // Spawn smoke from nozzle area
      const nozzleY = ry + 52 * 1.1 + 35; // bottom of flame area
      spawnSmoke(rx, nozzleY);

      updateSmoke();

      animRef.current = requestAnimationFrame(frame);
    }

    resize();
    window.addEventListener("resize", resize);
    animRef.current = requestAnimationFrame(frame);

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 0 }}
      aria-hidden="true"
    />
  );
}
