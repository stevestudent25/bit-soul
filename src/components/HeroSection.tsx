import { useEffect, useRef, useState } from "react";
import AnimatedSoul from "./AnimatedSoul";

const SOULS = [
  { color: "#f43f5e", secondaryColor: "#7f1d1d", label: "Striker", floatDelay: 0 },
  { color: "#3b82f6", secondaryColor: "#1e3a8a", label: "Guardian", floatDelay: 0.5 },
  { color: "#10b981", secondaryColor: "#064e3b", label: "Courier", floatDelay: 1.0 },
  { color: "#a855f7", secondaryColor: "#3b0764", label: "Trickster", floatDelay: 1.5 },
  { color: "#f59e0b", secondaryColor: "#78350f", label: "Architect", floatDelay: 2.0 },
];

const TICKER_EVENTS = [
  "⚔️ Zyx the Volatile has defeated Kael Ironshell — RIVALRY DEEPENS",
  "🏁 Mira Swiftdrift captured the enemy flag in 28 seconds — SPEED RECORD",
  "💥 Pyra Flameheart triggered Supernova, destroying 47 tiles — WORLDBREAKER",
  "🤝 Orix Voidwalker and Nael Crystalborn have formed a BOND",
  "🌍 New map 'Ember Confluence' generated — Seed: 0xA3F7",
  "👑 The Void Syndicate wins the Season of Shadow faction war",
  "🔮 Thex the Bold achieved Prestige IX — 'The Eternal' title unlocked",
  "⚡ Quix Shadowmeld remains INVISIBLE for 47 seconds — UNTOUCHABLE",
];

const HeroSection = () => {
  const bgCanvasRef = useRef<HTMLCanvasElement>(null);
  const [tickerIdx, setTickerIdx] = useState(0);
  const [tickerVisible, setTickerVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setTickerVisible(false);
      setTimeout(() => {
        setTickerIdx((i) => (i + 1) % TICKER_EVENTS.length);
        setTickerVisible(true);
      }, 400);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Background particle canvas
  useEffect(() => {
    const canvas = bgCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const particles: { x: number; y: number; vx: number; vy: number; r: number; color: string; alpha: number }[] = [];
    const colors = ["#a855f7", "#3b82f6", "#f43f5e", "#10b981", "#f59e0b", "#06b6d4"];

    for (let i = 0; i < 80; i++) {
      particles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        r: Math.random() * 3 + 1,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: Math.random() * 0.6 + 0.2,
      });
    }

    let animId: number;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color + Math.floor(p.alpha * 255).toString(16).padStart(2, "0");
        ctx.fill();

        // Draw connections
        particles.forEach((p2) => {
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = p.color + Math.floor((1 - dist / 120) * 30).toString(16).padStart(2, "0");
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        });
      });
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-[#080812]">
      {/* Background canvas */}
      <canvas ref={bgCanvasRef} className="absolute inset-0 pointer-events-none" />

      {/* Grid overlay */}
      <div className="absolute inset-0 grid-bg opacity-40 pointer-events-none" />

      {/* Scanline effect */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)"
      }} />

      {/* Content */}
      <div className="relative z-10 text-center px-6 max-w-6xl mx-auto">

        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-violet-500/40 bg-violet-500/10 text-violet-300 text-xs font-bold tracking-widest uppercase mb-8 bounce-in">
          <span className="w-2 h-2 rounded-full bg-violet-400 soul-pulse" style={{ color: "#a855f7" }} />
          BIT-SOUL × CAPTURE THE FLAG
        </div>

        {/* Title */}
        <h1 className="text-7xl md:text-9xl font-black tracking-tight mb-4">
          <span className="shimmer-text">BIT-SOUL</span>
        </h1>
        <p className="text-2xl md:text-3xl font-light text-white/60 mb-2 tracking-wide">
          Living World CTF Simulation
        </p>
        <p className="text-sm text-violet-400/70 tracking-widest uppercase mb-12">
          20 Interconnected Systems · Emergent Gameplay · Infinite Replayability
        </p>

        {/* Soul showcase */}
        <div className="flex items-end justify-center gap-4 md:gap-10 mb-12 flex-wrap">
          {SOULS.map((soul) => (
            <AnimatedSoul
              key={soul.label}
              color={soul.color}
              secondaryColor={soul.secondaryColor}
              label={soul.label}
              size={72}
              floatDelay={soul.floatDelay}
              pulseColor={soul.color}
            />
          ))}
        </div>

        {/* Stats bar */}
        <div className="flex flex-wrap justify-center gap-6 md:gap-12 mb-10">
          {[
            { label: "Systems", value: "20" },
            { label: "Soul Stats", value: "60+" },
            { label: "Biomes", value: "7" },
            { label: "CTF Variants", value: "4" },
            { label: "Mutations", value: "∞" },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-3xl font-black text-violet-300">{s.value}</div>
              <div className="text-xs text-white/40 uppercase tracking-widest">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Live ticker */}
        <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-black/40 border border-white/10 text-sm text-white/70 max-w-2xl">
          <span className="text-violet-400 font-bold text-xs uppercase tracking-wider shrink-0">LIVE</span>
          <span
            className="truncate transition-all duration-400"
            style={{ opacity: tickerVisible ? 1 : 0, transition: "opacity 0.4s" }}
          >
            {TICKER_EVENTS[tickerIdx]}
          </span>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/30 text-xs tracking-widest uppercase">
        <span>Explore Systems</span>
        <div className="w-px h-8 bg-gradient-to-b from-violet-500/50 to-transparent animate-pulse" />
      </div>
    </section>
  );
};

export default HeroSection;
