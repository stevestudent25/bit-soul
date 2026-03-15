// ═══════════════════════════════════════════════════════════════
// BIT-SOUL — Live Game Simulation View
// Interactive CTF match with real souls, combat, and flag mechanics
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  type SoulEntity,
  type MatchState,
  type MatchEvent,
  SoulClass,
  MatchPhase,
  FlagStatus,
  EmotionalState,
} from '../game';
import {
  createMatch,
  spawnTeamSouls,
  updateMatchPhase,
  pickupFlag,
  captureFlag,
  dropFlag,
  updateFlagCorruption,
} from '../game/systems/MatchEngine';
import {
  processAttack,
  tickSoul,
  respawnSoul,
} from '../game/systems/CombatEngine';


// ── Constants ─────────────────────────────────────────────────

const CANVAS_W = 800;
const CANVAS_H = 500;
const MAP_W = 64;
const MAP_H = 40;
const TILE = CANVAS_W / MAP_W; // ~12.5px per tile
const SIM_SPEED = 1 / 20; // 20 ticks/sec equivalent

// ── Color Palettes ────────────────────────────────────────────

const CLASS_COLORS: Record<string, { fill: string; stroke: string }> = {
  [SoulClass.Soldier]:   { fill: '#22c55e', stroke: '#86efac' },
  [SoulClass.Hitman]:    { fill: '#ef4444', stroke: '#fca5a5' },
  [SoulClass.Robot]:     { fill: '#3b82f6', stroke: '#93c5fd' },
  [SoulClass.Survivor]:  { fill: '#f59e0b', stroke: '#fcd34d' },
  [SoulClass.Scout]:     { fill: '#a855f7', stroke: '#d8b4fe' },
};

const PHASE_COLORS: Record<string, string> = {
  [MatchPhase.Preparation]: '#6366f1',
  [MatchPhase.Battle]: '#10b981',
  [MatchPhase.DesperateHour]: '#ef4444',
  [MatchPhase.Overtime]: '#f59e0b',
  [MatchPhase.PostMatch]: '#6b7280',
};

// ── Component ─────────────────────────────────────────────────

export default function GameSimulation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [match, setMatch] = useState<MatchState | null>(null);
  const [souls, setSouls] = useState<SoulEntity[]>([]);
  const [selectedSoul, setSelectedSoul] = useState<SoulEntity | null>(null);
  const [killFeed, setKillFeed] = useState<MatchEvent[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [simSpeed, setSimSpeed] = useState(1);
  const tickRef = useRef(0);
  const animRef = useRef<number>(0);

  // ── Initialize Match ──────────────────────────────────────

  const initMatch = useCallback(() => {
    const m = createMatch({
      soulsPerTeam: 5,
      scoreToWin: 3,
      timeLimit: 300,
      preparationTime: 10,
      desperateHourTime: 60,
    });
    const spawned = spawnTeamSouls(m);
    // Place souls on the map
    spawned.forEach((o, i) => {
      const team = m.teams.find(t => t.members.includes(o.id));
      if (team) {
        const side = m.teams.indexOf(team);
        o.position = {
          x: side === 0 ? 5 + (i % 5) * 2 : MAP_W - 7 + (i % 5) * 1,
          y: MAP_H / 2 - 4 + (i % 5) * 2,
        };
      }
    });
    setMatch(m);
    setSouls(spawned);
    setKillFeed([]);
    setSelectedSoul(null);
    setIsRunning(true);
    tickRef.current = 0;
  }, []);

  // ── AI Movement & Decision Making ─────────────────────────

  const runAI = useCallback((soulList: SoulEntity[], matchState: MatchState): SoulEntity[] => {
    return soulList.map(soul => {
      if (!soul.isAlive) return soul;

      const updated = { ...soul };
      const team = matchState.teams.find(t => t.id === soul.teamId);
      const enemyTeams = matchState.teams.filter(t => t.id !== soul.teamId);
      if (!team) return updated;

      // Personality-driven behavior
      const p = soul.personality;

      // Find nearest enemy
      const enemies = soulList.filter(e => e.teamId !== soul.teamId && e.isAlive);
      const nearestEnemy = enemies.reduce<SoulEntity | null>((nearest, e) => {
        const d = Math.hypot(e.position.x - soul.position.x, e.position.y - soul.position.y);
        const nd = nearest ? Math.hypot(nearest.position.x - soul.position.x, nearest.position.y - soul.position.y) : Infinity;
        return d < nd ? e : nearest;
      }, null);

      const distToEnemy = nearestEnemy
        ? Math.hypot(nearestEnemy.position.x - soul.position.x, nearestEnemy.position.y - soul.position.y)
        : Infinity;

      // Survival priority
      if (soul.vitals.hp / soul.vitals.hpMax < 0.2 && p.courage < 0.7) {
        // Flee to base
        const basePos = team.flag.position;
        const dx = basePos.x - soul.position.x;
        const dy = basePos.y - soul.position.y;
        const dist = Math.hypot(dx, dy) || 1;
        updated.velocity = {
          x: (dx / dist) * updated.movement.speedBase * 0.8,
          y: (dy / dist) * updated.movement.speedBase * 0.8,
        };
        updated.emotionalState = EmotionalState.Fearful;
        return moveSoul(updated);
      }

      // Flag carrier: run home
      if (soul.isCarryingFlag) {
        const basePos = team.flag.position;
        const dx = basePos.x - soul.position.x;
        const dy = basePos.y - soul.position.y;
        const dist = Math.hypot(dx, dy) || 1;
        updated.velocity = {
          x: (dx / dist) * updated.movement.speedCurrent,
          y: (dy / dist) * updated.movement.speedCurrent,
        };
        updated.emotionalState = EmotionalState.Desperate;
        return moveSoul(updated);
      }

      // Defend own flag if stolen
      if (team.flag.status === FlagStatus.Carried && p.patience > 0.5) {
        const carrier = soulList.find(e => e.id === team.flag.carrierId);
        if (carrier) {
          const dx = carrier.position.x - soul.position.x;
          const dy = carrier.position.y - soul.position.y;
          const dist = Math.hypot(dx, dy) || 1;
          updated.velocity = {
            x: (dx / dist) * updated.movement.speedBase,
            y: (dy / dist) * updated.movement.speedBase,
          };
          updated.emotionalState = EmotionalState.Vengeful;
          return moveSoul(updated);
        }
      }

      // Grab enemy flag
      const targetFlag = enemyTeams.find(t => t.flag.status === FlagStatus.AtBase || t.flag.status === FlagStatus.Dropped);
      if (targetFlag && p.aggression > 0.3 && p.courage > 0.4) {
        const flagPos = targetFlag.flag.position;
        const dx = flagPos.x - soul.position.x;
        const dy = flagPos.y - soul.position.y;
        const dist = Math.hypot(dx, dy) || 1;
        updated.velocity = {
          x: (dx / dist) * updated.movement.speedBase,
          y: (dy / dist) * updated.movement.speedBase,
        };
        updated.emotionalState = EmotionalState.Confident;
        return moveSoul(updated);
      }

      // Combat — attack nearby enemies
      if (nearestEnemy && distToEnemy < 10 && p.aggression > 0.5) {
        const dx = nearestEnemy.position.x - soul.position.x;
        const dy = nearestEnemy.position.y - soul.position.y;
        const dist = Math.hypot(dx, dy) || 1;
        updated.velocity = {
          x: (dx / dist) * updated.movement.speedBase * 0.6,
          y: (dy / dist) * updated.movement.speedBase * 0.6,
        };
        updated.emotionalState = EmotionalState.Enraged;
        return moveSoul(updated);
      }

      // Patrol / Explore
      if (p.curiosity > 0.5) {
        const angle = (tickRef.current * 0.01 + soulList.indexOf(soul)) * Math.PI * 2;
        updated.velocity = {
          x: Math.cos(angle) * updated.movement.speedBase * 0.4,
          y: Math.sin(angle) * updated.movement.speedBase * 0.4,
        };
      } else {
        // Defenders stay near flag
        const basePos = team.flag.position;
        const dx = basePos.x - soul.position.x;
        const dy = basePos.y - soul.position.y;
        const dist = Math.hypot(dx, dy);
        if (dist > 8) {
          updated.velocity = {
            x: (dx / (dist || 1)) * updated.movement.speedBase * 0.5,
            y: (dy / (dist || 1)) * updated.movement.speedBase * 0.5,
          };
        } else {
          // Idle patrol around base
          const angle = (tickRef.current * 0.02 + soulList.indexOf(soul) * 1.5);
          updated.velocity = {
            x: Math.cos(angle) * 1.5,
            y: Math.sin(angle) * 1.5,
          };
        }
      }

      return moveSoul(updated);
    });
  }, []);

  function moveSoul(soul: SoulEntity): SoulEntity {
    const updated = { ...soul };
    updated.position = {
      x: Math.max(1, Math.min(MAP_W - 1, updated.position.x + updated.velocity.x * SIM_SPEED)),
      y: Math.max(1, Math.min(MAP_H - 1, updated.position.y + updated.velocity.y * SIM_SPEED)),
    };
    // Apply friction
    updated.velocity = {
      x: updated.velocity.x * updated.movement.friction,
      y: updated.velocity.y * updated.movement.friction,
    };
    return updated;
  }

  // ── Game Loop ─────────────────────────────────────────────

  useEffect(() => {
    if (!isRunning || !match) return;

    let lastTime = performance.now();

    const tick = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.1) * simSpeed;
      lastTime = now;
      tickRef.current++;

      setMatch(prev => {
        if (!prev || prev.isFinished) {
          setIsRunning(false);
          return prev;
        }
        return updateMatchPhase(prev, dt);
      });

      setSouls(prev => {
        if (!match) return prev;

        // Tick regen & cooldowns
        let updated = prev.map(o => tickSoul(o, dt));

        // AI movement
        updated = runAI(updated, match);

        // Combat processing (nearby enemies auto-attack)
        const newEvents: MatchEvent[] = [];
        updated = updated.map(soul => {
          if (!soul.isAlive) return soul;
          const enemies = updated.filter(e => e.teamId !== soul.teamId && e.isAlive);
          const nearest = enemies.reduce<SoulEntity | null>((n, e) => {
            const d = Math.hypot(e.position.x - soul.position.x, e.position.y - soul.position.y);
            const nd = n ? Math.hypot(n.position.x - soul.position.x, n.position.y - soul.position.y) : Infinity;
            return d < nd ? e : n;
          }, null);

          if (nearest && Math.hypot(nearest.position.x - soul.position.x, nearest.position.y - soul.position.y) < soul.combat.attackRange) {
            // Auto-attack every few ticks
            if (tickRef.current % Math.max(3, Math.round(10 / soul.combat.attackSpeed)) === 0) {
              const { result, updatedDefender, events } = processAttack(soul, nearest);
              newEvents.push(...events);
              // Update the defender in the array
              const defIdx = updated.findIndex(u => u.id === nearest.id);
              if (defIdx >= 0) updated[defIdx] = updatedDefender;

              // If killed, handle flag drop
              if (result.killedTarget && nearest.isCarryingFlag) {
                setMatch(m => {
                  if (!m) return m;
                  const { match: updatedMatch } = dropFlag(m, nearest);
                  return updatedMatch;
                });
              }
            }
          }
          return soul;
        });

        // Flag pickup check
        updated.forEach(soul => {
          if (!soul.isAlive || soul.isCarryingFlag) return;
          setMatch(m => {
            if (!m) return m;
            let currentMatch = m;
            for (const team of m.teams) {
              const flagPos = team.flag.position;
              const dist = Math.hypot(flagPos.x - soul.position.x, flagPos.y - soul.position.y);
              if (dist < 2) {
                if (team.id !== soul.teamId && (team.flag.status === FlagStatus.AtBase || team.flag.status === FlagStatus.Dropped)) {
                  const { match: um, soul: uo } = pickupFlag(currentMatch, soul, team.id);
                  currentMatch = um;
                  const idx = updated.findIndex(u => u.id === soul.id);
                  if (idx >= 0) updated[idx] = uo;
                } else if (team.id === soul.teamId && team.flag.status === FlagStatus.Dropped) {
                  const { match: um } = pickupFlag(currentMatch, soul, team.id);
                  currentMatch = um;
                }
              }
            }
            return currentMatch;
          });
        });

        // Flag capture check
        updated.forEach(soul => {
          if (!soul.isAlive || !soul.isCarryingFlag) return;
          setMatch(m => {
            if (!m) return m;
            const soulTeam = m.teams.find(t => t.id === soul.teamId);
            if (!soulTeam) return m;
            const dist = Math.hypot(soulTeam.flag.position.x - soul.position.x, soulTeam.flag.position.y - soul.position.y);
            if (dist < 3) {
              const { match: um, soul: uo, captured } = captureFlag(m, soul);
              if (captured) {
                const idx = updated.findIndex(u => u.id === soul.id);
                if (idx >= 0) updated[idx] = uo;
              }
              return um;
            }
            return m;
          });
        });

        // Corruption update
        updated = updated.map(o => updateFlagCorruption(o, dt));

        // Respawn dead souls after timer
        updated = updated.map(o => {
          if (!o.isAlive && tickRef.current % 160 === 0) { // ~8s respawn
            const team = match.teams.find(t => t.members.includes(o.id));
            if (team) {
              return respawnSoul(o, {
                x: team.flag.position.x + (Math.random() * 4 - 2),
                y: team.flag.position.y + (Math.random() * 4 - 2),
              });
            }
          }
          return o;
        });

        // Mutation on death — every 3rd death
        // (simplified: random mutation chance on respawn)

        if (newEvents.length > 0) {
          setKillFeed(prev => [...newEvents.slice(-5), ...prev].slice(0, 10));
        }

        return updated;
      });

      animRef.current = requestAnimationFrame(tick);
    };

    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current);
  }, [isRunning, match, simSpeed, runAI]);

  // ── Canvas Rendering ──────────────────────────────────────

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !match) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

      // Background
      ctx.fillStyle = '#080812';
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

      // Grid
      ctx.strokeStyle = 'rgba(139, 92, 246, 0.08)';
      ctx.lineWidth = 0.5;
      for (let x = 0; x < MAP_W; x++) {
        ctx.beginPath();
        ctx.moveTo(x * TILE, 0);
        ctx.lineTo(x * TILE, CANVAS_H);
        ctx.stroke();
      }
      for (let y = 0; y < MAP_H; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * TILE);
        ctx.lineTo(CANVAS_W, y * TILE);
        ctx.stroke();
      }

      // Flag bases
      match.teams.forEach(team => {
        const fx = team.flag.position.x * TILE;
        const fy = team.flag.position.y * TILE;

        // Base zone glow
        ctx.save();
        const baseGrad = ctx.createRadialGradient(fx, fy, 5, fx, fy, 40);
        baseGrad.addColorStop(0, team.color + '30');
        baseGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = baseGrad;
        ctx.beginPath();
        ctx.arc(fx, fy, 40, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Flag
        if (team.flag.status === FlagStatus.AtBase || team.flag.status === FlagStatus.Dropped) {
          const flagX = team.flag.position.x * TILE;
          const flagY = team.flag.position.y * TILE;
          ctx.save();
          ctx.fillStyle = team.color;
          ctx.shadowColor = team.color;
          ctx.shadowBlur = 15;
          // Flag triangle
          ctx.beginPath();
          ctx.moveTo(flagX, flagY - 10);
          ctx.lineTo(flagX + 8, flagY - 4);
          ctx.lineTo(flagX, flagY + 2);
          ctx.closePath();
          ctx.fill();
          // Pole
          ctx.strokeStyle = '#ffffff88';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(flagX, flagY - 10);
          ctx.lineTo(flagX, flagY + 8);
          ctx.stroke();
          ctx.restore();
        }
      });

      // Overtime shrink ring
      if (match.isOvertime && match.overtimeShrinkRadius > 0) {
        ctx.save();
        ctx.strokeStyle = '#ef444488';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        const centerX = CANVAS_W / 2;
        const centerY = CANVAS_H / 2;
        const radius = Math.max(10, CANVAS_W / 2 - match.overtimeShrinkRadius * 5);
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
      }

      // Souls
      souls.forEach(soul => {
        const ox = soul.position.x * TILE;
        const oy = soul.position.y * TILE;
        const colors = CLASS_COLORS[soul.class] || { fill: '#888', stroke: '#aaa' };
        const soulRadius = Math.max(3, soul.physical.radius * 0.4);

        if (!soul.isAlive) {
          // Death marker
          ctx.save();
          ctx.globalAlpha = 0.3;
          ctx.fillStyle = '#666';
          ctx.beginPath();
          ctx.arc(ox, oy, 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;
          ctx.restore();
          return;
        }

        ctx.save();

        // Team color ring
        const team = match.teams.find(t => t.members.includes(soul.id));
        if (team) {
          ctx.strokeStyle = team.color + '60';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(ox, oy, soulRadius + 3, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Soul glow
        const glow = ctx.createRadialGradient(ox, oy, 0, ox, oy, soulRadius * 2);
        glow.addColorStop(0, colors.fill + '40');
        glow.addColorStop(1, 'transparent');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(ox, oy, soulRadius * 2, 0, Math.PI * 2);
        ctx.fill();

        // Soul body
        const bodyGrad = ctx.createRadialGradient(ox - 1, oy - 1, 0, ox, oy, soulRadius);
        bodyGrad.addColorStop(0, colors.stroke);
        bodyGrad.addColorStop(0.7, colors.fill);
        bodyGrad.addColorStop(1, colors.fill + '88');
        ctx.fillStyle = bodyGrad;
        ctx.beginPath();
        ctx.arc(ox, oy, soulRadius, 0, Math.PI * 2);
        ctx.fill();

        // Eye
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        const eyeX = ox + soul.facing.x * 2;
        const eyeY = oy + soul.facing.y * 2;
        ctx.arc(eyeX, eyeY, 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(eyeX + soul.facing.x * 0.5, eyeY + soul.facing.y * 0.5, 0.8, 0, Math.PI * 2);
        ctx.fill();

        // HP bar
        const hpPct = soul.vitals.hp / soul.vitals.hpMax;
        const barW = 14;
        const barH = 2;
        const barX = ox - barW / 2;
        const barY = oy - soulRadius - 6;
        ctx.fillStyle = '#333';
        ctx.fillRect(barX, barY, barW, barH);
        ctx.fillStyle = hpPct > 0.5 ? '#10b981' : hpPct > 0.25 ? '#f59e0b' : '#ef4444';
        ctx.fillRect(barX, barY, barW * hpPct, barH);

        // Flag carrier indicator
        if (soul.isCarryingFlag) {
          ctx.strokeStyle = '#fbbf24';
          ctx.lineWidth = 2;
          ctx.shadowColor = '#fbbf24';
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.arc(ox, oy, soulRadius + 5, 0, Math.PI * 2);
          ctx.stroke();
          ctx.shadowBlur = 0;

          // Corruption visual
          if (soul.corruptionLevel > 0) {
            ctx.strokeStyle = `rgba(139, 0, 255, ${soul.corruptionLevel / 100})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(ox, oy, soulRadius + 7, 0, Math.PI * 2 * (soul.corruptionLevel / 100));
            ctx.stroke();
          }
        }

        // Selected indicator
        if (selectedSoul?.id === soul.id) {
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 1;
          ctx.setLineDash([3, 3]);
          ctx.beginPath();
          ctx.arc(ox, oy, soulRadius + 8, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);
        }

        ctx.restore();
      });

      requestAnimationFrame(render);
    };

    const frameId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(frameId);
  }, [souls, match, selectedSoul]);

  // ── Canvas Click → Select Soul ─────────────────────────────

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mx = (e.clientX - rect.left) * (CANVAS_W / rect.width);
    const my = (e.clientY - rect.top) * (CANVAS_H / rect.height);
    const tileX = mx / TILE;
    const tileY = my / TILE;

    const clicked = souls.find(o => {
      const dist = Math.hypot(o.position.x - tileX, o.position.y - tileY);
      return dist < 2 && o.isAlive;
    });
    setSelectedSoul(clicked || null);
  };

  // ── Format time ───────────────────────────────────────────

  const formatTime = (s: number) => {
    const m = Math.floor(Math.abs(s) / 60);
    const sec = Math.floor(Math.abs(s) % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  // ── Render ────────────────────────────────────────────────

  return (
    <section id="game-sim" className="relative py-20 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <p className="text-xs uppercase tracking-[0.3em] text-violet-400 mb-2 font-bold">
            Phase 1 — Live Prototype
          </p>
          <h2 className="text-4xl md:text-5xl font-black text-white">
            ⚔️ Live CTF Simulation
          </h2>
          <p className="text-gray-400 mt-2 max-w-2xl mx-auto">
            Watch AI souls battle in real-time with personality-driven decisions, body-part targeting, flag corruption, and match phases.
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-4">
          <button
            onClick={initMatch}
            className="px-5 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg font-bold transition-colors text-sm"
          >
            {match ? '🔄 New Match' : '🎮 Start Match'}
          </button>
          {match && (
            <>
              <button
                onClick={() => setIsRunning(r => !r)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-bold transition-colors text-sm"
              >
                {isRunning ? '⏸ Pause' : '▶ Resume'}
              </button>
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <span>Speed:</span>
                {[0.5, 1, 2, 4].map(s => (
                  <button
                    key={s}
                    onClick={() => setSimSpeed(s)}
                    className={`px-2 py-1 rounded text-xs font-mono ${
                      simSpeed === s ? 'bg-violet-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* HUD Bar */}
        {match && (
          <div className="flex items-center justify-between bg-black/60 border border-gray-800 rounded-t-lg px-4 py-2 text-sm font-mono">
            {/* Team A Score */}
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ background: match.teams[0]?.color }} />
              <span className="text-white font-bold">{match.teams[0]?.name}</span>
              <span className="text-2xl font-black text-white">{match.teams[0]?.score}</span>
            </div>

            {/* Center */}
            <div className="flex flex-col items-center">
              <span className="text-xs px-2 py-0.5 rounded font-bold" style={{
                background: PHASE_COLORS[match.phase] + '30',
                color: PHASE_COLORS[match.phase],
              }}>
                {match.phase}
              </span>
              <span className="text-white font-bold text-lg">
                {match.phase === MatchPhase.Preparation
                  ? formatTime(match.preparationTimeRemaining)
                  : formatTime(match.timeRemaining)}
              </span>
            </div>

            {/* Team B Score */}
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black text-white">{match.teams[1]?.score}</span>
              <span className="text-white font-bold">{match.teams[1]?.name}</span>
              <div className="w-3 h-3 rounded-full" style={{ background: match.teams[1]?.color }} />
            </div>
          </div>
        )}

        {/* Game Canvas + Side Panel */}
        <div className="flex gap-4">
          {/* Canvas */}
          <div className="flex-1 relative">
            <canvas
              ref={canvasRef}
              width={CANVAS_W}
              height={CANVAS_H}
              onClick={handleCanvasClick}
              className="w-full border border-gray-800 rounded-b-lg cursor-crosshair"
              style={{ imageRendering: 'pixelated', background: '#080812' }}
            />
            {!match && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 rounded-b-lg">
                <p className="text-2xl font-bold text-violet-400 mb-2">BIT-SOUL</p>
                <p className="text-gray-400 text-sm">Press "Start Match" to begin simulation</p>
              </div>
            )}
          </div>

          {/* Side Panel */}
          <div className="w-64 flex flex-col gap-3">
            {/* Kill Feed */}
            <div className="bg-black/60 border border-gray-800 rounded-lg p-3 max-h-48 overflow-y-auto">
              <h3 className="text-xs uppercase tracking-widest text-violet-400 font-bold mb-2">Kill Feed</h3>
              {killFeed.length === 0 ? (
                <p className="text-gray-600 text-xs">Waiting for action...</p>
              ) : (
                killFeed.map((e, i) => (
                  <div key={e.id + i} className="text-xs text-gray-300 mb-1 flex items-center gap-1">
                    <span className={e.type === 'kill' ? 'text-red-400' : e.type === 'flag_capture' ? 'text-yellow-400' : 'text-gray-400'}>
                      {e.type === 'kill' ? '💀' : e.type === 'flag_capture' ? '⭐' : e.type === 'body_part_break' ? '💥' : '📡'}
                    </span>
                    <span className="truncate">{e.details}</span>
                  </div>
                ))
              )}
            </div>

            {/* Selected Soul Info */}
            {selectedSoul && (
              <div className="bg-black/60 border border-gray-800 rounded-lg p-3">
                <h3 className="text-xs uppercase tracking-widest text-violet-400 font-bold mb-2">Selected Soul</h3>
                <p className="text-white font-bold text-sm truncate">{selectedSoul.name}</p>
                <p className="text-gray-400 text-xs">{selectedSoul.class} — Lv{selectedSoul.level}</p>
                <p className="text-xs mt-1" style={{ color: CLASS_COLORS[selectedSoul.class]?.fill }}>
                  {selectedSoul.emotionalState}
                </p>

                {/* Vitals */}
                <div className="mt-2 space-y-1">
                  <VitalBar label="HP" current={selectedSoul.vitals.hp} max={selectedSoul.vitals.hpMax} color="#10b981" />
                  <VitalBar label="Shield" current={selectedSoul.vitals.shield} max={selectedSoul.vitals.shieldMax} color="#3b82f6" />
                  <VitalBar label="Mana" current={selectedSoul.vitals.mana} max={selectedSoul.vitals.manaMax} color="#8b5cf6" />
                </div>

                {/* Body Parts */}
                <div className="mt-2">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">Body Parts</p>
                  {selectedSoul.bodyParts.map(p => (
                    <div key={p.name} className="flex items-center gap-1 text-[10px]">
                      <span className={p.intact ? 'text-green-400' : 'text-red-400'}>
                        {p.intact ? '●' : '✕'}
                      </span>
                      <span className="text-gray-400">{p.name}</span>
                      <span className="text-gray-600 ml-auto">{Math.round(p.hp)}/{p.hpMax}</span>
                    </div>
                  ))}
                </div>

                {/* Abilities */}
                <div className="mt-2">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">Abilities</p>
                  {selectedSoul.abilities.map(a => (
                    <div key={a.id} className="flex items-center gap-1 text-[10px]">
                      <span className={a.cooldownRemaining > 0 ? 'text-gray-600' : 'text-cyan-400'}>
                        {a.cooldownRemaining > 0 ? `⏱${Math.ceil(a.cooldownRemaining)}s` : '✓'}
                      </span>
                      <span className="text-gray-300 truncate">{a.name}</span>
                      {a.isUltimate && <span className="text-yellow-400">★</span>}
                    </div>
                  ))}
                </div>

                {/* Personality */}
                <div className="mt-2">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">Personality</p>
                  <div className="grid grid-cols-2 gap-x-2 text-[10px]">
                    <PersonalityStat label="AGR" value={selectedSoul.personality.aggression} />
                    <PersonalityStat label="CRG" value={selectedSoul.personality.courage} />
                    <PersonalityStat label="LOY" value={selectedSoul.personality.loyalty} />
                    <PersonalityStat label="CUR" value={selectedSoul.personality.curiosity} />
                    <PersonalityStat label="PAT" value={selectedSoul.personality.patience} />
                    <PersonalityStat label="SOC" value={selectedSoul.personality.social} />
                  </div>
                </div>

                {/* Mutations */}
                {selectedSoul.mutations.length > 0 && (
                  <div className="mt-2">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">Mutations</p>
                    {selectedSoul.mutations.map(m => (
                      <p key={m.id} className="text-[10px] text-amber-400">🧬 {m.name}</p>
                    ))}
                  </div>
                )}

                {/* Flag carrier */}
                {selectedSoul.isCarryingFlag && (
                  <div className="mt-2 p-1 bg-yellow-900/30 border border-yellow-600/30 rounded text-[10px] text-yellow-400">
                    🚩 Carrying Flag — Corruption: {Math.round(selectedSoul.corruptionLevel)}%
                  </div>
                )}
              </div>
            )}

            {/* Team Roster */}
            {match && (
              <div className="bg-black/60 border border-gray-800 rounded-lg p-3 max-h-60 overflow-y-auto">
                <h3 className="text-xs uppercase tracking-widest text-violet-400 font-bold mb-2">Roster</h3>
                {match.teams.map(team => (
                  <div key={team.id} className="mb-2">
                    <p className="text-[10px] font-bold" style={{ color: team.color }}>
                      {team.name} — {team.score} caps
                    </p>
                    {souls.filter(o => o.teamId === team.id).map(o => (
                      <button
                        key={o.id}
                        onClick={() => setSelectedSoul(o)}
                        className={`w-full text-left text-[10px] px-1 py-0.5 rounded flex items-center gap-1 ${
                          selectedSoul?.id === o.id ? 'bg-violet-900/40' : 'hover:bg-gray-800/50'
                        } ${!o.isAlive ? 'opacity-30' : ''}`}
                      >
                        <span style={{ color: CLASS_COLORS[o.class]?.fill }}>●</span>
                        <span className="text-gray-300 truncate flex-1">{o.name.split(' ')[0]}</span>
                        <span className="text-gray-600">{o.class.slice(0, 3)}</span>
                        {o.isCarryingFlag && <span>🚩</span>}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Post-Match Summary */}
        {match?.isFinished && (
          <div className="mt-6 bg-gradient-to-r from-violet-900/20 to-indigo-900/20 border border-violet-800/30 rounded-xl p-6 text-center">
            <h3 className="text-2xl font-black text-white mb-2">
              🏆 {match.teams.find(t => t.id === match.winnerId)?.name} Wins!
            </h3>
            <p className="text-gray-400 text-sm mb-4">
              Final Score: {match.teams.map(t => t.score).join(' — ')}
            </p>
            <div className="flex justify-center gap-8">
              {match.teams.map(team => (
                <div key={team.id} className="text-center">
                  <p className="font-bold text-sm" style={{ color: team.color }}>{team.name}</p>
                  <p className="text-2xl font-black text-white">{team.score}</p>
                </div>
              ))}
            </div>
            <button
              onClick={initMatch}
              className="mt-4 px-6 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg font-bold transition-colors"
            >
              🔄 Play Again
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

// ── Sub-Components ────────────────────────────────────────────

function VitalBar({ label, current, max, color }: { label: string; current: number; max: number; color: string }) {
  const pct = max > 0 ? (current / max) * 100 : 0;
  return (
    <div className="flex items-center gap-1">
      <span className="text-[10px] text-gray-500 w-8">{label}</span>
      <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-[9px] text-gray-600 w-10 text-right">{Math.round(current)}</span>
    </div>
  );
}

function PersonalityStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-gray-500">{label}</span>
      <div className="flex-1 h-1 bg-gray-800 rounded-full overflow-hidden">
        <div className="h-full bg-violet-500 rounded-full" style={{ width: `${value * 100}%` }} />
      </div>
    </div>
  );
}
