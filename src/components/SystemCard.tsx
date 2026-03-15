import { useState, ReactNode } from "react";

interface CompareRow {
  aspect: string;
  before: string;
  after: string;
}

interface SystemCardProps {
  id: string;
  number: string;
  title: string;
  emoji: string;
  phase: string;
  phaseColor: string;
  priority: string;
  priorityColor: string;
  stars: number;
  accentColor: string;
  borderColor: string;
  description: string;
  features: string[];
  compareRows: CompareRow[];
  verdict: string;
  children?: ReactNode;
}

const StarRating = ({ count }: { count: number }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((i) => (
      <span key={i} className={i <= count ? "text-amber-400" : "text-white/10"}>★</span>
    ))}
  </div>
);

const SystemCard = ({
  id,
  number,
  title,
  emoji,
  phase,
  phaseColor,
  priority,
  priorityColor,
  stars,
  accentColor,
  borderColor,
  description,
  features,
  compareRows,
  verdict,
  children,
}: SystemCardProps) => {
  const [expanded, setExpanded] = useState(false);
  const [tab, setTab] = useState<"features" | "compare">("features");

  return (
    <div
      id={id}
      className={`relative rounded-2xl bg-[#0d0d1f] border ${borderColor} overflow-hidden card-hover transition-all duration-300`}
    >
      {/* Accent top bar */}
      <div className={`h-1 w-full bg-gradient-to-r ${accentColor}`} />

      {/* Header */}
      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${accentColor} flex items-center justify-center text-2xl font-black text-white shrink-0`}>
              {emoji}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold text-white/30 tracking-widest">#{number}</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${phaseColor}`}>{phase}</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${priorityColor}`}>{priority}</span>
              </div>
              <h3 className="text-xl font-black text-white leading-tight">{title}</h3>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <StarRating count={stars} />
            <button
              onClick={() => setExpanded(!expanded)}
              className={`text-xs font-bold px-3 py-1 rounded-full transition-all ${
                expanded
                  ? "bg-white/10 text-white"
                  : `bg-gradient-to-r ${accentColor} text-white`
              }`}
            >
              {expanded ? "Collapse" : "Explore"}
            </button>
          </div>
        </div>

        <p className="mt-4 text-sm text-white/60 leading-relaxed">{description}</p>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="px-6 pb-6 border-t border-white/5 pt-4">
          {/* Tabs */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setTab("features")}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${
                tab === "features" ? `bg-gradient-to-r ${accentColor} text-white` : "bg-white/5 text-white/50 hover:text-white"
              }`}
            >
              Key Features
            </button>
            <button
              onClick={() => setTab("compare")}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${
                tab === "compare" ? `bg-gradient-to-r ${accentColor} text-white` : "bg-white/5 text-white/50 hover:text-white"
              }`}
            >
              Before vs After
            </button>
          </div>

          {tab === "features" && (
            <div className="space-y-2">
              {features.map((f, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-white/70">
                  <span className="text-violet-400 mt-0.5 shrink-0">▸</span>
                  <span>{f}</span>
                </div>
              ))}
              {children && <div className="mt-4">{children}</div>}
            </div>
          )}

          {tab === "compare" && (
            <div className="space-y-2">
              <div className="grid grid-cols-3 gap-2 text-xs font-bold text-white/40 uppercase tracking-wider mb-2">
                <div>Aspect</div>
                <div className="text-red-400/70">Before</div>
                <div className="text-emerald-400/70">After</div>
              </div>
              {compareRows.map((row, i) => (
                <div key={i} className="grid grid-cols-3 gap-2 p-2 rounded-lg bg-white/3 text-xs">
                  <div className="font-bold text-white/70">{row.aspect}</div>
                  <div className="text-red-400/80">{row.before}</div>
                  <div className="text-emerald-400/80">{row.after}</div>
                </div>
              ))}
              <div className={`mt-3 p-3 rounded-lg bg-gradient-to-r ${accentColor} bg-opacity-10`}>
                <p className="text-xs font-bold text-white/90">✅ VERDICT: {verdict}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SystemCard;
