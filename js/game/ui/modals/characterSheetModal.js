/**
 * Character Sheet & Enemy Sheet Modals
 * Extracted from gameOrchestrator.js (Patch 1.2.72)
 * 
 * Provides:
 * - resolvePendingEnemyDefeats() - processes enemy defeats
 * - openCharacterSheet() - displays player character sheet
 * - openEnemySheet() - displays enemy inspection sheet
 */

export function createCharacterSheetModal(dependencies) {
    const {
        // State
        state,
        
        // Constants & Data
        PLAYER_CLASSES,
        ENEMY_ABILITIES,
        TALENT_DEFS,
        PLAYER_RESIST_CAP,
        ELEMENT_KEYS,
        
        // UI Functions
        openModal,
        closeModal,
        openEnemyModal,
        escapeHtml,
        addLog,
        
        // Utility Functions
        finiteNumber,
        clampFinite,
        clamp01,
        clampNumber,
        normalizeElementType,
        
        // Stat Functions
        recalcPlayerStats,
        updateHUD,
        requestSave,
        getActiveDifficultyConfig,
        
        // Combat Functions
        getAllEnemies,
        handleEnemyDefeat,
        getEnemyRarityDef,
        getEnemyAffixDef,
        ensureEnemyRuntime,
        getEffectiveEnemyAttack,
        getEffectiveEnemyMagic,
        
        // Talent Functions
        ensurePlayerTalents,
        getTalentsForClass,
        playerHasTalent,
        canUnlockTalent,
        unlockTalent,
        
        // Element Functions
        computeElementSummariesForPlayer,
        renderElementalBreakdownHtml,
        refreshCharacterSheetLiveValues,
        renderTalentsPanelHtml,
        
        // Helper Functions
        _capWord,
        _round1,
        _numPct,
        _elementIcon,
        _orderedElementKeys,
        _normalizeAffinityMult,
        _normalizePctMaybeFraction
    } = dependencies

    function resolvePendingEnemyDefeats() {
        if (!state || !state.inCombat) return

        const all = getAllEnemies()
        if (!all || !all.length) return

        // Process current target first for consistent logs/target sync.
        const cur = state.currentEnemy || null
        const ordered = []
        if (cur) ordered.push(cur)
        all.forEach((e) => {
            if (e && e !== cur) ordered.push(e)
        })

        for (let i = 0; i < ordered.length; i++) {
            if (!state.inCombat) break
            const e = ordered[i]
            if (!e || e._defeatHandled) continue
            if (finiteNumber(e.hp, 0) <= 0) handleEnemyDefeat(e)
        }
    }

    function openCharacterSheet() {
        const p = state.player
        if (!p) return

        const cls = PLAYER_CLASSES[p.classId]
        const diff = getActiveDifficultyConfig()

        const areaName =
            state.area === 'village'
                ? 'Emberwood Village'
                : state.area === 'forest'
                ? 'Emberwood Forest'
                : state.area === 'ruins'
                ? 'Ruined Spire'
                : state.area

        const mainQuest = state.quests.main

        // Quest summary line for Overview tab
        let questLine = 'None'
        if (mainQuest) {
            if (mainQuest.status === 'completed') {
                questLine = `${mainQuest.name} (Completed)`
            } else {
                questLine = `${mainQuest.name} – Step ${mainQuest.step}`
            }
        }

        // Base stats reference for derived breakdown
        const baseStats = cls
            ? cls.baseStats
            : {
                  maxHp: p.maxHp,
                  attack: p.stats.attack,
                  magic: p.stats.magic,
                  armor: p.stats.armor,
                  speed: p.stats.speed
              }

        const sk = p.skills || { strength: 0, endurance: 0, willpower: 0 }

        // Contributions from skills
        const atkFromStr = sk.strength * 2
        const hpFromEnd = sk.endurance * 6
        const armorFromEnd = Math.floor(sk.endurance / 2)
        const magicFromWill = sk.willpower * 2
        const resFromWill = sk.willpower * 4

        // Equipment bonuses
        const weaponAtkBonus =
            p.equipment.weapon && p.equipment.weapon.attackBonus
                ? p.equipment.weapon.attackBonus
                : 0

        const weaponMagicBonus =
            p.equipment.weapon && p.equipment.weapon.magicBonus
                ? p.equipment.weapon.magicBonus
                : 0

        // Multi-slot gear (Patch 1.1.5): sum bonuses across all equipped armor pieces.
        const gearSlots = ['armor', 'head', 'hands', 'feet', 'belt', 'neck', 'ring']
        const sumGear = (field) =>
            gearSlots.reduce((acc, k) => {
                const it = p.equipment && p.equipment[k] ? p.equipment[k] : null
                const v = it && typeof it[field] === 'number' ? it[field] : 0
                return acc + v
            }, 0)

        const armorBonus = sumGear('armorBonus')
        const armorResBonus = sumGear('maxResourceBonus')

        const baseRes = p.resourceKey === 'mana' ? 100 : 60

        const comp = state.companion

        // --- NEW: Gear-affix summary values for Character Sheet -------------------
        // (These are totals from recalcPlayerStats(), primarily driven by gear affixes.)
        const statCritChance = Math.round(((p.stats && p.stats.critChance) || 0) * 10) / 10
        const statDodgeChance = Math.round(((p.stats && p.stats.dodgeChance) || 0) * 10) / 10
        const statResistAll = Math.round(((p.stats && p.stats.resistAll) || 0) * 10) / 10
        const statLifeSteal = Math.round(((p.stats && p.stats.lifeSteal) || 0) * 10) / 10
        const statArmorPen = Math.round(((p.stats && p.stats.armorPen) || 0) * 10) / 10
        const statHaste = Math.round(((p.stats && p.stats.haste) || 0) * 10) / 10
        const statThorns = Math.round(((p.stats && p.stats.thorns) || 0) * 10) / 10
        const statHpRegen = Math.round(((p.stats && p.stats.hpRegen) || 0) * 10) / 10

        const capWord = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s)

        // Elemental bonus/resist summaries are used in the Character Sheet header.
        // They must be recomputable so unlocking talents (which can add resists)
        // updates the header immediately without closing/reopening the sheet.

        const computeElementSummaries = () => computeElementSummariesForPlayer(p)

        const _elemSummary = computeElementSummaries()

        openModal('Character Sheet', (body) => {
            body.innerHTML = ''

            // Element summaries are computed outside the modal builder so they can be
            // refreshed after talent unlocks (without forcing the user to close/reopen).
            // The tab templates below reference these variables directly.
            let { weaponElement, elementalBonusSummary, elementalResistSummary } = _elemSummary

            // --- HEADER --------------------------------------------------------------
            // Compact summary that stays consistent across tabs.
            const header = document.createElement('div')
            header.className = 'sheet-header'
            header.innerHTML = `
          <div class="sheet-title-row">
            <div>
              <div class="sheet-title">${escapeHtml(p.name || 'Hero')}</div>
              <div class="sheet-subtitle">${escapeHtml(cls ? cls.name : 'Unknown Class')} • Lv ${finiteNumber(p.level, 1)}</div>
            </div>
            <div class="sheet-subtitle">${escapeHtml(areaName)}</div>
          </div>
          <div class="sheet-badges">
            <span class="sheet-badge"><span class="k">HP</span><span class="v sheet-badge-hp">${Math.round(finiteNumber(p.hp, 0))} / ${Math.round(finiteNumber(p.maxHp, 0))}</span></span>
            <span class="sheet-badge"><span class="k">${escapeHtml(p.resourceKey || 'resource')}</span><span class="v sheet-badge-resource">${Math.round(finiteNumber(p.resource, 0))} / ${Math.round(finiteNumber(p.maxResource, 0))}</span></span>
            <span class="sheet-badge"><span class="k">Gold</span><span class="v sheet-badge-gold">${Math.round(finiteNumber(p.gold, 0))}</span></span>
          </div>
          <div class="sheet-line"><b>Weapon Element:</b> <span class="sheet-weapon-element">${escapeHtml(_elemSummary.weaponElement)}</span></div>
          <div class="sheet-line"><b>Elemental Bonuses:</b> <span class="sheet-element-bonuses">${escapeHtml(_elemSummary.elementalBonusSummary)}</span></div>
          <div class="sheet-line"><b>Elemental Resists:</b> <span class="sheet-element-resists">${escapeHtml(_elemSummary.elementalResistSummary)}</span></div>
        `
            body.appendChild(header)

            // --- TAB HEADER -----------------------------------------------------------
            const tabs = document.createElement('div')
            tabs.className = 'char-tabs'

            const tabDefs = [
                { id: 'overview', label: 'Overview' },
                { id: 'stats', label: 'Stats' },
                { id: 'skills', label: 'Skills' },
                { id: 'talents', label: 'Talents' },
                { id: 'equipment', label: 'Equipment' },
                { id: 'companions', label: 'Companions' }
            ]

            tabDefs.forEach((t, idx) => {
                const btn = document.createElement('button')
                btn.className = 'char-tab' + (idx === 0 ? ' active' : '')
                btn.dataset.tab = t.id
                btn.textContent = t.label
                tabs.appendChild(btn)
            })

            body.appendChild(tabs)

            // --- TAB PANELS WRAPPER ---------------------------------------------------
            const panelsWrapper = document.createElement('div')
            panelsWrapper.className = 'char-tabs-wrapper'

            function makePanel(id, innerHTML) {
                const panel = document.createElement('div')
                panel.className =
                    'char-tab-panel' + (id === 'overview' ? ' active' : '')
                panel.dataset.tab = id
                panel.innerHTML = innerHTML
                panelsWrapper.appendChild(panel)
                return panel
            }


            // --- Collapsible sections (Patch 1.2.2) ----------------------------------
            // Turns each .char-section-title into a toggle and wraps the section content
            // in .char-section-body so long tabs can be collapsed to reduce clutter.
            function wireSheetAccordions(root) {
                if (!root) return
                const sections = root.querySelectorAll('.char-section')
                sections.forEach((sec) => {
                    const titleEl = sec.querySelector(':scope > .char-section-title')
                    if (!titleEl) return

                    // Avoid double-wiring (important when panels re-render).
                    try {
                        if (sec.dataset.sheetSectionWired) return
                        sec.dataset.sheetSectionWired = '1'
                    } catch (_) {}

                    // Wrap everything after the title into a body container.
                    const bodyWrap = document.createElement('div')
                    bodyWrap.className = 'char-section-body'

                    let node = titleEl.nextSibling
                    while (node) {
                        const next = node.nextSibling
                        bodyWrap.appendChild(node)
                        node = next
                    }
                    sec.appendChild(bodyWrap)

                    // Default: collapse secondary sections that already have a divider.
                    if (sec.classList.contains('char-divider-top')) {
                        sec.classList.add('collapsed')
                    }

                    // Accessibility + interaction
                    titleEl.classList.add('section-toggle')
                    titleEl.setAttribute('role', 'button')
                    titleEl.tabIndex = 0

                    const syncAria = () => {
                        const expanded = !sec.classList.contains('collapsed')
                        titleEl.setAttribute('aria-expanded', expanded ? 'true' : 'false')
                    }

                    const toggle = () => {
                        sec.classList.toggle('collapsed')
                        syncAria()
                    }

                    titleEl.addEventListener('click', toggle)
                    titleEl.addEventListener('keydown', (e) => {
                        if (!e) return
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            toggle()
                        }
                    })

                    syncAria()
                })
            }

            // --- OVERVIEW TAB ---------------------------------------------------------
            const overviewHtml = `
      <div class="char-section">
        <div class="char-section-title">Hero</div>
        <div class="stat-grid">
          <div class="stat-label">
            <span class="char-stat-icon">🏷</span>Name
          </div>
          <div class="stat-value">${p.name}</div>

          <div class="stat-label">
            <span class="char-stat-icon">🎭</span>Class
          </div>
          <div class="stat-value">${cls ? cls.name : 'Unknown'}</div>

          <div class="stat-label">
            <span class="char-stat-icon">⚖</span>Difficulty
          </div>
          <div class="stat-value">${diff ? diff.name : ''}</div>

          <div class="stat-label">
            <span class="char-stat-icon">⭐</span>Level
          </div>
          <div class="stat-value">${p.level}</div>

          <div class="stat-label">
            <span class="char-stat-icon">📈</span>XP
          </div>
          <div class="stat-value">${p.xp} / ${p.nextLevelXp}</div>

          <div class="stat-label">
            <span class="char-stat-icon">📍</span>Location
          </div>
          <div class="stat-value">${areaName}</div>
        </div>
      </div>
    `

            // --- STATS TAB ------------------------------------------------------------
            const statsHtml = `
      <div class="char-section">
        <div class="char-section-title">Core Stats</div>
        <div class="stat-grid">
          <div class="stat-label">
            <span class="char-stat-icon">❤️</span>HP
          </div>
          <div class="stat-value"><span class="sheet-core-hp">${Math.round(p.hp)} / ${p.maxHp}</span></div>

          <div class="stat-label">
            <span class="char-stat-icon">💧</span>${p.resourceName}
          </div>
          <div class="stat-value"><span class="sheet-core-resource">${Math.round(p.resource)} / ${
                p.maxResource
            }</span></div>

          <div class="stat-label">
            <span class="char-stat-icon">⚔</span>Attack
          </div>
          <div class="stat-value stat-attack">${p.stats.attack}</div>

          <div class="stat-label">
            <span class="char-stat-icon">✨</span>Magic
          </div>
          <div class="stat-value stat-magic">${p.stats.magic}</div>

          <div class="stat-label">
            <span class="char-stat-icon">🛡</span>Armor
          </div>
          <div class="stat-value stat-armor">${p.stats.armor}</div>

          <div class="stat-label">
            <span class="char-stat-icon">🌀</span>Speed
          </div>
          <div class="stat-value stat-speed">${p.stats.speed}</div>

          <div class="stat-label">
            <span class="char-stat-icon">💰</span>Gold
          </div>
          <div class="stat-value"><span class="sheet-core-gold">${p.gold}</span></div>
        </div>
      </div>


      <div class="char-section char-divider-top">
        <div class="char-section-title">Gear Affixes</div>
        <div class="stat-grid">
          <div class="stat-label">
            <span class="char-stat-icon">🎯</span>Crit Chance
          </div>
          <div class="stat-value"><span class="sheet-stat-crit">${statCritChance}%</span></div>

          <div class="stat-label">
            <span class="char-stat-icon">💨</span>Dodge Chance
          </div>
          <div class="stat-value"><span class="sheet-stat-dodge">${statDodgeChance}%</span></div>

          <div class="stat-label">
            <span class="char-stat-icon">🧿</span>Resist All
          </div>
          <div class="stat-value"><span class="sheet-stat-resistall">${statResistAll}%</span></div>

          <div class="stat-label">
            <span class="char-stat-icon">🩸</span>Life Steal
          </div>
          <div class="stat-value"><span class="sheet-stat-lifesteal">${statLifeSteal}%</span></div>

          <div class="stat-label">
            <span class="char-stat-icon">🪓</span>Armor Pen
          </div>
          <div class="stat-value"><span class="sheet-stat-armorpen">${statArmorPen}%</span></div>

          <div class="stat-label">
            <span class="char-stat-icon">⏱</span>Haste
          </div>
          <div class="stat-value"><span class="sheet-stat-haste">${statHaste}%</span></div>

	      <div class="stat-label">
	            <span class="char-stat-icon">🌩</span>Elemental Bonus
	          </div>
	      <div class="stat-value"><span class="sheet-stat-element-bonus">${escapeHtml(_elemSummary.elementalBonusSummary)}</span></div>

          <div class="stat-label">
            <span class="char-stat-icon">🔮</span>Weapon Element
          </div>
	          <div class="stat-value"><span class="sheet-stat-weapon-element">${escapeHtml(_elemSummary.weaponElement)}</span></div>

          <div class="stat-label">
            <span class="char-stat-icon">🧊</span>Elemental Resists
          </div>
	          <div class="stat-value"><span class="sheet-stat-element-resists">${escapeHtml(_elemSummary.elementalResistSummary)}</span></div>

          <div class="stat-label">
            <span class="char-stat-icon">🦔</span>Thorns
          </div>
          <div class="stat-value"><span class="sheet-stat-thorns">${statThorns}</span></div>

          <div class="stat-label">
            <span class="char-stat-icon">➕</span>HP Regen
          </div>
          <div class="stat-value"><span class="sheet-stat-hpregen">${statHpRegen}</span></div>
        </div>
      </div>

      <div class="char-section char-divider-top">
        <div class="char-section-title">Elemental Breakdown</div>
        <div class="sheet-element-breakdown">${renderElementalBreakdownHtml(p)}</div>
      </div>

      <div class="char-section char-divider-top">
        <div class="char-section-title">Derived Breakdown</div>
        <div class="stat-grid">
          <div class="stat-label">
            <span class="char-stat-icon">⚔</span>Attack
          </div>
          <div class="stat-value">
            ${baseStats.attack}
            <span class="stat-note">
              (+${atkFromStr} STR, +${weaponAtkBonus} weapon)
            </span>
          </div>

          <div class="stat-label">
            <span class="char-stat-icon">❤️</span>HP Max
          </div>
          <div class="stat-value">
            ${baseStats.maxHp}
            <span class="stat-note">
              (+${hpFromEnd} END)
            </span>
          </div>

          <div class="stat-label">
            <span class="char-stat-icon">✨</span>Magic
          </div>
          <div class="stat-value">
            ${baseStats.magic}
            <span class="stat-note">
              (+${magicFromWill} WIL, +${weaponMagicBonus} weapon)
            </span>
          </div>

          <div class="stat-label">
            <span class="char-stat-icon">🛡</span>Armor
          </div>
          <div class="stat-value">
            ${baseStats.armor}
            <span class="stat-note">
              (+${armorFromEnd} END, +${armorBonus} armor)
            </span>
          </div>

          <div class="stat-label">
            <span class="char-stat-icon">💧</span>${p.resourceName} Max
          </div>
          <div class="stat-value">
            ${baseRes}
            <span class="stat-note">
              (+${resFromWill} WIL, +${armorResBonus} gear)
            </span>
          </div>
        </div>
      </div>
    `

            // --- SKILLS TAB -----------------------------------------------------------
            const skillsHtml = `
      <div class="char-section">
        <div class="char-section-title">Skills</div>
        <div class="stat-grid">
          <div class="stat-label">
            <span class="char-stat-icon">💪</span>Strength
          </div>
          <div class="stat-value">${sk.strength}</div>

          <div class="stat-label">
            <span class="char-stat-icon">🛡</span>Endurance
          </div>
          <div class="stat-value">${sk.endurance}</div>

          <div class="stat-label">
            <span class="char-stat-icon">🧠</span>Willpower
          </div>
          <div class="stat-value">${sk.willpower}</div>

          <div class="stat-label">
            <span class="char-stat-icon">⭐</span>Skill Points
          </div>
          <div class="stat-value">${p.skillPoints || 0}</div>
        </div>
      </div>

      <div class="char-section char-divider-top">
        <p class="modal-subtitle">
          Tip: Strength boosts physical attacks, Endurance increases max HP & armor,
          and Willpower improves magic power and resource pool.
        </p>
      </div>
    `

            // --- EQUIPMENT TAB --------------------------------------------------------
            const escHtml = (s) =>
                String(s ?? '')
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/"/g, '&quot;')
                    .replace(/'/g, '&#39;')

            const rarityKey = (r) => String(r || 'common').toLowerCase()

            const slotName = (slot) => {
                const it = p.equipment && p.equipment[slot] ? p.equipment[slot] : null
                if (!it) return '<span class="equip-empty">None</span>'
                return (
                    '<span class="equip-name rarity-' +
                    rarityKey(it.rarity) +
                    '">' +
                    escHtml(it.name) +
                    '</span>'
                )
            }

            const weaponName = slotName('weapon')
            const armorName = slotName('armor')
            const headName = slotName('head')
            const handsName = slotName('hands')
            const feetName = slotName('feet')
            const beltName = slotName('belt')
            const neckName = slotName('neck')
            const ringName = slotName('ring')

            // --- TALENTS TAB ----------------------------------------------------------
            const talentsHtml = renderTalentsPanelHtml(p)

            const equipmentHtml = `
      <div class="char-section">
        <div class="char-section-title">Equipment</div>
        <div class="stat-grid">
          <div class="stat-label">
            <span class="char-stat-icon">⚔</span>Weapon
          </div>
          <div class="stat-value">${weaponName}</div>

          <div class="stat-label">
            <span class="char-stat-icon">🛡</span>Armor (Body)
          </div>
          <div class="stat-value">${armorName}</div>

          <div class="stat-label">
            <span class="char-stat-icon">🪖</span>Head
          </div>
          <div class="stat-value">${headName}</div>

          <div class="stat-label">
            <span class="char-stat-icon">🧤</span>Hands
          </div>
          <div class="stat-value">${handsName}</div>

          <div class="stat-label">
            <span class="char-stat-icon">🥾</span>Feet
          </div>
          <div class="stat-value">${feetName}</div>

          <div class="stat-label">
            <span class="char-stat-icon">🎗</span>Belt
          </div>
          <div class="stat-value">${beltName}</div>

          <div class="stat-label">
            <span class="char-stat-icon">📿</span>Neck
          </div>
          <div class="stat-value">${neckName}</div>

          <div class="stat-label">
            <span class="char-stat-icon">💍</span>Ring
          </div>
          <div class="stat-value">${ringName}</div>
        </div>
      </div>

      <div class="char-section char-divider-top">
        <p class="modal-subtitle">
          Gear pieces can roll bonuses like Armor, Max Resource, Resist All, and more.
          Accessories (Neck/Ring) can also roll small offensive stats.
        </p>
      </div>
    `

            // --- COMPANIONS TAB -------------------------------------------------------
            let companionsHtml = ''

            if (!comp) {
                companionsHtml = `
        <div class="char-section">
          <div class="char-section-title">Companion</div>
          <p class="equip-empty">You currently travel alone.</p>
        </div>
      `
            } else {
                companionsHtml = `
        <div class="char-section">
          <div class="char-section-title">Companion</div>
          <div class="stat-grid">
            <div class="stat-label">
              <span class="char-stat-icon">🧍</span>Name
            </div>
            <div class="stat-value">${comp.name}</div>

            <div class="stat-label">
              <span class="char-stat-icon">🎯</span>Role
            </div>
            <div class="stat-value">${comp.role}</div>

            <div class="stat-label">
              <span class="char-stat-icon">⚔</span>Attack
            </div>
            <div class="stat-value stat-attack">${comp.attack}</div>

            <div class="stat-label">
              <span class="char-stat-icon">❤️</span>HP Bonus
            </div>
            <div class="stat-value">${comp.hpBonus}</div>
          </div>
          <p class="modal-subtitle">${comp.description}</p>
        </div>
      `
            }

            const companionsPanelHtml =
                companionsHtml +
                `
      <div class="char-section char-divider-top">
        <p class="modal-subtitle">
          Companions act after your turn. Some focus on damage, others on defense or healing.
        </p>
      </div>
    `

            // Build panels
            makePanel('overview', overviewHtml)
            makePanel('stats', statsHtml)
            makePanel('skills', skillsHtml)
            makePanel('talents', talentsHtml)

            // Wire talent unlock buttons
            try {
                const bindTalentButtons = (root) => {
                    if (!root) return
                    root.querySelectorAll('.talent-unlock').forEach((btn) => {
                        btn.addEventListener('click', () => {
                            const id = btn.getAttribute('data-talent')
                            if (unlockTalent(p, id)) {
                                // Talent effects can affect derived stats. Refresh the sheet in-place.
                                try { refreshCharacterSheetLiveValues(p, body) } catch (_) {}

                                const panel = panelsWrapper.querySelector('.char-tab-panel[data-tab="talents"]')
                                if (panel) {
                                    panel.innerHTML = renderTalentsPanelHtml(p)
                                    try { wireSheetAccordions(panel) } catch (_) {}
                                    bindTalentButtons(panel)
                                }
                                updateHUD()
                                requestSave('legacy')
                            }
                        })
                    })
                }
                bindTalentButtons(panelsWrapper)
            } catch (_) {}


            makePanel('equipment', equipmentHtml)
            makePanel('companions', companionsPanelHtml)

            body.appendChild(panelsWrapper)

            // Reduce clutter by enabling collapsible sections.
            try { wireSheetAccordions(panelsWrapper) } catch (_) {}

            // --- TAB SWITCH LOGIC -----------------------------------------------------
            tabs.addEventListener('click', (e) => {
                const btn = e.target.closest('.char-tab')
                if (!btn) return
                const tabId = btn.dataset.tab

                tabs.querySelectorAll('.char-tab').forEach((b) => {
                    b.classList.toggle('active', b === btn)
                })

                panelsWrapper
                    .querySelectorAll('.char-tab-panel')
                    .forEach((panel) => {
                        panel.classList.toggle(
                            'active',
                            panel.dataset.tab === tabId
                        )
                    })
            })
        })
    }

    function openEnemySheet() {
        const enemy = state && state.currentEnemy ? state.currentEnemy : null
        if (!state || !state.inCombat || !enemy) return

        // Ensure runtime containers exist (safe for mid-combat inspection)
        try { ensureEnemyRuntime(enemy) } catch (_) {}

        const rarityDef = getEnemyRarityDef(enemy.rarity) || getEnemyRarityDef('common')
        const rarityLabel = enemy.rarityLabel || (rarityDef ? rarityDef.label : 'Common')

        const isBoss = !!enemy.isBoss
        const isElite = !!enemy.isElite

        const maxHp = Math.max(1, Math.floor(finiteNumber(enemy.maxHp, 1)))
        const hp = clampFinite(enemy.hp, 0, maxHp, maxHp)

        const pm = typeof enemy.postureMax === 'number' && Number.isFinite(enemy.postureMax) && enemy.postureMax > 0
            ? Math.max(1, Math.floor(enemy.postureMax))
            : 0
        const posture = pm ? clampFinite(enemy.posture, 0, pm, 0) : 0

        const effAtk = getEffectiveEnemyAttack(enemy)
        const effMag = getEffectiveEnemyMagic(enemy)

        // Element info (Patch 1.2.0)
        // - Affinities are multipliers (weak > 1, resist < 1)
        // - elementalResists are flat %-reductions used by some templates
        const enemyElementInfoText = (() => {
            const parts = []
            if (enemy.affinities) {
                const w = enemy.affinities.weak || {}
                const r = enemy.affinities.resist || {}

                // Normalize keys + values so the sheet stays correct even if authored content
                // uses synonyms/casing or percent-style values.
                const weakMap = {}
                const resistMap = {}

                try {
                    Object.keys(w).forEach((k) => {
                        const nk = normalizeElementType(k)
                        if (!nk) return
                        const mult = _normalizeAffinityMult(w[k])
                        if (!(mult > 1.001)) return
                        weakMap[nk] = Math.max(weakMap[nk] || 1, mult)
                    })
                } catch (_) {}

                try {
                    Object.keys(r).forEach((k) => {
                        const nk = normalizeElementType(k)
                        if (!nk) return
                        const mult = _normalizeAffinityMult(r[k])
                        if (!(mult < 0.999)) return
                        resistMap[nk] = Math.min(resistMap[nk] || 1, mult)
                    })
                } catch (_) {}

                const wk = Object.keys(weakMap)
                    .sort()
                    .map((k) => {
                        const pct = Math.round((weakMap[k] - 1) * 100)
                        return (k.charAt(0).toUpperCase() + k.slice(1)) + ' +' + pct + '%'
                    })
                const rk = Object.keys(resistMap)
                    .sort()
                    .map((k) => {
                        const pct = Math.round((1 - resistMap[k]) * 100)
                        return (k.charAt(0).toUpperCase() + k.slice(1)) + ' -' + pct + '%'
                    })

                if (wk.length) parts.push('Weak: ' + wk.join(', '))
                if (rk.length) parts.push('Resist: ' + rk.join(', '))
            }

            if (enemy.elementalResists && typeof enemy.elementalResists === 'object') {
                const flatMap = {}
                try {
                    Object.keys(enemy.elementalResists).forEach((k) => {
                        const nk = normalizeElementType(k)
                        if (!nk) return
                        const pct = _normalizePctMaybeFraction(enemy.elementalResists[k], { allowNegative: false })
                        if (!(pct > 0)) return
                        flatMap[nk] = Math.max(flatMap[nk] || 0, pct)
                    })
                } catch (_) {}

                const ek = Object.keys(flatMap)
                    .sort()
                    .map((k) => (k.charAt(0).toUpperCase() + k.slice(1)) + ' ' + Math.round(flatMap[k]) + '%')

                if (ek.length) parts.push('Flat resist: ' + ek.join(', '))
            }

            return parts.join(' • ')
        })()

        const baseDropChance = isBoss ? 1.0 : isElite ? 0.9 : 0.7
        const dropChance = clamp01(baseDropChance * finiteNumber(enemy.rarityDropMult, 1))

        const fmtPct = (x) => Math.round(clamp01(Number(x) || 0) * 100) + '%'

        function describeAffix(id) {
            const def = getEnemyAffixDef(id)
            if (!def) return id
            const parts = []
            if (def.vampiricHealPct) parts.push('Heals ' + Math.round(def.vampiricHealPct * 100) + '% of damage dealt')
            if (def.thornsReflectPct) parts.push('Reflects ' + Math.round(def.thornsReflectPct * 100) + '% of damage taken')
            if (def.chillChance) parts.push('On hit: ' + fmtPct(def.chillChance) + ' to apply Chilled (' + (def.chillTurns || 1) + 't)')
            if (def.bleedChance) parts.push('On hit: ' + fmtPct(def.bleedChance) + ' to apply Bleed (' + (def.bleedTurns || 2) + 't)')
            if (def.onShieldCastNextDmgPct) parts.push('After casting a shield: next damage +' + Math.round(def.onShieldCastNextDmgPct) + '%')
            if (def.onKillGain && def.onKillGain.key) parts.push('On kill: +' + def.onKillGain.amount + ' ' + def.onKillGain.key)
            if (def.hexTurns) parts.push('On hit: applies Hex (' + def.hexTurns + 't)')
            if (def.berserkThreshold) parts.push('Below ' + Math.round(def.berserkThreshold * 100) + '% HP: +'+ Math.round((def.berserkAtkPct||0)*100) + '% attack')
            if (def.regenPct) parts.push('Regenerates ' + Math.round(def.regenPct * 100) + '% max HP at end of turn')
            return def.label + (parts.length ? ' — ' + parts.join('; ') : '')
        }

        openEnemyModal('Enemy Sheet', (body) => {
            body.innerHTML = ''

            // --- HEADER --------------------------------------------------------------
            const header = document.createElement('div')
            header.className = 'sheet-header'
            header.innerHTML = `
          <div class="sheet-title-row">
            <div>
              <div class="sheet-title">${escapeHtml(enemy.name || 'Enemy')}</div>
              <div class="sheet-subtitle">${escapeHtml(rarityLabel)}${isBoss ? ' • Boss' : ''}${isElite ? ' • Elite' : ''} • Lv ${finiteNumber(enemy.level, 1)}</div>
            </div>
            <div class="sheet-subtitle">${escapeHtml(state.area || '')}</div>
          </div>
          <div class="sheet-badges">
            <span class="sheet-badge"><span class="k">HP</span><span class="v">${Math.round(hp)} / ${maxHp}</span></span>
            ${pm ? `<span class="sheet-badge"><span class="k">Posture</span><span class="v">${Math.round(posture)} / ${pm}</span></span>` : ''}
            <span class="sheet-badge"><span class="k">Atk</span><span class="v">${Math.round(effAtk)}</span></span>
            <span class="sheet-badge"><span class="k">Mag</span><span class="v">${Math.round(effMag)}</span></span>
          </div>
          ${enemyElementInfoText ? `<div class="sheet-line"><b>Elements:</b> ${escapeHtml(enemyElementInfoText)}</div>` : ''}
        `
            body.appendChild(header)

            const tabs = document.createElement('div')
            tabs.className = 'char-tabs'

            const tabDefs = [
                { id: 'overview', label: 'Overview' },
                { id: 'stats', label: 'Stats' },
                { id: 'abilities', label: 'Abilities' },
                { id: 'effects', label: 'Affixes & Effects' },
                { id: 'rewards', label: 'Rewards' }
            ]

            tabDefs.forEach((t, idx) => {
                const btn = document.createElement('button')
                btn.className = 'char-tab' + (idx === 0 ? ' active' : '')
                btn.dataset.tab = t.id
                btn.textContent = t.label
                tabs.appendChild(btn)
            })

            body.appendChild(tabs)

            const panelsWrapper = document.createElement('div')
            panelsWrapper.className = 'char-tabs-wrapper'

            function makePanel(id, innerHTML) {
                const panel = document.createElement('div')
                panel.className = 'char-tab-panel' + (id === 'overview' ? ' active' : '')
                panel.dataset.tab = id
                panel.innerHTML = innerHTML
                panelsWrapper.appendChild(panel)
                return panel
            }

            // --- OVERVIEW -----------------------------------------------------------
            const overviewHtml = `
      <div class="char-section">
        <div class="char-section-title">Enemy</div>
        <div class="stat-grid">
          <div class="stat-label"><span class="char-stat-icon">🏷</span>Name</div>
          <div class="stat-value">${enemy.name || 'Enemy'}</div>

          <div class="stat-label"><span class="char-stat-icon">⭐</span>Level</div>
          <div class="stat-value">${finiteNumber(enemy.level, 1)}</div>

          <div class="stat-label"><span class="char-stat-icon">💠</span>Rarity</div>
          <div class="stat-value">${rarityLabel}${isBoss ? ' • Boss' : ''}${isElite ? ' • Elite' : ''}</div>

          <div class="stat-label"><span class="char-stat-icon">❤️</span>HP</div>
          <div class="stat-value">${Math.round(hp)}/${maxHp}</div>

          ${pm ? `
          <div class="stat-label"><span class="char-stat-icon">🛡</span>Posture</div>
          <div class="stat-value">${Math.round(posture)}/${pm}</div>
          ` : ''}

          <div class="stat-label"><span class="char-stat-icon">🧠</span>Behavior</div>
          <div class="stat-value">${enemy.behavior ? String(enemy.behavior) : '—'}</div>
        </div>
      </div>
    `
            makePanel('overview', overviewHtml)

            // --- STATS --------------------------------------------------------------
            const statsHtml = `
      <div class="char-section">
        <div class="char-section-title">Combat Stats</div>
        <div class="stat-grid">
          <div class="stat-label"><span class="char-stat-icon">⚔</span>Attack</div>
          <div class="stat-value">${Math.round(finiteNumber(enemy.attack, 0))} <span style="opacity:.7">(effective ${Math.round(effAtk)})</span></div>

          <div class="stat-label"><span class="char-stat-icon">✨</span>Magic</div>
          <div class="stat-value">${Math.round(finiteNumber(enemy.magic, 0))} <span style="opacity:.7">(effective ${Math.round(effMag)})</span></div>

          <div class="stat-label"><span class="char-stat-icon">🛡</span>Armor</div>
          <div class="stat-value">${Math.round(finiteNumber(enemy.armor, 0))}${enemy.armorBuff ? ' <span style="opacity:.7">(+' + Math.round(enemy.armorBuff) + ' buff)</span>' : ''}</div>

          <div class="stat-label"><span class="char-stat-icon">🔰</span>Magic Res</div>
          <div class="stat-value">${Math.round(finiteNumber(enemy.magicRes, 0))}</div>

          <div class="stat-label"><span class="char-stat-icon">🧪</span>Elements</div>
          <div class="stat-value">${enemyElementInfoText ? escapeHtml(enemyElementInfoText) : '—'}</div>

          <div class="stat-label"><span class="char-stat-icon">📌</span>Base Attack</div>
          <div class="stat-value">${Math.round(finiteNumber(enemy.baseAttack, finiteNumber(enemy.attack, 0)))}</div>

          <div class="stat-label"><span class="char-stat-icon">📌</span>Base Magic</div>
          <div class="stat-value">${Math.round(finiteNumber(enemy.baseMagic, finiteNumber(enemy.magic, 0)))}</div>
        </div>
      </div>
    `
            makePanel('stats', statsHtml)

            // --- ABILITIES ----------------------------------------------------------
            const abilityLines = (() => {
                const arr = Array.isArray(enemy.abilities) ? enemy.abilities : []
                if (!arr.length) return '<div class="modal-subtitle">No special abilities.</div>'
                return arr
                    .map((aid) => {
                        const ab = ENEMY_ABILITIES && ENEMY_ABILITIES[aid] ? ENEMY_ABILITIES[aid] : null
                        const name = ab ? ab.name : String(aid)
                        const cd = ab && typeof ab.cooldown === 'number' ? ab.cooldown : null
                        const tele = ab && ab.telegraphTurns ? ab.telegraphTurns : 0
                        const desc = ab && ab.desc ? ab.desc : ''
                        return `
          <div class="item-row">
            <div class="item-row-header">
              <div><span class="item-name">${name}</span></div>
              <div class="item-meta">${cd != null ? 'CD ' + cd : ''}${tele ? (cd != null ? ' • ' : '') + 'Telegraph ' + tele + 't' : ''}</div>
            </div>
            ${desc ? `<div style="font-size:.78rem;color:var(--muted)">${escapeHtml(desc)}</div>` : ''}
          </div>
        `
                    })
                    .join('')
            })()

            const abilitiesHtml = `
      <div class="char-section">
        <div class="char-section-title">Abilities</div>
        ${abilityLines}
      </div>
    `
            makePanel('abilities', abilitiesHtml)

            // --- AFFIXES / EFFECTS --------------------------------------------------
            const affixIds = Array.isArray(enemy.affixes) ? enemy.affixes : []
            const affixHtml = affixIds.length
                ? affixIds
                      .map((id) => `<div class="item-row"><div class="item-row-header"><div><span class="item-name">${describeAffix(id)}</span></div></div></div>`)
                      .join('')
                : '<div class="modal-subtitle">No mini-affixes.</div>'

            const eliteHtml = enemy.isElite
                ? `<div class="item-row"><div class="item-row-header"><div><span class="item-name">Elite: ${enemy.eliteLabel || enemy.eliteAffix || 'Elite'}</span></div></div></div>`
                : ''

            const statusParts = []
            if (enemy.bleedTurns && enemy.bleedTurns > 0) statusParts.push('Bleeding (' + enemy.bleedTurns + 't)')
            if (enemy.chilledTurns && enemy.chilledTurns > 0) statusParts.push('Chilled (' + enemy.chilledTurns + 't)')
            if (enemy.burnTurns && enemy.burnTurns > 0) statusParts.push('Burning (' + enemy.burnTurns + 't)')
            if (enemy.guardTurns && enemy.guardTurns > 0) statusParts.push('Guarding (' + enemy.guardTurns + 't)')
            if (enemy.brokenTurns && enemy.brokenTurns > 0) statusParts.push('Broken (' + enemy.brokenTurns + 't)')
            if (enemy.atkDownTurns && enemy.atkDownTurns > 0 && enemy.atkDownFlat) statusParts.push('Weakened ' + enemy.atkDownFlat + ' (' + enemy.atkDownTurns + 't)')
            if (enemy.intent && enemy.intent.aid) {
                const ab = ENEMY_ABILITIES && ENEMY_ABILITIES[enemy.intent.aid] ? ENEMY_ABILITIES[enemy.intent.aid] : null
                statusParts.push('Intent: ' + (ab ? ab.name : enemy.intent.aid) + ' (' + clampFinite(enemy.intent.turnsLeft, 0, 99, 0) + 't)')
            }

            const effectsHtml = `
      <div class="char-section">
        <div class="char-section-title">Modifiers</div>
        ${eliteHtml}
        <div style="margin-top:.35rem">${affixHtml}</div>
      </div>
      <div class="char-section">
        <div class="char-section-title">Current Effects</div>
        <div class="modal-subtitle">${statusParts.length ? statusParts.join(' • ') : 'None'}</div>
      </div>
    `
            makePanel('effects', effectsHtml)

            // --- REWARDS ------------------------------------------------------------
            const rewardsHtml = `
      <div class="char-section">
        <div class="char-section-title">Rewards</div>
        <div class="stat-grid">
          <div class="stat-label"><span class="char-stat-icon">📈</span>XP</div>
          <div class="stat-value">${Math.round(finiteNumber(enemy.xp, 0))}</div>

          <div class="stat-label"><span class="char-stat-icon">🪙</span>Gold</div>
          <div class="stat-value">${Math.round(finiteNumber(enemy.goldMin, 0))}–${Math.round(finiteNumber(enemy.goldMax, 0))}</div>

          <div class="stat-label"><span class="char-stat-icon">🎁</span>Loot Drop Chance</div>
          <div class="stat-value">${Math.round(dropChance * 100)}%</div>

          <div class="stat-label"><span class="char-stat-icon">🎲</span>Loot Quality Driver</div>
          <div class="stat-value">Enemy rarity tier ${finiteNumber(enemy.rarityTier, 1)}</div>
        </div>
      </div>
    `
            makePanel('rewards', rewardsHtml)

            body.appendChild(panelsWrapper)

            // Tab switching
            const tabBtns = tabs.querySelectorAll('.char-tab')
            tabBtns.forEach((btn) => {
                btn.addEventListener('click', () => {
                    tabBtns.forEach((b) => b.classList.remove('active'))
                    btn.classList.add('active')
                    const target = btn.dataset.tab
                    panelsWrapper.querySelectorAll('.char-tab-panel').forEach((pnl) => {
                        pnl.classList.toggle('active', pnl.dataset.tab === target)
                    })
                })
            })
        })
    }

    // Return the public API
    return {
        resolvePendingEnemyDefeats,
        openCharacterSheet,
        openEnemySheet
    }
}
