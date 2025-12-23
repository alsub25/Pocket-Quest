// tavernGames.js
// All tavern gambling UI lives here. It depends on DOM + callbacks from game.js.
// This version:
//  - Adds multiple fantasy games
//  - Styles the modal like the bank
//  - Uses pill-style game buttons whose text always fits
//  - Highlights the selected game with a border; only one can be active
//  - Keeps Play Round / Leave Table pinned at the bottom of the modal
//  - Properly removes the tavern footer when leaving the games
//  - Wires game pills so you can actually switch games
//  - Adds an "M" Max Bet pill to snap stake to the highest allowed value
//  - Respects gambling debug settings: mode + payoutMultiplier

export function openGambleModalImpl({
  state,
  openModal,
  addLog,
  updateHUD,
  saveGame,
  closeModal,
  openTavernModal
}) {
  const player = state.player;
  if (!player) return;

  // --- PATRON PERSONALITIES -------------------------------------------------
  const PATRONS = [
    {
      id: "mira",
      name: "Mira the Cardsharp",
      mood: "shifty",
      favoriteGame: "cards"
    },
    {
      id: "bram",
      name: "Old Bram",
      mood: "grumpy",
      favoriteGame: "dice"
    },
    {
      id: "lysa",
      name: "Lysa One-Eye",
      mood: "cheery",
      favoriteGame: "coin"
    },
    {
      id: "tobin",
      name: "Tobin the Swift",
      mood: "cheery",
      favoriteGame: "dice"
    },
    {
      id: "gruk",
      name: "Gruk the Quiet",
      mood: "shifty",
      favoriteGame: "cards"
    }
  ];

  // --- GAME DEFINITIONS -----------------------------------------------------
  const GAME_CONFIG = {
    dice: {
      id: "dice",
      label: "Dice Duel",
      riskLabel: "Steady Odds",
      baseStake: 10,
      biasKey: "dice",
      description:
        "You and a patron each roll two dice. Higher total wins the full pot; ties push."
    },
    cards: {
      id: "cards",
      label: "High Card",
      riskLabel: "Swingy",
      baseStake: 15,
      biasKey: "cards",
      description:
        "You and a patron each draw a single card. Higher value wins; ties refund most of your stake."
    },
    coin: {
      id: "coin",
      label: "Coin Toss",
      riskLabel: "Simple 50/50",
      baseStake: 5,
      biasKey: "coin",
      description:
        "Call Heads or Tails, then flip. Simple odds, quick swings."
    },
    dragon: {
      id: "dragon",
      label: "Dragonbone Dice",
      riskLabel: "High Risk",
      baseStake: 20,
      biasKey: "dice",
      description:
        "You both throw carved dragonbone dice. Beat the patron soundly to claim a larger hoard."
    },
    runes: {
      id: "runes",
      label: "Lucky Runes",
      riskLabel: "Blessings & Omens",
      baseStake: 10,
      biasKey: "cards",
      description:
        "Draw a rune from a pouch. Great blessings, small favors, or nasty omens decide your fortune."
    },
    wheel: {
      id: "wheel",
      label: "Elemental Wheel",
      riskLabel: "Very Swingy",
      baseStake: 15,
      biasKey: "coin",
      description:
        "A painted wheel of elements spins. Where it stops can mean a small flicker of profit or a blazing jackpot."
    }
  };

  // --- STATE HELPERS --------------------------------------------------------

  function ensureGamblingState() {
    if (!state.gambling) {
      state.gambling = {
        lastPatronId: null,
        roundsWithPatron: 0
      };
    } else {
      if (typeof state.gambling.lastPatronId === "undefined") {
        state.gambling.lastPatronId = null;
      }
      if (typeof state.gambling.roundsWithPatron === "undefined") {
        state.gambling.roundsWithPatron = 0;
      }
    }
  }

  function getGamblingDebug() {
    if (!state.gamblingDebug) {
      state.gamblingDebug = {
        mode: "normal",
        payoutMultiplier: 1
      };
    } else {
      if (!state.gamblingDebug.mode) {
        state.gamblingDebug.mode = "normal";
      }
      if (
        typeof state.gamblingDebug.payoutMultiplier !== "number" ||
        state.gamblingDebug.payoutMultiplier <= 0
      ) {
        state.gamblingDebug.payoutMultiplier = 1;
      }
    }
    return state.gamblingDebug;
  }

  function findPatronById(id) {
    return PATRONS.find(p => p.id === id) || null;
  }

  // Slightly favors:
  // - keeping the same patron if you're playing a game they like
  // - patrons whose favoriteGame matches biasKey
  function pickPatron(biasKey) {
    ensureGamblingState();
    const g = state.gambling;

    // 1) Try to keep the same patron around
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

    // 2) Otherwise, bias to patrons who love this game "type"
    const favored = PATRONS.filter(p => p.favoriteGame === biasKey);
    let pool = PATRONS;
    if (favored.length && Math.random() < 0.6) {
      pool = favored;
    }

    const patron = pool[Math.floor(Math.random() * pool.length)];
    g.lastPatronId = patron.id;
    g.roundsWithPatron = 1;
    return patron;
  }

  function addPersonalityFlavor(baseText, outcomeType, patron, roundsWithPatron) {
    if (!patron) return baseText;

    const shortName = patron.name.split(" ")[0];
    let extra = "";

    if (roundsWithPatron >= 3) {
      if (outcomeType === "good") {
        if (patron.mood === "grumpy") {
          extra =
            " " +
            shortName +
            " grumbles that you must be cheating, but keeps playing.";
        } else if (patron.mood === "cheery") {
          extra =
            " " +
            shortName +
            " laughs and insists the next round's drinks are on them.";
        } else if (patron.mood === "shifty") {
          extra =
            " " +
            shortName +
            "'s eyes narrow, clearly trying to learn your tricks.";
        }
      } else if (outcomeType === "danger") {
        if (patron.mood === "grumpy") {
          extra =
            " " +
            shortName +
            " snorts, clearly satisfied to have your coin.";
        } else if (patron.mood === "cheery") {
          extra =
            " " +
            shortName +
            " claps you on the shoulder and tells you not to lose heart.";
        } else if (patron.mood === "shifty") {
          extra =
            " " +
            shortName +
            " sweeps the coins away with a practiced hand.";
        }
      } else if (outcomeType === "system") {
        if (patron.mood === "cheery") {
          extra =
            " " +
            shortName +
            " just grins, happy to keep the game going.";
        } else if (patron.mood === "grumpy") {
          extra =
            " " +
            shortName +
            " mutters that the odds will turn soon enough.";
        }
      }
    }

    return baseText + extra;
  }

  // ---- LOCAL UI STATE ------------------------------------------------------
  let currentGameId = "dice";
  let currentConfig = GAME_CONFIG.dice;
  let currentStake = currentConfig.baseStake;
  let currentCall = "Heads"; // for coin toss only

  // --- OPEN MODAL -----------------------------------------------------------

  openModal("Tavern Games", body => {
    // Defensive: remove any leftover tavern footer from a prior session
    const outerPanel = body.parentElement; // #modalPanel
    if (outerPanel) {
      outerPanel.querySelectorAll(".tavern-footer-actions").forEach(el => el.remove());
    }

    // ========== CARD 1: TAVERN HEADER / GOLD ===============================
    const headerCard = document.createElement("div");
    headerCard.className = "item-row";

    const headerTop = document.createElement("div");
    headerTop.className = "item-row-header";

    const headerTitle = document.createElement("span");
    headerTitle.className = "item-name";
    headerTitle.textContent = "The Ember Mug Tavern";
    headerTop.appendChild(headerTitle);

    const headerTag = document.createElement("span");
    headerTag.className = "tag";
    headerTag.textContent = "Games & Wagers";
    headerTop.appendChild(headerTag);

    headerCard.appendChild(headerTop);

    const intro = document.createElement("p");
    intro.className = "modal-subtitle";
    intro.textContent =
      "Dice clatter, cards slap the tables, and a dozen games vie for your coin. Patrons wave you over to join.";
    headerCard.appendChild(intro);

    const goldLine = document.createElement("p");
    goldLine.className = "modal-subtitle";
    goldLine.textContent = "Your gold: " + player.gold + "g";
    headerCard.appendChild(goldLine);

    body.appendChild(headerCard);

    function updateGoldText() {
      goldLine.textContent = "Your gold: " + player.gold + "g";
    }

    // ========== CARD 2: CURRENT GAME SUMMARY ===============================
    const currentGameCard = document.createElement("div");
    currentGameCard.className = "item-row";

    const currentHeader = document.createElement("div");
    currentHeader.className = "item-row-header";

    const currentTitle = document.createElement("span");
    currentTitle.className = "item-name";
    currentTitle.textContent = "Game Table";
    currentHeader.appendChild(currentTitle);

    const currentTag = document.createElement("span");
    currentTag.className = "tag";
    currentHeader.appendChild(currentTag);

    currentGameCard.appendChild(currentHeader);

    const currentDesc = document.createElement("p");
    currentDesc.className = "modal-subtitle";
    currentGameCard.appendChild(currentDesc);

    body.appendChild(currentGameCard);

    // ========== CARD 3: GAME SELECTION =====================================
    const gameSelectCard = document.createElement("div");
    gameSelectCard.className = "item-row";

    const gameHeader = document.createElement("div");
    gameHeader.className = "item-row-header";
    const gameTitle = document.createElement("span");
    gameTitle.className = "item-name";
    gameTitle.textContent = "Choose Your Game";
    gameHeader.appendChild(gameTitle);

    const gameHint = document.createElement("span");
    gameHint.className = "tag";
    gameHint.textContent = "Different odds, different thrills";
    gameHeader.appendChild(gameHint);

    gameSelectCard.appendChild(gameHeader);

    const gameButtonsRow = document.createElement("div");
    gameButtonsRow.className = "item-actions tavern-game-row";

    const btnDice = document.createElement("button");
    btnDice.className = "btn small tavern-game-pill";
    btnDice.textContent = "Dice Duel";

    const btnCards = document.createElement("button");
    btnCards.className = "btn small tavern-game-pill";
    btnCards.textContent = "High Card";

    const btnCoin = document.createElement("button");
    btnCoin.className = "btn small tavern-game-pill";
    btnCoin.textContent = "Coin Toss";

    const btnDragon = document.createElement("button");
    btnDragon.className = "btn small tavern-game-pill";
    btnDragon.textContent = "Dragonbone Dice";

    const btnRunes = document.createElement("button");
    btnRunes.className = "btn small tavern-game-pill";
    btnRunes.textContent = "Lucky Runes";

    const btnWheel = document.createElement("button");
    btnWheel.className = "btn small tavern-game-pill";
    btnWheel.textContent = "Elemental Wheel";

    gameButtonsRow.appendChild(btnDice);
    gameButtonsRow.appendChild(btnCards);
    gameButtonsRow.appendChild(btnCoin);
    gameButtonsRow.appendChild(btnDragon);
    gameButtonsRow.appendChild(btnRunes);
    gameButtonsRow.appendChild(btnWheel);

    gameSelectCard.appendChild(gameButtonsRow);
    body.appendChild(gameSelectCard);

    // Map game IDs → buttons so we can toggle a single "selected" class
    const gameButtons = {
      dice: btnDice,
      cards: btnCards,
      coin: btnCoin,
      dragon: btnDragon,
      runes: btnRunes,
      wheel: btnWheel
    };

    // ========== CARD 4: STAKE & OPTIONS ====================================
    const stakeCard = document.createElement("div");
    stakeCard.className = "item-row";

    const stakeHeader = document.createElement("div");
    stakeHeader.className = "item-row-header";
    const stakeTitle = document.createElement("span");
    stakeTitle.className = "item-name";
    stakeTitle.textContent = "Stake & Options";
    stakeHeader.appendChild(stakeTitle);

    const stakeTag = document.createElement("span");
    stakeTag.className = "tag";
    stakeTag.textContent = "Adjust your wager";
    stakeHeader.appendChild(stakeTag);

    stakeCard.appendChild(stakeHeader);

    const stakeControlsRow = document.createElement("div");
    stakeControlsRow.className = "item-actions";

    const stakeLabel = document.createElement("span");
    stakeLabel.className = "modal-subtitle";

    function clampStake() {
      if (currentStake < 5) currentStake = 5;
      if (currentStake > 200) currentStake = 200;
    }

    function updateStakeLabel() {
      stakeLabel.textContent = "Stake: " + currentStake + "g";
    }

    const btnStakeDown = document.createElement("button");
    btnStakeDown.className = "btn small outline";
    btnStakeDown.textContent = "-5g";
    btnStakeDown.addEventListener("click", () => {
      currentStake -= 5;
      clampStake();
      updateStakeLabel();
    });

    const btnStakeUp = document.createElement("button");
    btnStakeUp.className = "btn small outline";
    btnStakeUp.textContent = "+5g";
    btnStakeUp.addEventListener("click", () => {
      currentStake += 5;
      clampStake();
      updateStakeLabel();
    });

    // NEW: Max bet pill ("M")
    const btnStakeMax = document.createElement("button");
    btnStakeMax.className = "btn small outline";
    btnStakeMax.textContent = "M";
    btnStakeMax.title = "Max bet";
    btnStakeMax.addEventListener("click", () => {
      // Max stake is capped both by player gold and the global 200g ceiling.
      if (player.gold >= 5) {
        currentStake = Math.min(player.gold, 200);
      } else {
        currentStake = 5;
      }
      clampStake();
      updateStakeLabel();
    });

    const callBtn = document.createElement("button");
    callBtn.className = "btn small outline";
    callBtn.textContent = "Call: " + currentCall;
    callBtn.addEventListener("click", () => {
      currentCall = currentCall === "Heads" ? "Tails" : "Heads";
      callBtn.textContent = "Call: " + currentCall;
    });

    stakeControlsRow.appendChild(stakeLabel);
    stakeControlsRow.appendChild(btnStakeDown);
    stakeControlsRow.appendChild(btnStakeUp);
    stakeControlsRow.appendChild(btnStakeMax);
    stakeControlsRow.appendChild(callBtn);

    stakeCard.appendChild(stakeControlsRow);

    const stakeHint = document.createElement("p");
    stakeHint.className = "modal-subtitle";
    stakeHint.textContent =
      "Higher stakes mean bigger swings. Some games favor steady gains, others chase wild jackpots.";
    stakeCard.appendChild(stakeHint);

    body.appendChild(stakeCard);

    function updateCallVisibility() {
      callBtn.style.display = currentGameId === "coin" ? "inline-flex" : "none";
    }

    // ========== CARD 5: LAST ROUND SUMMARY =================================
    const resultCard = document.createElement("div");
    resultCard.className = "item-row";

    const resultHeader = document.createElement("div");
    resultHeader.className = "item-row-header";
    const resultTitle = document.createElement("span");
    resultTitle.className = "item-name";
    resultTitle.textContent = "Last Round";
    resultHeader.appendChild(resultTitle);
    resultCard.appendChild(resultHeader);

    const resultText = document.createElement("p");
    resultText.className = "modal-subtitle";
    resultText.textContent = "No bets placed yet.";
    resultCard.appendChild(resultText);

    body.appendChild(resultCard);

    // ---- PLAY / LEAVE BUTTONS ----------------------------------------------
    const footerRow = document.createElement("div");
    footerRow.className = "item-actions tavern-footer-actions";

    // If we somehow reopen the tavern modal twice, clean up any previous footer
    body.querySelectorAll(".tavern-footer-actions").forEach(el => el.remove());

    const btnPlay = document.createElement("button");
    btnPlay.className = "btn small";
    btnPlay.textContent = "Play Round";
    btnPlay.addEventListener("click", playRound);
    footerRow.appendChild(btnPlay);

    const btnLeave = document.createElement("button");
    btnLeave.className = "btn small outline";
    btnLeave.textContent = "Leave Table";
    btnLeave.addEventListener("click", () => {
      if (typeof closeModal === "function") {
        closeModal();
      }
      if (typeof openTavernModal === "function") {
        openTavernModal();
      }
    });
    footerRow.appendChild(btnLeave);

    // Keep the footer inside modal body, then move it under #modalPanel so it can sit at the bottom.
    body.appendChild(footerRow);

    const modalPanel = body.parentElement; // should be #modalPanel
    if (modalPanel) {
      modalPanel.appendChild(footerRow);
    } else {
      body.appendChild(footerRow);
    }

    // --- SHARED HELPERS -----------------------------------------------------

    function showOutcome(baseText, type, includeGold = true) {
      const fullText = includeGold
        ? baseText + " You now have " + player.gold + " gold."
        : baseText;
      addLog(fullText, type);
      resultText.textContent = fullText;
    }

    function ensureStake(cost) {
      if (player.gold < cost) {
        const base = "You don't have enough gold to cover that stake.";
        showOutcome(base + " (Gold: " + player.gold + "g)", "system", false);
        updateGoldText();
        updateHUD();
        saveGame();
        return false;
      }
      player.gold -= cost;
      return true;
    }

    function setGame(id) {
      const cfg = GAME_CONFIG[id] || GAME_CONFIG.dice;
      currentGameId = cfg.id;
      currentConfig = cfg;
      currentStake = cfg.baseStake;
      clampStake();
      updateStakeLabel();
      updateCallVisibility();

      currentTag.textContent = cfg.label + " · " + cfg.riskLabel;
      currentDesc.textContent = cfg.description;

      Object.values(gameButtons).forEach(btn =>
        btn.classList.remove("selected")
      );

      const activeBtn = gameButtons[id];
      if (activeBtn) {
        activeBtn.classList.add("selected");
      }
    }

    // --- WIRE GAME PILL CLICKS ---------------------------------------------
    btnDice.addEventListener("click", () => setGame("dice"));
    btnCards.addEventListener("click", () => setGame("cards"));
    btnCoin.addEventListener("click", () => setGame("coin"));
    btnDragon.addEventListener("click", () => setGame("dragon"));
    btnRunes.addEventListener("click", () => setGame("runes"));
    btnWheel.addEventListener("click", () => setGame("wheel"));

    // --- GAME LOGIC IMPLEMENTATIONS (DEBUG-AWARE) ---------------------------

    function playRound() {
      ensureGamblingState();
      const cfg = currentConfig;
      const stake = currentStake;
      const patron = pickPatron(cfg.biasKey);
      const roundsWithPatron = state.gambling.roundsWithPatron || 1;
      const dbg = getGamblingDebug();
      const mode = dbg.mode || "normal";
      const payoutMult =
        typeof dbg.payoutMultiplier === "number" && dbg.payoutMultiplier > 0
          ? dbg.payoutMultiplier
          : 1;

      let msg = "";

      if (!ensureStake(stake)) return;

      if (cfg.id === "dice") {
        let yourRoll =
          1 + Math.floor(Math.random() * 6) +
          1 + Math.floor(Math.random() * 6);
        let theirRoll =
          1 + Math.floor(Math.random() * 6) +
          1 + Math.floor(Math.random() * 6);

        // Debug bias for dice
        if (mode === "playerFavored" && yourRoll <= theirRoll) {
          yourRoll = theirRoll + 1;
        } else if (mode === "houseFavored" && yourRoll >= theirRoll) {
          theirRoll = yourRoll + 1;
        }

        if (yourRoll > theirRoll) {
          const baseWin = stake * 2;
          const win = Math.round(baseWin * payoutMult);
          player.gold += win;
          msg =
            "You roll " +
            yourRoll +
            " against " +
            patron.name +
            "'s " +
            theirRoll +
            ". You win " +
            win +
            " gold from the table.";
          msg = addPersonalityFlavor(msg, "good", patron, roundsWithPatron);
          showOutcome(msg, "good");
        } else if (yourRoll < theirRoll) {
          msg =
            patron.name +
            " rolls " +
            theirRoll +
            " to your " +
            yourRoll +
            ". Laughter rises as you lose your " +
            stake +
            " gold stake.";
          msg = addPersonalityFlavor(msg, "danger", patron, roundsWithPatron);
          showOutcome(msg, "danger");
        } else {
          player.gold += stake;
          msg =
            "Both you and " +
            patron.name +
            " roll " +
            yourRoll +
            ". The pot is pushed and your stake is returned.";
          msg = addPersonalityFlavor(msg, "system", patron, roundsWithPatron);
          showOutcome(msg, "system");
        }
      } else if (cfg.id === "cards") {
        const suits = ["♠", "♥", "♦", "♣"];
        let yourValue = 1 + Math.floor(Math.random() * 13);
        let theirValue = 1 + Math.floor(Math.random() * 13);
        const yourSuit = suits[Math.floor(Math.random() * suits.length)];
        const theirSuit = suits[Math.floor(Math.random() * suits.length)];

        const names = { 1: "Ace", 11: "Jack", 12: "Queen", 13: "King" };
        const nameOf = v => names[v] || v.toString();

        // Debug bias for cards
        if (mode === "playerFavored" && yourValue <= theirValue) {
          yourValue = Math.min(13, theirValue + 1);
        } else if (mode === "houseFavored" && yourValue >= theirValue) {
          theirValue = Math.min(13, yourValue + 1);
        }

        if (yourValue > theirValue) {
          const baseWin = Math.round(stake * 2.5);
          const win = Math.round(baseWin * payoutMult);
          player.gold += win;
          msg =
            "You reveal " +
            nameOf(yourValue) +
            yourSuit +
            " against " +
            patron.name +
            "'s " +
            nameOf(theirValue) +
            theirSuit +
            ". The crowd groans as you rake in " +
            win +
            " gold.";
          msg = addPersonalityFlavor(msg, "good", patron, roundsWithPatron);
          showOutcome(msg, "good");
        } else if (yourValue < theirValue) {
          msg =
            patron.name +
            " shows " +
            nameOf(theirValue) +
            theirSuit +
            " to your " +
            nameOf(yourValue) +
            yourSuit +
            ". The table cheers as you lose your " +
            stake +
            " gold.";
          msg = addPersonalityFlavor(msg, "danger", patron, roundsWithPatron);
          showOutcome(msg, "danger");
        } else {
          const refund = Math.round(stake * 0.75);
          player.gold += refund;
          msg =
            "Both cards are " +
            nameOf(yourValue) +
            ". The table laughs and some coins slide back your way (" +
            refund +
            " gold).";
          msg = addPersonalityFlavor(msg, "system", patron, roundsWithPatron);
          showOutcome(msg, "system");
        }
      } else if (cfg.id === "coin") {
        let toss = Math.random() < 0.5 ? "Heads" : "Tails";

        // Debug bias for coin
        if (mode === "playerFavored") {
          toss = currentCall;
        } else if (mode === "houseFavored") {
          toss = currentCall === "Heads" ? "Tails" : "Heads";
        }

        if (toss === currentCall) {
          const baseWin = stake * 2;
          const win = Math.round(baseWin * payoutMult);
          player.gold += win;
          msg =
            "The coin spins, lands " +
            toss +
            ". You called it right against " +
            patron.name +
            " and scoop up " +
            win +
            " gold.";
          msg = addPersonalityFlavor(msg, "good", patron, roundsWithPatron);
          showOutcome(msg, "good");
        } else {
          msg =
            "The coin lands " +
            toss +
            ". " +
            patron.name +
            " grins as your " +
            stake +
            " gold vanishes into the pot.";
          msg = addPersonalityFlavor(msg, "danger", patron, roundsWithPatron);
          showOutcome(msg, "danger");
        }
      } else if (cfg.id === "dragon") {
        const roll3d6 = () =>
          1 + Math.floor(Math.random() * 6) +
          1 + Math.floor(Math.random() * 6) +
          1 + Math.floor(Math.random() * 6);

        const yourRoll = roll3d6();
        const theirRoll = roll3d6();

        let multiplier = 0;

        if (yourRoll >= theirRoll + 4) {
          multiplier = 3;
        } else if (yourRoll > theirRoll) {
          multiplier = 2;
        } else if (yourRoll === theirRoll) {
          multiplier = 1;
        } else {
          multiplier = 0;
        }

        if (multiplier === 0) {
          msg =
            "Dragonbone dice tumble across the felt. You roll " +
            yourRoll +
            " to " +
            patron.name +
            "'s " +
            theirRoll +
            ", and the hoard slips away with your " +
            stake +
            " gold stake.";
          msg = addPersonalityFlavor(msg, "danger", patron, roundsWithPatron);
          showOutcome(msg, "danger");
        } else if (multiplier === 1) {
          player.gold += stake;
          msg =
            "The dragonbone dice show matching fortunes: both totals " +
            yourRoll +
            ". The table agrees to push the pot, returning your stake.";
          msg = addPersonalityFlavor(msg, "system", patron, roundsWithPatron);
          showOutcome(msg, "system");
        } else {
          const baseWin = stake * multiplier;
          const win = Math.round(baseWin * payoutMult);
          player.gold += win;
          msg =
            "The dragonbone dice flash your way: " +
            yourRoll +
            " against " +
            patron.name +
            "'s " +
            theirRoll +
            ". You drag " +
            win +
            " gold into your corner of the table.";
          msg = addPersonalityFlavor(msg, "good", patron, roundsWithPatron);
          showOutcome(msg, "good");
        }
      } else if (cfg.id === "runes") {
        const roll = 1 + Math.floor(Math.random() * 100);
        let multiplier = 0;
        let tierText = "";

        if (roll >= 95) {
          multiplier = 4;
          tierText = "a blazing rune of fortune";
        } else if (roll >= 75) {
          multiplier = 2;
          tierText = "a bright, promising rune";
        } else if (roll >= 40) {
          multiplier = 1;
          tierText = "a faint flicker of luck";
        } else {
          multiplier = 0;
          tierText = "a dark, cracked rune";
        }

        if (multiplier === 0) {
          msg =
            patron.name +
            " tips the rune pouch and you draw " +
            tierText +
            ". The omen is poor—you lose your " +
            stake +
            " gold stake.";
          msg = addPersonalityFlavor(msg, "danger", patron, roundsWithPatron);
          showOutcome(msg, "danger");
        } else if (multiplier === 1) {
          player.gold += stake;
          msg =
            "You draw " +
            tierText +
            ". The table decides it's too vague to favor anyone, and your stake is quietly returned.";
          msg = addPersonalityFlavor(msg, "system", patron, roundsWithPatron);
          showOutcome(msg, "system");
        } else {
          const baseWin = stake * multiplier;
          const win = Math.round(baseWin * payoutMult);
          player.gold += win;
          msg =
            "From the pouch you pull " +
            tierText +
            ", and murmurs ripple around the table. You gain " +
            win +
            " gold in the name of fate.";
          msg = addPersonalityFlavor(msg, "good", patron, roundsWithPatron);
          showOutcome(msg, "good");
        }
      } else if (cfg.id === "wheel") {
        const elements = ["Flame", "Tide", "Gale", "Stone"];
        const landed = elements[Math.floor(Math.random() * elements.length)];
        const r = Math.random();
        let multiplier = 0;
        let tierText = "";

        if (r < 0.5) {
          multiplier = 0;
          tierText = "the wheel sputters out, leaving the element dim and cold";
        } else if (r < 0.8) {
          multiplier = 1.5;
          tierText = "a modest surge of power hums through the tavern";
        } else if (r < 0.95) {
          multiplier = 3;
          tierText =
            "the element flares brightly, drawing cheers from nearby tables";
        } else {
          multiplier = 5;
          tierText =
            "the element erupts in an imaginary blaze, and the whole tavern roars";
        }

        if (multiplier === 0) {
          msg =
            "The Elemental Wheel spins and settles on " +
            landed +
            "; " +
            tierText +
            " as your " +
            stake +
            " gold is swallowed by the pot.";
          msg = addPersonalityFlavor(msg, "danger", patron, roundsWithPatron);
          showOutcome(msg, "danger");
        } else if (multiplier === 1.5) {
          const baseWin = Math.round(stake * multiplier);
          const win = Math.round(baseWin * payoutMult);
          player.gold += win;
          msg =
            "The Elemental Wheel clicks to a stop on " +
            landed +
            "; " +
            tierText +
            ". You earn " +
            win +
            " gold for your trouble.";
          msg = addPersonalityFlavor(msg, "system", patron, roundsWithPatron);
          showOutcome(msg, "system");
        } else {
          const baseWin = Math.round(stake * multiplier);
          const win = Math.round(baseWin * payoutMult);
          player.gold += win;
          msg =
            "The Elemental Wheel blurs and lands on " +
            landed +
            "; " +
            tierText +
            ". You seize " +
            win +
            " gold from the swirling bets.";
          msg = addPersonalityFlavor(msg, "good", patron, roundsWithPatron);
          showOutcome(msg, "good");
        }
      }

      updateGoldText();
      updateHUD();
      saveGame();
    }

    btnPlay.addEventListener("click", playRound);

    // Initialize default game (also sets initial pill highlight)
    setGame("dice");
  });
}