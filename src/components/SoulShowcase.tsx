import { useState } from "react";
import AnimatedSoul from "./AnimatedSoul";

const CLASSES = [
  {
    name: "Striker",
    color: "#f43f5e",
    secondary: "#7f1d1d",
    role: "Assault / Kill Carrier",
    specialty: "High damage, low HP",
    stats: { hp: 35, speed: 80, power: 95, armor: 25, mana: 50 },
    abilities: ["Soul Slam", "Piercing Ray", "Frenzy", "⭐ Supernova"],
    personality: { aggression: 0.9, loyalty: 0.5, courage: 0.85, curiosity: 0.3 },
    mutations: ["Volatile Core", "Glass Cannon Core", "Thermal Runaway"],
    bgColor: "from-red-950/40 to-rose-900/20",
    border: "border-red-800/30",
  },
  {
    name: "Guardian",
    color: "#3b82f6",
    secondary: "#1e3a8a",
    role: "Defend Flag Base",
    specialty: "Shields, walls, crowd control",
    stats: { hp: 95, speed: 40, power: 55, armor: 90, mana: 65 },
    abilities: ["Shield Wall", "Taunt Pulse", "Fortress", "⭐ Aegis Dome"],
    personality: { aggression: 0.3, loyalty: 0.95, courage: 0.75, curiosity: 0.2 },
    mutations: ["Magnetic Shell", "Echo Split", "Mana Leech"],
    bgColor: "from-blue-950/40 to-blue-900/20",
    border: "border-blue-800/30",
  },
  {
    name: "Courier",
    color: "#10b981",
    secondary: "#064e3b",
    role: "Carry the Flag",
    specialty: "Speed, evasion, stealth",
    stats: { hp: 50, speed: 98, power: 45, armor: 35, mana: 70 },
    abilities: ["Phase Dash", "Slipstream", "Smoke Screen", "⭐ Warp Capture"],
    personality: { aggression: 0.2, loyalty: 0.7, courage: 0.6, curiosity: 0.8 },
    mutations: ["Phase Drift", "Void Touched", "Echo Split"],
    bgColor: "from-emerald-950/40 to-green-900/20",
    border: "border-emerald-800/30",
  },
  {
    name: "Trickster",
    color: "#a855f7",
    secondary: "#3b0764",
    role: "Disrupt & Deceive",
    specialty: "Traps, clones, illusions",
    stats: { hp: 55, speed: 72, power: 70, armor: 40, mana: 90 },
    abilities: ["Decoy Soul", "Trap Mine", "Shadow Swap", "⭐ Mirror Match"],
    personality: { aggression: 0.6, loyalty: 0.4, courage: 0.55, curiosity: 0.95 },
    mutations: ["Phase Drift", "Void Touched", "Magnetic Shell"],
    bgColor: "from-purple-950/40 to-violet-900/20",
    border: "border-purple-800/30",
  },
  {
    name: "Architect",
    color: "#f59e0b",
    secondary: "#78350f",
    role: "Build & Terraform",
    specialty: "Turrets, bridges, walls",
    stats: { hp: 65, speed: 55, power: 60, armor: 60, mana: 80 },
    abilities: ["Build Wall", "Turret Deploy", "Repair Pulse", "⭐ Citadel"],
    personality: { aggression: 0.2, loyalty: 0.8, courage: 0.45, curiosity: 0.7 },
    mutations: ["Mana Leech", "Echo Split", "Thermal Runaway"],
    bgColor: "from-amber-950/40 to-yellow-900/20",
    border: "border-amber-800/30",
  },
];

const StatBar = ({ label, value, color }: { label: string; value: number; color: string }) => (
  <div className="flex items-center gap-2">
    <span className="text-xs text-white/40 w-12 shrink-0">{label}</span>
    <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${value}%`, backgroundColor: color }}
      />
    </div>
    <span className="text-xs text-white/50 w-6 text-right">{value}</span>
  </div>
);

const PersonalityBar = ({ label, value }: { label: string; value: number }) => (
  <div className="flex items-center gap-2">
    <span className="text-xs text-white/40 w-14 shrink-0 capitalize">{label}</span>
    <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full bg-gradient-to-r from-violet-500 to-pink-500 transition-all duration-700"
        style={{ width: `${value * 100}%` }}
      />
    </div>
  </div>
);

const SoulShowcase = () => {
  const [selected, setSelected] = useState(0);
  const cls = CLASSES[selected];

  return (
    <section className="py-20 px-6 bg-[#0a0a18]">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <div className="text-xs text-violet-400 tracking-widest uppercase mb-2">Section 02</div>
          <h2 className="text-4xl md:text-5xl font-black text-white mb-3">🔮 Soul Entity System</h2>
          <p className="text-white/50 max-w-xl mx-auto">Every character is a sentient magical sphere with 60+ properties, personality, memories, and relationships</p>
        </div>

        {/* Class selector */}
        <div className="flex justify-center gap-3 flex-wrap mb-10">
          {CLASSES.map((c, i) => (
            <button
              key={c.name}
              onClick={() => setSelected(i)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-bold transition-all duration-200 ${
                selected === i
                  ? `bg-gradient-to-r from-[${c.color}22] to-transparent ${c.border} text-white scale-105`
                  : "bg-white/5 border-white/10 text-white/50 hover:text-white"
              }`}
              style={selected === i ? { borderColor: c.color + "55", color: c.color } : {}}
            >
              {c.name}
            </button>
          ))}
        </div>

        {/* Class detail */}
        <div className={`rounded-2xl bg-gradient-to-br ${cls.bgColor} border ${cls.border} p-6 md:p-8 grid md:grid-cols-2 gap-8`}>
          {/* Left: Soul + info */}
          <div className="flex flex-col items-center md:items-start gap-6">
            <div className="flex items-center gap-6">
              <AnimatedSoul
                color={cls.color}
                secondaryColor={cls.secondary}
                size={100}
                animated
                floatDelay={0}
              />
              <div>
                <h3 className="text-3xl font-black text-white">{cls.name}</h3>
                <p className="text-sm font-bold" style={{ color: cls.color }}>{cls.role}</p>
                <p className="text-xs text-white/50 mt-1">{cls.specialty}</p>
              </div>
            </div>

            {/* Combat stats */}
            <div className="w-full space-y-2">
              <h4 className="text-xs font-bold text-white/40 uppercase tracking-wider mb-3">Combat Stats</h4>
              <StatBar label="HP" value={cls.stats.hp} color={cls.color} />
              <StatBar label="Speed" value={cls.stats.speed} color={cls.color} />
              <StatBar label="Power" value={cls.stats.power} color={cls.color} />
              <StatBar label="Armor" value={cls.stats.armor} color={cls.color} />
              <StatBar label="Mana" value={cls.stats.mana} color={cls.color} />
            </div>

            {/* Personality axes */}
            <div className="w-full space-y-2">
              <h4 className="text-xs font-bold text-white/40 uppercase tracking-wider mb-3">Personality Matrix</h4>
              {Object.entries(cls.personality).map(([k, v]) => (
                <PersonalityBar key={k} label={k} value={v} />
              ))}
            </div>
          </div>

          {/* Right: Abilities + mutations */}
          <div className="space-y-6">
            {/* Abilities */}
            <div>
              <h4 className="text-xs font-bold text-white/40 uppercase tracking-wider mb-3">Abilities</h4>
              <div className="grid grid-cols-2 gap-2">
                {cls.abilities.map((ab, i) => (
                  <div
                    key={ab}
                    className={`p-3 rounded-xl border text-sm font-bold ${
                      i === 3
                        ? "col-span-2 border-amber-500/40 bg-amber-500/10 text-amber-300"
                        : "border-white/10 bg-white/5 text-white/80"
                    }`}
                  >
                    {ab}
                  </div>
                ))}
              </div>
            </div>

            {/* Body parts */}
            <div>
              <h4 className="text-xs font-bold text-white/40 uppercase tracking-wider mb-3">Body System (DF-Style)</h4>
              <div className="space-y-2">
                {[
                  { name: "Outer Shell", hp: 50, material: "crystal", color: "#06b6d4" },
                  { name: "Inner Core", hp: 100, material: "mana_plasma", color: "#a855f7" },
                  { name: "Eye Sensor", hp: 20, material: "lens", color: "#f59e0b" },
                  { name: "Propulsion Jet", hp: 30, material: "plasma", color: "#f43f5e" },
                  { name: "Mana Channel", hp: 40, material: "arcane", color: "#10b981" },
                ].map((part) => (
                  <div key={part.name} className="flex items-center gap-3 p-2 rounded-lg bg-white/3">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: part.color }} />
                    <span className="text-xs text-white/70 flex-1">{part.name}</span>
                    <span className="text-xs text-white/30">{part.material}</span>
                    <div className="w-16 h-1 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${(part.hp / 100) * 100}%`, backgroundColor: part.color }} />
                    </div>
                    <span className="text-xs text-white/40 w-6">{part.hp}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Mutations */}
            <div>
              <h4 className="text-xs font-bold text-white/40 uppercase tracking-wider mb-3">Common Mutations</h4>
              <div className="flex flex-wrap gap-2">
                {cls.mutations.map((m) => (
                  <span
                    key={m}
                    className="text-xs px-3 py-1 rounded-full bg-violet-500/15 border border-violet-500/30 text-violet-300 font-bold"
                  >
                    {m}
                  </span>
                ))}
              </div>
            </div>

            {/* Sample memory entry */}
            <div className="p-3 rounded-xl bg-black/30 border border-white/5">
              <h4 className="text-xs font-bold text-white/30 uppercase tracking-wider mb-2">Memory Log</h4>
              <div className="space-y-1 text-xs text-white/50 font-mono">
                <div>► killed_by: "Zyx_UUID" × 3 — <span className="text-red-400">rage</span></div>
                <div>► captured_flag × 5 — <span className="text-amber-400">pride</span></div>
                <div>► saved_by: "Kael_UUID" × 1 — <span className="text-emerald-400">gratitude</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SoulShowcase;
