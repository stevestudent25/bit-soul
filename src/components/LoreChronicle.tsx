import { useState, useEffect } from "react";

const NAME_PREFIXES = ["Zyx", "Kael", "Mira", "Thex", "Vorn", "Orix", "Nael", "Pyra", "Quix", "Roth", "Ixen", "Daev"];
const NAME_SUFFIXES = ["the Bold", "the Volatile", "Flameheart", "Voidwalker", "Ironshell", "Swiftdrift", "Shadowmeld", "Crystalborn", "Duskbane", "the Eternal"];
const MAP_NAMES = ["Ember Confluence", "Void Marshlands", "Crystal Abyss", "Shattered Peaks", "Arcane Nexus", "Frozen Rift", "Neon Catacombs", "The Burning Pass"];
const CLASSES = ["Striker", "Guardian", "Courier", "Trickster", "Architect"];
const ACHIEVEMENTS = ["destroyed 47 tiles with Supernova", "captured the flag 3 times in 4 minutes", "defended their base 9 times without dying", "passed the flag 5 times in a single run", "built a fortress in 15 seconds"];
const DRAMATIC_EVENTS = ["A Void Eclipse plunged the battlefield into darkness", "The bridge collapsed, stranding 3 souls", "Crystal showers rained down, reshaping the terrain", "A mana surge empowered the attackers", "Fire spread across the Ember Fields, cutting off escape routes"];

function rng(seed: number) {
  const x = Math.sin(seed) * 43758.5453;
  return x - Math.floor(x);
}

function pick<T>(arr: T[], seed: number): T {
  return arr[Math.floor(rng(seed) * arr.length)];
}

function generateChronicle(seed: number) {
  const winner = rng(seed) > 0.5 ? "The Radiant Collective" : "The Void Syndicate";
  const loser = winner === "The Radiant Collective" ? "The Void Syndicate" : "The Radiant Collective";
  const scoreA = Math.floor(rng(seed + 1) * 5) + 3;
  const scoreB = Math.floor(rng(seed + 2) * scoreA);
  const mvp = `${pick(NAME_PREFIXES, seed + 3)} ${pick(NAME_SUFFIXES, seed + 4)}`;
  const mvpClass = pick(CLASSES, seed + 5);
  const rival1 = `${pick(NAME_PREFIXES, seed + 6)} ${pick(NAME_SUFFIXES, seed + 7)}`;
  const rival2 = `${pick(NAME_PREFIXES, seed + 8)} ${pick(NAME_SUFFIXES, seed + 9)}`;
  const clashCount = Math.floor(rng(seed + 10) * 8) + 4;
  const mapName = pick(MAP_NAMES, seed + 11);
  const achievement = pick(ACHIEVEMENTS, seed + 12);
  const dramaticEvent = pick(DRAMATIC_EVENTS, seed + 13);
  const defender = `${pick(NAME_PREFIXES, seed + 14)} ${pick(NAME_SUFFIXES, seed + 15)}`;
  const defenseCount = Math.floor(rng(seed + 16) * 7) + 3;

  return {
    title: `The Battle of ${mapName}`,
    body: `In the Battle of ${mapName}, ${winner} claimed victory ${scoreA} to ${scoreB}. ${mvp} the ${mvpClass} earned glory by having ${achievement}. A fierce rivalry deepened between ${rival1} and ${rival2}, who clashed ${clashCount} times. ${dramaticEvent}, marking the turning point of the battle. The ${loser} fought valiantly, with ${defender} defending their flag ${defenseCount} times before the end.`,
    mvp,
    mapName,
    score: `${scoreA} — ${scoreB}`,
    winner,
  };
}

const TITLES = [
  { name: "Flag Thief", req: "50 lifetime captures", rarity: "Gold" },
  { name: "Immortal", req: "10 kills without dying", rarity: "Legendary" },
  { name: "Architect Supreme", req: "500 structures built", rarity: "Gold" },
  { name: "The Untouchable", req: "Won without taking damage", rarity: "Legendary" },
  { name: "Worldbreaker", req: "Destroyed 1000 tiles total", rarity: "Legendary" },
  { name: "The Eternal", req: "Prestige 10 any class", rarity: "Mythic" },
  { name: "Rivalborn", req: "3 active nemeses simultaneously", rarity: "Silver" },
  { name: "Chronicler", req: "Read 100 legend entries", rarity: "Silver" },
];

const LoreChronicle = () => {
  const [seed, setSeed] = useState(42);
  const [chronicle, setChronicle] = useState(generateChronicle(42));
  const [animating, setAnimating] = useState(false);

  const generateNew = () => {
    setAnimating(true);
    const newSeed = Math.floor(Math.random() * 10000);
    setTimeout(() => {
      setSeed(newSeed);
      setChronicle(generateChronicle(newSeed));
      setAnimating(false);
    }, 600);
  };

  useEffect(() => {
    const iv = setInterval(generateNew, 8000);
    return () => clearInterval(iv);
  }, []);

  return (
    <section className="py-20 px-6 bg-[#0a0a18]">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <div className="text-xs text-violet-400 tracking-widest uppercase mb-2">Section 09</div>
          <h2 className="text-4xl md:text-5xl font-black text-white mb-3">📜 Procedural Lore Engine</h2>
          <p className="text-white/50 max-w-xl mx-auto">Every match auto-generates a Chronicle Entry. The world writes its own legends.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Chronicle generator */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white/60 uppercase tracking-wider">📖 Library of Echoes</h3>
              <button
                onClick={generateNew}
                className="px-3 py-1.5 text-xs font-bold bg-violet-600 hover:bg-violet-500 text-white rounded-lg transition-all"
              >
                Generate Chronicle
              </button>
            </div>

            <div
              className={`p-6 rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-950/40 to-indigo-950/30 transition-all duration-500 ${
                animating ? "opacity-0 scale-95" : "opacity-100 scale-100"
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="text-xs text-violet-400 uppercase tracking-widest mb-1">Chronicle Entry #{seed.toString().padStart(4, "0")}</div>
                  <h4 className="text-xl font-black text-white">{chronicle.title}</h4>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs text-white/30">Score</div>
                  <div className="text-lg font-black text-amber-400">{chronicle.score}</div>
                </div>
              </div>

              {/* Body text */}
              <p className="text-sm text-white/70 leading-relaxed italic border-l-2 border-violet-500/40 pl-4 mb-4">
                "{chronicle.body}"
              </p>

              {/* MVP badge */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <span className="text-2xl">⭐</span>
                <div>
                  <div className="text-xs text-amber-400/70 uppercase tracking-wider">Match Legend</div>
                  <div className="font-bold text-amber-300">{chronicle.mvp}</div>
                </div>
                <div className="ml-auto">
                  <div className="text-xs text-white/30">Victory</div>
                  <div className="text-xs font-bold text-emerald-400">{chronicle.winner}</div>
                </div>
              </div>
            </div>

            {/* World history */}
            <div className="p-4 rounded-xl bg-black/30 border border-white/5">
              <h4 className="text-xs font-bold text-white/30 uppercase tracking-wider mb-3">World Timeline Fragments</h4>
              <div className="space-y-2 text-xs">
                {[
                  { age: "The Age of Crystal", note: "Crystal Accord dominates 3 consecutive seasons", color: "#7dd3fc" },
                  { age: "The Void Wars", note: "Void Syndicate conquers faction war tournament", color: "#a855f7" },
                  { age: "The Burning", note: "EmberFields biome expands — fire spreads globally", color: "#f97316" },
                  { age: "The Frozen Accord", note: "FrozenAether expands, slowing all matches", color: "#bae6fd" },
                ].map((entry) => (
                  <div key={entry.age} className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full mt-1 shrink-0" style={{ backgroundColor: entry.color }} />
                    <div>
                      <span className="font-bold" style={{ color: entry.color }}>{entry.age}</span>
                      <span className="text-white/40"> — {entry.note}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Titles & naming */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white/60 uppercase tracking-wider">🏅 Earned Titles</h3>
            <div className="space-y-2">
              {TITLES.map((title) => (
                <div
                  key={title.name}
                  className="flex items-center justify-between p-3 rounded-xl border border-white/5 bg-white/3 hover:bg-white/5 transition-colors"
                >
                  <div>
                    <div className={`text-sm font-bold ${
                      title.rarity === "Mythic" ? "text-amber-300" :
                      title.rarity === "Legendary" ? "text-violet-300" :
                      title.rarity === "Gold" ? "text-amber-400" : "text-white/70"
                    }`}>{title.name}</div>
                    <div className="text-xs text-white/30">{title.req}</div>
                  </div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    title.rarity === "Mythic" ? "bg-amber-500/20 text-amber-300" :
                    title.rarity === "Legendary" ? "bg-violet-500/20 text-violet-300" :
                    title.rarity === "Gold" ? "bg-amber-800/30 text-amber-400" :
                    "bg-white/10 text-white/40"
                  }`}>
                    {title.rarity}
                  </span>
                </div>
              ))}
            </div>

            {/* Naming examples */}
            <div className="p-4 rounded-xl bg-black/30 border border-white/5">
              <h4 className="text-xs font-bold text-white/30 uppercase tracking-wider mb-3">Procedural Name Examples</h4>
              <div className="flex flex-wrap gap-2">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <span
                    key={i}
                    className="text-xs px-3 py-1.5 rounded-full border border-violet-500/20 bg-violet-500/10 text-violet-300 font-bold"
                  >
                    {pick(NAME_PREFIXES, seed * 100 + i)} {pick(NAME_SUFFIXES, seed * 100 + i + 50)}
                  </span>
                ))}
              </div>
            </div>

            {/* Tile memory */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-violet-950/30 to-transparent border border-violet-500/10">
              <h4 className="text-xs font-bold text-violet-400/60 uppercase tracking-wider mb-2">🗺️ Tile Memory System</h4>
              <p className="text-xs text-white/50 italic leading-relaxed">
                "This crater was created when Pyra Flameheart used <span className="text-red-400">Supernova</span> in the Battle of Ember Confluence. The scorched earth still smolders — <span className="text-amber-400">fire damage +15%</span> to all souls passing through."
              </p>
              <div className="mt-2 grid grid-cols-3 gap-1 text-xs font-mono text-white/30">
                <div>blood_splatter: true</div>
                <div>scorch_marks: 4</div>
                <div>soul_trails: 12</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LoreChronicle;
