import { useEffect, useRef } from "react";

export function Starfield() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current!;
    const ctx = c.getContext("2d")!;
    let w = 0, h = 0, raf = 0;
    const css = getComputedStyle(document.documentElement);
    const star = css.getPropertyValue("--foreground").trim() || "white";
    const glow = css.getPropertyValue("--glow").trim() || "cyan";
    type S = { x: number; y: number; z: number; pz: number };
    let stars: S[] = [];
    const resize = () => {
      w = c.width = innerWidth * devicePixelRatio;
      h = c.height = innerHeight * devicePixelRatio;
      stars = Array.from({ length: 520 }, () => ({ x: (Math.random() - 0.5) * w, y: (Math.random() - 0.5) * h, z: Math.random() * w, pz: 0 }));
      stars.forEach((s) => (s.pz = s.z));
    };
    resize();
    addEventListener("resize", resize);
    let shoot = { x: 0, y: 0, life: 0 };
    const tick = () => {
      ctx.clearRect(0, 0, w, h);
      ctx.save();
      ctx.translate(w / 2, h / 2);
      for (const s of stars) {
        s.pz = s.z;
        s.z -= 2.2 * devicePixelRatio;
        if (s.z < 1) { s.x = (Math.random() - 0.5) * w; s.y = (Math.random() - 0.5) * h; s.z = w; s.pz = s.z; }
        const sx = (s.x / s.z) * w * 0.5, sy = (s.y / s.z) * w * 0.5;
        const px = (s.x / s.pz) * w * 0.5, py = (s.y / s.pz) * w * 0.5;
        const a = 1 - s.z / w;
        ctx.strokeStyle = star;
        ctx.globalAlpha = a;
        ctx.lineWidth = a * 2.2 * devicePixelRatio;
        ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(sx, sy); ctx.stroke();
      }
      ctx.restore();
      if (shoot.life <= 0 && Math.random() < 0.006) shoot = { x: Math.random() * w, y: Math.random() * h * 0.4, life: 60 };
      if (shoot.life > 0) {
        ctx.globalAlpha = shoot.life / 60;
        ctx.strokeStyle = glow;
        ctx.lineWidth = 2 * devicePixelRatio;
        ctx.beginPath(); ctx.moveTo(shoot.x, shoot.y); ctx.lineTo(shoot.x - 140, shoot.y - 60); ctx.stroke();
        shoot.x += 14; shoot.y += 6; shoot.life--;
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => { cancelAnimationFrame(raf); removeEventListener("resize", resize); };
  }, []);
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-background" />
      <div className="absolute -top-1/3 left-1/2 h-[80vh] w-[120vw] -translate-x-1/2 rounded-full bg-brand opacity-20 blur-[140px] animate-pulse" />
      <canvas ref={ref} className="absolute inset-0 h-full w-full" />
    </div>
  );
}
