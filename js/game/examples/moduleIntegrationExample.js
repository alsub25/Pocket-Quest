// js/game/examples/moduleIntegrationExample.js
// Example showing how to integrate the new modular code into gameOrchestrator.js
//
// This file demonstrates the patterns for importing and using the new modules.
// It is NOT meant to be executed, but rather to serve as a reference guide.

/* =============================================================================
 * STEP 1: Import the new modules at the top of gameOrchestrator.js
 * ============================================================================= */

// Character management
import {
    ensurePlayerTalents,
    playerHasTalent,
    grantTalentPointIfNeeded,
    getTalentsForClass,
    canUnlockTalent,
    unlockTalent as unlockTalentCore,
    getTalentSpellElementBonusMap
} from '../character/talentManager.js'

import {
    ensurePlayerStatsDefaults,
    capWord,
    round1,
    roundIntStable,
    numPct,
    elementIcon,
    orderedElementKeys,
    normalizeElemMap,
    ELEMENT_ORDER
} from '../character/statsManager.js'

import {
    getElementalBreakdownsForPlayer,
    computeElementSummariesForPlayer,
    renderElementalBreakdownHtml
} from '../character/elementalBreakdown.js'

// Inventory management
import {
    addItemToInventory as addItemCore,
    addGeneratedItemToInventory as addGeneratedItemCore,
    sellItemFromInventory as sellItemCore
} from '../inventory/inventoryManager.js'

import {
    unequipItemIfEquipped,
    tryAutoEquipItem,
    equipItem,
    unequipSlot,
    ensureEquipmentSlots,
    EQUIPMENT_SLOTS
} from '../inventory/equipmentManager.js'

// Helper utilities
import {
    finiteNumber,
    clampNumber,
    clampFinite,
    safe,
    formatPercentage,
    formatLargeNumber
} from '../helpers/numberHelpers.js'

/* =============================================================================
 * STEP 2: Create wrapper functions that provide the necessary context
 * 
 * The new modules accept dependencies as parameters (dependency injection).
 * Wrappers provide the context from gameOrchestrator's scope.
 * ============================================================================= */

// --- Talent Management Wrappers ---

function unlockTalent(p, talentId) {
    // Callback to handle post-unlock actions
    const onTalentUnlocked = (player) => {
        if (state && state.player === player) {
            recalcPlayerStats()
            try { updateHUD() } catch (_) {}
            try { refreshCharacterSheetIfOpen() } catch (_) {}
            try { if (state.inCombat) updateEnemyPanel() } catch (_) {}
        }
    }

    return unlockTalentCore(
        p,
        talentId,
        TALENT_DEFS,  // From gameOrchestrator scope
        addLog,       // From gameOrchestrator scope
        onTalentUnlocked
    )
}

// --- Inventory Management Wrappers ---

function addItemToInventory(itemId, quantity) {
    const questEventsEnabled = () => {
        try {
            const svc = _engine && typeof _engine.getService === 'function' 
                ? _engine.getService('ew.questEvents') 
                : null
            return !!(svc && svc.enabled)
        } catch (_) { 
            return false 
        }
    }

    return addItemCore(
        state,
        itemId,
        quantity,
        cloneItemDef,         // From gameOrchestrator scope
        _engine?.emit,        // Engine event emitter
        quests,               // Quest system
        questEventsEnabled
    )
}

function addGeneratedItemToInventory(item, quantity = 1) {
    const questEventsEnabled = () => {
        try {
            const svc = _engine && typeof _engine.getService === 'function' 
                ? _engine.getService('ew.questEvents') 
                : null
            return !!(svc && svc.enabled)
        } catch (_) { 
            return false 
        }
    }

    const autoEquip = (state, item) => {
        tryAutoEquipItem(state, item, addLog, recalcPlayerStats)
    }

    return addGeneratedItemCore(
        state,
        item,
        quantity,
        _engine?.emit,
        quests,
        questEventsEnabled,
        autoEquip
    )
}

function sellItemFromInventory(index, context = 'village') {
    return withSaveTxn('inventory:sell', () => {
        const sold = sellItemCore(
            state,
            index,
            context,
            getSellValue,           // From gameOrchestrator scope
            unequipItemIfEquipped,  // From equipmentManager
            addLog,                 // From gameOrchestrator scope
            recalcPlayerStats,      // From gameOrchestrator scope
            updateHUD               // From gameOrchestrator scope
        )
        
        if (sold) {
            requestSave('inventory:sell')
        }
        
        return sold
    })
}

/* =============================================================================
 * STEP 3: Use the modules directly where wrappers aren't needed
 * ============================================================================= */

// Example: Ensuring player stats during initialization
function initializePlayer(player) {
    ensurePlayerStatsDefaults(player)
    ensurePlayerTalents(player)
    ensureEquipmentSlots(player)
}

// Example: Computing elemental summaries for character sheet
function getCharacterSheetElementalData(player) {
    return computeElementSummariesForPlayer(
        player,
        PLAYER_RESIST_CAP,        // Constant from gameOrchestrator
        clampNumber,              // From numberHelpers
        normalizeElementType      // Function from gameOrchestrator
    )
}

// Example: Rendering elemental breakdown HTML
function renderCharacterElementalBreakdown(player) {
    return renderElementalBreakdownHtml(
        player,
        PLAYER_RESIST_CAP,
        clampNumber,
        escapeHtml,               // From uiRuntime
        normalizeElementType
    )
}

// Example: Using talent checks
function applyTalentBonuses(player) {
    if (playerHasTalent(player, 'warrior_strength')) {
        // Apply strength bonus
    }
    
    const elementalBonuses = getTalentSpellElementBonusMap(player)
    // Use bonuses...
}

// Example: Level up logic
function handleLevelUp(player, newLevel) {
    grantTalentPointIfNeeded(player, newLevel)
    // Other level up logic...
}

/* =============================================================================
 * STEP 4: Benefits of this approach
 * ============================================================================= */

// 1. TESTABILITY: Modules can be tested independently
//    - Mock dependencies as parameters
//    - No need to mock entire gameOrchestrator

// 2. MAINTAINABILITY: Logic is centralized
//    - Changes to talent system only in talentManager.js
//    - Changes to inventory only in inventoryManager.js

// 3. REUSABILITY: Functions can be used from multiple places
//    - Quest system can directly use addItemCore
//    - Combat can directly use playerHasTalent
//    - UI can directly use elementalBreakdown functions

// 4. CLARITY: Dependencies are explicit
//    - Clear what each function needs
//    - No hidden global state access

/* =============================================================================
 * STEP 5: Migration strategy (recommended approach)
 * ============================================================================= */

// Phase 1: Add imports (non-breaking)
//   - Import new modules at top of gameOrchestrator.js
//   - Keep existing implementations

// Phase 2: Create wrappers (non-breaking)
//   - Add wrapper functions that use the new modules
//   - Test wrappers alongside existing code

// Phase 3: Replace implementations (breaking, but tested)
//   - Remove old implementations
//   - Use wrapper functions instead
//   - Run full test suite

// Phase 4: Direct usage (optimization)
//   - Where appropriate, use modules directly without wrappers
//   - Further reduces code in gameOrchestrator.js

/* =============================================================================
 * NOTES
 * ============================================================================= */

// - This is a REFERENCE file, not meant to be executed
// - Actual integration should be done incrementally
// - Test thoroughly after each integration step
// - Keep existing smoke tests passing throughout
// - Document any breaking changes (there should be none!)
