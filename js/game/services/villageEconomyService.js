// js/game/services/villageEconomyService.js
// Engine-integrated village economy service
// 
// This service wraps the village economy system to ensure all state changes
// go through the engine properly with immutable updates and event emissions.

import {
  ECONOMY_TIERS,
  getVillageEconomySummary,
  getMerchantPrice,
  getRestCost
} from '../locations/village/villageEconomy.js';

function clamp(val, min, max) {
  const n = Number(val);
  if (!Number.isFinite(n)) return min;
  const rounded = Math.round(n);
  if (rounded < min) return min;
  if (rounded > max) return max;
  return rounded;
}

function recomputeTier(econ) {
  if (econ.prosperity < 35) {
    econ.tierId = 'struggling';
  } else if (econ.prosperity > 70) {
    econ.tierId = 'thriving';
  } else {
    econ.tierId = 'stable';
  }
}

/**
 * Creates an engine-integrated village economy service.
 * All state mutations go through engine.setState() with immutable updates.
 * All significant changes emit events for other systems to react.
 */
export function createVillageEconomyService(engine) {
  if (!engine) throw new Error('VillageEconomyService requires engine instance');

  const rng = engine.get('rng');
  if (!rng) throw new Error('VillageEconomyService requires RNG service');

  /**
   * Initialize economy state if missing (called automatically on reads)
   */
  function initEconomy(state) {
    if (!state.villageEconomy) {
      return {
        ...state,
        villageEconomy: {
          tierId: 'stable',
          prosperity: 50,
          security: 40,
          trade: 50,
          lastDayUpdated: null,
          lastDecreeNudge: null
        }
      };
    }
    return state;
  }

  /**
   * Handle daily economy tick (prosperity drift, decree effects)
   */
  function handleDayTick(absoluteDay) {
    const state = engine.getState();
    const stateWithEcon = initEconomy(state);
    const econ = stateWithEcon.villageEconomy;

    // Guard against double-ticking
    if (econ.lastDayUpdated === absoluteDay) return;

    // Create immutable update
    const drift = (rng.random() - 0.45) * 6; // -3.0 .. +3.3ish
    const newProsperity = clamp(econ.prosperity + drift, 0, 100);

    // Check for active Town Hall decree effects
    const eff = state?.government?.townHallEffects;
    const today = typeof absoluteDay === 'number' ? Math.floor(absoluteDay) : 0;
    const isActive =
      eff &&
      eff.petitionId &&
      typeof eff.expiresOnDay === 'number' &&
      today <= eff.expiresOnDay;

    let prosperityDelta = 0;
    let tradeDelta = 0;
    let securityDelta = 0;
    let lastDecreeNudge = null;

    if (isActive) {
      const pDelta = Number(eff.econProsperityDelta);
      const tDelta = Number(eff.econTradeDelta);
      const sDelta = Number(eff.econSecurityDelta);

      prosperityDelta = Number.isFinite(pDelta) ? Math.round(pDelta) : 0;
      tradeDelta = Number.isFinite(tDelta) ? Math.round(tDelta) : 0;
      securityDelta = Number.isFinite(sDelta) ? Math.round(sDelta) : 0;

      if (prosperityDelta || tradeDelta || securityDelta) {
        lastDecreeNudge = {
          day: absoluteDay,
          petitionId: eff.petitionId,
          deltas: {
            prosperity: prosperityDelta,
            trade: tradeDelta,
            security: securityDelta
          }
        };
      }
    }

    const updatedEcon = {
      ...econ,
      prosperity: clamp(newProsperity + prosperityDelta, 0, 100),
      trade: clamp((econ.trade || 50) + tradeDelta, 0, 100),
      security: clamp((econ.security || 40) + securityDelta, 0, 100),
      lastDayUpdated: absoluteDay
    };

    if (lastDecreeNudge) {
      updatedEcon.lastDecreeNudge = lastDecreeNudge;
    }

    // Recompute tier
    recomputeTier(updatedEcon);

    // Immutable state update through engine
    const newState = {
      ...stateWithEcon,
      villageEconomy: updatedEcon
    };

    engine.setState(newState);

    // Emit event for other systems
    engine.emit('village:economyTick', {
      day: absoluteDay,
      prosperity: updatedEcon.prosperity,
      tierId: updatedEcon.tierId,
      decreeNudge: lastDecreeNudge
    });
  }

  /**
   * Handle economy changes after battle (security & prosperity boost)
   */
  function handleAfterBattle(enemy, area) {
    const state = engine.getState();
    const stateWithEcon = initEconomy(state);
    const econ = stateWithEcon.villageEconomy;

    // Only monsters outside the village affect trade route safety
    if (area !== 'forest' && area !== 'ruins') return;

    const bossBonus = enemy && enemy.isBoss ? 8 : 2;
    const newSecurity = clamp((econ.security || 40) + bossBonus, 0, 100);
    const newProsperity = clamp(econ.prosperity + bossBonus * 0.6, 0, 100);

    const updatedEcon = {
      ...econ,
      security: newSecurity,
      prosperity: newProsperity
    };

    recomputeTier(updatedEcon);

    // Immutable state update
    const newState = {
      ...stateWithEcon,
      villageEconomy: updatedEcon
    };

    engine.setState(newState);

    // Emit event
    engine.emit('village:economyAfterBattle', {
      enemy,
      area,
      securityDelta: bossBonus,
      prosperityDelta: bossBonus * 0.6,
      newTierId: updatedEcon.tierId
    });
  }

  /**
   * Handle economy changes after purchase (trade & prosperity boost)
   */
  function handleAfterPurchase(goldSpent, context = 'village') {
    goldSpent = Number(goldSpent);
    if (!Number.isFinite(goldSpent) || goldSpent <= 0) return;

    // Only village purchases boost local economy
    if (context !== 'village') return;

    const state = engine.getState();
    const stateWithEcon = initEconomy(state);
    const econ = stateWithEcon.villageEconomy;

    const tradeDelta = Math.min(5, goldSpent / 20);
    const prosperityDelta = Math.min(4, goldSpent / 25);

    const updatedEcon = {
      ...econ,
      trade: clamp((econ.trade || 50) + tradeDelta, 0, 100),
      prosperity: clamp(econ.prosperity + prosperityDelta, 0, 100)
    };

    recomputeTier(updatedEcon);

    // Immutable state update
    const newState = {
      ...stateWithEcon,
      villageEconomy: updatedEcon
    };

    engine.setState(newState);

    // Emit event
    engine.emit('village:economyAfterPurchase', {
      goldSpent,
      context,
      tradeDelta,
      prosperityDelta,
      newTierId: updatedEcon.tierId
    });
  }

  // Public API
  return {
    // State initialization
    initEconomy: () => {
      const state = engine.getState();
      const newState = initEconomy(state);
      if (newState !== state) {
        engine.setState(newState);
      }
    },

    // Read-only accessors (delegate to existing pure functions)
    getSummary: () => getVillageEconomySummary(engine.getState()),
    getMerchantPrice: (basePrice, context) => getMerchantPrice(basePrice, engine.getState(), context),
    getRestCost: () => getRestCost(engine.getState()),
    getTiers: () => ECONOMY_TIERS,

    // State-modifying operations (engine-integrated)
    handleDayTick,
    handleAfterBattle,
    handleAfterPurchase
  };
}
