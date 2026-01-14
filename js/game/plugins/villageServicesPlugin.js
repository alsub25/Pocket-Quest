// js/game/plugins/villageServicesPlugin.js
// Plugin to register village services with the engine
//
// This plugin ensures all village-related systems (economy, population, etc.)
// run through the engine properly with immutable state updates and event emissions.

import { createVillageEconomyService } from '../services/villageEconomyService.js';
import { createVillagePopulationService } from '../services/villagePopulationService.js';

export function createVillageServicesPlugin() {
  let economyService = null;
  let populationService = null;

  return {
    id: 'ew.villageServices',
    requires: ['ew.rngBridge'], // Needs RNG service

    init(engine) {
      // Create and register village services
      try {
        economyService = createVillageEconomyService(engine);
        engine.registerService('village.economy', economyService);

        populationService = createVillagePopulationService(engine);
        engine.registerService('village.population', populationService);

        // Initialize village state
        economyService.initEconomy();
        populationService.initPopulation();

        engine.log?.info?.('village', 'Village services registered with engine', {
          economy: !!economyService,
          population: !!populationService
        });
      } catch (e) {
        engine.log?.error?.('village', 'Failed to register village services', { error: e.message });
      }
    },

    start(engine) {
      // Subscribe to relevant events that trigger village system updates

      // Economy: handle after battle
      engine.on('combat:victory', (payload) => {
        if (economyService && payload.enemy && payload.area) {
          economyService.handleAfterBattle(payload.enemy, payload.area);
        }
      });

      // Economy: handle after purchase
      engine.on('merchant:purchase', (payload) => {
        if (economyService && payload.goldSpent) {
          economyService.handleAfterPurchase(payload.goldSpent, payload.context);
        }
      });

      // Listen for time advancement events to trigger daily ticks
      engine.on('time:dayChanged', (payload) => {
        if (economyService && typeof payload.newDay === 'number') {
          economyService.handleDayTick(payload.newDay);
        }
        if (populationService && typeof payload.newDay === 'number') {
          populationService.handleDayTick(payload.newDay);
        }
      });

      engine.log?.info?.('village', 'Village services started and listening for events');
    },

    stop(engine) {
      // Cleanup event listeners
      engine.off('combat:victory');
      engine.off('merchant:purchase');
      engine.off('time:dayChanged');

      engine.log?.info?.('village', 'Village services stopped');
    },

    dispose(engine) {
      // Unregister services
      try {
        engine.unregisterService('village.economy');
        engine.unregisterService('village.population');
      } catch (_) {}

      economyService = null;
      populationService = null;
    }
  };
}
