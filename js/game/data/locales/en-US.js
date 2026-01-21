// js/game/data/locales/en-US.js
// English (US) - Base language translations

export const translations = {
  // UI Common
  'ui.new_game': 'New Game',
  'ui.continue': 'Load Game',
  'ui.save': 'Save',
  'ui.load': 'Load',
  'ui.settings': 'Settings',
  'ui.changelog': 'Changelog',
  'ui.feedback': 'Feedback / Bug Report',
  'ui.close': 'Close',
  'ui.cancel': 'Cancel',
  'ui.confirm': 'Confirm',
  'ui.back': 'Back',
  'ui.next': 'Next',
  'ui.menu': 'Menu',
  'ui.journal': 'Journal',
  
  // Character Creation
  'char.create_hero': 'Create Hero',
  'char.name': 'Name',
  'char.name_placeholder': 'Aria, Thorne, etc.',
  'char.class': 'Class',
  'char.difficulty': 'Difficulty',
  'char.dev_cheats': 'Developer Cheats',
  'char.enable_cheats': 'Enable developer cheats',
  'char.cheats_subtitle': 'Shows the Cheat menu in-game for this character (testing only).',
  'char.begin_adventure': 'Begin Adventure',
  
  // Game HUD
  'hud.hero': 'Hero',
  'hud.level_xp': 'Lv {level} • {xp}/{nextXp} XP',
  'hud.gold': 'Gold',
  'hud.hp': 'HP',
  'hud.resource': 'Resource',
  'hud.enemy': 'Enemy',
  
  // Quest Panel
  'quest.quests': 'Quests',
  'quest.none': 'None yet.',
  'quest.log': 'Log',
  
  // Log Filters
  'log.all': 'All',
  'log.system': 'System',
  'log.player': 'Player',
  'log.enemy': 'Enemy',
  'log.combat': 'Combat',
  'log.damage': 'Damage',
  'log.procs': 'Procs',
  'log.status': 'Status',
  
  // Settings Screen
  'settings.title': 'Settings',
  'settings.subtitle': 'Personalize visuals, audio, and accessibility.',
  
  // Display Settings
  'settings.display': 'Display',
  'settings.theme': 'Theme',
  'settings.theme_desc': 'Changes the overall UI palette.',
  'settings.theme_default': 'Default',
  'settings.theme_arcane': 'Arcane',
  'settings.theme_inferno': 'Inferno',
  'settings.theme_forest': 'Forest',
  'settings.theme_holy': 'Holy',
  'settings.theme_shadow': 'Shadow',
  'settings.color_scheme': 'Color scheme',
  'settings.color_scheme_desc': 'Light or dark mode for the UI.',
  'settings.color_auto': 'Auto',
  'settings.color_light': 'Light',
  'settings.color_dark': 'Dark',
  'settings.ui_scale': 'UI scale',
  'settings.ui_scale_desc': 'Adjusts the size of all UI elements.',
  'settings.size_small': 'Small',
  'settings.size_default': 'Default',
  'settings.size_large': 'Large',
  'settings.size_xlarge': 'Extra Large',
  'settings.text_speed': 'Text speed',
  'settings.text_speed_desc': 'How quickly story text advances.',
  
  // Audio Settings
  'settings.audio': 'Audio',
  'settings.master_volume': 'Master volume',
  'settings.master_volume_desc': 'Overall volume level.',
  'settings.music': 'Music',
  'settings.music_desc': 'Background music during play.',
  'settings.sfx': 'SFX',
  'settings.sfx_desc': 'Combat and UI sound effects.',
  
  // Gameplay Settings
  'settings.gameplay': 'Gameplay',
  'settings.difficulty_setting': 'Difficulty',
  'settings.difficulty_desc': 'Adjust challenge and enemy scaling.',
  'settings.difficulty_easy': 'Easy',
  'settings.difficulty_normal': 'Normal',
  'settings.difficulty_hard': 'Hard',
  'settings.difficulty_dynamic': 'Dynamic',
  'settings.combat_numbers': 'Show combat numbers',
  'settings.combat_numbers_desc': 'Display damage and healing numbers in combat.',
  'settings.auto_save': 'Auto-save',
  'settings.auto_save_desc': 'Automatically save your progress periodically.',
  
  // Accessibility Settings
  'settings.accessibility': 'Accessibility',
  'settings.reduce_motion': 'Reduce motion',
  'settings.reduce_motion_desc': 'Turns off animated HUD effects.',
  'settings.text_size': 'Text size',
  'settings.text_size_desc': 'Scales UI text for readability.',
  'settings.high_contrast': 'High contrast',
  'settings.high_contrast_desc': 'Boosts contrast to improve readability.',
  'settings.high_contrast_on': 'On',
  'settings.high_contrast_off': 'Off',
  'settings.auto_equip': 'Auto-equip loot',
  'settings.auto_equip_desc': 'When you gain a new weapon or armor piece and the slot is empty, equip it automatically.',
  
  // Language Settings
  'settings.language_section': 'Language',
  'settings.language': 'Language',
  'settings.language_desc': 'Choose your preferred language for the game interface.',
  'settings.ai_translation': 'AI translation',
  'settings.ai_translation_desc': 'Enable AI-powered translation for dynamic game content (requires API key).',
  
  // Character Creation
  'char.create_character': 'Create Character',
  'char.choose_class': 'Choose Your Class',
  'char.character_name': 'Character Name',
  'char.difficulty': 'Difficulty',
  
  // Combat
  'combat.turn': 'Turn',
  'combat.your_turn': 'Your Turn',
  'combat.enemy_turn': 'Enemy Turn',
  'combat.attack': 'Attack',
  'combat.defend': 'Defend',
  'combat.flee': 'Flee',
  'combat.abilities': 'Abilities',
  'combat.victory': 'Victory!',
  'combat.defeat': 'Defeat',
  'combat.damage': 'Damage',
  'combat.healing': 'Healing',
  
  // Village
  'village.tavern': 'Tavern',
  'village.merchant': 'Merchant',
  'village.bank': 'Bank',
  'village.town_hall': 'Town Hall',
  'village.adventure': 'Adventure',
  
  // Inventory
  'inv.inventory': 'Inventory',
  'inv.equipment': 'Equipment',
  'inv.gold': 'Gold',
  'inv.items': 'Items',
  'inv.equip': 'Equip',
  'inv.unequip': 'Unequip',
  'inv.use': 'Use',
  'inv.sell': 'Sell',
  
  // Stats
  'stats.level': 'Level',
  'stats.health': 'Health',
  'stats.mana': 'Mana',
  'stats.energy': 'Energy',
  'stats.strength': 'Strength',
  'stats.dexterity': 'Dexterity',
  'stats.intelligence': 'Intelligence',
  'stats.vitality': 'Vitality',
  'stats.defense': 'Defense',
  'stats.attack': 'Attack',
  
  // Classes
  'class.warrior': 'Warrior',
  'class.mage': 'Mage',
  'class.rogue': 'Rogue',
  'class.cleric': 'Cleric',
  'class.ranger': 'Ranger',
  'class.paladin': 'Paladin',
  'class.necromancer': 'Necromancer',
  'class.blood_knight': 'Blood Knight',
  'class.berserker': 'Berserker',
  'class.shaman': 'Shaman',
  'class.vampire': 'Vampire',
  
  // Settings
  'settings.language': 'Language',
  'settings.ai_translation': 'AI Translation',
  'settings.translation_provider': 'Translation Provider',
  'settings.enable_ai': 'Enable AI Translation',
  'settings.api_key': 'API Key',
  'settings.local_mode': 'Local Mode (No API)',
  'settings.openai': 'OpenAI',
  'settings.google': 'Google Translate',
  
  // Messages
  'msg.game_saved': 'Game saved successfully',
  'msg.game_loaded': 'Game loaded',
  'msg.item_equipped': 'Item equipped',
  'msg.item_sold': 'Item sold',
  'msg.not_enough_gold': 'Not enough gold',
  'msg.level_up': 'Level Up!',
  'msg.translation_enabled': 'AI Translation enabled',
  'msg.translation_disabled': 'AI Translation disabled',
  'msg.language_changed': 'Language changed to {language}',
  
  // Toasts
  'toast.saved': 'Saved.',
  'toast.saving': 'Saving…',
  'toast.replay.recording': 'Recording replay…',
  'toast.replay.stopped': 'Replay captured.',
  'toast.replay.playing': 'Playing replay…'
}
