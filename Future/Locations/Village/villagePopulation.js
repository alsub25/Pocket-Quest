// villagePopulation.js

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function ensureVillagePopulation(state) {
  if (!state.village) state.village = {};
  if (!state.village.population) {
    state.village.population = {
      size: randInt(900, 1600),
      mood: 0,          // -100..+100, 0 = neutral
      lastDayUpdated: null
    };
  }
  return state.village.population;
}

export function adjustPopulation(state, delta) {
  const pop = ensureVillagePopulation(state);
  pop.size = Math.max(0, pop.size + delta);
  return pop;
}

export function adjustPopulationMood(state, delta) {
  const pop = ensureVillagePopulation(state);
  pop.mood = Math.max(-100, Math.min(100, pop.mood + delta));
  return pop;
}

// Optional: daily drift, events, etc.
export function handlePopulationDayTick(state, absoluteDay, hooks = {}) {
  const pop = ensureVillagePopulation(state);
  pop.lastDayUpdated = absoluteDay;

  // Example tiny drift back toward neutral mood:
  if (pop.mood > 0) pop.mood -= 1;
  else if (pop.mood < 0) pop.mood += 1;
}