// js/game/character/elementalBreakdown.js
// Elemental stat calculations and breakdowns for character sheet
//
// Extracted from gameOrchestrator.js to improve modularity and maintainability.
// This module handles elemental bonus/resist calculations and UI rendering.

import { getTalentSpellElementBonusMap } from './talentManager.js'
import { 
    capWord, 
    round1, 
    numPct, 
    elementIcon, 
    orderedElementKeys,
    normalizeElemMap 
} from './statsManager.js'

/**
 * Gets elemental bonuses and resists broken down by source (gear vs talent)
 * @param {Object} p - Player object
 * @returns {Object} Elemental breakdowns with gearBonus, talentBonus, gearResist, talentResist, totalResist
 */
export function getElementalBreakdownsForPlayer(p) {
    const gearBonus =
        (p && p.stats && p.stats.elementalBonusBreakdown && p.stats.elementalBonusBreakdown.gear) ||
        (p && p.stats && p.stats.elementalBonuses) ||
        {}

    let talentBonus =
        (p && p.stats && p.stats.elementalBonusBreakdown && p.stats.elementalBonusBreakdown.talent) ||
        {}

    if (!talentBonus || typeof talentBonus !== 'object') talentBonus = {}
    if (!Object.keys(talentBonus).length) {
        // Back-compat: compute focus bonuses on demand.
        talentBonus = getTalentSpellElementBonusMap(p)
    }

    const gearResist =
        (p && p.stats && p.stats.elementalResistBreakdown && p.stats.elementalResistBreakdown.gear) ||
        {}
    const talentResist =
        (p && p.stats && p.stats.elementalResistBreakdown && p.stats.elementalResistBreakdown.talent) ||
        {}
    const totalResist = (p && p.stats && p.stats.elementalResists) || {}

    return {
        gearBonus: normalizeElemMap(gearBonus),
        talentBonus: normalizeElemMap(talentBonus),
        gearResist: normalizeElemMap(gearResist),
        talentResist: normalizeElemMap(talentResist),
        totalResist: normalizeElemMap(totalResist)
    }
}

/**
 * Computes element summaries for player (bonuses and resists)
 * @param {Object} p - Player object
 * @param {number} PLAYER_RESIST_CAP - Maximum resist percentage (e.g., 75)
 * @param {Function} clampNumberFn - Function to clamp numbers to a range
 * @returns {Object} Summary with weaponElement, elementalBonusSummary, elementalResistSummary
 */
export function computeElementSummariesForPlayer(p, PLAYER_RESIST_CAP, clampNumberFn, normalizeElementTypeFn) {
    const bd = getElementalBreakdownsForPlayer(p)

    // Bonuses: show effective combined spell bonus per element: (1+gear)*(1+talent)-1
    const bonusKeys = orderedElementKeys(
        Object.keys(bd.gearBonus || {}).concat(Object.keys(bd.talentBonus || {})),
        normalizeElementTypeFn
    )
    const bonusParts = []
    bonusKeys.forEach((k) => {
        const g = round1(numPct((bd.gearBonus || {})[k]))
        const t = round1(numPct((bd.talentBonus || {})[k]))
        if (!g && !t) return
        const total = round1(((1 + g / 100) * (1 + t / 100) - 1) * 100)
        if (!total) return
        bonusParts.push(capWord(k) + ' +' + total + '%')
    })
    const elementalBonusSummary = bonusParts.length ? bonusParts.join(', ') : 'None'

    // Resists: show clamped resist percent (combat uses this value).
    const resistKeys = orderedElementKeys(Object.keys(bd.totalResist || {}), normalizeElementTypeFn)
    const resistParts = []
    const cap = Number(PLAYER_RESIST_CAP) || 75

    resistKeys.forEach((k) => {
        const raw = round1(numPct((bd.totalResist || {})[k]))
        const eff = round1(clampNumberFn(raw, 0, cap))
        if (!eff) return

        // If a build is over cap, show the raw value for clarity.
        if (raw > eff + 0.5) {
            resistParts.push(capWord(k) + ' ' + eff + '% (raw ' + raw + '%)')
        } else {
            resistParts.push(capWord(k) + ' ' + eff + '%')
        }
    })
    const elementalResistSummary = resistParts.length ? resistParts.join(', ') : 'None'

    const weaponElement =
        p && p.stats && p.stats.weaponElementType ? capWord(p.stats.weaponElementType) : 'None'

    return { weaponElement, elementalBonusSummary, elementalResistSummary }
}

/**
 * Renders HTML breakdown of elemental bonuses and resists
 * @param {Object} p - Player object
 * @param {number} PLAYER_RESIST_CAP - Maximum resist percentage
 * @param {Function} clampNumberFn - Function to clamp numbers to a range
 * @param {Function} escapeHtmlFn - Function to escape HTML entities
 * @param {Function} normalizeElementTypeFn - Function to normalize element type strings
 * @returns {string} HTML string for elemental breakdown
 */
export function renderElementalBreakdownHtml(p, PLAYER_RESIST_CAP, clampNumberFn, escapeHtmlFn, normalizeElementTypeFn) {
    const bd = getElementalBreakdownsForPlayer(p)

    const keys = orderedElementKeys(
        Object.keys(bd.gearBonus || {})
            .concat(Object.keys(bd.talentBonus || {}))
            .concat(Object.keys(bd.gearResist || {}))
            .concat(Object.keys(bd.talentResist || {}))
            .concat(Object.keys(bd.totalResist || {})),
        normalizeElementTypeFn
    )

    if (!keys.length) {
        return '<div class="muted">None</div>'
    }

    let html = '<div class="stat-grid elem-breakdown-grid">'

    keys.forEach((k) => {
        const name = capWord(k)
        const icon = elementIcon(k)

        const gB = round1(numPct((bd.gearBonus || {})[k]))
        const tB = round1(numPct((bd.talentBonus || {})[k]))
        const gR = round1(numPct((bd.gearResist || {})[k]))
        const tR = round1(numPct((bd.talentResist || {})[k]))

        // Bonus row (spell bonus)
        if ((gB > 0) || (tB > 0)) {
            const totalB = round1(((1 + gB / 100) * (1 + tB / 100) - 1) * 100)
            html +=
                '<div class="stat-label"><span class="char-stat-icon">' +
                escapeHtmlFn(icon) +
                '</span>' +
                escapeHtmlFn(name) +
                ' Bonus</div>' +
                '<div class="stat-value">+' +
                escapeHtmlFn(String(totalB)) +
                '% <span class="muted">(Gear +' +
                escapeHtmlFn(String(gB)) +
                '%, Talent +' +
                escapeHtmlFn(String(tB)) +
                '%)</span></div>'
        }

        // Resist row
        const rawTotalRes = numPct((bd.totalResist || {})[k]) || (gR + tR)
        const cap = Number(PLAYER_RESIST_CAP) || 75
        const effR = round1(clampNumberFn(rawTotalRes, 0, cap))
        const rawR = round1(rawTotalRes)
        if ((gR > 0) || (tR > 0) || (rawR > 0)) {
            html +=
                '<div class="stat-label"><span class="char-stat-icon">🛡</span>' +
                escapeHtmlFn(name) +
                ' Resist</div>' +
                '<div class="stat-value">' +
                escapeHtmlFn(String(effR)) +
                '% <span class="muted">(raw ' +
                escapeHtmlFn(String(rawR)) +
                '%, Gear ' +
                escapeHtmlFn(String(gR)) +
                '%, Talent ' +
                escapeHtmlFn(String(tR)) +
                '%)</span></div>'
        }
    })

    html += '</div><div class="muted" style="margin-top:6px;">Resists are capped at 75%. Higher rarity gear reaches the cap more easily via stronger rolls.</div>'
    return html
}
