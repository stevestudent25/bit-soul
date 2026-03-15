// ═══════════════════════════════════════════════════════════════
// BIT-SOUL — AI Controller (Dungeon Enemy Behavior)
// ═══════════════════════════════════════════════════════════════

import type { SoulEntity, Vector2 } from '../types/SoulEntity';
import type { GameMap } from '../types/World';
import { PathFinder } from './PathFinder';

export type AIState =
  | 'idle'
  | 'patrol'
  | 'attack_enemy'
  | 'flee'
  | 'collect_resource'
  | 'hunt';

interface AIContext {
  soul: SoulEntity;
  allies: SoulEntity[];
  enemies: SoulEntity[];
  map: GameMap;
  teamFlag: { position: Vector2; carriedBy: string | null };
  enemyFlags: { teamId: string; position: Vector2; carriedBy: string | null }[];
  teamBasePos: Vector2;
  pathfinder: PathFinder;
}

export interface AIDecision {
  state: AIState;
  targetPosition: Vector2 | null;
  attackTargetId: string | null;
  abilityToUse: number; // -1 = none, 0-3 = ability index
}

export class AIController {
  private states = new Map<string, AIState>();
  private paths = new Map<string, Vector2[]>();
  private patrolPoints = new Map<string, Vector2[]>();
  private patrolIdx = new Map<string, number>();
  private lastDecisionTime = new Map<string, number>();
  private stateChangeCooldown = new Map<string, number>();
  private stuckCounters = new Map<string, { lastPos: Vector2; frames: number }>();
  private readonly DECISION_INTERVAL = 30;
  private readonly STATE_CHANGE_COOLDOWN = 45; // min frames between state changes

  /** Generate patrol points for an enemy around its spawn position */
  private getPatrolPoints(soulId: string, basePos: Vector2, map: GameMap): Vector2[] {
    if (this.patrolPoints.has(soulId)) return this.patrolPoints.get(soulId)!;
    const points: Vector2[] = [];
    const offsets = [
      { x: -8, y: -6 }, { x: 8, y: -6 },
      { x: 8, y: 6 }, { x: -8, y: 6 },
      { x: 0, y: -10 }, { x: 0, y: 10 },
      { x: -10, y: 0 }, { x: 10, y: 0 },
    ];
    for (const off of offsets) {
      const px = Math.max(2, Math.min(map.tiles[0].length - 3, Math.floor(basePos.x + off.x)));
      const py = Math.max(2, Math.min(map.tiles.length - 3, Math.floor(basePos.y + off.y)));
      if (map.tiles[py]?.[px]?.isPassable) {
        points.push({ x: px + 0.5, y: py + 0.5 });
      }
    }
    if (points.length === 0) points.push({ x: basePos.x, y: basePos.y });
    this.patrolPoints.set(soulId, points);
    return points;
  }

  /** Main AI tick — returns a decision for the soul */
  decide(ctx: AIContext, frameCount: number): AIDecision {
    const { soul } = ctx;
    const lastTime = this.lastDecisionTime.get(soul.id) || 0;

    // Stuck detection — if velocity near zero for too long, pick new patrol target
    const stuck = this.stuckCounters.get(soul.id) || { lastPos: { x: soul.position.x, y: soul.position.y }, frames: 0 };
    const movedDist = this.dist(soul.position, stuck.lastPos);
    if (movedDist < 0.05) {
      stuck.frames++;
    } else {
      stuck.frames = 0;
      stuck.lastPos = { x: soul.position.x, y: soul.position.y };
    }
    this.stuckCounters.set(soul.id, stuck);

    if (stuck.frames > 90) {
      // Force new patrol target
      stuck.frames = 0;
      this.patrolIdx.set(soul.id, (this.patrolIdx.get(soul.id) || 0) + 1);
      this.paths.delete(soul.id);
      this.states.set(soul.id, 'patrol');
      return this.patrol(ctx);
    }

    if (frameCount - lastTime < this.DECISION_INTERVAL && this.states.has(soul.id)) {
      return this.continueCurrentState(ctx);
    }
    this.lastDecisionTime.set(soul.id, frameCount);

    // State change cooldown — prevent jitter
    const changeCd = this.stateChangeCooldown.get(soul.id) || 0;
    const canChangeState = changeCd <= 0;
    if (changeCd > 0) this.stateChangeCooldown.set(soul.id, changeCd - this.DECISION_INTERVAL);

    const hpPct = soul.vitals.hp / soul.vitals.hpMax;
    const nearestEnemy = this.findNearest(soul.position, ctx.enemies.filter(e => e.isAlive));
    const enemyDist = nearestEnemy ? this.dist(soul.position, nearestEnemy.position) : Infinity;

    const currentState = this.states.get(soul.id) || 'patrol';

    // Hysteresis detection ranges (enter chase at 6, exit at 10)
    const chaseEnterRange = 6;
    const chaseExitRange = 10;
    const huntEnterRange = 12;
    const huntExitRange = 16;

    // Priority 1: Flee if critically low HP
    if (hpPct < 0.15 && enemyDist < 8 && canChangeState) {
      this.setState(soul.id, 'flee');
      return this.flee(ctx, nearestEnemy!);
    }

    // Priority 2: Attack close enemies (with hysteresis)
    if (nearestEnemy && soul.personality.aggression > 0.3) {
      const inChaseRange = currentState === 'attack_enemy'
        ? enemyDist < chaseExitRange      // already chasing — use exit range
        : enemyDist < chaseEnterRange;    // not chasing — use enter range

      if (inChaseRange && (canChangeState || currentState === 'attack_enemy')) {
        this.setState(soul.id, 'attack_enemy');
        return {
          state: 'attack_enemy',
          targetPosition: nearestEnemy.position,
          attackTargetId: nearestEnemy.id,
          abilityToUse: this.pickAbility(soul, enemyDist),
        };
      }
    }

    // Priority 3: Hunt — heard combat nearby (with hysteresis)
    if (nearestEnemy && soul.personality.courage > 0.3) {
      const inHuntRange = currentState === 'hunt'
        ? enemyDist < huntExitRange
        : enemyDist < huntEnterRange;

      if (inHuntRange && (canChangeState || currentState === 'hunt')) {
        this.setState(soul.id, 'hunt');
        return {
          state: 'hunt',
          targetPosition: nearestEnemy.position,
          attackTargetId: null,
          abilityToUse: -1,
        };
      }
    }

    // Priority 4: Collect nearby resources (greedy souls)
    if (soul.personality.greed > 0.5) {
      const nearRes = ctx.map.resourceNodes.find(
        r => r.remaining > 0 && this.dist(soul.position, r.position) < 10
      );
      if (nearRes) {
        this.setState(soul.id, 'collect_resource');
        return {
          state: 'collect_resource',
          targetPosition: nearRes.position,
          attackTargetId: null,
          abilityToUse: -1,
        };
      }
    }

    // Default: Patrol around spawn area
    this.setState(soul.id, 'patrol');
    return this.patrol(ctx);
  }

  private continueCurrentState(ctx: AIContext): AIDecision {
    const state = this.states.get(ctx.soul.id) || 'patrol';
    const path = this.paths.get(ctx.soul.id);

    if (path && path.length > 0) {
      return {
        state,
        targetPosition: path[0],
        attackTargetId: null,
        abilityToUse: -1,
      };
    }

    return this.patrol(ctx);
  }

  private setState(soulId: string, state: AIState): void {
    if (this.states.get(soulId) !== state) {
      this.paths.delete(soulId);
      this.stateChangeCooldown.set(soulId, this.STATE_CHANGE_COOLDOWN);
    }
    this.states.set(soulId, state);
  }

  private patrol(ctx: AIContext): AIDecision {
    const points = this.getPatrolPoints(ctx.soul.id, ctx.teamBasePos, ctx.map);
    const idx = (this.patrolIdx.get(ctx.soul.id) || 0) % points.length;
    const target = points[idx];

    if (this.dist(ctx.soul.position, target) < 2) {
      this.patrolIdx.set(ctx.soul.id, idx + 1);
    }

    return {
      state: 'patrol',
      targetPosition: target,
      attackTargetId: null,
      abilityToUse: -1,
    };
  }

  private flee(ctx: AIContext, threat: SoulEntity): AIDecision {
    const dx = ctx.soul.position.x - threat.position.x;
    const dy = ctx.soul.position.y - threat.position.y;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const fleeTarget: Vector2 = {
      x: ctx.soul.position.x + (dx / len) * 10,
      y: ctx.soul.position.y + (dy / len) * 10,
    };
    return {
      state: 'flee',
      targetPosition: fleeTarget,
      attackTargetId: null,
      abilityToUse: -1,
    };
  }

  private pickAbility(soul: SoulEntity, distance: number): number {
    for (let i = 0; i < soul.abilities.length; i++) {
      const ab = soul.abilities[i];
      if (ab.cooldownRemaining <= 0 && soul.vitals.mana >= ab.manaCost && ab.range >= distance) {
        return i;
      }
    }
    return -1;
  }

  advancePath(soulId: string): void {
    const path = this.paths.get(soulId);
    if (path && path.length > 0) {
      path.shift();
      if (path.length === 0) this.paths.delete(soulId);
    }
  }

  private findNearest(pos: Vector2, entities: SoulEntity[]): SoulEntity | null {
    let nearest: SoulEntity | null = null;
    let minDist = Infinity;
    for (const e of entities) {
      const d = this.dist(pos, e.position);
      if (d < minDist) {
        minDist = d;
        nearest = e;
      }
    }
    return nearest;
  }

  private dist(a: Vector2, b: Vector2): number {
    return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
  }
}
