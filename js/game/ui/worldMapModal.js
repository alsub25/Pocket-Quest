// worldMapModal.js
// UI Modal for displaying and interacting with the overworld map

import {
  WORLD_MAP,
  generateMapDisplay,
  getRegion,
  getAccessibleRegions,
  canAccessRegion
} from '../data/worldMap.js';

/**
 * Open the world map modal
 * @param {Object} state - Game state
 * @param {Function} openModal - Modal open function
 * @param {Function} onTravel - Callback when player travels to a new location
 */
export function openWorldMapModal(state, openModal, onTravel) {
  if (!state || !state.player) return;

  const currentRegion = state.area || 'village';
  const playerLevel = state.player.level || 1;
  const unlockedRegions = (state.worldMap && state.worldMap.unlockedRegions) || [];
  const completedQuests = [];
  
  // Get completed quests for requirements checking
  if (state.quests && state.quests.completed) {
    completedQuests.push(...state.quests.completed);
  }

  openModal('World Map', (body) => {
    body.innerHTML = '';
    body.classList.add('world-map-modal');

    // Map title section
    const titleSection = document.createElement('div');
    titleSection.className = 'map-title-section';
    titleSection.innerHTML = `
      <h3>⚔️ Emberwood Region ⚔️</h3>
      <p class="hint">Explore the lands beyond the village. Each location offers unique challenges and rewards.</p>
    `;
    body.appendChild(titleSection);

    // ASCII Map Display
    const mapContainer = document.createElement('div');
    mapContainer.className = 'map-display-container';
    
    const mapPre = document.createElement('pre');
    mapPre.className = 'map-display';
    mapPre.textContent = generateMapDisplay(currentRegion, unlockedRegions);
    mapContainer.appendChild(mapPre);
    
    const mapLegend = document.createElement('div');
    mapLegend.className = 'map-legend';
    mapLegend.innerHTML = `
      <div class="legend-item"><span class="legend-icon">⚔️</span> Your Location</div>
      <div class="legend-item"><span class="legend-icon">🏘️</span> Village (Safe)</div>
      <div class="legend-item"><span class="legend-icon">?</span> Undiscovered</div>
    `;
    mapContainer.appendChild(mapLegend);
    
    body.appendChild(mapContainer);

    // Current Location Info
    const currentInfo = document.createElement('div');
    currentInfo.className = 'current-location-info';
    const current = getRegion(currentRegion);
    if (current) {
      currentInfo.innerHTML = `
        <h4>${current.icon} ${current.name}</h4>
        <p>${current.description}</p>
      `;
    }
    body.appendChild(currentInfo);

    // Available Locations List
    const locationsSection = document.createElement('div');
    locationsSection.className = 'locations-section';
    
    const locationsTitle = document.createElement('h4');
    locationsTitle.textContent = 'Available Locations';
    locationsSection.appendChild(locationsTitle);

    const accessibleRegions = getAccessibleRegions(currentRegion, playerLevel, unlockedRegions, completedQuests);
    
    if (accessibleRegions.length === 0) {
      const noLocations = document.createElement('p');
      noLocations.className = 'hint';
      noLocations.textContent = 'No new locations available from here. Complete quests or gain levels to unlock more areas.';
      locationsSection.appendChild(noLocations);
    } else {
      const locationsList = document.createElement('div');
      locationsList.className = 'locations-list';

      accessibleRegions.forEach(region => {
        const locationCard = createLocationCard(region, currentRegion, playerLevel, unlockedRegions, completedQuests, onTravel);
        locationsList.appendChild(locationCard);
      });

      locationsSection.appendChild(locationsList);
    }

    body.appendChild(locationsSection);

    // All Regions Summary (collapsed by default)
    const allRegionsSection = document.createElement('details');
    allRegionsSection.className = 'all-regions-section';
    
    const summary = document.createElement('summary');
    summary.textContent = 'View All Regions';
    allRegionsSection.appendChild(summary);

    const allRegionsList = document.createElement('div');
    allRegionsList.className = 'all-regions-list';

    WORLD_MAP.regions.forEach(region => {
      const isUnlocked = region.unlocked || unlockedRegions.includes(region.id);
      const isCurrent = region.id === currentRegion;
      
      const regionItem = document.createElement('div');
      regionItem.className = `region-item ${isUnlocked ? 'unlocked' : 'locked'} ${isCurrent ? 'current' : ''}`;
      
      let requirementText = '';
      if (!isUnlocked) {
        const requirements = [];
        if (region.requiresLevel) {
          requirements.push(`Level ${region.requiresLevel}+`);
        }
        if (region.requiresQuest) {
          requirements.push('Quest Required');
        }
        if (requirements.length > 0) {
          requirementText = `<span class="requirement">(${requirements.join(', ')})</span>`;
        }
      }
      
      regionItem.innerHTML = `
        <div class="region-header">
          <span class="region-icon">${region.icon}</span>
          <span class="region-name">${region.name}</span>
          ${isCurrent ? '<span class="current-marker">(Current)</span>' : ''}
          ${!isUnlocked ? '<span class="locked-marker">🔒</span>' : ''}
        </div>
        <p class="region-description">${isUnlocked ? region.description : '???'}</p>
        ${requirementText}
      `;
      
      allRegionsList.appendChild(regionItem);
    });

    allRegionsSection.appendChild(allRegionsList);
    body.appendChild(allRegionsSection);

    // Add custom styles
    addMapModalStyles();
  });
}

/**
 * Create a location card for travel
 */
function createLocationCard(region, currentRegion, playerLevel, unlockedRegions, completedQuests, onTravel) {
  const card = document.createElement('div');
  card.className = 'location-card';
  
  const isUnlocked = region.unlocked || unlockedRegions.includes(region.id);
  const canAccess = canAccessRegion(region, playerLevel, unlockedRegions, completedQuests);
  const isCurrent = region.id === currentRegion;
  
  if (isCurrent) {
    card.classList.add('current-location');
  }
  
  const dangerBadge = region.dangerLevel 
    ? `<span class="danger-badge danger-${region.dangerLevel}">${region.dangerLevel.toUpperCase()}</span>`
    : '';
  
  card.innerHTML = `
    <div class="location-card-header">
      <span class="location-icon">${region.icon}</span>
      <span class="location-name">${region.name}</span>
      ${dangerBadge}
    </div>
    <p class="location-description">${region.description}</p>
  `;
  
  if (!isCurrent && (isUnlocked || canAccess)) {
    const travelBtn = document.createElement('button');
    travelBtn.className = 'btn outline travel-btn';
    travelBtn.textContent = 'Travel Here';
    travelBtn.onclick = () => {
      if (onTravel) {
        onTravel(region.id);
      }
    };
    card.appendChild(travelBtn);
  } else if (isCurrent) {
    const currentLabel = document.createElement('div');
    currentLabel.className = 'current-label';
    currentLabel.textContent = '📍 You are here';
    card.appendChild(currentLabel);
  }
  
  return card;
}

/**
 * Add custom CSS for map modal
 */
function addMapModalStyles() {
  const styleId = 'world-map-modal-styles';
  if (document.getElementById(styleId)) return;
  
  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
    .world-map-modal {
      max-height: 80vh;
      overflow-y: auto;
    }
    
    .map-title-section {
      text-align: center;
      margin-bottom: 1rem;
    }
    
    .map-title-section h3 {
      margin-bottom: 0.5rem;
      color: var(--text-primary);
    }
    
    .map-display-container {
      background: var(--bg-secondary);
      border: 2px solid var(--border);
      border-radius: 8px;
      padding: 1rem;
      margin-bottom: 1.5rem;
    }
    
    .map-display {
      font-family: monospace;
      font-size: 0.9rem;
      line-height: 1.4;
      overflow-x: auto;
      background: var(--bg-primary);
      padding: 1rem;
      border-radius: 4px;
      white-space: pre;
      text-align: center;
    }
    
    .map-legend {
      display: flex;
      justify-content: center;
      gap: 1.5rem;
      margin-top: 0.75rem;
      flex-wrap: wrap;
    }
    
    .legend-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.85rem;
    }
    
    .legend-icon {
      font-size: 1.1rem;
    }
    
    .current-location-info {
      background: var(--bg-secondary);
      border-left: 4px solid var(--accent);
      padding: 1rem;
      margin-bottom: 1.5rem;
      border-radius: 4px;
    }
    
    .current-location-info h4 {
      margin-top: 0;
      margin-bottom: 0.5rem;
      color: var(--text-primary);
    }
    
    .locations-section h4 {
      margin-bottom: 1rem;
      color: var(--text-primary);
    }
    
    .locations-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      margin-bottom: 1.5rem;
    }
    
    .location-card {
      background: var(--bg-secondary);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 1rem;
      transition: border-color 0.2s, transform 0.2s;
    }
    
    .location-card:hover {
      border-color: var(--accent);
      transform: translateY(-2px);
    }
    
    .location-card.current-location {
      border-color: var(--accent);
      background: var(--bg-primary);
    }
    
    .location-card-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 0.5rem;
    }
    
    .location-icon {
      font-size: 1.5rem;
    }
    
    .location-name {
      font-weight: bold;
      font-size: 1.1rem;
      flex: 1;
    }
    
    .danger-badge {
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.7rem;
      font-weight: bold;
      text-transform: uppercase;
    }
    
    .danger-low {
      background: #4a7c59;
      color: white;
    }
    
    .danger-medium {
      background: #d4a574;
      color: #2a1810;
    }
    
    .danger-high {
      background: #c44569;
      color: white;
    }
    
    .danger-extreme {
      background: #8b3a62;
      color: white;
    }
    
    .location-description {
      margin: 0.5rem 0;
      font-size: 0.9rem;
      color: var(--text-secondary);
    }
    
    .travel-btn {
      width: 100%;
      margin-top: 0.5rem;
    }
    
    .current-label {
      text-align: center;
      padding: 0.5rem;
      margin-top: 0.5rem;
      background: var(--accent);
      color: white;
      border-radius: 4px;
      font-weight: bold;
    }
    
    .all-regions-section {
      margin-top: 2rem;
      border-top: 2px solid var(--border);
      padding-top: 1rem;
    }
    
    .all-regions-section summary {
      cursor: pointer;
      font-weight: bold;
      padding: 0.5rem;
      margin-bottom: 1rem;
      user-select: none;
    }
    
    .all-regions-section summary:hover {
      color: var(--accent);
    }
    
    .all-regions-list {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 1rem;
    }
    
    .region-item {
      background: var(--bg-secondary);
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 0.75rem;
    }
    
    .region-item.locked {
      opacity: 0.6;
    }
    
    .region-item.current {
      border-color: var(--accent);
      border-width: 2px;
    }
    
    .region-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.5rem;
    }
    
    .region-icon {
      font-size: 1.2rem;
    }
    
    .region-name {
      font-weight: bold;
      flex: 1;
    }
    
    .current-marker {
      color: var(--accent);
      font-size: 0.8rem;
    }
    
    .locked-marker {
      font-size: 0.9rem;
    }
    
    .region-description {
      font-size: 0.85rem;
      margin: 0.25rem 0;
      color: var(--text-secondary);
    }
    
    .requirement {
      font-size: 0.8rem;
      color: var(--text-muted);
      font-style: italic;
    }
  `;
  
  document.head.appendChild(style);
}
