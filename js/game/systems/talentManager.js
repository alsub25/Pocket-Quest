/**
 * talentManager.js
 * Manages player talents, unlocking, and talent point allocation.
 */

import { TALENT_DEFS } from '../../data/talentDefs.js'

export function createTalentManager(deps) {
    const {
        state,
        addLog,
        updateHUD,
        updateEnemyPanel,
        _recalcPlayerStats,
        refreshCharacterSheetIfOpen
    } = deps

    function ensurePlayerTalents(p) {
        if (!p) return
        if (p.talentPoints == null) p.talentPoints = 0
        if (!p.talents || typeof p.talents !== 'object') p.talents = {}
    }

    function playerHasTalent(p, talentId) {
        ensurePlayerTalents(p)
        return !!(p && p.talents && p.talents[talentId])
    }

    function grantTalentPointIfNeeded(p, newLevel) {
        // Award on 3/6/9/12/... to keep pacing simple.
        if (!p) return
        ensurePlayerTalents(p)
        if (newLevel % 3 === 0) p.talentPoints += 1
    }

    function getTalentsForClass(classId) {
        return TALENT_DEFS[classId] || []
    }

    function canUnlockTalent(p, tdef) {
        if (!p || !tdef) return false
        ensurePlayerTalents(p)
        if (playerHasTalent(p, tdef.id)) return false
        if ((p.level || 1) < (tdef.levelReq || 1)) return false
        if ((p.talentPoints || 0) <= 0) return false
        return true
    }

    function unlockTalent(p, talentId) {
        if (!p || !talentId) return false
        ensurePlayerTalents(p)
        const list = getTalentsForClass(p.classId)
        const tdef = list.find((t) => t.id === talentId)
        if (!tdef) return false
        if (!canUnlockTalent(p, tdef)) return false
        p.talents[talentId] = true
        p.talentPoints = Math.max(0, (p.talentPoints || 0) - 1)
        addLog('Talent unlocked: ' + tdef.name + '.', 'system')

        // Some talents modify derived stats (ex: elemental resist). Apply immediately so
        // the Character Sheet + combat math reflect the new talent without requiring
        // an unrelated stat refresh (equip, level-up, etc.).
        try {
            if (state && state.player === p) {
                _recalcPlayerStats()
                // Keep immediate UI feedback consistent across ALL classes.
                // (Many talents affect dodge/resistAll/max resource, etc.)
                try { updateHUD() } catch (_) {}
                try { refreshCharacterSheetIfOpen(state, playerHasTalent) } catch (_) {}
                try { if (state.inCombat) updateEnemyPanel() } catch (_) {}
            }
        } catch (_) {}
        return true
    }

    return {
        ensurePlayerTalents,
        playerHasTalent,
        grantTalentPointIfNeeded,
        getTalentsForClass,
        canUnlockTalent,
        unlockTalent
    }
}
