/**
 * exploreModal.js
 * 
 * Explore area selection modal UI.
 * Extracted from gameOrchestrator.js to reduce file size.
 * 
 * ~181 lines extracted.
 */

/**
 * Creates the explore modal function with all necessary dependencies injected.
 * @returns {Function} openExploreModal function
 */
export function createExploreModal({
    // Core state
    state,
    
    // UI functions
    openModal,
    closeModal,
    addLog,
    ensureUiState,
    recordInput,
    renderActions,
    
    // Game system functions
    isAreaUnlocked,
    getAreaDisplayName,
    setArea,
    exploreArea,
    requestSave,
    ensureCombatPointers
}) {
    return function openExploreModal() {
        ensureUiState()
        recordInput('open.exploreModal')
        if (!state.player) return

        openModal('Choose Where to Explore', (body) => {
            const intro = document.createElement('p')
            intro.className = 'modal-subtitle'
            intro.textContent =
                'Pick a region to travel to. After choosing, the Explore button will keep using that region until you change it.'
            body.appendChild(intro)

            const areas = [
                {
                    id: 'village',
                    desc: 'Talk to Elder Rowan, visit the merchant, or rest between journeys.'
                },
                {
                    id: 'forest',
                    desc: 'Beasts, bandits, and goblin warbands beneath Emberwood twisted canopy.'
                },
                {
                    id: 'ruins',
                    desc: 'Climb the shattered spire and face void-touched horrors.'
                },
                {
                    id: 'marsh',
                    desc: 'A choking mire of ash and rot where a witch's coven whispers.'
                },
                {
                    id: 'frostpeak',
                    desc: 'A frozen mountain pass haunted by yeti packs and a rampaging giant.'
                },
                {
                    id: 'catacombs',
                    desc: 'Sunken crypts where necromancy lingers and the dead refuse to rest.'
                },
                {
                    id: 'keep',
                    desc: 'A black fortress of obsidian and shadow - the source of the realm's corruption.'
                },
                {
                    id: 'oathgrove',
                    desc: 'A hidden grove where the Blackbark Oath was first written - and where sap still listens.'
                },
                {
                    id: 'blackbarkDepths',
                    desc: 'Lightless roots and oath-carved veins beneath the village. Something stalks the dark.'
                },
                {
                    id: 'starfallRidge',
                    desc: 'A windswept ridge where fallen star-iron hums in the stone.'
                }
            ]

            areas.forEach((info) => {
                const unlocked = isAreaUnlocked(info.id)
                const name = getAreaDisplayName(info.id)

                const row = document.createElement('div')
                row.className = 'item-row'

                const header = document.createElement('div')
                header.className = 'item-row-header'

                const left = document.createElement('div')
                left.innerHTML = '<span class="item-name">' + name + '</span>'

                const right = document.createElement('div')
                right.className = 'item-meta'
                if (info.id === state.area) {
                    right.textContent = 'Current area'
                } else {
                    right.textContent = unlocked ? 'Available' : 'Locked'
                }

                header.appendChild(left)
                header.appendChild(right)

                const desc = document.createElement('div')
                desc.style.fontSize = '0.75rem'
                desc.style.color = 'var(--muted)'
                desc.textContent = info.desc

                row.appendChild(header)
                row.appendChild(desc)

                const actions = document.createElement('div')
                actions.className = 'item-actions'

                const btn = document.createElement('button')
                btn.className = 'btn small' + (unlocked ? '' : ' outline')
                btn.textContent = unlocked ? 'Travel & Explore' : 'Locked'
                btn.disabled = !unlocked

                if (unlocked) {
                    btn.addEventListener('click', () => {
                        // Guard: do not allow travel/explore selection while in combat.
                        // This prevents mid-combat modal navigation from desyncing combat state.
                        if (state && state.inCombat) {
                            try { ensureCombatPointers() } catch (_) {}
                            addLog('You cannot travel while in combat.', 'danger')
                            return
                        }

                        // Lock in this choice for repeated exploring
                        recordInput('travel', { to: info.id })
                        setArea(info.id, { source: 'travel' })
                        state.ui.exploreChoiceMade = true

                        // If we leave the village, make sure village submenu state is closed
                        state.ui.villageActionsOpen = false

                        addLog('You travel to ' + name + '.', 'system')

                        closeModal()

                        // ✅ Rebuild the action bar immediately so Village / Realm buttons disappear
                        renderActions()

                        exploreArea()
                        requestSave('legacy')
                    })
                }

                actions.appendChild(btn)
                row.appendChild(actions)
                body.appendChild(row)
            })

            const hint = document.createElement('p')
            hint.className = 'modal-subtitle'
            hint.textContent =
                'Tip: Use "Change Area" on the main screen any time you want to pick a different region.'
            body.appendChild(hint)
        })
    }
}
