// Locations/Village/tavern.js

export function openTavernModalImpl({
  state,
  openModal,
  addLog,
  getVillageEconomySummary,
  getRestCost,
  handleEconomyAfterPurchase,
  jumpToNextMorning,
  handleEconomyDayTick,
  handleGovernmentDayTick,   // ⬅️ ADD THIS
  updateHUD,
  updateTimeDisplay,
  saveGame,
  closeModal,
  openGambleModal
}) {
  const p = state && state.player;
  if (!p) return;

  const econSummary = getVillageEconomySummary(state);
  const tier = econSummary.tier;

  openModal('Emberwood Tavern', body => {
    body.innerHTML = '';

    // Intro
    const intro = document.createElement('p');
    intro.className = 'modal-subtitle';
    intro.textContent =
      'The Emberwood tavern hums with low chatter, clinking mugs, and the smell of stew.';
    body.appendChild(intro);

    // Economy line – same idea as bank summary line
    const econLine = document.createElement('p');
    econLine.className = 'modal-subtitle';
    econLine.textContent =
      `Village economy: ${tier.name} – rooms and food are ${tier.priceDescriptor}.`;
    body.appendChild(econLine);

    // ========= SERVICE ROW: REST / ROOM ======================================
    const restRow = document.createElement('div');
    restRow.className = 'item-row';

    const restHeader = document.createElement('div');
    restHeader.className = 'item-row-header';

    const restLeft = document.createElement('div');
    restLeft.innerHTML = '<span class="item-name">Rent a Room</span>';

    const restRight = document.createElement('div');
    restRight.className = 'item-meta';

    const restCost = getRestCost(state);
    restRight.innerHTML = `<span class="tag gold">${restCost}g</span>`;

    restHeader.appendChild(restLeft);
    restHeader.appendChild(restRight);

    const restDesc = document.createElement('div');
    restDesc.className = 'modal-subtitle';
    restDesc.textContent =
      'Rest until morning, fully restoring health and class resources while washing away most wounds.';

    const restActions = document.createElement('div');
    restActions.className = 'item-actions';

    const btnRest = document.createElement('button');
    btnRest.className = 'btn small';
    btnRest.textContent = 'Rest until Morning';
    btnRest.addEventListener('click', () => {
      const cost = getRestCost(state); // recalc in case tier changed
      if (p.gold < cost) {
        addLog('You cannot afford a room right now.', 'system');
        return;
      }

      // Pay & heal
      p.gold -= cost;
      p.hp = p.maxHp;
      p.resource = p.maxResource;
      if (p.status) {
        p.status.bleedTurns = 0;
        p.status.bleedDamage = 0;
      }

      // Economy reacts to spending in the village
      handleEconomyAfterPurchase(state, cost, 'village');

            // Time jumps to next morning
      const newTime = jumpToNextMorning(state);
      handleEconomyDayTick(state, newTime.absoluteDay);
      handleGovernmentDayTick(state, newTime.absoluteDay, { addLog });

      addLog(
        `You rest at the tavern and wake on ${newTime.weekdayName} morning (Year ${newTime.year}).`,
        'good'
      );

      updateHUD();
      updateTimeDisplay();
      saveGame();
      closeModal();
    });
    restActions.appendChild(btnRest);

    restRow.appendChild(restHeader);
    restRow.appendChild(restDesc);
    restRow.appendChild(restActions);
    body.appendChild(restRow);

    // ========= SERVICE ROW: RUMORS ===========================================
    const rumorRow = document.createElement('div');
    rumorRow.className = 'item-row';

    const rumorHeader = document.createElement('div');
    rumorHeader.className = 'item-row-header';

    const rumorLeft = document.createElement('div');
    rumorLeft.innerHTML = '<span class="item-name">Listen for Rumors</span>';

    const rumorRight = document.createElement('div');
    rumorRight.className = 'item-meta';
    rumorRight.textContent = 'Hints & world gossip';

    rumorHeader.appendChild(rumorLeft);
    rumorHeader.appendChild(rumorRight);

    const rumorDesc = document.createElement('div');
    rumorDesc.className = 'modal-subtitle';
    rumorDesc.textContent =
      'Eavesdrop on patrons to learn about threats, secrets, and places worth exploring.';

    const rumorActions = document.createElement('div');
    rumorActions.className = 'item-actions';

    const btnRumors = document.createElement('button');
    btnRumors.className = 'btn small outline';
    btnRumors.textContent = 'Listen';
    btnRumors.addEventListener('click', () => {
      const rumors = [
        'Caravans say goblins still stalk the Emberwood trails at night.',
        'Someone swears they saw a robed figure near the Ruined Spire, whispering to the dark.',
        'Hunters talk about a huge wolf deeper in the forest that leads smaller packs.',
        'The elder keeps old maps of the Spire locked away. Maybe he knows more than he says.',
        'A traveling merchant claimed the Dragon\'s roar can still be heard on stormy nights.'
      ];
      const rumor = rumors[Math.floor(Math.random() * rumors.length)];
      addLog('Tavern rumor: ' + rumor, 'system');
      saveGame();
      closeModal();
    });
    rumorActions.appendChild(btnRumors);

    rumorRow.appendChild(rumorHeader);
    rumorRow.appendChild(rumorDesc);
    rumorRow.appendChild(rumorActions);
    body.appendChild(rumorRow);

    // ========= SERVICE ROW: TAVERN GAMES =====================================
    const gamesRow = document.createElement('div');
    gamesRow.className = 'item-row';

    const gamesHeader = document.createElement('div');
    gamesHeader.className = 'item-row-header';

    const gamesLeft = document.createElement('div');
    gamesLeft.innerHTML = '<span class="item-name">Tavern Games</span>';

    const gamesRight = document.createElement('div');
    gamesRight.className = 'item-meta';
    gamesRight.textContent = 'Gamble for gold';

    gamesHeader.appendChild(gamesLeft);
    gamesHeader.appendChild(gamesRight);

    const gamesDesc = document.createElement('div');
    gamesDesc.className = 'modal-subtitle';
    gamesDesc.textContent =
      'Join dice and card games with the locals. You might win a purse of coin… or lose your last copper.';

    const gamesActions = document.createElement('div');
    gamesActions.className = 'item-actions';

    const btnGames = document.createElement('button');
    btnGames.className = 'btn small outline';
    btnGames.textContent = 'Play Tavern Games';
    btnGames.addEventListener('click', () => {
      closeModal();
      if (typeof openGambleModal === 'function') {
        openGambleModal();
      }
    });
    gamesActions.appendChild(btnGames);

    gamesRow.appendChild(gamesHeader);
    gamesRow.appendChild(gamesDesc);
    gamesRow.appendChild(gamesActions);
    body.appendChild(gamesRow);

    // ========= FOOTER HINT ====================================================
    const hint = document.createElement('p');
    hint.className = 'modal-subtitle';
    hint.textContent =
      'The tavern is a safe place to regroup, gather information, and test your luck between journeys.';
    body.appendChild(hint);
  });
}