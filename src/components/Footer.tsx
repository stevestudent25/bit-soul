import AnimatedSoul from "./AnimatedSoul";

const Footer = () => {
  return (
    <footer className="bg-[#05050f] border-t border-white/5 py-16 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-12">
          {/* Logo */}
          <div className="flex items-center gap-4">
            <AnimatedSoul color="#a855f7" secondaryColor="#3b0764" size={56} trail={false} />
            <div>
              <div className="text-2xl font-black text-white">BIT-SOUL</div>
              <div className="text-sm text-violet-400/70">Living World CTF Simulation</div>
            </div>
          </div>

          {/* Taglines */}
          <div className="text-center">
            <div className="text-white/30 text-sm italic">"Every soul has a story. Every match writes history."</div>
          </div>

          {/* Stats */}
          <div className="flex gap-6 text-center">
            {[
              { val: "20", label: "Systems" },
              { val: "7", label: "Biomes" },
              { val: "∞", label: "Stories" },
            ].map((s) => (
              <div key={s.label}>
                <div className="text-xl font-black text-violet-300">{s.val}</div>
                <div className="text-xs text-white/30 uppercase tracking-wider">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Phase summary */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-10">
          {[
            { phase: "Phase 1", label: "Core", color: "from-red-600 to-rose-600", weeks: "Wk 1-4" },
            { phase: "Phase 2", label: "Depth", color: "from-amber-600 to-orange-600", weeks: "Wk 5-8" },
            { phase: "Phase 3", label: "Soul", color: "from-emerald-600 to-teal-600", weeks: "Wk 9-12" },
            { phase: "Phase 4", label: "Polish", color: "from-blue-600 to-indigo-600", weeks: "Wk 13-16" },
            { phase: "Phase 5", label: "Legacy", color: "from-violet-600 to-purple-600", weeks: "Post-Launch" },
          ].map((p) => (
            <div
              key={p.phase}
              className={`p-3 rounded-xl bg-gradient-to-br ${p.color} bg-opacity-20 text-center border border-white/10`}
            >
              <div className="text-xs font-black text-white">{p.phase}</div>
              <div className="text-sm font-bold text-white/70">{p.label}</div>
              <div className="text-xs text-white/40">{p.weeks}</div>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="border-t border-white/5 pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-white/20">
          <div>BIT-SOUL — deep-simulation × CTF. All systems modular, event-driven, moddable.</div>
          <div className="flex items-center gap-4">
            <span>Simulation-First Design</span>
            <span>•</span>
            <span>Emergent Gameplay</span>
            <span>•</span>
            <span>Infinite Replayability</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
