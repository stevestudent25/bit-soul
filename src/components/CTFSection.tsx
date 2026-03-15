import { useState, useEffect } from "react";

const PHASES = [
  {
    name: "PREPARATION",
    icon: "🏗️",
    duration: "60s",
    color: "text-cyan-400",
    borderColor: "border-cyan-500/40",
    bgColor: "bg-cyan-500/10",
    desc: "Build defenses, set traps, plan routes. Architect shines here.",
    actions: ["Place defensive walls", "Deploy trap mines", "Position turrets", "Designate patrol routes", "Vote on forward outposts"],
  },
  {
    name: "BATTLE",
    icon: "⚔️",
    duration: "Main",
    color: "text-amber-400",
    borderColor: "border-amber-500/40",
    bgColor: "bg-amber-500/10",
    desc: "Full CTF gameplay. Resource control, flag runs, team coordination.",
    actions: ["Multi-lane assault", "Flag interception", "Resource denial", "Dynamic events spawn", "Relic objectives"],
  },
  {
    name: "DESPERATE HOUR",
    icon: "🔥",
    duration: "Last 120s",
    color: "text-orange-400",
    borderColor: "border-orange-500/40",
    bgColor: "bg-orange-500/10",
    desc: "All stats +20%. Respawn halved. Map hazards activate. Music intensifies.",
    actions: ["+20% all stats", "Respawn time halved", "Map hazards activate", "Music max intensity", "Corruption accelerates"],
  },
  {
    name: "OVERTIME",
    icon: "💀",
    duration: "Tied",
    color: "text-red-400",
    borderColor: "border-red-500/40",
    bgColor: "bg-red-500/10",
    desc: "First capture wins. No respawns. Map slowly collapses inward.",
    actions: ["No respawns", "Map shrinks inward", "First capture wins", "Maximum tension", "Legend moments born"],
  },
];

const FLAG_MECHANICS = [
  { icon: "⚖️", title: "Flag Physics", desc: "Physical object with weight, momentum, and collision" },
  { icon: "🏋️", title: "Carrier Penalty", desc: "-15% speed, +10% size, glows on minimap" },
  { icon: "🎯", title: "Flag Throw", desc: "Skill shot to teammates, interception possible" },
  { icon: "🫥", title: "Flag Hidden", desc: "Trickster can hide flag in terrain" },
  { icon: "📡", title: "Resonance Ping", desc: "Every 10s reveals carrier direction to enemies" },
  { icon: "⏱️", title: "Return Timer", desc: "15s timer on dropped flag, contestable" },
  { icon: "💥", title: "Flag Destroyed", desc: "Can be damaged — 60s respawn if destroyed" },
  { icon: "☠️", title: "Corruption", desc: "Holding 60s+ starts DoT — carrier gains power but dies" },
];

const CTFSection = () => {
  const [activePhase, setActivePhase] = useState(0);
  const [score] = useState({ red: 2, blue: 1 });
  const [timer, setTimer] = useState(532);
  const [flagStatus, setFlagStatus] = useState<"safe" | "taken" | "dropped">("taken");

  useEffect(() => {
    const iv = setInterval(() => {
      setTimer((t) => (t > 0 ? t - 1 : t));
    }, 1000);
    return () => clearInterval(iv);
  }, []);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  return (
    <section className="py-20 px-6 bg-[#080812]">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <div className="text-xs text-amber-400 tracking-widest uppercase mb-2">Section 03</div>
          <h2 className="text-4xl md:text-5xl font-black text-white mb-3">🏁 CTF Core Loop</h2>
          <p className="text-white/50 max-w-xl mx-auto">A 4-phase dramatic arc with physics-based flags, multi-objective strategy, and emergent moments</p>
        </div>

        {/* Live HUD preview */}
        <div className="mb-10 rounded-2xl border border-white/10 bg-black/50 p-4 font-mono text-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-red-400 font-bold">RED TEAM</span>
              <span className="text-white/50 mx-1">—</span>
              <span className="text-3xl font-black text-white">{score.red}</span>
            </div>
            <div className="text-center">
              <div className="text-xs text-white/30 uppercase tracking-wider">Timer</div>
              <div className="text-2xl font-black text-amber-400">{formatTime(timer)}</div>
              <div className={`text-xs font-bold ${timer < 120 ? "text-red-400 animate-pulse" : "text-white/30"}`}>
                {timer < 120 ? "DESPERATE HOUR" : "BATTLE"}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-3xl font-black text-white">{score.blue}</span>
              <span className="text-white/50 mx-1">—</span>
              <span className="text-blue-400 font-bold">BLUE TEAM</span>
              <div className="w-3 h-3 rounded-full bg-blue-500" />
            </div>
          </div>

          {/* Flag status */}
          <div className="flex justify-center gap-6">
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border cursor-pointer transition-all"
              style={{
                borderColor: flagStatus === "taken" ? "#f43f5e" : "#ffffff20",
                backgroundColor: flagStatus === "taken" ? "#f43f5e15" : "transparent",
              }}
              onClick={() => setFlagStatus(s => s === "taken" ? "dropped" : s === "dropped" ? "safe" : "taken")}
            >
              <span className="text-lg">🚩</span>
              <div>
                <div className="text-xs text-white/40">Red Flag</div>
                <div className={`text-xs font-bold ${flagStatus === "taken" ? "text-red-400" : flagStatus === "dropped" ? "text-amber-400" : "text-emerald-400"}`}>
                  {flagStatus === "taken" ? "STOLEN by Zyx" : flagStatus === "dropped" ? "DROPPED — 12s" : "SAFE"}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-blue-500/20 bg-blue-500/5">
              <span className="text-lg">🏴</span>
              <div>
                <div className="text-xs text-white/40">Blue Flag</div>
                <div className="text-xs font-bold text-emerald-400">SAFE at Base</div>
              </div>
            </div>
          </div>
        </div>

        {/* Match phases */}
        <div className="mb-12">
          <h3 className="text-lg font-black text-white/70 mb-4 text-center">Match Phases</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            {PHASES.map((phase, i) => (
              <button
                key={phase.name}
                onClick={() => setActivePhase(i)}
                className={`p-4 rounded-xl border text-left transition-all duration-200 ${
                  activePhase === i ? `${phase.borderColor} ${phase.bgColor}` : "border-white/10 bg-white/3 hover:bg-white/5"
                }`}
              >
                <div className="text-2xl mb-2">{phase.icon}</div>
                <div className={`text-xs font-black ${activePhase === i ? phase.color : "text-white/60"} uppercase tracking-wider`}>
                  {phase.name}
                </div>
                <div className="text-xs text-white/30 mt-0.5">{phase.duration}</div>
              </button>
            ))}
          </div>

          {/* Active phase detail */}
          <div className={`p-5 rounded-xl border ${PHASES[activePhase].borderColor} ${PHASES[activePhase].bgColor}`}>
            <p className={`text-sm font-bold ${PHASES[activePhase].color} mb-3`}>{PHASES[activePhase].desc}</p>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {PHASES[activePhase].actions.map((a) => (
                <div key={a} className="text-xs text-white/60 bg-black/30 px-2 py-1.5 rounded-lg text-center">
                  {a}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Flag mechanics */}
        <div>
          <h3 className="text-lg font-black text-white/70 mb-4 text-center">Flag Mechanics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {FLAG_MECHANICS.map((m) => (
              <div key={m.title} className="p-4 rounded-xl border border-white/10 bg-white/3 hover:bg-white/5 transition-colors">
                <div className="text-2xl mb-2">{m.icon}</div>
                <div className="text-sm font-bold text-white/80 mb-1">{m.title}</div>
                <div className="text-xs text-white/40">{m.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTFSection;
