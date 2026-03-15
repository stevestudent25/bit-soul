import { useState, useEffect } from "react";

const EMOTIONAL_STATES = [
  { name: "CALM", color: "#10b981", desc: "Default, balanced decisions", stats: { dmg: 0, spd: 0, acc: 0 } },
  { name: "ENRAGED", color: "#ef4444", desc: "+30% damage, -20% accuracy, tunnel vision", stats: { dmg: 30, spd: 5, acc: -20 } },
  { name: "FEARFUL", color: "#f59e0b", desc: "+20% speed, -30% damage, avoids combat", stats: { dmg: -30, spd: 20, acc: -10 } },
  { name: "CONFIDENT", color: "#3b82f6", desc: "+10% all stats, takes more risks", stats: { dmg: 10, spd: 10, acc: 10 } },
  { name: "DESPERATE", color: "#dc2626", desc: "Ignores self-preservation, all-in attacks", stats: { dmg: 25, spd: 15, acc: -15 } },
  { name: "VENGEFUL", color: "#a855f7", desc: "Locks onto killer, ignores objectives", stats: { dmg: 40, spd: 10, acc: -5 } },
  { name: "INSPIRED", color: "#fbbf24", desc: "+15% all stats for 20s after ally epic play", stats: { dmg: 15, spd: 15, acc: 15 } },
  { name: "CORRUPTED", color: "#6d28d9", desc: "Holding flag too long — erratic behavior", stats: { dmg: 20, spd: -10, acc: -25 } },
];

const PULSE_TYPES = [
  { color: "#ef4444", label: "RED", meaning: "Enemy here!", icon: "⚠️" },
  { color: "#3b82f6", label: "BLUE", meaning: "Regroup on me!", icon: "🔵" },
  { color: "#10b981", label: "GREEN", meaning: "Flag is clear, go!", icon: "✅" },
  { color: "#fbbf24", label: "YELLOW", meaning: "Need healing!", icon: "💛" },
  { color: "#a855f7", label: "PURPLE", meaning: "Passing flag to you!", icon: "🔮" },
];

const BT_NODES = [
  { label: "SURVIVAL", priority: "HIGHEST", color: "text-red-400", children: ["hp < 20% → FLEE", "on_fire → SEEK water", "mana = 0 → RETREAT", "outnumbered 3:1 → CALL_HELP"] },
  { label: "OBJECTIVE", priority: "HIGH", color: "text-amber-400", children: ["flag stolen → PURSUE", "flag available → EVALUATE", "carrying flag → PATHFIND", "flag dropped → RACE"] },
  { label: "COMBAT", priority: "MED", color: "text-orange-400", children: ["threat evaluation", "personality-based targeting", "range management by class", "dodge projectiles"] },
  { label: "SOCIAL", priority: "MED", color: "text-blue-400", children: ["ally died → morale debuff", "rival present → prioritize", "grateful → protect ally", "bored → ROAM"] },
  { label: "STRATEGY", priority: "LOW", color: "text-violet-400", children: ["role assignment", "pincer movement", "distraction plays", "relay flag chains"] },
  { label: "IDLE", priority: "LOWEST", color: "text-white/40", children: ["curiosity → EXPLORE", "greed → COLLECT", "social → GROUP", "creativity → UNUSUAL"] },
];

const AISection = () => {
  const [activeEmotion, setActiveEmotion] = useState(0);
  const [pulsing, setPulsing] = useState<number | null>(null);
  const [btOpen, setBtOpen] = useState<number | null>(null);
  const [simLog, setSimLog] = useState<string[]>([
    "[AI] Zyx evaluates threat: Kael at 18% HP → ENRAGED",
    "[AI] Mira detects flag dropped — RACE priority activated",
    "[AI] Orix (courage: 0.2) outnumbered — CALL_FOR_HELP pulse sent",
  ]);

  useEffect(() => {
    const events = [
      "[AI] Thex enters VENGEFUL state — will pursue Kael exclusively",
      "[AI] Pyra (patience: 0.8) enters defensive patrol — 45s no action",
      "[AI] Nael detects rival Zyx → targeting priority overridden",
      "[AI] Guardian team role assigned: Vorn (patience: 0.9) → defend base",
      "[AI] Pincer movement initiated: 2 souls split-lane assault",
      "[AI] Mira social bond with Orix → protecting soul in combat",
      "[AI] Trickster ambush from shadow — waiting for flag carrier",
      "[AI] Low courage (0.2) Soul — fleeing at 79% HP threshold",
    ];
    const iv = setInterval(() => {
      setSimLog((prev) => [events[Math.floor(Math.random() * events.length)], ...prev.slice(0, 5)]);
    }, 2500);
    return () => clearInterval(iv);
  }, []);

  const emotion = EMOTIONAL_STATES[activeEmotion];

  return (
    <section className="py-20 px-6 bg-[#080812]">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <div className="text-xs text-emerald-400 tracking-widest uppercase mb-2">Section 05</div>
          <h2 className="text-4xl md:text-5xl font-black text-white mb-3">🧠 AI Behavior Tree</h2>
          <p className="text-white/50 max-w-xl mx-auto">deep-simulation-level AI with behavior trees, emotional states, personality-driven decisions, and team strategy</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Left: Behavior tree */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white/60 uppercase tracking-wider">Behavior Tree (Priority Order)</h3>
            <div className="space-y-2">
              {BT_NODES.map((node, i) => (
                <div key={node.label} className="rounded-xl border border-white/10 overflow-hidden">
                  <button
                    onClick={() => setBtOpen(btOpen === i ? null : i)}
                    className="w-full flex items-center justify-between p-3 hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-black ${node.color}`}>{i + 1}</span>
                      <span className={`text-sm font-bold ${node.color}`}>{node.label}</span>
                      <span className="text-xs text-white/30 bg-white/5 px-2 py-0.5 rounded-full">{node.priority}</span>
                    </div>
                    <span className="text-white/30 text-xs">{btOpen === i ? "▲" : "▼"}</span>
                  </button>
                  {btOpen === i && (
                    <div className="px-3 pb-3 space-y-1 border-t border-white/5">
                      {node.children.map((c) => (
                        <div key={c} className="flex items-center gap-2 text-xs text-white/50 font-mono pl-4">
                          <span className="text-white/20">├─</span> {c}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* AI Sim log */}
            <div className="p-4 rounded-xl bg-black/50 border border-white/5 font-mono">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs text-emerald-400 font-bold uppercase tracking-wider">Live AI Log</span>
              </div>
              <div className="space-y-1">
                {simLog.map((log, i) => (
                  <div
                    key={i}
                    className="text-xs text-white/50 transition-all"
                    style={{ opacity: 1 - i * 0.15 }}
                  >
                    {log}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Emotional states + pulse system */}
          <div className="space-y-6">
            {/* Emotional states */}
            <div>
              <h3 className="text-sm font-bold text-white/60 uppercase tracking-wider mb-3">Emotional State Machine</h3>
              <div className="grid grid-cols-4 gap-1.5 mb-3">
                {EMOTIONAL_STATES.map((e, i) => (
                  <button
                    key={e.name}
                    onClick={() => setActiveEmotion(i)}
                    className="p-2 rounded-lg border text-xs font-bold text-center transition-all"
                    style={{
                      borderColor: activeEmotion === i ? e.color : "rgba(255,255,255,0.05)",
                      backgroundColor: activeEmotion === i ? e.color + "22" : "transparent",
                      color: activeEmotion === i ? e.color : "rgba(255,255,255,0.3)",
                    }}
                  >
                    {e.name}
                  </button>
                ))}
              </div>

              {/* Active emotion detail */}
              <div
                className="p-4 rounded-xl border"
                style={{ borderColor: emotion.color + "44", backgroundColor: emotion.color + "11" }}
              >
                <div className="font-bold text-sm mb-1" style={{ color: emotion.color }}>{emotion.name}</div>
                <p className="text-xs text-white/60 mb-3">{emotion.desc}</p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: "Damage", val: emotion.stats.dmg },
                    { label: "Speed", val: emotion.stats.spd },
                    { label: "Accuracy", val: emotion.stats.acc },
                  ].map((s) => (
                    <div key={s.label} className="text-center p-2 rounded-lg bg-black/30">
                      <div className="text-xs text-white/40">{s.label}</div>
                      <div className={`text-lg font-black ${s.val > 0 ? "text-emerald-400" : s.val < 0 ? "text-red-400" : "text-white/30"}`}>
                        {s.val > 0 ? "+" : ""}{s.val}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Pulse communication */}
            <div>
              <h3 className="text-sm font-bold text-white/60 uppercase tracking-wider mb-3">Communication Pulse System</h3>
              <div className="space-y-2">
                {PULSE_TYPES.map((p, i) => (
                  <button
                    key={p.label}
                    onClick={() => {
                      setPulsing(i);
                      setTimeout(() => setPulsing(null), 1000);
                    }}
                    className="w-full flex items-center gap-3 p-3 rounded-xl border border-white/10 hover:bg-white/5 transition-all text-left"
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 transition-all"
                      style={{
                        backgroundColor: p.color + "33",
                        border: `2px solid ${p.color}`,
                        boxShadow: pulsing === i ? `0 0 20px ${p.color}` : "none",
                        transform: pulsing === i ? "scale(1.3)" : "scale(1)",
                      }}
                    >
                      {p.icon}
                    </div>
                    <div>
                      <span className="text-xs font-bold" style={{ color: p.color }}>{p.label} PULSE</span>
                      <p className="text-xs text-white/40">{p.meaning}</p>
                    </div>
                    <span className="ml-auto text-xs text-white/20">Tap</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AISection;
