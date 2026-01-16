# Game State API Reference

## Overview

Emberwood maintains a single authoritative game state object that serves as the single source of truth for all game data. This document describes the state structure and common access patterns.

## State Structure

### Top-Level Schema

```javascript
const state = {
  // Character data
  player: { /* Player stats, inventory, equipment */ },
  
  // World time
  time: { /* Current day, year, time of day */ },
  
  // Village state
  village: { /* Economy, merchant, population */ },
  
  // Government
  government: { /* Kingdom, council, decrees */ },
  
  // Banking
  bank: { /* Deposits, loans, investments */ },
  
  // Quest tracking
  quests: { /* Active and completed quests */ },
  
  // Combat (only during battles)
  combat: { /* Enemies, turn state */ },
  
  // UI state
  ui: { /* Current screen, modals, filters */ },
  
  // Feature flags
  flags: { /* Debug modes, cheats */ },
  
  // Debug tools
  debug: { /* RNG logging, diagnostics */ },
  
  // Event log
  log: [ /* Game event history */ ]
};
```

## Player State

### Structure

```javascript
state.player = {
  // Identity
  name: "Aria",
  class: "warrior",
  
  // Level and progression
  level: 5,
  xp: 1250,
  xpToNext: 2000,
  skillPoints: 0,
  
  // Health and resources
  hp: 120,
  maxHp: 120,
  resource: 50,           // Mana, fury, etc.
  maxResource: 100,
  resourceType: "mana",   // "mana", "fury", "essence"
  
  // Core stats
  stats: {
    strength: 15,
    agility: 12,
    intelligence: 10,
    vitality: 16,
    // Derived stats
    attack: 45,
    magic: 35,
    armor: 20,
    magicResist: 15,
    speed: 10
  },
  
  // Skills (allocation)
  skills: {
    Strength: 5,
    Endurance: 3,
    Willpower: 2
  },
  
  // Inventory
  inventory: [
    {
      id: "health_potion",
      name: "Health Potion",
      type: "consumable",
      quantity: 3,
      // ... other item properties
    }
  ],
  
  // Equipment
  equipment: {
    mainHand: { /* weapon */ },
    offHand: { /* shield or weapon */ },
    head: { /* helmet */ },
    chest: { /* armor */ },
    legs: { /* greaves */ },
    feet: { /* boots */ },
    accessory1: { /* ring/amulet */ },
    accessory2: { /* ring/amulet */ }
  },
  
  // Talents
  talents: ["critical_mastery", "elemental_fury"],
  
  // Gold
  gold: 1500,
  
  // Location
  area: "village",
  
  // Companion
  companion: {
    id: "ember_wolf",
    name: "Ember Wolf",
    level: 5,
    // ... companion stats
  }
};
```

### Common Access Patterns

#### Reading Player Stats

```javascript
// Basic stats
const playerHp = state.player.hp;
const playerMaxHp = state.player.maxHp;
const playerGold = state.player.gold;
const playerLevel = state.player.level;

// Combat stats
const attack = state.player.stats.attack;
const armor = state.player.stats.armor;

// Check if player is alive
const isAlive = state.player.hp > 0;
```

#### Updating Player Stats (Immutable)

```javascript
// Update HP
engine.setState({
  ...state,
  player: {
    ...state.player,
    hp: Math.max(0, Math.min(newHp, state.player.maxHp))
  }
});

// Add gold
engine.setState({
  ...state,
  player: {
    ...state.player,
    gold: state.player.gold + amount
  }
});

// Level up
engine.setState({
  ...state,
  player: {
    ...state.player,
    level: state.player.level + 1,
    skillPoints: state.player.skillPoints + 1,
    xp: state.player.xp - state.player.xpToNext
  }
});
```

#### Inventory Management

```javascript
// Find item in inventory
const potion = state.player.inventory.find(item => item.id === 'health_potion');

// Add item to inventory
const newInventory = [...state.player.inventory];
const existingItem = newInventory.find(item => item.id === newItem.id);
if (existingItem && newItem.stackable) {
  existingItem.quantity += newItem.quantity;
} else {
  newInventory.push(newItem);
}
engine.setState({
  ...state,
  player: {
    ...state.player,
    inventory: newInventory
  }
});

// Remove item from inventory
engine.setState({
  ...state,
  player: {
    ...state.player,
    inventory: state.player.inventory.filter(item => item.id !== itemId)
  }
});
```

#### Equipment Management

```javascript
// Equip item
engine.setState({
  ...state,
  player: {
    ...state.player,
    equipment: {
      ...state.player.equipment,
      [slot]: item
    }
  }
});

// Unequip item
engine.setState({
  ...state,
  player: {
    ...state.player,
    equipment: {
      ...state.player.equipment,
      [slot]: null
    }
  }
});

// Check if item is equipped
const isEquipped = state.player.equipment[slot]?.id === itemId;
```

## Time State

### Structure

```javascript
state.time = {
  dayIndex: 15,          // Absolute day number
  year: 1,
  dayOfWeek: 3,         // 0-6 (0 = Sunday)
  dayPart: "morning",   // "morning", "afternoon", "evening", "night"
};
```

### Common Access Patterns

```javascript
// Current time
const currentDay = state.time.dayIndex;
const timeOfDay = state.time.dayPart;

// Check if it's morning
const isMorning = state.time.dayPart === 'morning';

// Advance time (use timeService)
const timeService = engine.get('time.service');
const newTime = timeService.advanceTime(state);
```

## Village State

### Structure

```javascript
state.village = {
  // Economy
  economy: {
    prosperity: 65,
    trade: 70,
    security: 60,
    tier: "Stable",
    lastProcessedDay: 15
  },
  
  // Merchant
  merchant: {
    stock: {
      "iron_sword": { quantity: 3, price: 150 },
      "health_potion": { quantity: 10, price: 25 }
    },
    shopNames: {
      blacksmith: "Brightforge Smithy",
      alchemist: "Starfall Tomes"
    }
  },
  
  // Population
  population: {
    count: 500,
    mood: 70,
    lastProcessedDay: 15
  }
};
```

### Common Access Patterns

```javascript
// Economy checks
const economyTier = state.village.economy.tier;
const prosperity = state.village.economy.prosperity;

// Merchant stock
const hasItem = state.village.merchant.stock[itemId]?.quantity > 0;
const itemPrice = state.village.merchant.stock[itemId]?.price || 0;

// Population mood
const villagersMood = state.village.population.mood;
```

## Combat State

### Structure

```javascript
state.combat = {
  // Current enemies
  enemies: [
    {
      id: "goblin_1",
      name: "Goblin Warrior",
      hp: 45,
      maxHp: 60,
      attack: 15,
      // ... enemy stats
      statuses: ["bleeding", "chilled"]
    }
  ],
  
  // Turn tracking
  turnCount: 5,
  currentTurn: "player",
  
  // Player intent
  playerIntent: null,
  
  // Combat modifiers
  modifiers: {
    playerDamageBonus: 0,
    enemyDamageBonus: 0
  }
};
```

### Common Access Patterns

```javascript
// Check if in combat
const inCombat = state.combat && Array.isArray(state.combat.enemies);

// Get current enemy
const enemy = state.combat.enemies[0];

// Check if enemy is alive
const isEnemyAlive = enemy.hp > 0;

// All enemies defeated
const allEnemiesDefeated = state.combat.enemies.every(e => e.hp <= 0);
```

## Quest State

### Structure

```javascript
state.quests = {
  main: {
    id: "blackbark_oath",
    currentStep: 2,
    flags: {
      metElder: true,
      defeatedWarlord: false
    }
  },
  
  side: [
    {
      id: "whispers_grain",
      name: "Whispers in the Grain",
      currentStep: 1,
      progress: {
        enemiesDefeated: 3,
        itemsCollected: 1
      }
    }
  ],
  
  completed: ["tutorial_combat"],
  
  // Pinned quest (in quest box)
  pinnedQuestId: "whispers_grain"
};
```

### Common Access Patterns

```javascript
// Check main quest progress
const mainQuestStep = state.quests.main.currentStep;
const hasMetElder = state.quests.main.flags.metElder;

// Find active side quest
const activeQuest = state.quests.side.find(q => q.id === questId);

// Check if quest is completed
const isCompleted = state.quests.completed.includes(questId);

// Get pinned quest
const pinnedQuest = state.quests.side.find(q => q.id === state.quests.pinnedQuestId);
```

## UI State

### Structure

```javascript
state.ui = {
  currentScreen: "game",
  previousScreen: "mainMenu",
  
  // Modal stack
  modals: [],
  
  // HUD view
  hudView: "player",  // "player" or "companion"
  
  // Log filters
  logFilter: "all",   // "all", "system", "danger", "good"
  
  // Collapsed panels
  questBoxCollapsed: false,
  logCollapsed: false
};
```

### Common Access Patterns

```javascript
// Current screen
const onMainMenu = state.ui.currentScreen === 'mainMenu';
const inGame = state.ui.currentScreen === 'game';

// Modal state
const modalOpen = state.ui.modals.length > 0;

// Log filter
const showingAllLogs = state.ui.logFilter === 'all';
```

## Flags State

### Structure

```javascript
state.flags = {
  // Debug features
  devCheatsEnabled: false,
  godMode: false,
  alwaysCrit: false,
  
  // Quest flags
  goblinWhisperShown: false,
  
  // Difficulty
  difficulty: "normal",
  dynamicDifficulty: {
    currentBand: 1,
    easyStreak: 0,
    hardStreak: 0
  }
};
```

### Common Access Patterns

```javascript
// Check dev features
const canCheat = state.flags.devCheatsEnabled;
const godModeActive = state.flags.godMode;

// Quest flags
const hasSeenHint = state.flags[flagName];

// Difficulty
const difficulty = state.flags.difficulty;
```

## Best Practices

### 1. Always Use Immutable Updates

```javascript
// ✅ Good: Immutable update
engine.setState({
  ...state,
  player: {
    ...state.player,
    hp: newHp
  }
});

// ❌ Bad: Direct mutation
state.player.hp = newHp;
```

### 2. Validate Input

```javascript
// ✅ Good: Clamp values
const newHp = Math.max(0, Math.min(amount, state.player.maxHp));

// ✅ Good: Type check
if (typeof amount !== 'number' || !Number.isFinite(amount)) {
  console.warn('Invalid HP amount:', amount);
  return;
}
```

### 3. Use Null Safety

```javascript
// ✅ Good: Optional chaining
const equipped = state.player.equipment.mainHand?.id;

// ✅ Good: Defaults
const gold = state.player?.gold || 0;
```

### 4. Emit Events for State Changes

```javascript
// Update state
engine.setState(newState);

// Emit event for other systems to react
engine.emit('player:damaged', {
  oldHp: state.player.hp,
  newHp: newState.player.hp,
  damage: damage
});
```

### 5. Use Service APIs When Available

```javascript
// ✅ Good: Use service
const timeService = engine.get('time.service');
const newTime = timeService.advanceTime(state);

// ❌ Bad: Direct state manipulation
state.time.dayIndex++;
```

## State Access Helpers

### Getting Engine State

```javascript
// In plugin or service
const state = engine.getState();

// In UI binding
const state = window.__emberwoodStateRef || engine.getState();
```

### Checking State Existence

```javascript
// Check if combat active
if (state.combat && Array.isArray(state.combat.enemies)) {
  // In combat
}

// Check if quest exists
if (state.quests?.main?.id) {
  // Has main quest
}
```

## Further Reading

- `/IMPORT_GUIDELINES.md` - Module import patterns
- `/PLUGIN_ARCHITECTURE.md` - Plugin development guide
- `/js/engine/README.md` - Engine services documentation
- `/js/game/state/initialState.js` - Default state structure
