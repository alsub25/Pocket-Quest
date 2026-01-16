// js/game/character/talentManager.js
// Talent tree management and operations
//
// Extracted from gameOrchestrator.js to improve modularity and maintainability.
// This module handles talent unlocking, validation, and talent-based stat calculations.

/**
 * Ensures player has talent-related fields initialized
 * @param {Object} p - Player object
 */
export function ensurePlayerTalents(p) {
    if (!p) return
    if (p.talentPoints == null) p.talentPoints = 0
    if (!p.talents || typeof p.talents !== 'object') p.talents = {}
}

/**
 * Checks if player has a specific talent
 * @param {Object} p - Player object
 * @param {string} talentId - Talent identifier
 * @returns {boolean} True if player has the talent
 */
export function playerHasTalent(p, talentId) {
    ensurePlayerTalents(p)
    return !!(p && p.talents && p.talents[talentId])
}

/**
 * Grants talent points on specific level milestones
 * @param {Object} p - Player object
 * @param {number} newLevel - New player level
 */
export function grantTalentPointIfNeeded(p, newLevel) {
    // Award on 3/6/9/12/... to keep pacing simple.
    if (!p) return
    ensurePlayerTalents(p)
    if (newLevel % 3 === 0) p.talentPoints += 1
}

/**
 * Gets list of talents available for a specific class
 * @param {string} classId - Class identifier
 * @param {Object} TALENT_DEFS - Talent definitions object
 * @returns {Array} List of talent definitions
 */
export function getTalentsForClass(classId, TALENT_DEFS) {
    return TALENT_DEFS[classId] || []
}

/**
 * Checks if player can unlock a specific talent
 * @param {Object} p - Player object
 * @param {Object} tdef - Talent definition
 * @returns {boolean} True if talent can be unlocked
 */
export function canUnlockTalent(p, tdef) {
    if (!p || !tdef) return false
    ensurePlayerTalents(p)
    if (playerHasTalent(p, tdef.id)) return false
    if ((p.level || 1) < (tdef.levelReq || 1)) return false
    if ((p.talentPoints || 0) <= 0) return false
    return true
}

/**
 * Unlocks a talent for the player
 * @param {Object} p - Player object
 * @param {string} talentId - Talent identifier
 * @param {Object} TALENT_DEFS - Talent definitions object
 * @param {Function} addLogFn - Function to add log messages
 * @param {Function} onTalentUnlocked - Callback for post-unlock actions (stat recalc, UI update)
 * @returns {boolean} True if talent was successfully unlocked
 */
export function unlockTalent(p, talentId, TALENT_DEFS, addLogFn, onTalentUnlocked) {
    if (!p || !talentId) return false
    ensurePlayerTalents(p)
    const list = getTalentsForClass(p.classId, TALENT_DEFS)
    const tdef = list.find((t) => t.id === talentId)
    if (!tdef) return false
    if (!canUnlockTalent(p, tdef)) return false
    
    p.talents[talentId] = true
    p.talentPoints = Math.max(0, (p.talentPoints || 0) - 1)
    
    if (addLogFn) {
        addLogFn('Talent unlocked: ' + tdef.name + '.', 'system')
    }

    // Some talents modify derived stats (ex: elemental resist). Apply immediately so
    // the Character Sheet + combat math reflect the new talent without requiring
    // an unrelated stat refresh (equip, level-up, etc.).
    if (onTalentUnlocked) {
        try {
            onTalentUnlocked(p)
        } catch (_) {}
    }
    
    return true
}

/**
 * Calculates talent-based spell element bonus map for a player
 * @param {Object} p - Player object
 * @returns {Object} Map of element types to bonus percentages
 */
export function getTalentSpellElementBonusMap(p) {
    const out = {}
    if (!p) return out
    try {
        if (playerHasTalent(p, 'mage_ember_focus')) out.fire = (out.fire || 0) + 10
        if (playerHasTalent(p, 'mage_glacial_edge')) out.frost = (out.frost || 0) + 10
        if (playerHasTalent(p, 'blood_hemomancy')) out.shadow = (out.shadow || 0) + 10
        if (playerHasTalent(p, 'ranger_nature_attunement')) out.nature = (out.nature || 0) + 10
        if (playerHasTalent(p, 'paladin_radiant_focus')) out.holy = (out.holy || 0) + 10
        if (playerHasTalent(p, 'cleric_holy_focus')) out.holy = (out.holy || 0) + 10
        if (playerHasTalent(p, 'necromancer_shadow_mastery')) out.shadow = (out.shadow || 0) + 10
        if (playerHasTalent(p, 'necromancer_plague_touch')) out.poison = (out.poison || 0) + 10
        if (playerHasTalent(p, 'shaman_tempest_focus')) out.lightning = (out.lightning || 0) + 10
        if (playerHasTalent(p, 'shaman_nature_attunement')) out.nature = (out.nature || 0) + 10
        if (playerHasTalent(p, 'vampire_shadow_focus')) out.shadow = (out.shadow || 0) + 10
    } catch (_) {}
    return out
}
