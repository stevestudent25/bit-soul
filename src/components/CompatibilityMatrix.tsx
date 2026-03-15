import { useState } from "react";

const SYSTEMS = [
  { id: "00", name: "Project Identity", emoji: "🎯", stars: 5, compatible: "✅", priority: "🔴", phase: "NOW", improvement: "MASSIVE", category: "core" },
  { id: "01", name: "World Generation", emoji: "🌍", stars: 5, compatible: "✅", priority: "🟡", phase: "Phase 2", improvement: "CRITICAL", category: "depth" },
  { id: "02", name: "Soul Entity System", emoji: "🔮", stars: 5, compatible: "✅", priority: "🔴", phase: "Phase 1", improvement: "GAME-DEFINING", category: "core" },
  { id: "03", name: "CTF Core Loop", emoji: "🏁", stars: 5, compatible: "✅", priority: "🔴", phase: "Phase 1", improvement: "ESSENTIAL", category: "core" },
  { id: "04", name: "Physics & Environment", emoji: "⚡", stars: 4, compatible: "✅", priority: "🟡", phase: "Phase 2", improvement: "HIGH", category: "depth" },
  { id: "05", name: "AI Behavior Tree", emoji: "🧠", stars: 5, compatible: "✅", priority: "🟢", phase: "Phase 3", improvement: "GAME-CHANGING", category: "soul" },
  { id: "06", name: "Combat & Damage", emoji: "⚔️", stars: 5, compatible: "✅", priority: "🔴", phase: "Phase 1", improvement: "ESSENTIAL", category: "core" },
  { id: "07", name: "Crafting Economy", emoji: "🔧", stars: 4, compatible: "✅", priority: "🟢", phase: "Phase 4", improvement: "STRONG", category: "polish" },
  { id: "08", name: "Social & Factions", emoji: "🤝", stars: 4, compatible: "✅", priority: "🟢", phase: "Phase 3", improvement: "SIGNIFICANT", category: "soul" },
  { id: "09", name: "Procedural Lore", emoji: "📜", stars: 5, compatible: "✅", priority: "🟢", phase: "Phase 3", improvement: "MAJOR", category: "soul" },
  { id: "10", name: "Biome Engine", emoji: "🏔️", stars: 4, compatible: "✅", priority: "🟡", phase: "Phase 2", improvement: "EXCELLENT", category: "depth" },
  { id: "11", name: "Weather & Seasons", emoji: "🌦️", stars: 3, compatible: "✅", priority: "🟢", phase: "Phase 3", improvement: "STRONG", category: "soul" },
  { id: "12", name: "Sound & Music", emoji: "🔊", stars: 4, compatible: "✅", priority: "🟢", phase: "Phase 3", improvement: "HIGH", category: "soul" },
  { id: "13", name: "Multiplayer Netcode", emoji: "🌐", stars: 5, compatible: "⚠️", priority: "🟢", phase: "Phase 4", improvement: "REQUIRED", category: "polish" },
  { id: "14", name: "UI/UX & HUD", emoji: "🖥️", stars: 4, compatible: "✅", priority: "🔴", phase: "Phase 1", improvement: "ESSENTIAL", category: "core" },
  { id: "15", name: "Accessibility", emoji: "♿", stars: 4, compatible: "✅", priority: "🟢", phase: "Phase 4", improvement: "CRITICAL", category: "polish" },
  { id: "16", name: "Modding Support", emoji: "🔧", stars: 5, compatible: "⚠️", priority: "🔵", phase: "Phase 5", improvement: "LONG-TERM", category: "legacy" },
  { id: "17", name: "Performance", emoji: "⚡", stars: 5, compatible: "✅", priority: "🟡", phase: "Phase 2", improvement: "REQUIRED", category: "depth" },
  { id: "18", name: "Animation & VFX", emoji: "🎨", stars: 4, compatible: "✅", priority: "🟡", phase: "Phase 2", improvement: "HIGH", category: "depth" },
  { id: "19", name: "Save & Persistence", emoji: "💾", stars: 4, compatible: "✅", priority: "🟢", phase: "Phase 4", improvement: "ESSENTIAL", category: "polish" },
  { id: "20", name: "Endgame Loop", emoji: "🏆", stars: 5, compatible: "✅", priority: "🟢", phase: "Phase 4", improvement: "CRITICAL", category: "polish" },
];

const PHASES = [
  { name: "Phase 1 — Core", color: "from-red-600 to-rose-600", sections: ["00", "02", "03", "06", "14"], weeks: "Weeks 1–4" },
  { name: "Phase 2 — Depth", color: "from-amber-600 to-orange-600", sections: ["01", "10", "04", "18", "17"], weeks: "Weeks 5–8" },
  { name: "Phase 3 — Soul", color: "from-emerald-600 to-teal-600", sections: ["05", "09", "08", "12", "11"], weeks: "Weeks 9–12" },
  { name: "Phase 4 — Polish", color: "from-blue-600 to-indigo-600", sections: ["07", "13", "15", "19", "20"], weeks: "Weeks 13–16" },
  { name: "Phase 5 — Legacy", color: "from-violet-600 to-purple-600", sections: ["16"], weeks: "Post-Launch" },
];

const StarRating = ({ count }: { count: number }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((i) => (
      <span key={i} className={`text-xs ${i <= count ? "text-amber-400" : "text-white/10"}`}>★</span>
    ))}
  </div>
);

const CompatibilityMatrix = () => {
  const [filter, setFilter] = useState<string>("all");
  const [view, setView] = useState<"matrix" | "phases">("matrix");

  const filtered = filter === "all" ? SYSTEMS : SYSTEMS.filter((s) => s.phase === filter || s.category === filter);

  return (
    <section className="py-20 px-6 bg-[#0a0a18]">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <div className="text-xs text-amber-400 tracking-widest uppercase mb-2">Master Overview</div>
          <h2 className="text-4xl md:text-5xl font-black text-white mb-3">📊 System Matrix</h2>
          <p className="text-white/50 max-w-xl mx-auto">20 interconnected systems with improvement ratings, compatibility, and implementation priority</p>
        </div>

        {/* View toggle */}
        <div className="flex justify-center gap-2 mb-6">
          <button
            onClick={() => setView("matrix")}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${view === "matrix" ? "bg-violet-600 text-white" : "bg-white/5 text-white/50 hover:text-white"}`}
          >
            System Matrix
          </button>
          <button
            onClick={() => setView("phases")}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${view === "phases" ? "bg-violet-600 text-white" : "bg-white/5 text-white/50 hover:text-white"}`}
          >
            Phase Roadmap
          </button>
        </div>

        {view === "matrix" && (
          <>
            {/* Filter tabs */}
            <div className="flex flex-wrap gap-2 justify-center mb-6">
              {[
                { key: "all", label: "All 20" },
                { key: "core", label: "🔴 Core" },
                { key: "depth", label: "🟡 Depth" },
                { key: "soul", label: "🟢 Soul" },
                { key: "polish", label: "🔵 Polish" },
                { key: "legacy", label: "⚫ Legacy" },
              ].map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                    filter === f.key ? "bg-violet-600 text-white" : "bg-white/5 text-white/40 hover:text-white"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Table */}
            <div className="rounded-2xl border border-white/10 overflow-hidden">
              <div className="grid grid-cols-6 gap-0 p-3 bg-white/5 text-xs font-bold text-white/30 uppercase tracking-wider border-b border-white/5">
                <div>#</div>
                <div className="col-span-2">System</div>
                <div>Improvement</div>
                <div>Compatible</div>
                <div>Priority</div>
              </div>
              <div className="divide-y divide-white/5">
                {filtered.map((sys) => (
                  <div
                    key={sys.id}
                    className="grid grid-cols-6 gap-0 p-3 hover:bg-white/3 transition-colors items-center"
                  >
                    <div className="text-xs text-white/30 font-mono">#{sys.id}</div>
                    <div className="col-span-2 flex items-center gap-2">
                      <span>{sys.emoji}</span>
                      <div>
                        <div className="text-sm font-bold text-white/80">{sys.name}</div>
                        <StarRating count={sys.stars} />
                      </div>
                    </div>
                    <div className="text-xs font-bold text-violet-300">{sys.improvement}</div>
                    <div className="text-sm">{sys.compatible}</div>
                    <div className="flex items-center gap-1">
                      <span>{sys.priority}</span>
                      <span className="text-xs text-white/30">{sys.phase}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 justify-center mt-4 text-xs text-white/40">
              <span>🔴 Critical — Build Now</span>
              <span>🟡 Important — Phase 2</span>
              <span>🟢 Enhancing — Phase 3-4</span>
              <span>🔵 Post-Launch</span>
              <span>⚠️ Requires early arch decisions</span>
            </div>
          </>
        )}

        {view === "phases" && (
          <div className="space-y-4">
            {PHASES.map((phase) => (
              <div key={phase.name} className="rounded-2xl border border-white/10 overflow-hidden">
                <div className={`px-6 py-3 bg-gradient-to-r ${phase.color} flex items-center justify-between`}>
                  <span className="font-black text-white">{phase.name}</span>
                  <span className="text-white/70 text-sm">{phase.weeks}</span>
                </div>
                <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                  {phase.sections.map((secId) => {
                    const sys = SYSTEMS.find((s) => s.id === secId);
                    if (!sys) return null;
                    return (
                      <div key={secId} className="p-3 rounded-xl bg-white/5 border border-white/10 text-center">
                        <div className="text-xl mb-1">{sys.emoji}</div>
                        <div className="text-xs font-bold text-white/70 leading-tight">{sys.name}</div>
                        <StarRating count={sys.stars} />
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default CompatibilityMatrix;
