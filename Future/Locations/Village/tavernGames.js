// Locations/Village/tavernGames.js
// Tavern gambling UI and game logic.
//
// Design goals:
// - Single source of truth for UI state (selected game, stake, call).
// - No leaked/stale footers when switching modals.
// - Play button disables when stake is unaffordable.
// - Game logic is data-driven and easy to expand.

/** @typedef {{
 *  state: any,
 *  openModal: (title: string, builder: (body: HTMLElement) => void) => void,
 *  addLog: (text: string, type?: string) => void,
 *  updateHUD: () => void,
 *  saveGame: () => void,
 *  closeModal: () => void,
 *  openTavernModal: () => void,
 * }} TavernGamesDeps
 */

function el(tag, opts = {}) {
  const node = document.createElement(tag);
  if (opts.className) node.className = opts.className;
  if (opts.text != null) node.textContent = String(opts.text);
  if (opts.html != null) node.innerHTML = String(opts.html);
  if (opts.attrs) {
    Object.entries(opts.attrs).forEach(([k, v]) => node.setAttribute(k, String(v)));
  }
  if (opts.onClick) node.addEventListener("click", opts.onClick);
  if (Array.isArray(opts.children)) opts.children.forEach(c => c && node.appendChild(c));
  return node;
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

// ----------------------------------------------------------------------------
// DATA
// ----------------------------------------------------------------------------

const PATRONS = [
  { id: "mira", name: "Mira the Cardsharp", mood: "shifty", favoriteGame: "cards" },
  { id: "bram", name: "Old Bram", mood: "grumpy", favoriteGame: "dice" },
  { id: "lysa", name: "Lysa One-Eye", mood: "cheery", favoriteGame: "coin" },
  { id: "tobin", name: "Tobin the Swift", mood: "cheery", favoriteGame: "dice" },
  { id: "gruk", name: "Gruk the Quiet", mood: "shifty", favoriteGame: "cards" }
];

/**
 * biasKey: which patron pool to prefer (dice/cards/coin)
 * baseStake: default stake when switching to the game
 */
const GAMES = {
  dice: {
    id: "dice",
    label: "Dice Duel",
    riskLabel: "Steady Odds",
    baseStake: 10,
    biasKey: "dice",
    description: "You and a patron each roll two dice. Higher total wins the full pot; ties push."
  },
  cards: {
    id: "cards",
    label: "High Card",
    riskLabel: "Swingy",
    baseStake: 15,
    biasKey: "cards",
    description: "You and a patron each draw a single card. Higher value wins; ties refund most of your stake."
  },
  coin: {
    id: "coin",
    label: "Coin Toss",
    riskLabel: "Simple 50/50",
    baseStake: 5,
    biasKey: "coin",
    description: "Call Heads or Tails, then flip. Simple odds, quick swings."
  },
  dragon: {
    id: "dragon",
    label: "Dragonbone Dice",
    riskLabel: "High Risk",
    baseStake: 20,
    biasKey: "dice",
    description: "You both throw carved dragonbone dice. Win big by beating the patron soundly."
  },
  runes: {
    id: "runes",
    label: "Lucky Runes",
    riskLabel: "Blessings & Omens",
    baseStake: 10,
    biasKey: "cards",
    description: "Draw a rune from a pouch. Blessings, favors, or omens decide your fortune."
  },
  wheel: {
    id: "wheel",
    label: "Elemental Wheel",
    riskLabel: "Very Swingy",
    baseStake: 15,
    biasKey: "coin",
    description: "A painted wheel spins. Where it stops can mean a small profit or a blazing jackpot."
  }
};

// ----------------------------------------------------------------------------
// STATE PATCHING
// ----------------------------------------------------------------------------

function ensureGamblingState(state) {
  if (!state.gambling) {
    state.gambling = { lastPatronId: null, roundsWithPatron: 0 };
  }
  if (!("lastPatronId" in state.gambling)) state.gambling.lastPatronId = null;
  if (!("roundsWithPatron" in state.gambling)) state.gambling.roundsWithPatron = 0;
  return state.gambling;
}

function ensureGamblingDebug(state) {
  if (!state.gamblingDebug) {
    state.gamblingDebug = { mode: "normal", payoutMultiplier: 1 };
  }
  if (!state.gamblingDebug.mode) state.gamblingDebug.mode = "normal";
  if (typeof state.gamblingDebug.payoutMultiplier !== "number" || state.gamblingDebug.payoutMultiplier <= 0) {
    state.gamblingDebug.payoutMultiplier = 1;
  }
  return state.gamblingDebug;
}

function findPatronById(id) {
  return PATRONS.find(p => p.id === id) || null;
}

function pickPatron(state, biasKey) {
  const g = ensureGamblingState(state);

  // Reuse the same patron some of the time.
  if (g.lastPatronId) {
    const last = findPatronById(g.lastPatronId);
    if (last) {
      const favorMatch = last.favoriteGame === biasKey;
      const reuseChance = favorMatch ? 0.7 : 0.5;
      if (Math.random() < reuseChance) {
        g.roundsWithPatron = (g.roundsWithPatron || 0) + 1;
        return last;
      }
    }
  }

  // Otherwise, bias toward patrons who love this game type.
  const favored = PATRONS.filter(p => p.favoriteGame === biasKey);
  const pool = favored.length && Math.random() < 0.6 ? favored : PATRONS;
  const patron = pick(pool);
  g.lastPatronId = patron.id;
  g.roundsWithPatron = 1;
  return patron;
}

function addFlavor(text, outcomeType, patron, roundsWithPatron) {
  if (!patron) return text;
  if (roundsWithPatron < 3) return text;

  const shortName = patron.name.split(" ")[0];
  const mood = patron.mood;

  const good = {
    grumpy: ` ${shortName} grumbles that you must be cheating, but keeps playing.`,
    cheery: ` ${shortName} laughs and insists the next round's drinks are on them.`,
    shifty: ` ${shortName}'s eyes narrow, clearly trying to learn your tricks.`
  };
  const bad = {
    grumpy: ` ${shortName} snorts, clearly satisfied to have your coin.`,
    cheery: ` ${shortName} claps you on the shoulder and tells you not to lose heart.`,
    shifty: ` ${shortName} sweeps the coins away with a practiced hand.`
  };
  const neutral = {
    grumpy: ` ${shortName} mutters that the odds will turn soon enough.`,
    cheery: ` ${shortName} just grins, happy to keep the game going.`,
    shifty: ""
  };

  if (outcomeType === "good") return text + (good[mood] || "");
  if (outcomeType === "danger") return text + (bad[mood] || "");
  return text + (neutral[mood] || "");
}

// ----------------------------------------------------------------------------
// GAME LOGIC (returns delta in gold after paying the stake)
// ----------------------------------------------------------------------------

function applyDebugBias(dbgMode, kind, playerValue, houseValue, maxValue) {
  // kind is informational; bias behavior is the same pattern for all.
  if (dbgMode === "playerFavored" && playerValue <= houseValue) {
    return { playerValue: clamp(houseValue + 1, 1, maxValue), houseValue };
  }
  if (dbgMode === "houseFavored" && playerValue >= houseValue) {
    return { playerValue, houseValue: clamp(playerValue + 1, 1, maxValue) };
  }
  return { playerValue, houseValue };
}

function playDice({ stake, patron, dbgMode, payoutMult }) {
  let you = randInt(1, 6) + randInt(1, 6);
  let them = randInt(1, 6) + randInt(1, 6);

  ({ playerValue: you, houseValue: them } = applyDebugBias(dbgMode, "dice", you, them, 12));

  if (you > them) {
    const win = Math.round(stake * 2 * payoutMult);
    return {
      type: "good",
      delta: win,
      text: `You roll ${you} against ${patron.name}'s ${them}. You win ${win} gold from the table.`
    };
  }
  if (you < them) {
    return {
      type: "danger",
      delta: 0,
      text: `${patron.name} rolls ${them} to your ${you}. Laughter rises as you lose your ${stake} gold stake.`
    };
  }
  return {
    type: "system",
    delta: stake,
    text: `Both you and ${patron.name} roll ${you}. The pot is pushed and your stake is returned.`
  };
}

function playCards({ stake, patron, dbgMode, payoutMult }) {
  const suits = ["♠", "♥", "♦", "♣"];
  let you = randInt(1, 13);
  let them = randInt(1, 13);
  const youSuit = pick(suits);
  const themSuit = pick(suits);

  ({ playerValue: you, houseValue: them } = applyDebugBias(dbgMode, "cards", you, them, 13));

  const names = { 1: "Ace", 11: "Jack", 12: "Queen", 13: "King" };
  const n = v => names[v] || String(v);

  if (you > them) {
    const win = Math.round(Math.round(stake * 2.5) * payoutMult);
    return {
      type: "good",
      delta: win,
      text: `You reveal ${n(you)}${youSuit} against ${patron.name}'s ${n(them)}${themSuit}. You rake in ${win} gold.`
    };
  }
  if (you < them) {
    return {
      type: "danger",
      delta: 0,
      text: `${patron.name} shows ${n(them)}${themSuit} to your ${n(you)}${youSuit}. You lose your ${stake} gold.`
    };
  }
  const refund = Math.round(stake * 0.75);
  return {
    type: "system",
    delta: refund,
    text: `Both cards are ${n(you)}. The table laughs and some coins slide back your way (${refund} gold).`
  };
}

function playCoin({ stake, patron, dbgMode, payoutMult, call }) {
  let toss = Math.random() < 0.5 ? "Heads" : "Tails";

  if (dbgMode === "playerFavored") toss = call;
  if (dbgMode === "houseFavored") toss = call === "Heads" ? "Tails" : "Heads";

  if (toss === call) {
    const win = Math.round(stake * 2 * payoutMult);
    return {
      type: "good",
      delta: win,
      text: `The coin lands ${toss}. You called it right against ${patron.name} and scoop up ${win} gold.`
    };
  }
  return {
    type: "danger",
    delta: 0,
    text: `The coin lands ${toss}. ${patron.name} grins as your ${stake} gold vanishes into the pot.`
  };
}

function playDragon({ stake, patron, payoutMult }) {
  const roll3d6 = () => randInt(1, 6) + randInt(1, 6) + randInt(1, 6);
  const you = roll3d6();
  const them = roll3d6();

  let multiplier = 0;
  if (you >= them + 4) multiplier = 3;
  else if (you > them) multiplier = 2;
  else if (you === them) multiplier = 1;

  if (multiplier === 0) {
    return {
      type: "danger",
      delta: 0,
      text: `Dragonbone dice tumble across the felt. You roll ${you} to ${patron.name}'s ${them}, and lose your ${stake} gold stake.`
    };
  }
  if (multiplier === 1) {
    return {
      type: "system",
      delta: stake,
      text: `Matching fortunes—both totals ${you}. The table pushes the pot, returning your stake.`
    };
  }
  const win = Math.round(stake * multiplier * payoutMult);
  return {
    type: "good",
    delta: win,
    text: `The dragonbone dice flash your way: ${you} against ${patron.name}'s ${them}. You drag ${win} gold into your corner.`
  };
}

function playRunes({ stake, patron, payoutMult }) {
  const roll = randInt(1, 100);
  let multiplier = 0;
  let rune = "a dark, cracked rune";

  if (roll >= 95) {
    multiplier = 4;
    rune = "a blazing rune of fortune";
  } else if (roll >= 75) {
    multiplier = 2;
    rune = "a bright, promising rune";
  } else if (roll >= 40) {
    multiplier = 1;
    rune = "a faint flicker of luck";
  }

  if (multiplier === 0) {
    return {
      type: "danger",
      delta: 0,
      text: `${patron.name} tips the rune pouch and you draw ${rune}. The omen is poor—you lose your ${stake} gold stake.`
    };
  }
  if (multiplier === 1) {
    return {
      type: "system",
      delta: stake,
      text: `You draw ${rune}. The table decides its too vague to favor anyone, and your stake is returned.`
    };
  }
  const win = Math.round(stake * multiplier * payoutMult);
  return {
    type: "good",
    delta: win,
    text: `From the pouch you pull ${rune}, and murmurs ripple around the table. You gain ${win} gold in the name of fate.`
  };
}

function playWheel({ stake, patron, payoutMult }) {
  const elements = ["Flame", "Tide", "Gale", "Stone"];
  const landed = pick(elements);
  const r = Math.random();

  let multiplier = 0;
  let flavor = "the wheel sputters out, leaving the element dim and cold";
  if (r < 0.5) {
    multiplier = 0;
  } else if (r < 0.8) {
    multiplier = 1.5;
    flavor = "a modest surge of power hums through the tavern";
  } else if (r < 0.95) {
    multiplier = 3;
    flavor = "the element flares brightly, drawing cheers from nearby tables";
  } else {
    multiplier = 5;
    flavor = "the element erupts in an imaginary blaze, and the whole tavern roars";
  }

  if (multiplier === 0) {
    return {
      type: "danger",
      delta: 0,
      text: `The Elemental Wheel settles on ${landed}; ${flavor} as your ${stake} gold is swallowed by the pot.`
    };
  }

  const win = Math.round(Math.round(stake * multiplier) * payoutMult);
  return {
    type: multiplier <= 1.5 ? "system" : "good",
    delta: win,
    text: `The Elemental Wheel clicks to a stop on ${landed}; ${flavor}. You earn ${win} gold.`
  };
}

const GAME_RUNNERS = {
  dice: playDice,
  cards: playCards,
  coin: playCoin,
  dragon: playDragon,
  runes: playRunes,
  wheel: playWheel
};

// ----------------------------------------------------------------------------
// UI ENTRYPOINT
// ----------------------------------------------------------------------------

/**
 * Main entrypoint used by Main.js.
 * @param {TavernGamesDeps} deps
 */
export function openGambleModalImpl(deps) {
  const { state, openModal, addLog, updateHUD, saveGame, closeModal, openTavernModal } = deps;
  const player = state?.player;
  if (!player) return;

  // Local UI state.
  let currentGameId = "dice";
  let currentStake = GAMES[currentGameId].baseStake;
  let currentCall = "Heads"; // coin only

  const STAKE_MIN = 5;
  const STAKE_MAX = 200;

  function cleanFooters(modalBodyEl) {
    const panel = modalBodyEl?.parentElement;
    if (!panel) return;
    panel.querySelectorAll(".tavern-footer-actions").forEach(el => el.remove());
  }

  openModal("Tavern Games", body => {
    body.innerHTML = "";
    cleanFooters(body);

    // --- Header card ------------------------------------------------------
    const headerCard = el("div", { className: "item-row" });
    const headerTop = el("div", { className: "item-row-header" });
    headerTop.appendChild(el("span", { className: "item-name", text: "The Ember Mug Tavern" }));
    headerTop.appendChild(el("span", { className: "tag", text: "Games & Wagers" }));
    headerCard.appendChild(headerTop);
    headerCard.appendChild(
      el("p", {
        className: "modal-subtitle",
        text:
          "Dice clatter, cards slap the tables, and a dozen games vie for your coin. Patrons wave you over to join."
      })
    );

    const goldLine = el("p", { className: "modal-subtitle" });
    const dbgLine = el("p", { className: "modal-subtitle" });
    headerCard.appendChild(goldLine);
    headerCard.appendChild(dbgLine);
    body.appendChild(headerCard);

    const currentGameCard = el("div", { className: "item-row" });
    const currentHeader = el("div", { className: "item-row-header" });
    const currentTitle = el("span", { className: "item-name", text: "Game Table" });
    const currentTag = el("span", { className: "tag" });
    currentHeader.appendChild(currentTitle);
    currentHeader.appendChild(currentTag);
    currentGameCard.appendChild(currentHeader);
    const currentDesc = el("p", { className: "modal-subtitle" });
    currentGameCard.appendChild(currentDesc);
    body.appendChild(currentGameCard);

    // --- Game selection card ---------------------------------------------
    const selectCard = el("div", { className: "item-row" });
    const selectHeader = el("div", { className: "item-row-header" });
    selectHeader.appendChild(el("span", { className: "item-name", text: "Choose Your Game" }));
    selectHeader.appendChild(el("span", { className: "tag", text: "Different odds, different thrills" }));
    selectCard.appendChild(selectHeader);

    const pillRow = el("div", { className: "item-actions tavern-game-row" });
    const gameButtons = {};
    Object.values(GAMES).forEach(cfg => {
      const btn = el("button", {
        className: "btn small tavern-game-pill",
        text: cfg.label,
        onClick: () => setGame(cfg.id)
      });
      gameButtons[cfg.id] = btn;
      pillRow.appendChild(btn);
    });
    selectCard.appendChild(pillRow);
    body.appendChild(selectCard);

    // --- Stake card -------------------------------------------------------
    const stakeCard = el("div", { className: "item-row" });
    const stakeHeader = el("div", { className: "item-row-header" });
    stakeHeader.appendChild(el("span", { className: "item-name", text: "Stake & Options" }));
    stakeHeader.appendChild(el("span", { className: "tag", text: "Adjust your wager" }));
    stakeCard.appendChild(stakeHeader);

    const stakeRow = el("div", { className: "item-actions" });
    const stakeLabel = el("span", { className: "modal-subtitle" });
    stakeRow.appendChild(stakeLabel);

    const btnDown = el("button", {
      className: "btn small outline",
      text: "-5g",
      onClick: () => {
        currentStake = clamp(currentStake - 5, STAKE_MIN, STAKE_MAX);
        refreshStake();
      }
    });
    const btnUp = el("button", {
      className: "btn small outline",
      text: "+5g",
      onClick: () => {
        currentStake = clamp(currentStake + 5, STAKE_MIN, STAKE_MAX);
        refreshStake();
      }
    });
    const btnMax = el("button", {
      className: "btn small outline",
      text: "M",
      attrs: { title: "Max bet" },
      onClick: () => {
        currentStake = clamp(Math.min(player.gold, STAKE_MAX), STAKE_MIN, STAKE_MAX);
        refreshStake();
      }
    });
    const callBtn = el("button", {
      className: "btn small outline",
      text: `Call: ${currentCall}`,
      onClick: () => {
        currentCall = currentCall === "Heads" ? "Tails" : "Heads";
        callBtn.textContent = `Call: ${currentCall}`;
      }
    });

    stakeRow.appendChild(btnDown);
    stakeRow.appendChild(btnUp);
    stakeRow.appendChild(btnMax);
    stakeRow.appendChild(callBtn);
    stakeCard.appendChild(stakeRow);
    stakeCard.appendChild(
      el("p", {
        className: "modal-subtitle",
        text: "Higher stakes mean bigger swings. Some games favor steady gains; others chase wild jackpots."
      })
    );
    body.appendChild(stakeCard);

    // --- Last round card --------------------------------------------------
    const resultCard = el("div", { className: "item-row" });
    const resultHeader = el("div", { className: "item-row-header" });
    resultHeader.appendChild(el("span", { className: "item-name", text: "Last Round" }));
    resultCard.appendChild(resultHeader);
    const resultText = el("p", { className: "modal-subtitle", text: "No bets placed yet." });
    resultCard.appendChild(resultText);
    body.appendChild(resultCard);

    // --- Footer actions (pinned) -----------------------------------------
    const footer = el("div", { className: "item-actions tavern-footer-actions" });
    const btnPlay = el("button", { className: "btn small", text: "Play Round" });
    const btnLeave = el("button", { className: "btn small outline", text: "Leave Table" });
    footer.appendChild(btnPlay);
    footer.appendChild(btnLeave);

    // Put footer under the modal panel so it stays at the bottom.
    const panel = body.parentElement;
    if (panel) panel.appendChild(footer);
    else body.appendChild(footer);

    // --- UI refresh helpers ----------------------------------------------
    function refreshGold() {
      goldLine.textContent = `Your gold: ${player.gold}g`;
      const dbg = ensureGamblingDebug(state);
      const mode = dbg.mode || "normal";
      const mult = dbg.payoutMultiplier || 1;
      dbgLine.textContent =
        mode !== "normal" || mult !== 1
          ? `Debug: ${mode}, payout×${mult}`
          : "";
    }

    function refreshStake() {
      currentStake = clamp(currentStake, STAKE_MIN, STAKE_MAX);
      const affordable = player.gold >= currentStake;
      stakeLabel.textContent = affordable
        ? `Stake: ${currentStake}g`
        : `Stake: ${currentStake}g (need ${currentStake - player.gold}g more)`;
      btnPlay.disabled = !affordable;
    }

    function refreshCallVisibility() {
      callBtn.style.display = currentGameId === "coin" ? "inline-flex" : "none";
    }

    function setGame(id) {
      const cfg = GAMES[id] || GAMES.dice;
      currentGameId = cfg.id;
      currentStake = cfg.baseStake;
      currentTag.textContent = `${cfg.label} · ${cfg.riskLabel}`;
      currentDesc.textContent = cfg.description;

      Object.values(gameButtons).forEach(b => b.classList.remove("selected"));
      gameButtons[cfg.id]?.classList.add("selected");

      refreshCallVisibility();
      refreshStake();
    }

    function showOutcome(text, type) {
      addLog(text, type);
      resultText.textContent = text;
    }

    function playRound() {
      if (player.gold < currentStake) {
        refreshGold();
        refreshStake();
        showOutcome("You don't have enough gold to cover that stake.", "system");
        updateHUD();
        saveGame();
        return;
      }

      const dbg = ensureGamblingDebug(state);
      const dbgMode = dbg.mode || "normal";
      const payoutMult = typeof dbg.payoutMultiplier === "number" && dbg.payoutMultiplier > 0 ? dbg.payoutMultiplier : 1;

      const cfg = GAMES[currentGameId] || GAMES.dice;
      const patron = pickPatron(state, cfg.biasKey);
      const rounds = ensureGamblingState(state).roundsWithPatron || 1;

      // Pay stake up front.
      player.gold -= currentStake;

      const runner = GAME_RUNNERS[cfg.id] || GAME_RUNNERS.dice;
      const outcome = runner({
        stake: currentStake,
        patron,
        dbgMode,
        payoutMult,
        call: currentCall
      });

      if (outcome && typeof outcome.delta === "number") {
        player.gold += outcome.delta;
      }

      const flavored = addFlavor(outcome.text, outcome.type, patron, rounds);
      showOutcome(`${flavored} You now have ${player.gold} gold.`, outcome.type);

      refreshGold();
      refreshStake();
      updateHUD();
      saveGame();
    }

    function leaveTable() {
      cleanFooters(body);
      closeModal?.();
      openTavernModal?.();
    }

    btnPlay.addEventListener("click", playRound);
    btnLeave.addEventListener("click", leaveTable);

    refreshGold();
    setGame("dice");
  });
}