/* =============================================================================
 * Passive Skill Definitions (passiveSkills.js)
 * Patch: 1.2.82 — The Blackbark Oath
 *
 * Passive skills provide always-active bonuses to enhance class identity.
 * Unlike talents (which are selected), passives are automatically unlocked
 * at specific levels and provide thematic benefits.
 * ============================================================================= */

export const PASSIVE_SKILLS = {
    // MAGE PASSIVES
    mage: [
        {
            id: 'arcane_intellect',
            name: 'Arcane Intellect',
            levelReq: 1,
            desc: 'Your deep understanding of magic grants +5% spell damage and +10 max Mana.',
            effects: { spellDamage: 0.05, maxMana: 10 }
        },
        {
            id: 'spell_weaving',
            name: 'Spell Weaving',
            levelReq: 5,
            desc: 'Casting spells has a 10% chance to refund half the mana cost.',
            effects: { manaRefundChance: 0.10, manaRefundAmount: 0.5 }
        },
        {
            id: 'arcane_barrier',
            name: 'Arcane Barrier',
            levelReq: 10,
            desc: 'When you take damage, gain a shield equal to 8% of your max Mana (30s cooldown).',
            effects: { autoShieldPercent: 0.08, autoShieldCooldown: 30 }
        },
        {
            id: 'elemental_mastery',
            name: 'Elemental Mastery',
            levelReq: 14,
            desc: 'All elemental damage increased by 8%, elemental resistances increased by 5%.',
            effects: { elementalDamage: 0.08, elementalResist: 0.05 }
        },
        {
            id: 'mana_surge',
            name: 'Mana Surge',
            levelReq: 17,
            desc: 'Mana regeneration increased by 25%, maximum Mana increased by 20.',
            effects: { manaRegen: 0.25, maxMana: 20 }
        }
    ],

    // WARRIOR PASSIVES
    warrior: [
        {
            id: 'warrior_resolve',
            name: 'Warrior Resolve',
            levelReq: 1,
            desc: 'Your battle-hardened nature grants +10 max HP and +2 Armor.',
            effects: { maxHp: 10, armor: 2 }
        },
        {
            id: 'combat_reflexes',
            name: 'Combat Reflexes',
            levelReq: 5,
            desc: 'Gain 5% chance to dodge attacks and 3% increased movement speed.',
            effects: { dodgeChance: 0.05, haste: 0.03 }
        },
        {
            id: 'battle_hardened',
            name: 'Battle Hardened',
            levelReq: 10,
            desc: 'Reduce all damage taken by 5%, gain +5 Armor.',
            effects: { damageReduction: 0.05, armor: 5 }
        },
        {
            id: 'fury_generation',
            name: 'Fury Generation',
            levelReq: 14,
            desc: 'Generate 2 extra Fury when hitting or being hit.',
            effects: { furyOnHit: 2, furyOnHitTaken: 2 }
        },
        {
            id: 'unbreakable',
            name: 'Unbreakable',
            levelReq: 17,
            desc: 'Maximum HP increased by 15%, regenerate 2% max HP per turn.',
            effects: { maxHpPercent: 0.15, hpRegenPercent: 0.02 }
        }
    ],

    // BLOOD KNIGHT PASSIVES
    blood: [
        {
            id: 'blood_pact',
            name: 'Blood Pact',
            levelReq: 1,
            desc: 'Your connection to blood magic grants +8 max HP and 3% lifesteal.',
            effects: { maxHp: 8, lifesteal: 0.03 }
        },
        {
            id: 'sanguine_flow',
            name: 'Sanguine Flow',
            levelReq: 5,
            desc: 'Generate 1 Blood resource when taking damage.',
            effects: { bloodOnDamageTaken: 1 }
        },
        {
            id: 'crimson_vitality',
            name: 'Crimson Vitality',
            levelReq: 10,
            desc: 'Lifesteal increased by 5%, healing from all sources increased by 10%.',
            effects: { lifesteal: 0.05, healingReceived: 0.10 }
        },
        {
            id: 'blood_shield',
            name: 'Blood Shield',
            levelReq: 14,
            desc: 'When below 40% HP, gain a shield equal to 15% of missing HP (1 minute cooldown).',
            effects: { bloodShieldThreshold: 0.40, bloodShieldPercent: 0.15, bloodShieldCooldown: 60 }
        },
        {
            id: 'hemomancers_mastery',
            name: "Hemomancer's Mastery",
            levelReq: 17,
            desc: 'All blood abilities cost 10% less HP, shadow damage increased by 8%.',
            effects: { bloodCostReduction: 0.10, shadowDamage: 0.08 }
        }
    ],

    // RANGER PASSIVES
    ranger: [
        {
            id: 'hunters_mark',
            name: "Hunter's Mark",
            levelReq: 1,
            desc: 'Your keen eye grants +3% critical strike chance and +5% critical damage.',
            effects: { critChance: 0.03, critDamage: 0.05 }
        },
        {
            id: 'swift_footed',
            name: 'Swift Footed',
            levelReq: 5,
            desc: 'Gain +5% dodge chance and +8% movement speed.',
            effects: { dodgeChance: 0.05, haste: 0.08 }
        },
        {
            id: 'trackers_insight',
            name: "Tracker's Insight",
            levelReq: 10,
            desc: 'Marked enemies take 5% more damage from all sources.',
            effects: { markedDamageBonus: 0.05 }
        },
        {
            id: 'natural_camouflage',
            name: 'Natural Camouflage',
            levelReq: 14,
            desc: 'First attack each combat deals 15% more damage and has +10% crit chance.',
            effects: { firstStrikeDamage: 0.15, firstStrikeCrit: 0.10 }
        },
        {
            id: 'apex_hunter',
            name: 'Apex Hunter',
            levelReq: 17,
            desc: 'Critical strikes reduce cooldowns by 1 turn and restore 5 Fury.',
            effects: { critCooldownReduction: 1, critFuryRestore: 5 }
        }
    ],

    // PALADIN PASSIVES
    paladin: [
        {
            id: 'holy_blessing',
            name: 'Holy Blessing',
            levelReq: 1,
            desc: 'Your divine protection grants +3 Armor and +5% holy resistance.',
            effects: { armor: 3, holyResist: 0.05 }
        },
        {
            id: 'healing_aura',
            name: 'Healing Aura',
            levelReq: 5,
            desc: 'Heal 1% of max HP at the start of each turn.',
            effects: { hpRegenPercent: 0.01 }
        },
        {
            id: 'divine_shield',
            name: 'Divine Shield',
            levelReq: 10,
            desc: 'When reduced below 25% HP, gain a shield equal to 20% max HP (once per battle).',
            effects: { emergencyShieldThreshold: 0.25, emergencyShieldPercent: 0.20 }
        },
        {
            id: 'righteous_power',
            name: 'Righteous Power',
            levelReq: 14,
            desc: 'Holy abilities deal 10% more damage and heal for 8% of damage dealt.',
            effects: { holyDamage: 0.10, holyLifesteal: 0.08 }
        },
        {
            id: 'divine_purpose',
            name: 'Divine Purpose',
            levelReq: 17,
            desc: 'All healing increased by 15%, shields last 1 turn longer.',
            effects: { healingPower: 0.15, shieldDuration: 1 }
        }
    ],

    // ROGUE PASSIVES
    rogue: [
        {
            id: 'assassins_precision',
            name: "Assassin's Precision",
            levelReq: 1,
            desc: 'Your deadly strikes grant +5% critical strike chance.',
            effects: { critChance: 0.05 }
        },
        {
            id: 'shadow_step',
            name: 'Shadow Step',
            levelReq: 5,
            desc: 'Gain +8% dodge chance and 5% increased attack speed.',
            effects: { dodgeChance: 0.08, haste: 0.05 }
        },
        {
            id: 'deadly_poison',
            name: 'Deadly Poison',
            levelReq: 10,
            desc: 'All attacks have a 15% chance to apply poison, dealing damage over 3 turns.',
            effects: { poisonChance: 0.15, poisonDuration: 3 }
        },
        {
            id: 'evasion_mastery',
            name: 'Evasion Mastery',
            levelReq: 14,
            desc: 'Dodging an attack grants 10 Fury and increases next attack damage by 20%.',
            effects: { dodgeFuryGain: 10, dodgeDamageBonus: 0.20 }
        },
        {
            id: 'lethal_strikes',
            name: 'Lethal Strikes',
            levelReq: 17,
            desc: 'Critical strikes deal 40% more damage and have 20% chance to reset cooldowns.',
            effects: { critDamage: 0.40, critCooldownResetChance: 0.20 }
        }
    ],

    // CLERIC PASSIVES
    cleric: [
        {
            id: 'divine_protection',
            name: 'Divine Protection',
            levelReq: 1,
            desc: 'Your holy prayers grant +5% to all resistances.',
            effects: { resistAll: 0.05 }
        },
        {
            id: 'blessed_recovery',
            name: 'Blessed Recovery',
            levelReq: 5,
            desc: 'All healing you receive is increased by 10%.',
            effects: { healingReceived: 0.10 }
        },
        {
            id: 'holy_light',
            name: 'Holy Light',
            levelReq: 10,
            desc: 'Healing spells have a 20% chance to also damage the nearest enemy for 50% of healing.',
            effects: { healToDamageChance: 0.20, healToDamagePercent: 0.50 }
        },
        {
            id: 'sanctified_ground',
            name: 'Sanctified Ground',
            levelReq: 14,
            desc: 'Start each combat with a 30-point shield and 3% increased healing power.',
            effects: { startingShield: 30, healingPower: 0.03 }
        },
        {
            id: 'divine_intervention',
            name: 'Divine Intervention',
            levelReq: 17,
            desc: 'When an ally would die, they are instead healed for 25% max HP (once per battle).',
            effects: { revivePercent: 0.25, reviveCount: 1 }
        }
    ],

    // NECROMANCER PASSIVES
    necromancer: [
        {
            id: 'dark_communion',
            name: 'Dark Communion',
            levelReq: 1,
            desc: 'Your mastery of death grants +5% shadow damage and +10 max Mana.',
            effects: { shadowDamage: 0.05, maxMana: 10 }
        },
        {
            id: 'soul_siphon',
            name: 'Soul Siphon',
            levelReq: 5,
            desc: 'Killing enemies restores 5% of your max HP and 5 Mana.',
            effects: { killHealPercent: 0.05, killManaRestore: 5 }
        },
        {
            id: 'undead_resilience',
            name: 'Undead Resilience',
            levelReq: 10,
            desc: 'Summoned minions have 30% more HP and deal 15% more damage.',
            effects: { minionHpBonus: 0.30, minionDamageBonus: 0.15 }
        },
        {
            id: 'plague_bearer',
            name: 'Plague Bearer',
            levelReq: 14,
            desc: 'All DoT effects you apply deal 20% more damage and last 1 turn longer.',
            effects: { dotDamage: 0.20, dotDuration: 1 }
        },
        {
            id: 'lich_form',
            name: 'Lich Form',
            levelReq: 17,
            desc: 'Shadow damage increased by 15%, heal for 10% of shadow damage dealt.',
            effects: { shadowDamage: 0.15, shadowLifesteal: 0.10 }
        }
    ],

    // SHAMAN PASSIVES
    shaman: [
        {
            id: 'elemental_bond',
            name: 'Elemental Bond',
            levelReq: 1,
            desc: 'Your connection to nature grants +5% elemental damage and +5 max Mana.',
            effects: { elementalDamage: 0.05, maxMana: 5 }
        },
        {
            id: 'spirit_walker',
            name: 'Spirit Walker',
            levelReq: 5,
            desc: 'Gain +3 Armor and +5% to all elemental resistances.',
            effects: { armor: 3, elementalResist: 0.05 }
        },
        {
            id: 'totemic_power',
            name: 'Totemic Power',
            levelReq: 10,
            desc: 'Totems last 2 turns longer and grant +8% damage while active.',
            effects: { totemDuration: 2, totemDamageBonus: 0.08 }
        },
        {
            id: 'natures_wrath',
            name: "Nature's Wrath",
            levelReq: 14,
            desc: 'Lightning and nature spells have a 15% chance to chain to another enemy for 50% damage.',
            effects: { chainChance: 0.15, chainDamagePercent: 0.50 }
        },
        {
            id: 'ancestral_blessing',
            name: 'Ancestral Blessing',
            levelReq: 17,
            desc: 'All healing increased by 20%, elemental damage increased by 10%.',
            effects: { healingPower: 0.20, elementalDamage: 0.10 }
        }
    ],

    // BERSERKER PASSIVES
    berserker: [
        {
            id: 'primal_rage',
            name: 'Primal Rage',
            levelReq: 1,
            desc: 'Your fury grants +5% attack damage and +2% lifesteal.',
            effects: { physicalDamage: 0.05, lifesteal: 0.02 }
        },
        {
            id: 'battle_fury',
            name: 'Battle Fury',
            levelReq: 5,
            desc: 'Generate 3 extra Fury when hitting or being hit.',
            effects: { furyOnHit: 3, furyOnHitTaken: 3 }
        },
        {
            id: 'relentless_assault',
            name: 'Relentless Assault',
            levelReq: 10,
            desc: 'Deal 8% more damage when above 50% Fury, gain +5% attack speed.',
            effects: { highFuryDamage: 0.08, haste: 0.05 }
        },
        {
            id: 'enrage',
            name: 'Enrage',
            levelReq: 14,
            desc: 'When below 40% HP, gain +15% damage and +10% attack speed.',
            effects: { lowHpDamage: 0.15, lowHpHaste: 0.10, lowHpThreshold: 0.40 }
        },
        {
            id: 'titans_strength',
            name: "Titan's Strength",
            levelReq: 17,
            desc: 'Maximum HP increased by 20%, deal 12% more damage.',
            effects: { maxHpPercent: 0.20, physicalDamage: 0.12 }
        }
    ],

    // VAMPIRE PASSIVES
    vampire: [
        {
            id: 'vampiric_essence',
            name: 'Vampiric Essence',
            levelReq: 1,
            desc: 'Your undead nature grants +5% lifesteal and +10 max Essence.',
            effects: { lifesteal: 0.05, maxEssence: 10 }
        },
        {
            id: 'night_hunter',
            name: 'Night Hunter',
            levelReq: 5,
            desc: 'Gain +5% dodge chance and +5% critical strike chance.',
            effects: { dodgeChance: 0.05, critChance: 0.05 }
        },
        {
            id: 'blood_drinker',
            name: 'Blood Drinker',
            levelReq: 10,
            desc: 'Lifesteal increased by 8%, healing also restores 5% of amount as Essence.',
            effects: { lifesteal: 0.08, healToEssence: 0.05 }
        },
        {
            id: 'shadow_embrace',
            name: 'Shadow Embrace',
            levelReq: 14,
            desc: 'Shadow damage increased by 10%, shadow spells heal for 8% of damage dealt.',
            effects: { shadowDamage: 0.10, shadowLifesteal: 0.08 }
        },
        {
            id: 'immortal_blood',
            name: 'Immortal Blood',
            levelReq: 17,
            desc: 'When you would die, heal to 30% HP instead (once per battle), lifesteal increased by 10%.',
            effects: { cheatDeathPercent: 0.30, cheatDeathCount: 1, lifesteal: 0.10 }
        }
    ]
};
