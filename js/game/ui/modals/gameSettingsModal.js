/**
 * gameSettingsModal.js
 * 
 * In-game settings modal UI for audio, display, gameplay, accessibility, and save management.
 * Extracted from gameOrchestrator.js to reduce file size.
 * 
 * ~651 lines extracted.
 */

/**
 * Creates the in-game settings modal function with all necessary dependencies injected.
 * @returns {Function} openInGameSettingsModal function
 */
export function createGameSettingsModal({
    // Core state
    state,
    _engine,
    
    // UI functions
    openModal,
    closeModal,
    updateHUD,
    
    // Game system functions
    requestSave,
    safeStorageSet,
    
    // Audio functions
    setMasterVolumePercent,
    setMusicEnabled,
    setSfxEnabled,
    
    // UI theme functions
    setTheme,
    setReduceMotionEnabled,
    
    // Save management functions
    exportCurrentSaveToFile,
    importSaveFromFile,
    exportAllSavesBundleToFile,
    
    // Game data
    DIFFICULTY_CONFIG
}) {
    return function openInGameSettingsModal() {
        openModal('Settings', (body) => {
            // Safety: if state doesn't exist yet, just show a simple message
            if (typeof state === 'undefined' || !state) {
                const msg = document.createElement('p')
                msg.textContent = 'Settings are unavailable until a game is running.'
                body.appendChild(msg)

                const actions = document.createElement('div')
                actions.className = 'modal-actions'
                const btnBack = document.createElement('button')
                btnBack.className = 'btn outline'
                btnBack.textContent = 'Back'
                btnBack.addEventListener('click', () => closeModal())
                actions.appendChild(btnBack)
                body.appendChild(actions)
                return
            }

            const intro = document.createElement('p')
            intro.className = 'modal-subtitle'
            intro.textContent = 'Changes apply immediately.'
            body.appendChild(intro)

            const container = document.createElement('div')
            // Compact settings layout so it fits better on mobile while keeping sections.
            container.className = 'settings-modal-body settings-sections settings-compact'

            let sectionIdCounter = 0

            const addSection = (title, opts = null) => {
                const options = opts || {}
                const collapsible = !!options.collapsible
                const startCollapsed = !!options.collapsed

                const sec = document.createElement('div')
                sec.className = 'settings-section'
                if (collapsible) sec.classList.add('is-collapsible')
                if (collapsible && startCollapsed) sec.classList.add('is-collapsed')

                const titleEl = document.createElement(collapsible ? 'button' : 'div')
                if (collapsible) titleEl.type = 'button'
                titleEl.className = 'settings-section-title'
                titleEl.textContent = title

                const content = document.createElement('div')
                content.className = 'settings-section-content'

                if (collapsible) {
                    sectionIdCounter += 1
                    const contentId = 'settingsSec_' + sectionIdCounter
                    content.id = contentId
                    titleEl.setAttribute('aria-controls', contentId)
                    titleEl.setAttribute('aria-expanded', startCollapsed ? 'false' : 'true')

                    titleEl.addEventListener('click', () => {
                        const collapsed = !sec.classList.contains('is-collapsed')
                        sec.classList.toggle('is-collapsed', collapsed)
                        titleEl.setAttribute('aria-expanded', collapsed ? 'false' : 'true')
                    })
                }

                sec.appendChild(titleEl)
                sec.appendChild(content)
                container.appendChild(sec)
                return content
            }

            const makeRow = (labelText, descText) => {
                const row = document.createElement('div')
                row.className = 'settings-row'

                const left = document.createElement('div')
                left.className = 'settings-left'

                const label = document.createElement('div')
                label.className = 'settings-label'
                label.textContent = labelText
                left.appendChild(label)

                if (descText) {
                    const desc = document.createElement('div')
                    desc.className = 'settings-desc'
                    desc.textContent = descText
                    left.appendChild(desc)
                }

                row.appendChild(left)
                return row
            }

            const makeSwitch = (id, initialChecked, onChange, ariaLabel) => {
                const wrap = document.createElement('label')
                wrap.className = 'switch'
                if (ariaLabel) wrap.setAttribute('aria-label', ariaLabel)

                const input = document.createElement('input')
                input.type = 'checkbox'
                if (id) input.id = id
                input.checked = !!initialChecked
                input.addEventListener('change', () => onChange(!!input.checked))

                const track = document.createElement('span')
                track.className = 'switch-track'
                track.setAttribute('aria-hidden', 'true')

                wrap.appendChild(input)
                wrap.appendChild(track)
                return wrap
            }

            // Get engine settings service once for use across all sections
            const engineSettings = (() => {
                try { return _engine && _engine.getService ? _engine.getService('settings') : null } catch (_) { return null }
            })()

            // --- Audio ------------------------------------------------------------
            const secAudio = addSection('Audio')

            // Master volume
            {
                const row = makeRow('Master volume', 'Overall volume level.')
                const control = document.createElement('div')
                control.className = 'settings-control'

                const slider = document.createElement('input')
                slider.type = 'range'
                slider.min = '0'
                slider.max = '100'
                slider.step = '5'
                slider.value = typeof state.settingsVolume === 'number' ? state.settingsVolume : 100

                const value = document.createElement('span')
                value.className = 'settings-value'
                value.textContent = slider.value + '%'

                setMasterVolumePercent(slider.value)

                slider.addEventListener('input', () => {
                    const v = Number(slider.value) || 0
                    state.settingsVolume = v
                    // Use engine settings service (locus_settings)
                    try {
                        const settings = _engine && _engine.getService ? _engine.getService('settings') : null
                        if (settings && settings.set) {
                            settings.set('audio.masterVolume', v)
                        }
                    } catch (e) {}
                    value.textContent = v + '%'
                    setMasterVolumePercent(v)
                })

                control.appendChild(slider)
                row.appendChild(control)
                row.appendChild(value)
                secAudio.appendChild(row)
            }

            // Music toggle
            {
                const row = makeRow('Music', 'Background music during play.')
                const control = document.createElement('div')
                control.className = 'settings-control'

                const sw = makeSwitch(null, state.musicEnabled !== false, (on) => {
                    setMusicEnabled(_engine, state, on)
                    requestSave('legacy')
                }, 'Toggle music')
                control.appendChild(sw)
                row.appendChild(control)
                secAudio.appendChild(row)
            }

            // SFX toggle
            {
                const row = makeRow('SFX', 'Combat and UI sound effects.')
                const control = document.createElement('div')
                control.className = 'settings-control'

                const sw = makeSwitch(null, state.sfxEnabled !== false, (on) => {
                    setSfxEnabled(_engine, state, on)
                    requestSave('legacy')
                }, 'Toggle sound effects')
                control.appendChild(sw)
                row.appendChild(control)
                secAudio.appendChild(row)
            }

            // --- Display ----------------------------------------------------------
            const secDisplay = addSection('Display')

            // UI theme
            {
                const row = makeRow('Theme', 'Changes the overall UI palette.')
                const control = document.createElement('div')
                control.className = 'settings-control'

                const themeSelectInline = document.createElement('select')
                themeSelectInline.className = 'settings-select'

                const themeOptions = [
                    { value: 'default', label: 'Default' },
                    { value: 'arcane', label: 'Arcane' },
                    { value: 'inferno', label: 'Inferno' },
                    { value: 'forest', label: 'Forest' },
                    { value: 'holy', label: 'Holy' },
                    { value: 'shadow', label: 'Shadow' }
                ]

                themeOptions.forEach((t) => {
                    const opt = document.createElement('option')
                    opt.value = t.value
                    opt.textContent = t.label
                    themeSelectInline.appendChild(opt)
                })

                // Hydrate from engine settings when present
                try {
                    const settings = _engine && _engine.getService ? _engine.getService('settings') : null
                    if (settings && typeof settings.get === 'function') {
                        themeSelectInline.value = settings.get('ui.theme', 'default')
                    }
                } catch (_) {
                    themeSelectInline.value = 'default'
                }
                themeSelectInline.addEventListener('change', () => setTheme(themeSelectInline.value))

                control.appendChild(themeSelectInline)
                row.appendChild(control)
                secDisplay.appendChild(row)
            }

            // Color scheme
            {
                const row = makeRow('Color scheme', 'Light or dark mode for the UI.')
                const control = document.createElement('div')
                control.className = 'settings-control'

                const sel = document.createElement('select')
                sel.className = 'settings-select'
                sel.setAttribute('aria-label', 'Color scheme')
                ;[
                    { value: 'auto', label: 'Auto' },
                    { value: 'light', label: 'Light' },
                    { value: 'dark', label: 'Dark' }
                ].forEach((o) => {
                    const opt = document.createElement('option')
                    opt.value = o.value
                    opt.textContent = o.label
                    sel.appendChild(opt)
                })

                // Hydrate from engine settings when present
                try {
                    if (engineSettings && engineSettings.get) {
                        sel.value = engineSettings.get('a11y.colorScheme', 'auto')
                    }
                } catch (_) {}

                sel.addEventListener('change', () => {
                    const v = String(sel.value || 'auto')
                    try {
                        if (engineSettings && engineSettings.set) {
                            engineSettings.set('a11y.colorScheme', v)
                        }
                    } catch (_) {}
                    requestSave('legacy')
                })

                control.appendChild(sel)
                row.appendChild(control)
                secDisplay.appendChild(row)
            }

            // UI scale
            {
                const row = makeRow('UI scale', 'Adjusts the size of all UI elements.')
                const control = document.createElement('div')
                control.className = 'settings-control'

                const sel = document.createElement('select')
                sel.className = 'settings-select'
                sel.setAttribute('aria-label', 'UI scale')
                ;[
                    { value: '0.9', label: 'Small' },
                    { value: '1', label: 'Default' },
                    { value: '1.1', label: 'Large' },
                    { value: '1.2', label: 'Extra Large' }
                ].forEach((o) => {
                    const opt = document.createElement('option')
                    opt.value = o.value
                    opt.textContent = o.label
                    sel.appendChild(opt)
                })

                // Hydrate from engine settings when present
                try {
                    if (engineSettings && engineSettings.get) {
                        const scale = Number(engineSettings.get('ui.scale', 1))
                        sel.value = String(scale)
                    }
                } catch (_) {}

                sel.addEventListener('change', () => {
                    const v = Number(sel.value) || 1
                    try {
                        if (engineSettings && engineSettings.set) {
                            engineSettings.set('ui.scale', v)
                        }
                    } catch (_) {}
                    requestSave('legacy')
                })

                control.appendChild(sel)
                row.appendChild(control)
                secDisplay.appendChild(row)
            }

            // Text speed
            {
                const row = makeRow('Text speed', 'How quickly story text advances.')
                const control = document.createElement('div')
                control.className = 'settings-control'

                const slider = document.createElement('input')
                slider.type = 'range'
                slider.min = '30'
                slider.max = '200'
                slider.step = '10'
                slider.value = typeof state.settingsTextSpeed === 'number' ? state.settingsTextSpeed : 100

                const value = document.createElement('span')
                value.className = 'settings-value'
                value.textContent = String(slider.value)

                slider.addEventListener('input', () => {
                    const v = Number(slider.value) || 100
                    state.settingsTextSpeed = v
                    value.textContent = String(v)
                    // Use engine settings service (locus_settings)
                    try {
                        const settings = _engine && _engine.getService ? _engine.getService('settings') : null
                        if (settings && settings.set) {
                            settings.set('ui.textSpeed', v)
                        }
                    } catch (e) {}
                })

                control.appendChild(slider)
                row.appendChild(control)
                row.appendChild(value)
                secDisplay.appendChild(row)
            }

            // --- Gameplay ---------------------------------------------------------
            const secGameplay = addSection('Gameplay')

            // Difficulty
            {
                const row = makeRow('Difficulty', 'Adjust challenge and enemy scaling.')
                const control = document.createElement('div')
                control.className = 'settings-control'

                const diffSelect = document.createElement('select')
                diffSelect.className = 'settings-select'
                Object.values(DIFFICULTY_CONFIG).forEach((cfg) => {
                    const opt = document.createElement('option')
                    opt.value = cfg.id
                    opt.textContent = cfg.name
                    diffSelect.appendChild(opt)
                })
                diffSelect.value = state.difficulty || 'normal'
                diffSelect.addEventListener('change', () => {
                    const newDiff = diffSelect.value
                    if (DIFFICULTY_CONFIG[newDiff]) {
                        state.difficulty = newDiff
                        updateHUD()
                        requestSave('legacy')
                    }
                })

                control.appendChild(diffSelect)
                row.appendChild(control)
                secGameplay.appendChild(row)
            }

            // Show combat numbers
            {
                const row = makeRow('Show combat numbers', 'Display damage and healing numbers in combat.')
                const control = document.createElement('div')
                control.className = 'settings-control'

                const sw = makeSwitch(null, state.settingsShowCombatNumbers !== false, (on) => {
                    state.settingsShowCombatNumbers = !!on
                    try {
                        if (engineSettings && engineSettings.set) {
                            engineSettings.set('gameplay.showCombatNumbers', !!on)
                        } else {
                            // Legacy fallback
                            safeStorageSet('pq-show-combat-numbers', state.settingsShowCombatNumbers ? '1' : '0')
                        }
                    } catch (e) {}
                    requestSave('legacy')
                }, 'Toggle combat numbers')

                control.appendChild(sw)
                row.appendChild(control)
                secGameplay.appendChild(row)
            }

            // Auto-save
            {
                const row = makeRow('Auto-save', 'Automatically save your progress periodically.')
                const control = document.createElement('div')
                control.className = 'settings-control'

                const sw = makeSwitch(null, state.settingsAutoSave !== false, (on) => {
                    state.settingsAutoSave = !!on
                    try {
                        if (engineSettings && engineSettings.set) {
                            engineSettings.set('gameplay.autoSave', !!on)
                        } else {
                            // Legacy fallback
                            safeStorageSet('pq-auto-save', state.settingsAutoSave ? '1' : '0')
                        }
                    } catch (e) {}
                    requestSave('legacy')
                }, 'Toggle auto-save')

                control.appendChild(sw)
                row.appendChild(control)
                secGameplay.appendChild(row)
            }

            // --- Accessibility ----------------------------------------------------
            const secAccess = addSection('Accessibility')
            {
                const row = makeRow('Reduce motion', 'Turns off animated HUD effects.')
                const control = document.createElement('div')
                control.className = 'settings-control'

                const sw = makeSwitch(null, !!state.settingsReduceMotion, (on) => {
                    setReduceMotionEnabled(on)
                    requestSave('legacy')
                }, 'Toggle reduce motion')

                control.appendChild(sw)
                row.appendChild(control)
                secAccess.appendChild(row)
            }

            // Text size (named buckets -> numeric scale)
            {
                const row = makeRow('Text size', 'Scales UI text for readability.')
                const control = document.createElement('div')
                control.className = 'settings-control'

                const sel = document.createElement('select')
                sel.className = 'settings-select'
                ;[
                    { value: 'small', label: 'Small' },
                    { value: 'default', label: 'Default' },
                    { value: 'large', label: 'Large' },
                    { value: 'xlarge', label: 'Extra Large' }
                ].forEach((o) => {
                    const opt = document.createElement('option')
                    opt.value = o.value
                    opt.textContent = o.label
                    sel.appendChild(opt)
                })

                // Hydrate from engine settings when present.
                try {
                    if (engineSettings && engineSettings.get) {
                        const s = Number(engineSettings.get('a11y.textScale', 1))
                        if (s <= 0.92) sel.value = 'small'
                        else if (s < 1.05) sel.value = 'default'
                        else if (s < 1.16) sel.value = 'large'
                        else sel.value = 'xlarge'
                    }
                } catch (_) {}

                sel.addEventListener('change', () => {
                    const v = String(sel.value || 'default')
                    const scale = (v === 'small') ? 0.9 : (v === 'large') ? 1.1 : (v === 'xlarge') ? 1.2 : 1
                    try {
                        if (engineSettings && engineSettings.set) engineSettings.set('a11y.textScale', scale)
                    } catch (_) {}
                    requestSave('legacy')
                })

                control.appendChild(sel)
                row.appendChild(control)
                secAccess.appendChild(row)
            }

            // High contrast (tri-state: auto/on/off)
            {
                const row = makeRow('High contrast', 'Boosts contrast to improve readability.')
                const control = document.createElement('div')
                control.className = 'settings-control'

                const sel = document.createElement('select')
                sel.className = 'settings-select'
                ;[
                    { value: 'auto', label: 'Auto' },
                    { value: 'on', label: 'On' },
                    { value: 'off', label: 'Off' }
                ].forEach((o) => {
                    const opt = document.createElement('option')
                    opt.value = o.value
                    opt.textContent = o.label
                    sel.appendChild(opt)
                })

                // Hydrate from engine settings when present.
                try {
                    if (engineSettings && engineSettings.get) {
                        const pref = engineSettings.get('a11y.highContrast', 'auto')
                        if (pref === true) sel.value = 'on'
                        else if (pref === false) sel.value = 'off'
                        else sel.value = 'auto'
                    }
                } catch (_) {}

                sel.addEventListener('change', () => {
                    const v = String(sel.value || 'auto')
                    try {
                        if (engineSettings && engineSettings.set) {
                            if (v === 'on') engineSettings.set('a11y.highContrast', true)
                            else if (v === 'off') engineSettings.set('a11y.highContrast', false)
                            else engineSettings.set('a11y.highContrast', 'auto')
                        }
                    } catch (_) {}
                    requestSave('legacy')
                })

                control.appendChild(sel)
                row.appendChild(control)
                secAccess.appendChild(row)
            }

            // Auto-equip loot (QoL)
            {
                const row = makeRow('Auto-equip loot', 'When you pick up a weapon/armor piece and the slot is empty, equip it automatically.')
                const control = document.createElement('div')
                control.className = 'settings-control'

                const sw = makeSwitch(null, !!state.settingsAutoEquipLoot, (on) => {
                    state.settingsAutoEquipLoot = !!on
                    // Use engine settings service (locus_settings)
                    try {
                        const settings = _engine && _engine.getService ? _engine.getService('settings') : null
                        if (settings && settings.set) {
                            settings.set('gameplay.autoEquipLoot', !!on)
                        }
                    } catch (e) {}
                    requestSave('legacy')
                }, 'Toggle auto-equip loot')

                control.appendChild(sw)
                row.appendChild(control)
                secAccess.appendChild(row)
            }

            // --- Saves ------------------------------------------------------------
            const secSaves = addSection('Saves', { collapsible: true, collapsed: true })

            // Export current save as a JSON file (editable / backup)
            {
                const row = makeRow('Export save (JSON)', 'Downloads your current autosave as a readable .json file so you can back it up or edit it.')
                const control = document.createElement('div')
                control.className = 'settings-control'

                const btn = document.createElement('button')
                btn.className = 'btn outline'
                btn.textContent = 'Export'
                btn.addEventListener('click', () => {
                    try { exportCurrentSaveToFile() } catch (e) {
                        console.error('Export failed', e)
                        alert('Export failed.')
                    }
                })

                control.appendChild(btn)
                row.appendChild(control)
                secSaves.appendChild(row)
            }

            // Import a JSON save (overwrites autosave on this device)
            {
                const row = makeRow('Import save (JSON)', 'Imports a .json save file and loads it immediately (overwrites your current autosave).')
                const control = document.createElement('div')
                control.className = 'settings-control'

                const btn = document.createElement('button')
                btn.className = 'btn outline'
                btn.textContent = 'Import'
                btn.addEventListener('click', () => {
                    try { importSaveFromFile() } catch (e) {
                        console.error('Import failed', e)
                        alert('Import failed.')
                    }
                })

                control.appendChild(btn)
                row.appendChild(control)
                secSaves.appendChild(row)
            }

            // Backup all local saves as a bundle
            {
                const row = makeRow('Backup all saves', 'Exports autosave + manual slots as a single bundle file (useful before patching or testing).')
                const control = document.createElement('div')
                control.className = 'settings-control'

                const btn = document.createElement('button')
                btn.className = 'btn outline'
                btn.textContent = 'Export All'
                btn.addEventListener('click', () => {
                    try { exportAllSavesBundleToFile() } catch (e) {
                        console.error('Export all failed', e)
                        alert('Export failed.')
                    }
                })

                control.appendChild(btn)
                row.appendChild(control)
                secSaves.appendChild(row)
            }


            body.appendChild(container)

            // --- Footer actions ---------------------------------------------------
            const actions = document.createElement('div')
            actions.className = 'modal-actions'

            const btnBack = document.createElement('button')
            btnBack.className = 'btn outline'
            btnBack.textContent = 'Back'
            btnBack.addEventListener('click', () => {
                requestSave('legacy')
                closeModal()
            })

            actions.appendChild(btnBack)
            body.appendChild(actions)
        })
    }
}
