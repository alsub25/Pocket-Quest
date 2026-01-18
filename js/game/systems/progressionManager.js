/**
 * progressionManager.js
 * Manages player XP, leveling, and progression systems.
 */

import { MAX_PLAYER_LEVEL } from '../../data/playerClasses.js'

export function createProgressionManager(deps) {
    const {
        state,
        addLog,
        updateHUD,
        requestSave,
        grantTalentPointIfNeeded,
        rescaleActiveCompanion,
        ensurePlayerSpellSystems,
        tryUnlockClassSpells,
        openSkillLevelUpModal,
        ABILITIES
    } = deps

    function grantExperience(amount) {
        const p = state.player
        let remaining = amount
        while (remaining > 0) {
            const toNext = p.nextLevelXp - p.xp
            if (remaining >= toNext) {
                p.xp += toNext
                remaining -= toNext
                levelUp()
            } else {
                p.xp += remaining
                remaining = 0
            }
        }
        updateHUD()
        requestSave('legacy')
    }

    function levelUp() {
        const p = state.player
        p.level += 1
        grantTalentPointIfNeeded(p, p.level)
        p.nextLevelXp = Math.round(p.nextLevelXp * 1.4)

        // Award 1 skill point per level
        if (p.skillPoints == null) p.skillPoints = 0
        p.skillPoints += 1

        // Keep companion scaling synced to your level
        rescaleActiveCompanion()

        // Full heal using current max stats
        p.hp = p.maxHp
        p.resource = p.maxResource

    // Patch 1.1.0: spell loadouts, upgrades, and progression unlocks
        ensurePlayerSpellSystems(p)
        p.abilityUpgradeTokens = (p.abilityUpgradeTokens || 0) + 1
        const unlocked = tryUnlockClassSpells(p)
        if (unlocked && unlocked.length) {
            unlocked.forEach((sid) => {
                const a = ABILITIES[sid]
                addLog('Unlocked: ' + (a ? a.name : sid) + '.', 'good')
            })
        }

        addLog(
            'You reach level ' + p.level + '! Choose a skill to improve.',
            'good'
        )

        // Open skill selection modal
        openSkillLevelUpModal()
    }

    function cheatMaxLevel(opts = {}) {
        const p = state.player
        if (!p) return
        const target = MAX_PLAYER_LEVEL
        const startLevel = Number(p.level || 1)

        if (startLevel >= target) {
            addLog('Cheat: you are already at the level cap (' + target + ').', 'system')
            return
        }

        const gainedLevels = target - startLevel

        // Ensure optional containers exist (old saves / smoke sandboxes).
        if (p.skillPoints == null) p.skillPoints = 0
        deps.ensurePlayerTalents(p)

        // Award missing talent points exactly as if each level-up had occurred.
        // This keeps the cheat consistent with real progression.
        for (let lv = startLevel + 1; lv <= target; lv++) {
            grantTalentPointIfNeeded(p, lv)
        }

        // Next-level XP curve (matches levelUp(): nextLevelXp *= 1.4 per level)
        let next = 100
        for (let i = 1; i < target; i++) next = Math.round(next * 1.4)

        p.level = target
        p.xp = 0
        p.nextLevelXp = next

        // Award skill + upgrade tokens (1 per level gained)
        p.skillPoints += gainedLevels
        p.abilityUpgradeTokens = (p.abilityUpgradeTokens || 0) + gainedLevels

        // Unlock all class spells up to max level
        ensurePlayerSpellSystems(p)
        tryUnlockClassSpells(p)

        rescaleActiveCompanion()
        deps._recalcPlayerStats()

        // Full heal
        p.hp = p.maxHp
        p.resource = p.maxResource

        updateHUD()
        requestSave('legacy')

        const silent = opts.silent
        if (!silent) {
            addLog(
                'Cheat: you are now level ' +
                    target +
                    ' with ' +
                    gainedLevels +
                    ' skill points.',
                'system'
            )
        }
    }

    return {
        grantExperience,
        levelUp,
        cheatMaxLevel
    }
}
