/**
 * Combat Action Renderer
 * Extracted from gameOrchestrator.js (Patch 1.2.72)
 * 
 * Renders combat and explore action buttons in the action bar.
 * Uses dependency injection pattern for all external dependencies.
 */

/**
 * Creates a combat action renderer with injected dependencies
 * @param {Object} deps - Dependencies object
 * @param {Object} deps.state - Game state reference
 * @param {Function} deps.dispatchGameCommand - Command dispatcher
 * @param {Function} deps.ensureCombatPointers - Combat pointer validation
 * @param {Function} deps.canPlayerActNow - Check if player can act
 * @param {Function} deps.addLog - Logging function
 * @param {Object} deps.handlers - Action handlers
 * @returns {Object} Renderer API
 */
export function createCombatActionRenderer(deps) {
    const {
        state,
        dispatchGameCommand,
        ensureCombatPointers,
        canPlayerActNow,
        addLog,
        handlers
    } = deps

    /**
     * Creates a button element for an action
     * @param {string} label - Button text
     * @param {Function} onClick - Click handler
     * @param {string} extraClass - Additional CSS classes
     * @param {Object} opts - Options (title, disabled)
     * @returns {HTMLButtonElement}
     */
    function makeActionButton(label, onClick, extraClass, opts) {
        // Backwards-compatible: allow makeActionButton(label, onClick, opts)
        let cls = extraClass
        let o = opts
        if (cls && typeof cls === 'object' && !o) {
            o = cls
            cls = ''
        }

        const btn = document.createElement('button')
        btn.className = 'btn small ' + (cls || '')
        btn.textContent = label

        const cfg = o || {}
        if (cfg.title) btn.title = String(cfg.title)
        if (cfg.disabled) {
            btn.disabled = true
            btn.classList.add('disabled')
        }

        btn.addEventListener('click', (e) => {
            if (btn.disabled) return
            onClick(e)
        })
        return btn
    }

    /**
     * Renders explore mode action buttons
     * @param {HTMLElement} actionsEl - Container element
     */
    function renderExploreActions(actionsEl) {
        actionsEl.innerHTML = ''
        if (!state.player) return

        if (!state.ui) state.ui = {}
        const ui = state.ui
        const inVillage = state.area === 'village'
        const showVillageMenu = inVillage && ui.villageActionsOpen

        // 🔹 VILLAGE SUBMENU MODE ---------------------------------------------------
        if (showVillageMenu) {
            actionsEl.appendChild(
                makeActionButton('Elder Rowan', () => {
                    if (!dispatchGameCommand('GAME_OPEN_ELDER_ROWAN', {})) {
                        if (handlers.quests && handlers.quests.openElderRowanDialog) {
                            handlers.quests.openElderRowanDialog()
                        }
                    }
                })
            )

            actionsEl.appendChild(
                makeActionButton('Tavern', () => {
                    if (!dispatchGameCommand('GAME_OPEN_TAVERN', {})) {
                        handlers.openTavernModal()
                    }
                })
            )

            actionsEl.appendChild(
                makeActionButton('Bank', () => {
                    if (!dispatchGameCommand('GAME_OPEN_BANK', {})) {
                        handlers.openBankModal()
                    }
                })
            )

            actionsEl.appendChild(
                makeActionButton('Merchant', () => {
                    if (!dispatchGameCommand('GAME_OPEN_MERCHANT', {})) {
                        handlers.openMerchantModal()
                    }
                })
            )

            actionsEl.appendChild(
                makeActionButton('Town Hall', () => {
                    if (!dispatchGameCommand('GAME_OPEN_TOWN_HALL', {})) {
                        handlers.openTownHallModal()
                    }
                })
            )

            actionsEl.appendChild(
                makeActionButton('Back', () => {
                    ui.villageActionsOpen = false
                    handlers.renderActions()
                })
            )

            return
        }

        // 🔹 DEFAULT (NON-VILLAGE or VILLAGE NORMAL BAR) ----------------------------
        // Village-only: button to enter the village submenu
        if (inVillage) {
            actionsEl.appendChild(
                makeActionButton('Village ▸', () => {
                    ui.villageActionsOpen = true
                    handlers.renderActions()
                })
            )

            // ✅ Only show Realm & Council if you're in the village
            actionsEl.appendChild(
                makeActionButton('Realm & Council', () => {
                    if (!dispatchGameCommand('GAME_OPEN_GOVERNMENT', {})) {
                        handlers.openGovernmentModal()
                    }
                })
            )
        }

        actionsEl.appendChild(
            makeActionButton(
                'Explore',
                () => {
                    if (!dispatchGameCommand('GAME_EXPLORE', {})) {
                        handlers.handleExploreClick()
                    }
                },
                ''
            )
        )

        actionsEl.appendChild(
            makeActionButton('Change Area', () => {
                if (!dispatchGameCommand('GAME_CHANGE_AREA', {})) {
                    ui.exploreChoiceMade = false
                    handlers.openExploreModal()
                }
            })
        )

        actionsEl.appendChild(
            makeActionButton('Inventory', () => {
                if (!dispatchGameCommand('GAME_OPEN_INVENTORY', { inCombat: false })) {
                    handlers.openInventoryModal(false)
                }
            })
        )

        actionsEl.appendChild(
            makeActionButton('Spells', () => {
                if (!dispatchGameCommand('GAME_OPEN_SPELLS', { inCombat: false })) {
                    handlers.openSpellsModal(false)
                }
            })
        )

        // Cheats button removed from the main action bar.
        // In dev-cheat mode, Cheats are accessed via the 🛠️ HUD pill next to 🧪 and the Menu button.
    }

    /**
     * Renders combat mode action buttons
     * @param {HTMLElement} actionsEl - Container element
     */
    function renderCombatActions(actionsEl) {
        actionsEl.innerHTML = ''

        const locked = !canPlayerActNow()
        const lockTitle = locked ? 'Resolve the current turn first.' : ''

        actionsEl.appendChild(
            makeActionButton('Attack', () => {
                if (!dispatchGameCommand('COMBAT_ATTACK', {})) {
                    handlers.playerBasicAttack()
                }
            }, '', { disabled: locked, title: lockTitle })
        )

        actionsEl.appendChild(
            makeActionButton('Interrupt', () => {
                if (!dispatchGameCommand('COMBAT_INTERRUPT', {})) {
                    handlers.playerInterrupt()
                }
            }, 'outline', { disabled: locked, title: lockTitle })
        )

        actionsEl.appendChild(
            makeActionButton('Spells', () => {
                if (!dispatchGameCommand('GAME_OPEN_SPELLS', { inCombat: true })) {
                    handlers.openSpellsModal(true)
                }
            }, '', { disabled: locked, title: lockTitle })
        )

        actionsEl.appendChild(
            makeActionButton('Items', () => {
                if (!dispatchGameCommand('GAME_OPEN_INVENTORY', { inCombat: true })) {
                    handlers.openInventoryModal(true)
                }
            }, '', { disabled: locked, title: lockTitle })
        )

        const isBoss = !!(state.currentEnemy && state.currentEnemy.isBoss)
        actionsEl.appendChild(
            makeActionButton(isBoss ? 'No Escape' : 'Flee', () => {
                if (isBoss) {
                    addLog('This foe blocks your escape!', 'danger')
                } else {
                    if (!dispatchGameCommand('COMBAT_FLEE', {})) {
                        handlers.tryFlee()
                    }
                }
            }, isBoss ? 'outline' : '', { disabled: locked, title: lockTitle })
        )
    }

    /**
     * Main render function - switches between combat and explore modes
     */
    function renderActions() {
        const actionsEl = document.getElementById('actions')
        actionsEl.innerHTML = ''

        if (!state.player) return

        if (state.inCombat) {
            // Hardening: never allow Explore actions to render while inCombat.
            // If combat pointers desync, attempt a quick repair.
            try { ensureCombatPointers() } catch (_) {}

            if (state.inCombat && state.currentEnemy) {
                renderCombatActions(actionsEl)
            } else {
                // If we still can't recover, fall back safely.
                state.inCombat = false
                state.currentEnemy = null
                state.enemies = []
                state.targetEnemyIndex = 0
                if (state.combat) {
                    state.combat.busy = false
                    state.combat.phase = 'player'
                }
                renderExploreActions(actionsEl)
            }
        } else {
            renderExploreActions(actionsEl)
        }
    }

    return {
        renderActions,
        renderExploreActions,
        renderCombatActions,
        makeActionButton
    }
}
