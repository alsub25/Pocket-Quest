// Locations/Village/villageEconomy.js

// Economy tiers describe the *baseline* village situation.
// Government can nudge effective prosperity/security/trade up or down on top.
import { getVillageGovernmentEffect } from "../../Systems/kingdomGovernment.js";

export const ECONOMY_TIERS = {
  struggling: {
    id: "struggling",
    name: "Struggling",
    merchantPriceMultiplier: 1.2,
    restCostBase: 18,
    priceDescriptor: "a bit steep",
    description: "Coin is tight and goods are scarce."
  },
  stable: {
    id: "stable",
    name: "Stable",
    merchantPriceMultiplier: 1.0,
    restCostBase: 15,
    priceDescriptor: "about normal",
    description: "Trade flows steadily and people get by."
  },
  thriving: {
    id: "thriving",
    name: "Thriving",
    merchantPriceMultiplier: 0.9,
    restCostBase: 12,
    priceDescriptor: "surprisingly fair",
    description: "Caravans are constant and the market hums."
  }
};

// Ensure state.villageEconomy exists with baseline metrics.
export function initVillageEconomyState(state) {
  if (!state.villageEconomy) {
    state.villageEconomy = {
      tierId: "stable",
      prosperity: 50, // 0–100 (raw, pre-government)
      security: 40,
      trade: 50,
      lastDayUpdated: 0
    };
  }
  return state.villageEconomy;
}

/**
 * Government-aware summary:
 * - Start from stored econ values (prosperity, trade, security).
 * - Pull village-level modifiers from the kingdom government.
 * - Compute "effective" prosperity/trade/security & tier.
 *
 * All other systems (bank, merchants, tavern rest) should call this
 * instead of touching state.villageEconomy directly.
 *
 * The values returned here are the *adjusted* ones. This is what
 * every other system "sees" when it looks at the economy.
 */
export function getVillageEconomySummary(state) {
  const econ = initVillageEconomyState(state);

  // Raw values in the save
  const rawProsperity = econ.prosperity;
  const rawSecurity = econ.security;
  const rawTrade = econ.trade;

  // Ask the kingdom what its influence on Emberwood is
  let govEffect = null;
  try {
    govEffect = getVillageGovernmentEffect(state, "village");
  } catch (e) {
    // If government module isn’t wired yet, just fall back gracefully.
    govEffect = null;
  }

  let effectiveProsperity = rawProsperity;
  let effectiveSecurity = rawSecurity;
  let effectiveTrade = rawTrade;

  if (govEffect && govEffect.hasData) {
    const pMod =
      typeof govEffect.prosperityModifier === "number"
        ? govEffect.prosperityModifier
        : 0; // -0.3 .. +0.3

    const sMod =
      typeof govEffect.safetyModifier === "number"
        ? govEffect.safetyModifier
        : 0; // -0.3 .. +0.3

    // Nudge the metrics toward government influence.
    // We keep it fairly gentle so economy still matters.
    effectiveProsperity = clamp(
      rawProsperity + Math.round(rawProsperity * pMod),
      0,
      100
    );

    effectiveTrade = clamp(
      rawTrade + Math.round(rawTrade * pMod * 0.7),
      0,
      100
    );

    effectiveSecurity = clamp(
      rawSecurity + Math.round(rawSecurity * sMod),
      0,
      100
    );
  }

  // Derive an *effective* tier from the adjusted prosperity.
  // This controls merchant prices & rest costs.
  let effectiveTierId = "stable";
  if (effectiveProsperity < 35) {
    effectiveTierId = "struggling";
  } else if (effectiveProsperity > 70) {
    effectiveTierId = "thriving";
  }

  const tier = ECONOMY_TIERS[effectiveTierId] || ECONOMY_TIERS.stable;

  // IMPORTANT CHANGE:
  // We no longer spread raw econ or expose rawProsperity/rawSecurity/rawTrade.
  // The numbers below are the adjusted ones that other systems actually use.
  return {
    prosperity: effectiveProsperity,
    security: effectiveSecurity,
    trade: effectiveTrade,
    tierId: effectiveTierId,
    tier,
    lastDayUpdated: econ.lastDayUpdated,
    govInfluence: govEffect
  };
}

// Price for a shop item given base price + context (village / wandering)
export function getMerchantPrice(basePrice, state, context = "village") {
  const summary = getVillageEconomySummary(state);
  let mult = summary.tier.merchantPriceMultiplier;

  // Wandering merchants charge a bit more
  if (context === "wandering") {
    mult += 0.1;
  }

  return Math.max(1, Math.round(basePrice * mult));
}

// Tavern rest cost driven by (government-influenced) tier
export function getRestCost(state) {
  const summary = getVillageEconomySummary(state);
  let cost = summary.tier.restCostBase;

  // Town Hall / council petitions can temporarily nudge rest prices
  // (for example, a market-stimulus decree that makes inns more expensive
  // while interest rates are boosted).
  const g = state && state.government;
  const t = state && state.time;
  const today =
    t && typeof t.dayIndex === "number" ? t.dayIndex : 0;

  if (g && g.townHallEffects) {
    const eff = g.townHallEffects;
    const expiresOnDay = typeof eff.expiresOnDay === "number"
      ? eff.expiresOnDay
      : null;

    if (expiresOnDay != null && today <= expiresOnDay) {
      if (typeof eff.restCostMultiplier === "number") {
        cost = Math.round(cost * eff.restCostMultiplier);
      }
    } else if (expiresOnDay != null && today > expiresOnDay) {
      // Clean up expired effect so it doesn't linger.
      delete g.townHallEffects;
    }
  }

  return cost;
}

// Called once when a *new day* is reached (we pass absoluteDay from timeSystem)
export function handleEconomyDayTick(state, absoluteDay) {
  const econ = initVillageEconomyState(state);

  if (econ.lastDayUpdated === absoluteDay) return; // already ticked
  econ.lastDayUpdated = absoluteDay;

  // Slight random drift in prosperity (biased a bit upward)
  const drift = (Math.random() - 0.45) * 6; // -3.0 .. +3.3ish
  econ.prosperity = clamp(econ.prosperity + drift, 0, 100);

  recomputeTier(econ);
}

// Called when you kill a monster in the forest/ruins
export function handleEconomyAfterBattle(state, enemy, area) {
  const econ = initVillageEconomyState(state);

  // Only monsters outside the village affect safety of trade routes
  if (area !== "forest" && area !== "ruins") return;

  const bossBonus = enemy.isBoss ? 8 : 2;
  econ.security = clamp((econ.security || 40) + bossBonus, 0, 100);
  econ.prosperity = clamp(
    econ.prosperity + bossBonus * 0.6,
    0,
    100
  );

  recomputeTier(econ);
}

// Called when you buy something from a village / wandering merchant
export function handleEconomyAfterPurchase(
  state,
  goldSpent,
  context = "village"
) {
  const econ = initVillageEconomyState(state);
  if (goldSpent <= 0) return;

  if (context === "village") {
    // Spending money *in* the village helps trade + prosperity a little
    econ.trade = clamp(
      (econ.trade || 50) + Math.min(5, goldSpent / 20),
      0,
      100
    );
    econ.prosperity = clamp(
      econ.prosperity + Math.min(4, goldSpent / 25),
      0,
      100
    );
    recomputeTier(econ);
  }
  // Wandering merchants don’t directly boost the local economy (you’re sending coin away),
  // so we leave econ unchanged for now.
}

// ----------------- helpers -----------------

function recomputeTier(econ) {
  if (econ.prosperity < 35) {
    econ.tierId = "struggling";
  } else if (econ.prosperity > 70) {
    econ.tierId = "thriving";
  } else {
    econ.tierId = "stable";
  }
}

// Clamp to range AND round to a whole number
function clamp(val, min, max) {
  const rounded = Math.round(val);
  if (rounded < min) return min;
  if (rounded > max) return max;
  return rounded;
}