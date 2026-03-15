import { useEffect, useRef, useState } from 'react';
import { GameEngine } from '../game/engine/GameEngine';
import { SoulClass } from '../game/types/SoulEntity';
import { CheckpointManager } from '../game/engine/CheckpointManager';

const CLASS_INFO: Record<SoulClass, {
  desc: string;
  color: string;
  icon: string;
  sprite: string;
  spritePoses: string[];
  title: string;
  stats: { atk: number; def: number; spd: number; hp: number };
}> = {
  [SoulClass.Soldier]: {
    desc: 'Balanced assault trooper. Grenades, burst fire, and airstrikes. Ready for any fight.',
    color: '#22c55e',
    icon: '🎖️',
    sprite: 'assets/characters/soldier1_stand.png',
    spritePoses: ['assets/characters/soldier1_gun.png', 'assets/characters/soldier1_machine.png', 'assets/characters/soldier1_reload.png'],
    title: 'Assault Trooper',
    stats: { atk: 70, def: 55, spd: 60, hp: 75 },
  },
  [SoulClass.Hitman]: {
    desc: 'Silent assassin. Massive crit damage from stealth. One shot, one kill.',
    color: '#ef4444',
    icon: '🎯',
    sprite: 'assets/characters/hitman1_stand.png',
    spritePoses: ['assets/characters/hitman1_silencer.png', 'assets/characters/hitman1_gun.png', 'assets/characters/hitman1_hold.png'],
    title: 'Silent Assassin',
    stats: { atk: 95, def: 20, spd: 75, hp: 40 },
  },
  [SoulClass.Robot]: {
    desc: 'Heavy armored mech. Shield matrix, laser beams, and deployable turrets.',
    color: '#3b82f6',
    icon: '🤖',
    sprite: 'assets/characters/robot1_stand.png',
    spritePoses: ['assets/characters/robot1_gun.png', 'assets/characters/robot1_machine.png', 'assets/characters/robot2_stand.png'],
    title: 'Combat Mech',
    stats: { atk: 50, def: 95, spd: 30, hp: 95 },
  },
  [SoulClass.Survivor]: {
    desc: 'Resourceful scavenger. Self-heals, sets traps, thrives in desperate situations.',
    color: '#f59e0b',
    icon: '🔥',
    sprite: 'assets/characters/survivor1_stand.png',
    spritePoses: ['assets/characters/survivor1_gun.png', 'assets/characters/survivor1_machine.png', 'assets/characters/survivor1_hold.png'],
    title: 'Last Man Standing',
    stats: { atk: 55, def: 45, spd: 65, hp: 60 },
  },
  [SoulClass.Scout]: {
    desc: 'Lightning-fast recon. Fastest in the field — flashbangs, drones, rapid assault.',
    color: '#a855f7',
    icon: '⚡',
    sprite: 'assets/characters/womanGreen_stand.png',
    spritePoses: ['assets/characters/womanGreen_gun.png', 'assets/characters/womanGreen_machine.png', 'assets/characters/womanGreen_hold.png'],
    title: 'Phantom Recon',
    stats: { atk: 45, def: 15, spd: 95, hp: 35 },
  },
};

function StatBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-10 text-gray-500 uppercase font-bold">{label}</span>
      <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${value}%`, backgroundColor: color, boxShadow: `0 0 6px ${color}80` }}
        />
      </div>
      <span className="w-6 text-right text-gray-600 font-mono text-[10px]">{value}</span>
    </div>
  );
}

export default function BitSoulGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const [selectedClass, setSelectedClass] = useState<SoulClass>(SoulClass.Soldier);
  const [started, setStarted] = useState(false);
  const [continuing, setContinuing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [poseIndex, setPoseIndex] = useState(0);

  const hasSave = CheckpointManager.hasSave();

  useEffect(() => { setMounted(true); }, []);

  // Cycle character poses
  useEffect(() => {
    const interval = setInterval(() => {
      setPoseIndex(i => i + 1);
    }, 1200);
    return () => clearInterval(interval);
  }, []);

  // Initialize engine
  useEffect(() => {
    if (!started || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const engine = new GameEngine({ playerClass: selectedClass });
    engineRef.current = engine;

    // Set initial canvas size before init
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      engine.handleResize(canvas.width, canvas.height);
    };

    engine.init(canvas)
      .then(() => {
        if (continuing) {
          engine.loadFromSave();
        }
        window.addEventListener('resize', resizeCanvas);
        engine.state = 'playing';
        engine.start();
      })
      .catch(err => {
        setError(`Failed to initialize: ${err.message}`);
      });

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      engine.destroy();
      engineRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started, selectedClass]);

  // Detect engine quit (from pause menu "Quit to Menu")
  useEffect(() => {
    if (!started || !engineRef.current) return;
    const engine = engineRef.current;
    const poll = setInterval(() => {
      if (engine && engine.state === 'quit') {
        clearInterval(poll);
        setStarted(false);
        setContinuing(false);
      }
    }, 250);
    return () => clearInterval(poll);
  }, [started]);

  if (!started) {
    const selected = CLASS_INFO[selectedClass];
    const poses = selected.spritePoses;
    const currentPose = poses[poseIndex % poses.length];

    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#080810] overflow-hidden">
        {/* Scan lines */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 4px)' }} />

        {/* Floating particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {Array.from({ length: 30 }).map((_, i) => (
            <div key={i} className="absolute rounded-full"
              style={{
                width: 2 + (i % 4), height: 2 + (i % 4),
                left: `${(i * 13 + 7) % 100}%`, top: `${(i * 19 + 3) % 100}%`,
                backgroundColor: selected.color,
                opacity: 0.15 + (i % 3) * 0.1,
                animation: `float-particle ${4 + (i % 5)}s ease-in-out infinite ${i * 0.2}s`,
              }}
            />
          ))}
        </div>

        <div className="text-center max-w-5xl mx-auto px-4 relative z-10 transition-all duration-700"
          style={{ opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(40px)' }}>

          {/* Title */}
          <h1 className="text-6xl md:text-7xl font-black mb-1 tracking-[0.2em] select-none"
            style={{ color: '#8844ff', textShadow: '0 0 40px rgba(136,68,255,0.5), 0 0 80px rgba(136,68,255,0.2)', animation: 'title-pulse 3s ease-in-out infinite' }}>
            BIT-SOUL
          </h1>
          <p className="text-gray-600 text-xs mb-6 tracking-[0.4em] uppercase">Dungeon Explorer &bull; Shooter &bull; RPG</p>

          {/* Character Select */}
          <h2 className="text-sm text-gray-500 mb-3 font-semibold tracking-widest uppercase">Select Your Operative</h2>

          <div className="flex gap-3 justify-center mb-5">
            {Object.values(SoulClass).map((cls, idx) => {
              const info = CLASS_INFO[cls];
              const isSelected = cls === selectedClass;
              return (
                <button key={cls} onClick={() => { setSelectedClass(cls); setPoseIndex(0); }}
                  className="relative overflow-hidden rounded-lg border-2 cursor-pointer text-center group w-[140px]"
                  style={{
                    borderColor: isSelected ? info.color : '#1a1a2e',
                    backgroundColor: isSelected ? '#0f0f24' : '#0a0a18',
                    boxShadow: isSelected ? `0 0 20px ${info.color}40, inset 0 0 20px ${info.color}10` : 'none',
                    transform: isSelected ? 'scale(1.08) translateY(-4px)' : 'scale(1)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    animation: mounted ? `card-enter 0.5s ease-out ${idx * 0.08}s both` : 'none',
                  }}>
                  {/* Glow bar */}
                  <div className="absolute top-0 left-0 right-0 h-[2px] transition-opacity duration-300"
                    style={{ backgroundColor: info.color, opacity: isSelected ? 1 : 0, boxShadow: `0 0 8px ${info.color}` }} />

                  {/* Character sprite */}
                  <div className="pt-3 pb-1 flex justify-center">
                    <img src={info.sprite} alt={cls}
                      className="h-16 w-16 object-contain transition-transform duration-300 drop-shadow-lg"
                      style={{
                        transform: isSelected ? 'scale(1.15)' : 'scale(0.95)',
                        filter: isSelected ? `drop-shadow(0 0 8px ${info.color}80)` : 'brightness(0.7)',
                        imageRendering: 'pixelated',
                      }}
                      draggable={false} />
                  </div>

                  {/* Name + title */}
                  <div className="pb-3 px-2">
                    <div className="font-black text-xs tracking-wide" style={{ color: isSelected ? info.color : '#666' }}>{cls}</div>
                    <div className="text-[9px] text-gray-600 italic">{info.title}</div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Detail panel */}
          <div className="rounded-xl border p-5 mb-5 text-left transition-all duration-500 max-w-3xl mx-auto"
            style={{ backgroundColor: '#0c0c1a', borderColor: `${selected.color}25`, boxShadow: `0 0 30px ${selected.color}08` }}>
            <div className="flex items-start gap-5">
              {/* Character pose preview */}
              <div className="flex flex-col items-center gap-2 shrink-0">
                <div className="w-28 h-28 rounded-lg border-2 flex items-center justify-center overflow-hidden"
                  style={{ borderColor: `${selected.color}40`, backgroundColor: '#0a0a16', boxShadow: `0 0 20px ${selected.color}20` }}>
                  <img src={currentPose} alt="pose"
                    className="h-24 w-24 object-contain transition-all duration-300"
                    style={{ filter: `drop-shadow(0 0 12px ${selected.color}60)`, imageRendering: 'pixelated' }}
                    draggable={false} />
                </div>
                <div className="flex gap-1">
                  {poses.map((p, i) => (
                    <div key={i} className="w-8 h-8 rounded border cursor-pointer flex items-center justify-center overflow-hidden hover:border-white/40 transition-colors"
                      style={{ borderColor: poseIndex % poses.length === i ? selected.color : '#222', backgroundColor: '#0a0a16' }}
                      onClick={() => setPoseIndex(i)}>
                      <img src={p} alt="" className="h-6 w-6 object-contain" style={{ imageRendering: 'pixelated' }} draggable={false} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">{selected.icon}</span>
                  <div>
                    <h3 className="font-black text-lg" style={{ color: selected.color }}>{selectedClass}</h3>
                    <p className="text-[10px] text-gray-500 italic tracking-wide">{selected.title}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-400 mb-3 leading-relaxed">{selected.desc}</p>
                <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
                  <StatBar label="ATK" value={selected.stats.atk} color="#ef4444" />
                  <StatBar label="DEF" value={selected.stats.def} color="#3b82f6" />
                  <StatBar label="SPD" value={selected.stats.spd} color="#10b981" />
                  <StatBar label="HP" value={selected.stats.hp} color="#f59e0b" />
                </div>
              </div>
            </div>
          </div>

          {/* Controls + Launch */}
          <div className="flex items-center gap-4 max-w-3xl mx-auto">
            <div className="flex-1 bg-[#0a0a16] rounded-lg p-3 text-[10px] text-gray-600 grid grid-cols-3 gap-1">
              <div><span className="text-gray-400 font-bold">WASD</span> Move</div>
              <div><span className="text-gray-400 font-bold">Mouse</span> Shoot</div>
              <div><span className="text-gray-400 font-bold">Q/E/R/F</span> Abilities</div>
              <div><span className="text-gray-400 font-bold">Space</span> Dash</div>
              <div><span className="text-gray-400 font-bold">ESC</span> Pause</div>
              <div><span className="text-gray-400 font-bold">Explore</span> Dungeons</div>
            </div>
            <div className="flex flex-col gap-2 shrink-0">
              <button onClick={() => setStarted(true)}
                className="px-8 py-4 text-base font-black rounded-xl cursor-pointer text-white tracking-widest relative overflow-hidden"
                style={{ backgroundColor: '#8844ff', boxShadow: '0 0 25px rgba(136,68,255,0.4), 0 4px 15px rgba(0,0,0,0.3)', transition: 'all 0.3s ease' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.06)'; e.currentTarget.style.boxShadow = '0 0 40px rgba(136,68,255,0.6)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 0 25px rgba(136,68,255,0.4)'; }}>
                ENTER THE DUNGEON
              </button>
              {hasSave && (
                <button onClick={() => {
                  const save = CheckpointManager.loadSave();
                  if (save?.playerClass) {
                    const cls = save.playerClass as SoulClass;
                    if (Object.values(SoulClass).includes(cls)) {
                      setSelectedClass(cls);
                    }
                  }
                  setContinuing(true);
                  setStarted(true);
                }}
                  className="px-8 py-3 text-sm font-bold rounded-xl cursor-pointer text-gray-300 tracking-widest relative overflow-hidden"
                  style={{ backgroundColor: '#1a1a2e', border: '1px solid rgba(136,68,255,0.3)', boxShadow: '0 0 15px rgba(136,68,255,0.15)', transition: 'all 0.3s ease' }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.04)'; e.currentTarget.style.borderColor = 'rgba(136,68,255,0.6)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.borderColor = 'rgba(136,68,255,0.3)'; }}>
                  CONTINUE
                </button>
              )}
            </div>
          </div>
        </div>

        <style>{`
          @keyframes title-pulse {
            0%, 100% { text-shadow: 0 0 40px rgba(136,68,255,0.5), 0 0 80px rgba(136,68,255,0.2); }
            50% { text-shadow: 0 0 60px rgba(136,68,255,0.7), 0 0 120px rgba(136,68,255,0.3); }
          }
          @keyframes card-enter {
            from { opacity: 0; transform: translateY(20px) scale(0.9); }
            to { opacity: 1; transform: translateY(0) scale(1); }
          }
          @keyframes float-particle {
            0%, 100% { transform: translateY(0) translateX(0); opacity: 0.15; }
            50% { transform: translateY(-25px) translateX(8px); opacity: 0.35; }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black">
      <canvas ref={canvasRef} className="block w-full h-full" style={{ cursor: 'crosshair' }} />
      {error && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-900/80 text-white px-4 py-2 rounded">{error}</div>
      )}
    </div>
  );
}
