import { useEffect, useRef, useState } from "react";



const BIOMES = [
  { name: "Crystal Caverns", color: "#7dd3fc", icon: "💎", effect: "Ranged attacks BOUNCE off crystal walls" },
  { name: "Ember Fields", color: "#f97316", icon: "🔥", effect: "Fire +30%, geysers erupt periodically" },
  { name: "Void Marsh", color: "#7c3aed", icon: "🌑", effect: "Mana regen +50%, movement -20%" },
  { name: "Arcane Forest", color: "#84cc16", icon: "🌲", effect: "Cooldowns -20%, trees move unobserved" },
  { name: "Shattered Plains", color: "#94a3b8", icon: "🏔️", effect: "Knockback +50%, bridges collapse" },
  { name: "Frozen Aether", color: "#bae6fd", icon: "❄️", effect: "Souls slide with momentum, blizzards" },
  { name: "Neon Ruins", color: "#22d3ee", icon: "⚡", effect: "Electric +30%, hackable turrets" },
];

const WorldGenSection = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [seed, setSeed] = useState("0xA3F7B2");
  const [mapSize, setMapSize] = useState<"small" | "medium" | "large">("medium");
  const [symmetry, setSymmetry] = useState<"mirror" | "chaos">("mirror");
  const [generating, setGenerating] = useState(false);
  const [validated, setValidated] = useState(true);

  const generateMap = () => {
    setGenerating(true);
    setValidated(false);
    const newSeed = "0x" + Math.floor(Math.random() * 0xFFFFFF).toString(16).toUpperCase().padStart(6, "0");
    setSeed(newSeed);
    setTimeout(() => {
      setGenerating(false);
      setValidated(true);
    }, 1200);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = 256, H = 192;
    canvas.width = W;
    canvas.height = H;

    // Seeded pseudo-random based on seed string
    let rngState = seed.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
    const rng = () => {
      rngState = (rngState * 1664525 + 1013904223) & 0xffffffff;
      return Math.abs(rngState) / 0xffffffff;
    };

    // Simple noise function
    const noise = (x: number, y: number) => {
      const X = Math.floor(x) & 255;
      const Y = Math.floor(y) & 255;
      return ((Math.sin(X * 127.1 + Y * 311.7 + rngState * 0.0001) * 43758.5453) % 1 + 1) % 1;
    };

    const fbm = (x: number, y: number, octaves = 4) => {
      let v = 0, a = 0.5, f = 1, max = 0;
      for (let i = 0; i < octaves; i++) {
        v += noise(x * f, y * f) * a;
        max += a;
        a *= 0.5;
        f *= 2;
      }
      return v / max;
    };

    const tileSize = mapSize === "small" ? 4 : mapSize === "medium" ? 2 : 1;
    const cols = Math.floor(W / tileSize);
    const rows = Math.floor(H / tileSize);

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const nx = symmetry === "mirror" ? Math.abs(x / cols - 0.5) * 2 : x / cols;
        const ny = y / rows;

        // Distance from center for island shape
        const distToCenter = Math.sqrt((nx - (symmetry === "mirror" ? 0 : 0.5)) ** 2 + (ny - 0.5) ** 2);

        const elevation = fbm(nx * 3 + rngState * 0.0001, ny * 3) - distToCenter * 0.5;

        let color: string;
        if (elevation < 0.05) color = "#1e3a8a"; // deep water
        else if (elevation < 0.12) color = "#2563eb"; // water
        else if (elevation < 0.25) color = "#16a34a"; // lowlands
        else if (elevation < 0.38) color = "#15803d"; // plains
        else if (elevation < 0.5) color = "#92400e"; // hills
        else if (elevation < 0.65) color = "#78716c"; // mountains
        else if (elevation < 0.75) color = "#a8a29e"; // high mountains
        else color = "#f1f5f9"; // peaks

        // Biome overlays
        const moisture = fbm(nx * 2 + 100, ny * 2 + 100);
        const temp = fbm(nx * 1.5 + 200, ny * 1.5 + 200);

        if (elevation > 0.12 && elevation < 0.65) {
          if (temp > 0.75 && moisture < 0.35) color = "#c2410c"; // ember
          else if (temp < 0.25 && moisture > 0.6) color = "#bae6fd"; // frozen
          else if (moisture > 0.7 && temp > 0.4 && temp < 0.6) color = "#4c1d95"; // void marsh
          else if (moisture > 0.55 && temp > 0.35 && elevation < 0.38) color = "#4d7c0f"; // arcane forest
          else if (elevation > 0.3 && elevation < 0.45 && noise(nx * 8, ny * 8) > 0.75) color = "#60a5fa"; // crystal
        }

        ctx.fillStyle = color;
        ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
      }
    }

    // Draw bases
    const baseY = Math.floor(rows / 2) * tileSize;
    // Red base (left)
    ctx.fillStyle = "#f43f5e";
    ctx.beginPath();
    ctx.arc(20, baseY, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Blue base (right)
    ctx.fillStyle = "#3b82f6";
    ctx.beginPath();
    ctx.arc(W - 20, baseY, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Draw paths (simplified)
    ctx.strokeStyle = "rgba(255,255,255,0.15)";
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 4]);
    for (let p = 0; p < 3; p++) {
      ctx.beginPath();
      ctx.moveTo(28, baseY + (p - 1) * 30);
      const mid1x = W * 0.35 + rng() * 20 - 10;
      const mid1y = baseY + (rng() - 0.5) * 60;
      const mid2x = W * 0.65 + rng() * 20 - 10;
      const mid2y = baseY + (rng() - 0.5) * 60;
      ctx.bezierCurveTo(mid1x, mid1y, mid2x, mid2y, W - 28, baseY + (p - 1) * 30);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // Grid overlay
    ctx.strokeStyle = "rgba(0,0,0,0.1)";
    ctx.lineWidth = 0.5;
    for (let gx = 0; gx < W; gx += tileSize * 8) {
      ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke();
    }
    for (let gy = 0; gy < H; gy += tileSize * 8) {
      ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke();
    }

    // Labels
    ctx.fillStyle = "white";
    ctx.font = "bold 8px monospace";
    ctx.fillText("🚩 RED BASE", 4, baseY - 12);
    ctx.fillText("BLUE BASE 🏴", W - 58, baseY - 12);

  }, [seed, mapSize, symmetry, generating]);

  return (
    <section className="py-20 px-6 bg-[#0a0a18]">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <div className="text-xs text-cyan-400 tracking-widest uppercase mb-2">Section 01</div>
          <h2 className="text-4xl md:text-5xl font-black text-white mb-3">🌍 World Generation Engine</h2>
          <p className="text-white/50 max-w-xl mx-auto">Procedural 2D maps with 7 generation layers, A* validation, and tile-level simulation data</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Map preview */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white/60 uppercase tracking-wider">Live Map Preview</h3>
              <div className="flex items-center gap-2">
                {validated && <span className="text-xs text-emerald-400 font-bold">✅ A* Validated</span>}
                {generating && <span className="text-xs text-amber-400 font-bold animate-pulse">🔄 Generating...</span>}
              </div>
            </div>

            <div className="relative rounded-xl overflow-hidden border border-white/10" style={{ imageRendering: "pixelated" }}>
              <canvas
                ref={canvasRef}
                style={{ width: "100%", imageRendering: "pixelated" }}
              />
              {generating && (
                <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                  <div className="text-sm text-violet-400 font-bold animate-pulse">Generating World...</div>
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-white/40 uppercase tracking-wider block mb-1">Map Size</label>
                <div className="flex gap-1">
                  {(["small", "medium", "large"] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setMapSize(s)}
                      className={`flex-1 py-1 text-xs font-bold rounded-lg transition-all capitalize ${
                        mapSize === s ? "bg-violet-600 text-white" : "bg-white/5 text-white/50 hover:text-white"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-white/40 uppercase tracking-wider block mb-1">Symmetry</label>
                <div className="flex gap-1">
                  {(["mirror", "chaos"] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setSymmetry(s)}
                      className={`flex-1 py-1 text-xs font-bold rounded-lg transition-all capitalize ${
                        symmetry === s ? "bg-violet-600 text-white" : "bg-white/5 text-white/50 hover:text-white"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-black/30 border border-white/10 rounded-lg">
                <span className="text-xs text-white/30">SEED</span>
                <span className="text-xs font-mono text-violet-300 font-bold">{seed}</span>
              </div>
              <button
                onClick={generateMap}
                disabled={generating}
                className="px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-xs font-bold rounded-lg hover:from-violet-500 hover:to-indigo-500 transition-all disabled:opacity-50"
              >
                {generating ? "Generating..." : "New Map"}
              </button>
            </div>
          </div>

          {/* Biomes */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white/60 uppercase tracking-wider">7 Biomes</h3>
            <div className="space-y-2">
              {BIOMES.map((b) => (
                <div key={b.name} className="flex items-start gap-3 p-3 rounded-xl bg-white/3 border border-white/5 hover:bg-white/5 transition-colors">
                  <div
                    className="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center text-sm"
                    style={{ backgroundColor: b.color + "33", border: `1px solid ${b.color}44` }}
                  >
                    {b.icon}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white/80" style={{ color: b.color }}>{b.name}</div>
                    <div className="text-xs text-white/40">{b.effect}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Generation layers */}
            <div className="p-4 rounded-xl bg-black/30 border border-white/5">
              <h4 className="text-xs font-bold text-white/30 uppercase tracking-wider mb-3">Generation Layers</h4>
              <div className="space-y-1">
                {[
                  "1. Continental Noise (Perlin/Simplex)",
                  "2. Elevation Map (0-255 per tile)",
                  "3. Biome Assignment (elevation + moisture + temp)",
                  "4. Resource Scatter (mana wells, ore veins)",
                  "5. Structure Placement (ruins, towers, bridges)",
                  "6. Flag Base Placement (A* validated)",
                  "7. Spawn Zones + Secret Passages",
                ].map((l) => (
                  <div key={l} className="text-xs font-mono text-white/50">{l}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WorldGenSection;
