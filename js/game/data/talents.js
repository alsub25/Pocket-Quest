/* =============================================================================
 * Talent Definitions (talents.js)
 * Patch: 1.2.65 — The Blackbark Oath
 *
 * Extracted from engine.js as part of the 1.2.65 modularization overhaul.
 * This file is intentionally DATA-ONLY (no side effects).
 * ============================================================================= */

export const TALENT_DEFS = {
    mage: [
        { id: 'mage_rhythm_mastery', tier: 1, levelReq: 3, name: 'Rhythm Mastery', desc: 'Rhythm empowers every 2nd spell instead of every 3rd.' },
        { id: 'mage_mana_weave', tier: 1, levelReq: 3, name: 'Mana Weave', desc: 'Spell mana costs are reduced by 5%.' },

        { id: 'mage_ember_focus', tier: 2, levelReq: 6, name: 'Ember Focus', desc: 'Fire spells deal +10% damage.' },
        { id: 'mage_frostward', tier: 2, levelReq: 6, name: 'Frostward', desc: 'Gain 15% Frost resistance.' },

        { id: 'mage_arcane_conduit', tier: 3, levelReq: 9, name: 'Arcane Conduit', desc: 'Empowered Rhythm casts refund +2 mana.' },
        { id: 'mage_glacial_edge', tier: 3, levelReq: 9, name: 'Glacial Edge', desc: 'Frost spells deal +10% damage.' },

        { id: 'mage_arcane_ward', tier: 4, levelReq: 12, name: 'Arcane Ward', desc: 'Gain 15% Arcane resistance.' },
        { id: 'mage_mystic_reservoir', tier: 4, levelReq: 12, name: 'Mystic Reservoir', desc: 'Increase maximum Mana by 20.' },

        { id: 'mage_temporal_mastery', tier: 5, levelReq: 15, name: 'Temporal Mastery', desc: 'Spell cast time reduced by 15%, gain +5% spell critical chance.' },
        { id: 'mage_elemental_convergence', tier: 5, levelReq: 15, name: 'Elemental Convergence', desc: 'All elemental spells deal +8% damage and apply a minor DoT.' },

        { id: 'mage_archmage_supremacy', tier: 6, levelReq: 18, name: 'Archmage Supremacy', desc: 'Spell damage increased by 12%, mana regeneration increased by 20%.' },
        { id: 'mage_spell_echo', tier: 6, levelReq: 18, name: 'Spell Echo', desc: '15% chance to cast your spell twice without additional cost.' }
    ],

    warrior: [
        { id: 'warrior_deep_cleave', tier: 1, levelReq: 3, name: 'Deep Cleave', desc: 'Cleave splash damage +15%.' },
        { id: 'warrior_frostward', tier: 1, levelReq: 3, name: 'Frostward', desc: 'Gain 15% Frost resistance.' },

        { id: 'warrior_bulwark_spikes', tier: 2, levelReq: 6, name: 'Bulwark Spikes', desc: 'When Bulwark triggers, reflect a small amount of damage on the next enemy hit.' },
        { id: 'warrior_sunder', tier: 2, levelReq: 6, name: 'Sunder', desc: 'Gain +10% Armor Penetration.' },

        { id: 'warrior_relentless', tier: 3, levelReq: 9, name: 'Relentless', desc: 'On kill, gain 10 Fury.' },
        { id: 'warrior_ironhide', tier: 3, levelReq: 9, name: 'Ironhide', desc: 'Gain +6 Armor and +5% Resist All.' },

        { id: 'warrior_executioner', tier: 4, levelReq: 12, name: 'Executioner', desc: 'Deal +15% physical damage to enemies below 30% HP.' },
        { id: 'warrior_battle_trance', tier: 4, levelReq: 12, name: 'Battle Trance', desc: 'Gain +10% Haste.' },

        { id: 'warrior_steel_soul', tier: 5, levelReq: 15, name: 'Steel Soul', desc: 'Gain +10 Armor and immunity to first stun/knock each combat.' },
        { id: 'warrior_warlords_presence', tier: 5, levelReq: 15, name: "Warlord's Presence", desc: 'All defensive abilities last 1 turn longer and grant +8% damage.' },

        { id: 'warrior_unbreakable_wall', tier: 6, levelReq: 18, name: 'Unbreakable Wall', desc: 'Reduce all incoming damage by 15%, gain +20% max HP.' },
        { id: 'warrior_devastate', tier: 6, levelReq: 18, name: 'Devastate', desc: 'Critical strikes deal 50% more damage and reduce enemy armor by 20%.' }
    ],

    blood: [
        { id: 'blood_thicker_than_water', tier: 1, levelReq: 3, name: 'Thicker Than Water', desc: 'Blood Nova applies +1 Bleed turn.' },
        { id: 'blood_shadowward', tier: 1, levelReq: 3, name: 'Shadowward', desc: 'Gain 15% Shadow resistance.' },

        { id: 'blood_bloodrush_hunger', tier: 2, levelReq: 6, name: 'Bloodrush Hunger', desc: 'While Bloodrush is active, lifesteal +5%.' },
        { id: 'blood_hemomancy', tier: 2, levelReq: 6, name: 'Hemomancy', desc: 'Shadow spells deal +10% damage.' },

        { id: 'blood_sanguine_ritual', tier: 3, levelReq: 9, name: 'Sanguine Ritual', desc: 'On kill, gain 6 Blood.' },
        { id: 'blood_blood_armor', tier: 3, levelReq: 9, name: 'Blood Armor', desc: 'Gain +12 Max HP and +2 Armor.' },

        { id: 'blood_crimson_storm', tier: 4, levelReq: 12, name: 'Crimson Storm', desc: 'Blood Nova damage +15%.' },
        { id: 'blood_sanguine_pact', tier: 4, levelReq: 12, name: 'Sanguine Pact', desc: 'Leech heals 15% more.' },

        { id: 'blood_hemorrhagic_mastery', tier: 5, levelReq: 15, name: 'Hemorrhagic Mastery', desc: 'Bleeding effects you apply deal 20% more damage and last 1 turn longer.' },
        { id: 'blood_crimson_rebirth', tier: 5, levelReq: 15, name: 'Crimson Rebirth', desc: 'When below 30% HP, gain +15% lifesteal and +10% damage.' },

        { id: 'blood_blood_god', tier: 6, levelReq: 18, name: 'Blood God', desc: 'HP costs reduced by 25%, all blood abilities deal 15% more damage.' },
        { id: 'blood_vampiric_supremacy', tier: 6, levelReq: 18, name: 'Vampiric Supremacy', desc: 'Lifesteal increased by 15%, heal 10% of damage dealt as blood resource.' }
    ],

    ranger: [
        { id: 'ranger_pinpoint', tier: 1, levelReq: 3, name: 'Pinpoint', desc: 'Marks also increase damage vs the marked target by +1% each.' },
        { id: 'ranger_quickdraw', tier: 1, levelReq: 3, name: 'Quickdraw', desc: 'Your first hit bonus each combat is stronger (+6%).' },

        { id: 'ranger_nature_attunement', tier: 2, levelReq: 6, name: 'Nature Attunement', desc: 'Nature spells deal +10% damage.' },
        { id: 'ranger_thorned_arrows', tier: 2, levelReq: 6, name: 'Thorned Arrows', desc: 'Rain of Thorns bleed damage +10%.' },

        { id: 'ranger_hunters_bounty', tier: 3, levelReq: 9, name: "Hunter's Bounty", desc: 'On kill, gain 8 Mana/Fury/Blood depending on class resource.' },
        { id: 'ranger_camouflage', tier: 3, levelReq: 9, name: 'Camouflage', desc: 'Gain +8% Dodge Chance.' },

        { id: 'ranger_called_shot', tier: 4, levelReq: 12, name: 'Called Shot', desc: 'Gain +10% Crit Chance.' },
        { id: 'ranger_long_mark', tier: 4, levelReq: 12, name: 'Long Mark', desc: 'Marks last +1 turn.' },

        { id: 'ranger_apex_predator', tier: 5, levelReq: 15, name: 'Apex Predator', desc: 'Deal 12% more damage to marked targets, marks grant +2% dodge.' },
        { id: 'ranger_wild_instinct', tier: 5, levelReq: 15, name: 'Wild Instinct', desc: 'Gain +15% critical damage and +10% attack speed.' },

        { id: 'ranger_master_tracker', tier: 6, levelReq: 18, name: 'Master Tracker', desc: 'Automatically mark enemies on combat start, marks never expire.' },
        { id: 'ranger_deadly_precision', tier: 6, levelReq: 18, name: 'Deadly Precision', desc: 'Critical strikes deal 60% more damage and apply bleeding.' }
    ],

    paladin: [
        { id: 'paladin_radiant_focus', tier: 1, levelReq: 3, name: 'Radiant Focus', desc: 'Holy spells deal +10% damage.' },
        { id: 'paladin_aura_of_faith', tier: 1, levelReq: 3, name: 'Aura of Faith', desc: 'Gain +5% Resist All.' },

        { id: 'paladin_sanctified_plate', tier: 2, levelReq: 6, name: 'Sanctified Plate', desc: 'Gain +8 Armor.' },
        { id: 'paladin_holyward', tier: 2, levelReq: 6, name: 'Holyward', desc: 'Gain 15% Holy resistance.' },

        { id: 'paladin_mana_font', tier: 3, levelReq: 9, name: 'Mana Font', desc: 'Increase maximum Mana by 20.' },
        { id: 'paladin_zeal', tier: 3, levelReq: 9, name: 'Zeal', desc: 'Gain +8% Crit Chance.' },

        { id: 'paladin_avenging_strike', tier: 4, levelReq: 12, name: 'Avenging Strike', desc: 'Deal +12% physical damage to enemies below 30% HP.' },
        { id: 'paladin_divine_haste', tier: 4, levelReq: 12, name: 'Divine Haste', desc: 'Gain +10% Haste.' },

        { id: 'paladin_holy_champion', tier: 5, levelReq: 15, name: 'Holy Champion', desc: 'All healing increased by 20%, shields last 1 turn longer.' },
        { id: 'paladin_righteous_fury', tier: 5, levelReq: 15, name: 'Righteous Fury', desc: 'Holy abilities deal 15% more damage and heal for 10% of damage dealt.' },

        { id: 'paladin_avatar_of_light', tier: 6, levelReq: 18, name: 'Avatar of Light', desc: 'Reduce all damage taken by 12%, heal 5% max HP every turn.' },
        { id: 'paladin_divine_retribution', tier: 6, levelReq: 18, name: 'Divine Retribution', desc: 'Reflect 25% of damage taken as holy damage, gain +15% crit chance.' }
    ],

    rogue: [
        { id: 'rogue_deadly_precision', tier: 1, levelReq: 3, name: 'Deadly Precision', desc: 'Gain +10% Crit Chance.' },
        { id: 'rogue_smokefoot', tier: 1, levelReq: 3, name: 'Smokefoot', desc: 'Gain +8% Dodge Chance.' },

        { id: 'rogue_shadowward', tier: 2, levelReq: 6, name: 'Shadowward', desc: 'Gain 15% Shadow resistance.' },
        { id: 'rogue_exploit_wounds', tier: 2, levelReq: 6, name: 'Exploit Wounds', desc: 'Deal +10% physical damage to bleeding targets.' },

        { id: 'rogue_cutpurse', tier: 3, levelReq: 9, name: 'Cutpurse', desc: 'On kill, gain 10 gold.' },
        { id: 'rogue_armor_sunder', tier: 3, levelReq: 9, name: 'Armor Sunder', desc: 'Gain +10% Armor Penetration.' },

        { id: 'rogue_execution', tier: 4, levelReq: 12, name: 'Execution', desc: 'Deal +15% physical damage to enemies below 30% HP.' },
        { id: 'rogue_adrenaline', tier: 4, levelReq: 12, name: 'Adrenaline', desc: 'Gain +10% Haste.' },

        { id: 'rogue_master_assassin', tier: 5, levelReq: 15, name: 'Master Assassin', desc: 'Critical strikes from stealth deal 50% more damage and silence enemy.' },
        { id: 'rogue_shadow_mastery', tier: 5, levelReq: 15, name: 'Shadow Mastery', desc: 'Dodge chance increased by 10%, dodging grants 15 fury.' },

        { id: 'rogue_death_mark', tier: 6, levelReq: 18, name: 'Death Mark', desc: 'Your attacks have a 20% chance to mark enemies, marked enemies take 25% more damage.' },
        { id: 'rogue_ultimate_precision', tier: 6, levelReq: 18, name: 'Ultimate Precision', desc: 'Crit chance increased by 15%, crits reduce all cooldowns by 1 turn.' }
    ],

    cleric: [
        { id: 'cleric_holy_focus', tier: 1, levelReq: 3, name: 'Holy Focus', desc: 'Holy spells deal +10% damage.' },
        { id: 'cleric_sanctuary', tier: 1, levelReq: 3, name: 'Sanctuary', desc: 'Start each combat with a 20-point shield.' },

        { id: 'cleric_mending_prayer', tier: 2, levelReq: 6, name: 'Mending Prayer', desc: 'Healing and shields are 15% stronger.' },
        { id: 'cleric_lightward', tier: 2, levelReq: 6, name: 'Lightward', desc: 'Gain 15% Holy resistance.' },

        { id: 'cleric_mana_font', tier: 3, levelReq: 9, name: 'Mana Font', desc: 'Increase maximum Mana by 20.' },
        { id: 'cleric_bastion', tier: 3, levelReq: 9, name: 'Bastion', desc: 'Gain +6 Armor and +5% Resist All.' },

        { id: 'cleric_divine_haste', tier: 4, levelReq: 12, name: 'Divine Haste', desc: 'Gain +10% Haste.' },
        { id: 'cleric_grace', tier: 4, levelReq: 12, name: 'Grace', desc: 'Gain +8% Dodge Chance.' },

        { id: 'cleric_divine_blessing', tier: 5, levelReq: 15, name: 'Divine Blessing', desc: 'All heals also grant a shield equal to 30% of healing done.' },
        { id: 'cleric_radiant_power', tier: 5, levelReq: 15, name: 'Radiant Power', desc: 'Holy damage increased by 15%, healing increases by 10%.' },

        { id: 'cleric_miracle_worker', tier: 6, levelReq: 18, name: 'Miracle Worker', desc: 'Healing spells cost 20% less, overheal creates shields.' },
        { id: 'cleric_divine_wrath', tier: 6, levelReq: 18, name: 'Divine Wrath', desc: 'Holy damage increased by 20%, enemies hit by holy spells deal 15% less damage.' }
    ],

    necromancer: [
        { id: 'necromancer_shadow_mastery', tier: 1, levelReq: 3, name: 'Shadow Mastery', desc: 'Shadow spells deal +10% damage.' },
        { id: 'necromancer_graveward', tier: 1, levelReq: 3, name: 'Graveward', desc: 'Gain 15% Shadow resistance.' },

        { id: 'necromancer_deathmark_ritual', tier: 2, levelReq: 6, name: 'Deathmark Ritual', desc: 'Death Mark lasts +1 turn and amplifies the next shadow hit more.' },
        { id: 'necromancer_soul_battery', tier: 2, levelReq: 6, name: 'Soul Battery', desc: 'Increase maximum Mana by 20.' },

        { id: 'necromancer_bone_plating', tier: 3, levelReq: 9, name: 'Bone Plating', desc: 'Gain +4 Armor and +8% Resist All.' },
        { id: 'necromancer_reaper', tier: 3, levelReq: 9, name: 'Reaper', desc: 'On kill, restore 8 Mana.' },

        { id: 'necromancer_plague_touch', tier: 4, levelReq: 12, name: 'Plague Touch', desc: 'Poison spells deal +10% damage.' },
        { id: 'necromancer_dark_haste', tier: 4, levelReq: 12, name: 'Dark Haste', desc: 'Gain +10% Haste.' },

        { id: 'necromancer_undead_mastery', tier: 5, levelReq: 15, name: 'Undead Mastery', desc: 'Summoned undead deal 25% more damage and have 30% more HP.' },
        { id: 'necromancer_soul_harvest', tier: 5, levelReq: 15, name: 'Soul Harvest', desc: 'On kill, drain 15% of enemy max HP as healing and gain 10 mana.' },

        { id: 'necromancer_lich_lord', tier: 6, levelReq: 18, name: 'Lich Lord', desc: 'Shadow damage increased by 20%, heal for 15% of shadow damage dealt.' },
        { id: 'necromancer_death_incarnate', tier: 6, levelReq: 18, name: 'Death Incarnate', desc: 'All DoT effects deal 30% more damage, enemies killed have 25% chance to revive as ally.' }
    ],

    shaman: [
        { id: 'shaman_tempest_focus', tier: 1, levelReq: 3, name: 'Tempest Focus', desc: 'Lightning spells deal +10% damage.' },
        { id: 'shaman_nature_attunement', tier: 1, levelReq: 3, name: 'Nature Attunement', desc: 'Nature spells deal +10% damage.' },

        { id: 'shaman_stormward', tier: 2, levelReq: 6, name: 'Stormward', desc: 'Gain 15% Lightning resistance.' },
        { id: 'shaman_mana_font', tier: 2, levelReq: 6, name: 'Mana Font', desc: 'Increase maximum Mana by 20.' },

        { id: 'shaman_totemic_mastery', tier: 3, levelReq: 9, name: 'Totemic Mastery', desc: 'Totem Spark deals +15% damage.' },
        { id: 'shaman_spirit_guard', tier: 3, levelReq: 9, name: 'Spirit Guard', desc: 'Gain +6 Armor and +5% Resist All.' },

        { id: 'shaman_ancestral_mending', tier: 4, levelReq: 12, name: 'Ancestral Mending', desc: 'Healing and shields are 15% stronger.' },
        { id: 'shaman_swift_steps', tier: 4, levelReq: 12, name: 'Swift Steps', desc: 'Gain +8% Dodge Chance.' },

        { id: 'shaman_elemental_fury', tier: 5, levelReq: 15, name: 'Elemental Fury', desc: 'All elemental damage increased by 12%, totems last 2 turns longer.' },
        { id: 'shaman_spirit_link', tier: 5, levelReq: 15, name: 'Spirit Link', desc: 'Heal 8% max HP when totems expire, totems grant +10% resistance.' },

        { id: 'shaman_storm_caller', tier: 6, levelReq: 18, name: 'Storm Caller', desc: 'Lightning spells chain to additional targets, dealing 50% damage.' },
        { id: 'shaman_earth_warden', tier: 6, levelReq: 18, name: 'Earth Warden', desc: 'Gain 20% damage reduction, earth spells restore 5% max HP.' }
    ],

    berserker: [
        { id: 'berserker_rage_mastery', tier: 1, levelReq: 3, name: 'Rage Mastery', desc: 'Missing-HP damage scaling is stronger.' },
        { id: 'berserker_bloodthirst', tier: 1, levelReq: 3, name: 'Bloodthirst', desc: 'Gain +8% Lifesteal.' },

        { id: 'berserker_executioner', tier: 2, levelReq: 6, name: 'Executioner', desc: 'Deal +15% physical damage to enemies below 30% HP.' },
        { id: 'berserker_fireward', tier: 2, levelReq: 6, name: 'Fireward', desc: 'Gain 15% Fire resistance.' },

        { id: 'berserker_hardened', tier: 3, levelReq: 9, name: 'Hardened', desc: 'Gain +6 Armor.' },
        { id: 'berserker_ferocity', tier: 3, levelReq: 9, name: 'Ferocity', desc: 'Gain +10% Crit Chance.' },

        { id: 'berserker_battle_trance', tier: 4, levelReq: 12, name: 'Battle Trance', desc: 'Gain +10% Haste.' },
        { id: 'berserker_rampage', tier: 4, levelReq: 12, name: 'Rampage', desc: 'On kill, gain 10 Fury.' },

        { id: 'berserker_brutal_strikes', tier: 5, levelReq: 15, name: 'Brutal Strikes', desc: 'Attacks deal 15% more damage when below 50% HP, gain 5% lifesteal.' },
        { id: 'berserker_unstoppable_rage', tier: 5, levelReq: 15, name: 'Unstoppable Rage', desc: 'Gain immunity to stuns and slows, deal 10% more damage.' },

        { id: 'berserker_titans_wrath', tier: 6, levelReq: 18, name: "Titan's Wrath", desc: 'Deal 25% more damage when below 30% HP, gain 20% damage reduction.' },
        { id: 'berserker_blood_frenzy', tier: 6, levelReq: 18, name: 'Blood Frenzy', desc: 'Critical strikes heal for 15% of damage dealt and generate 15 fury.' }
    ],

    vampire: [
        { id: 'vampire_shadow_focus', tier: 1, levelReq: 3, name: 'Shadow Focus', desc: 'Shadow spells deal +10% damage.' },
        { id: 'vampire_night_hunger', tier: 1, levelReq: 3, name: 'Night Hunger', desc: 'On kill, restore 10 Essence.' },

        { id: 'vampire_essence_reservoir', tier: 2, levelReq: 6, name: 'Essence Reservoir', desc: 'Increase maximum Essence by 20.' },
        { id: 'vampire_dark_agility', tier: 2, levelReq: 6, name: 'Dark Agility', desc: 'Gain +8% Dodge Chance.' },

        { id: 'vampire_bloodletting', tier: 3, levelReq: 9, name: 'Bloodletting', desc: 'Gain +10% Lifesteal.' },
        { id: 'vampire_shadowward', tier: 3, levelReq: 9, name: 'Shadowward', desc: 'Gain 15% Shadow resistance.' },

        { id: 'vampire_crimson_crit', tier: 4, levelReq: 12, name: 'Crimson Crit', desc: 'Gain +10% Crit Chance.' },
        { id: 'vampire_mistward', tier: 4, levelReq: 12, name: 'Mistward', desc: 'Gain 15% Frost resistance.' },

        { id: 'vampire_blood_lord', tier: 5, levelReq: 15, name: 'Blood Lord', desc: 'Lifesteal increased by 15%, heal allies for 50% of lifesteal healing.' },
        { id: 'vampire_nightstalker', tier: 5, levelReq: 15, name: 'Nightstalker', desc: 'Gain 12% dodge, attacks from stealth deal 30% more damage.' },

        { id: 'vampire_lord_of_night', tier: 6, levelReq: 18, name: 'Lord of Night', desc: 'Shadow damage increased by 25%, heal for 20% of shadow damage dealt.' },
        { id: 'vampire_eternal_thirst', tier: 6, levelReq: 18, name: 'Eternal Thirst', desc: 'Gain 20% lifesteal, killing blows restore 25% max HP and 30 essence.' }
    ]

}

