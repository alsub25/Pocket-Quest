// worldMap.js
// Defines the overworld map structure for Emberwood

export const WORLD_MAP = {
  regions: [
    {
      id: 'village',
      name: 'Emberwood Village',
      description: 'A peaceful settlement nestled in the heart of the forest. Home to merchants, a tavern, and your trusted allies.',
      position: { x: 5, y: 5 },
      unlocked: true,
      icon: '🏘️',
      connections: ['misty_woods', 'riverside_path', 'oathgrove']
    },
    {
      id: 'misty_woods',
      name: 'Misty Woods',
      description: 'Dense forests shrouded in perpetual mist. Goblins and wolves prowl these shadowy paths.',
      position: { x: 3, y: 3 },
      unlocked: true,
      icon: '🌲',
      connections: ['village', 'ancient_ruins'],
      dangerLevel: 'low'
    },
    {
      id: 'riverside_path',
      name: 'Riverside Path',
      description: 'A serene trail following the crystal river. Bandits sometimes ambush travelers here.',
      position: { x: 7, y: 4 },
      unlocked: true,
      icon: '〰️',
      connections: ['village', 'mountain_pass'],
      dangerLevel: 'low'
    },
    {
      id: 'oathgrove',
      name: 'The Oathgrove',
      description: 'An ancient grove where the Blackbark Oath was first sworn. Sacred and mysterious.',
      position: { x: 5, y: 7 },
      unlocked: false,
      icon: '🌳',
      connections: ['village', 'shadowfen'],
      dangerLevel: 'medium',
      requiresQuest: 'main_quest_step_5'
    },
    {
      id: 'ancient_ruins',
      name: 'Ancient Ruins',
      description: 'Crumbling stone structures from a forgotten civilization. Undead and dark magic linger here.',
      position: { x: 1, y: 2 },
      unlocked: false,
      icon: '🏛️',
      connections: ['misty_woods', 'haunted_crypt'],
      dangerLevel: 'medium',
      requiresLevel: 5
    },
    {
      id: 'mountain_pass',
      name: 'Mountain Pass',
      description: 'Treacherous mountain paths with steep cliffs. Giants and trolls make their home here.',
      position: { x: 9, y: 3 },
      unlocked: false,
      icon: '⛰️',
      connections: ['riverside_path', 'starfall_ridge'],
      dangerLevel: 'high',
      requiresLevel: 8
    },
    {
      id: 'shadowfen',
      name: 'Shadowfen Marshes',
      description: 'Dark swamps filled with poisonous creatures and cursed spirits.',
      position: { x: 4, y: 9 },
      unlocked: false,
      icon: '🌊',
      connections: ['oathgrove'],
      dangerLevel: 'high',
      requiresLevel: 10
    },
    {
      id: 'haunted_crypt',
      name: 'Haunted Crypt',
      description: 'The resting place of ancient warriors, now overrun by necromantic forces.',
      position: { x: 1, y: 5 },
      unlocked: false,
      icon: '⚰️',
      connections: ['ancient_ruins'],
      dangerLevel: 'high',
      requiresLevel: 12
    },
    {
      id: 'starfall_ridge',
      name: 'Starfall Ridge',
      description: 'The highest peak where meteors are said to fall. Dragons patrol these skies.',
      position: { x: 10, y: 1 },
      unlocked: false,
      icon: '✨',
      connections: ['mountain_pass'],
      dangerLevel: 'extreme',
      requiresLevel: 15
    }
  ]
};

// Map dimensions for ASCII display
export const MAP_DISPLAY = {
  width: 11,
  height: 10,
  emptyTile: '  ·  ',
  playerMarker: ' ⚔️ ',
  unlockedPath: '  -  ',
  lockedPath: '  ?  '
};

/**
 * Generate a text-based map representation
 */
export function generateMapDisplay(currentLocation, unlockedRegions = []) {
  const display = [];
  const map = Array(MAP_DISPLAY.height).fill(null).map(() => 
    Array(MAP_DISPLAY.width).fill(MAP_DISPLAY.emptyTile)
  );

  // Place regions on map
  WORLD_MAP.regions.forEach(region => {
    const { x, y } = region.position;
    const isUnlocked = region.unlocked || unlockedRegions.includes(region.id);
    const isCurrent = region.id === currentLocation;
    
    if (isCurrent) {
      map[y][x] = MAP_DISPLAY.playerMarker;
    } else if (isUnlocked) {
      map[y][x] = `  ${region.icon}  `;
    } else {
      map[y][x] = MAP_DISPLAY.lockedPath;
    }
  });

  // Convert to string
  for (let y = 0; y < MAP_DISPLAY.height; y++) {
    display.push(map[y].join(''));
  }

  return display.join('\n');
}

/**
 * Get region by ID
 */
export function getRegion(regionId) {
  return WORLD_MAP.regions.find(r => r.id === regionId);
}

/**
 * Check if player can access a region
 */
export function canAccessRegion(region, playerLevel, unlockedRegions, completedQuests) {
  if (!region) return false;
  
  // Check if already unlocked
  if (region.unlocked || unlockedRegions.includes(region.id)) {
    return true;
  }
  
  // Check level requirement
  if (region.requiresLevel && playerLevel < region.requiresLevel) {
    return false;
  }
  
  // Check quest requirement
  if (region.requiresQuest && !completedQuests.includes(region.requiresQuest)) {
    return false;
  }
  
  // Check if connected to current location
  // (Additional logic could be added here)
  
  return false;
}

/**
 * Get accessible regions from current location
 */
export function getAccessibleRegions(currentRegion, playerLevel, unlockedRegions, completedQuests) {
  const current = getRegion(currentRegion);
  if (!current) return [];
  
  return current.connections
    .map(id => getRegion(id))
    .filter(region => {
      if (!region) return false;
      const isUnlocked = region.unlocked || unlockedRegions.includes(region.id);
      const meetsRequirements = canAccessRegion(region, playerLevel, unlockedRegions, completedQuests);
      return isUnlocked || meetsRequirements;
    });
}
