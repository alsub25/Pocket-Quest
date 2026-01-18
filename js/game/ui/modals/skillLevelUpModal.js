/**
 * skillLevelUpModal.js
 * 
 * Skill level-up modal UI for distributing skill points.
 * Extracted from gameOrchestrator.js to reduce file size.
 * 
 * ~126 lines extracted.
 */

/**
 * Creates the skill level-up modal function with all necessary dependencies injected.
 * @returns {Function} openSkillLevelUpModal function
 */
export function createSkillLevelUpModal({
    // Core state
    state,
    
    // UI functions
    openModal,
    closeModal,
    setModalOnClose,
    addLog,
    updateHUD,
    
    // Game system functions
    autoDistributeSkillPoints,
    _recalcPlayerStats
}) {
    return function openSkillLevelUpModal() {
        const p = state.player
        if (!p) return

        // If the player clicks outside and closes the modal, auto-spend any remaining points.
        setModalOnClose(() => {
            const pl = state.player
            if (!pl) return
            autoDistributeSkillPoints(pl) // no-ops if skillPoints <= 0
        })

        // Give exactly 1 point if somehow missing
        if (p.skillPoints == null) p.skillPoints = 0
        if (p.skillPoints <= 0) p.skillPoints = 1

        const closeBtn = document.getElementById('modalClose')
        if (closeBtn) closeBtn.style.display = 'none' // force choice

        openModal('Level Up!', (body) => {
            const info = document.createElement('p')
            info.className = 'modal-subtitle'
            info.textContent =
                'You feel your power surge. Choose a skill to improve (1 point).'
            body.appendChild(info)

            const pointsEl = document.createElement('p')
            pointsEl.className = 'modal-subtitle'
            pointsEl.textContent = 'Unspent skill points: ' + p.skillPoints
            body.appendChild(pointsEl)

            const skills = [
                {
                    key: 'strength',
                    name: 'Strength',
                    desc: 'Increase physical power. +Attack.'
                },
                {
                    key: 'endurance',
                    name: 'Endurance',
                    desc: 'Bolster toughness. +Max HP and a bit of Armor.'
                },
                {
                    key: 'willpower',
                    name: 'Willpower',
                    desc: 'Sharpen arcane focus. +Magic and max resource.'
                }
            ]

            skills.forEach((s) => {
                const row = document.createElement('div')
                row.className = 'item-row'

                const header = document.createElement('div')
                header.className = 'item-row-header'

                const left = document.createElement('div')
                left.innerHTML =
                    '<span class="item-name">' +
                    s.name +
                    '</span>' +
                    ' (Rank ' +
                    p.skills[s.key] +
                    ')'

                const right = document.createElement('div')
                right.className = 'item-meta'
                right.textContent = s.desc

                header.appendChild(left)
                header.appendChild(right)

                const actions = document.createElement('div')
                actions.className = 'item-actions'

                const btn = document.createElement('button')
                btn.className = 'btn small'
                btn.textContent = 'Increase'
                btn.addEventListener('click', () => {
                    if (p.skillPoints <= 0) return

                    p.skills[s.key] += 1
                    p.skillPoints -= 1

                    _recalcPlayerStats()
                    p.hp = p.maxHp // full heal on level-up
                    p.resource = p.maxResource

                    updateHUD()
                    pointsEl.textContent = 'Unspent skill points: ' + p.skillPoints

                    addLog(
                        'You increase ' +
                            s.name +
                            ' to rank ' +
                            p.skills[s.key] +
                            '.',
                        'good'
                    )

                    if (p.skillPoints <= 0) {
                        closeModal()
                    } else {
                        // update shown rank
                        left.innerHTML =
                            '<span class="item-name">' +
                            s.name +
                            '</span>' +
                            ' (Rank ' +
                            p.skills[s.key] +
                            ')'
                    }
                })

                actions.appendChild(btn)
                row.appendChild(header)
                row.appendChild(actions)
                body.appendChild(row)
            })
        })
    }
}
