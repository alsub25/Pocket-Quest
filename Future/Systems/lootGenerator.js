// Loot/lootGenerator.js
// Dynamic loot generation for Project: Mystic
// - Potions (HP + class-resource potions)
// - Weapons + single-piece Armor (not per-slot gear)
// - Leveled loot with rarities and item levels derived from stats
//
// Item shape matches the rest of the game code:
// { id, name, type: 'potion'|'weapon'|'armor', desc, price, ...bonuses..., rarity, itemLevel }

const RARITY_ORDER = ['common', 'uncommon', 'rare', 'epic', 'legendary']

const RARITY_LABEL = {
    common: 'Common',
    uncommon: 'Uncommon',
    rare: 'Rare',
    epic: 'Epic',
    legendary: 'Legendary'
}

// Stat/price multipliers by rarity
const RARITY_MULT = {
    common: 1.0,
    uncommon: 1.18,
    rare: 1.42,
    epic: 1.75,
    legendary: 2.2
}

// Baseline weights (bosses shift these in rollRarity)
const RARITY_WEIGHTS_NORMAL = [
    ['common', 60],
    ['uncommon', 25],
    ['rare', 11],
    ['epic', 3],
    ['legendary', 1]
]

const RARITY_WEIGHTS_BOSS = [
    ['common', 25],
    ['uncommon', 35],
    ['rare', 25],
    ['epic', 12],
    ['legendary', 3]
]

const RARITY_PREFIX = {
    common: '',
    uncommon: 'Fine',
    rare: 'Enchanted',
    epic: 'Mythic',
    legendary: 'Legendary'
}

function clamp(n, lo, hi) {
    return Math.max(lo, Math.min(hi, n))
}

function randint(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min
}

function pickWeighted(pairs) {
    const total = pairs.reduce((a, [, w]) => a + w, 0)
    let r = Math.random() * total
    for (const [v, w] of pairs) {
        r -= w
        if (r <= 0) return v
    }
    return pairs[pairs.length - 1][0]
}

function makeId(prefix) {
    // stable-enough uniqueness for saves without requiring crypto
    return (
        prefix +
        '_' +
        Date.now().toString(36) +
        '_' +
        Math.floor(Math.random() * 1e9).toString(36)
    )
}

export function formatRarityLabel(rarity) {
    return RARITY_LABEL[rarity] || 'Common'
}

export function getItemPowerScore(item) {
    if (!item) return 0

    if (item.type === 'weapon') {
        return (item.attackBonus || 0) + (item.magicBonus || 0)
    }

    if (item.type === 'armor') {
        return (item.armorBonus || 0) + (item.maxResourceBonus || 0) / 10
    }

    if (item.type === 'potion') {
        return (item.hpRestore || 0) + (item.resourceRestore || 0)
    }

    return 0
}

function estimateItemLevelFromStats(item, fallbackLevel = 1) {
    const score = getItemPowerScore(item)

    if (item.type === 'weapon') {
        return clamp(Math.round(score * 0.85), 1, 99)
    }
    if (item.type === 'armor') {
        return clamp(Math.round(score * 1.05), 1, 99)
    }
    if (item.type === 'potion') {
        return clamp(Math.round(score / 12), 1, 99)
    }
    return clamp(fallbackLevel, 1, 99)
}

function areaTier(area) {
    // Small nudge so later areas tend to drop slightly stronger loot.
    // (Safe default if unknown)
    switch (area) {
        case 'forest':
            return 0
        case 'ruins':
            return 1
        case 'marsh':
            return 2
        case 'frostpeak':
            return 3
        case 'catacombs':
            return 4
        case 'keep':
            return 5
        default:
            return 0
    }
}

function rollRarity(isBoss) {
    return pickWeighted(isBoss ? RARITY_WEIGHTS_BOSS : RARITY_WEIGHTS_NORMAL)
}

function rollBaseLevel(playerLevel, area, isBoss) {
    const tier = areaTier(area)
    const base = Math.max(1, (playerLevel || 1) + Math.floor(tier / 2))

    if (isBoss) return base + randint(2, 5)
    return base + randint(-1, 2)
}

function buildWeapon(level, rarity) {
    const mult = RARITY_MULT[rarity] || 1.0

    const archetype = pickWeighted([
        ['war', 45],
        ['mage', 35],
        ['hybrid', 20]
    ])

    // Base numbers: tuned to roughly align with existing ITEM_DEFS progression
    let atk = 0
    let mag = 0

    if (archetype === 'war') {
        atk = Math.round((4 + level * 1.25) * mult)
        mag = Math.round(level * 0.25 * mult)
    } else if (archetype === 'mage') {
        atk = Math.round(level * 0.25 * mult)
        mag = Math.round((4 + level * 1.25) * mult)
    } else {
        atk = Math.round((3 + level * 0.9) * mult)
        mag = Math.round((3 + level * 0.9) * mult)
    }

    // Names
    const baseName = pickWeighted([
        ['Longsword', 35],
        ['War Axe', 18],
        ['Spear', 16],
        ['Dagger', 12],
        ['Staff', 19]
    ])

    const prefix = RARITY_PREFIX[rarity] ? RARITY_PREFIX[rarity] + ' ' : ''
    const name = `${prefix}${baseName}`

    const item = {
        id: makeId('gen_weapon'),
        name,
        type: 'weapon',
        attackBonus: atk || undefined,
        magicBonus: mag || undefined,
        rarity,
        generated: true
    }

    item.itemLevel = estimateItemLevelFromStats(item, level)

    // Price scales mostly off power; rarity already baked into stats, but rarity still nudges price.
    const raw = (atk + mag) * 8
    item.price = Math.max(
        5,
        Math.round(raw * (1 + RARITY_ORDER.indexOf(rarity) * 0.15))
    )

    item.desc =
        [
            atk ? `+${atk} Attack` : null,
            mag ? `+${mag} Magic` : null,
            `iLv ${item.itemLevel}`,
            formatRarityLabel(rarity)
        ]
            .filter(Boolean)
            .join(', ') + '.'

    return item
}

function buildArmor(level, rarity) {
    const mult = RARITY_MULT[rarity] || 1.0

    const style = pickWeighted([
        ['plate', 35],
        ['leather', 40],
        ['robe', 25]
    ])

    let armor = 0
    let maxRes = 0

    if (style === 'plate') {
        armor = Math.round((4 + level * 1.15) * mult)
        maxRes = Math.round(level * 1.0 * mult)
    } else if (style === 'leather') {
        armor = Math.round((3 + level * 1.0) * mult)
        maxRes = Math.round(level * 1.5 * mult)
    } else {
        armor = Math.round((2 + level * 0.85) * mult)
        maxRes = Math.round((10 + level * 4.0) * mult)
    }

    const baseName =
        style === 'plate'
            ? 'Plate Harness'
            : style === 'leather'
            ? 'Leather Jerkin'
            : 'Runed Robe'

    const prefix = RARITY_PREFIX[rarity] ? RARITY_PREFIX[rarity] + ' ' : ''
    const name = `${prefix}${baseName}`

    const item = {
        id: makeId('gen_armor'),
        name,
        type: 'armor',
        armorBonus: armor || undefined,
        maxResourceBonus: maxRes || undefined,
        rarity,
        generated: true
    }

    item.itemLevel = estimateItemLevelFromStats(item, level)

    const raw = armor * 7 + maxRes * 0.6
    item.price = Math.max(
        5,
        Math.round(raw * (1 + RARITY_ORDER.indexOf(rarity) * 0.15))
    )

    item.desc =
        [
            armor ? `+${armor} Armor` : null,
            maxRes ? `+${maxRes} ${'Max Resource'}` : null,
            `iLv ${item.itemLevel}`,
            formatRarityLabel(rarity)
        ]
            .filter(Boolean)
            .join(', ') + '.'

    return item
}

function buildPotion(level, rarity, resourceKey) {
    // Potions are meant to be stackable, so ID must be stable by potion type/tier.
    const mult = RARITY_MULT[rarity] || 1.0

    // Decide potion subtype
    const subtype = pickWeighted([
        ['hp', 55],
        ['resource', 45]
    ])

    // Tier based on rarity (common/uncommon -> small; rare+ -> strong)
    const tier =
        rarity === 'common' || rarity === 'uncommon'
            ? 'small'
            : rarity === 'rare'
            ? 'standard'
            : 'greater'

    const tierLabel =
        tier === 'small'
            ? 'Small'
            : tier === 'standard'
            ? 'Standard'
            : 'Greater'

    const item = {
        type: 'potion',
        rarity,
        generated: true
    }

    if (subtype === 'hp') {
        const restore = Math.round(
            (18 + level * 6) *
                mult *
                (tier === 'small' ? 0.85 : tier === 'standard' ? 1.0 : 1.25)
        )
        item.id = `potion_hp_${tier}`
        item.name = `${tierLabel} Health Potion`
        item.hpRestore = restore
        item.itemLevel = estimateItemLevelFromStats(
            { ...item, hpRestore: restore },
            level
        )
        item.price = Math.max(3, Math.round(restore * 0.55))
        item.desc = `Restore ${restore} HP.`
    } else {
        const key = resourceKey || 'mana'
        const restore = Math.round(
            (16 + level * 6) *
                mult *
                (tier === 'small' ? 0.85 : tier === 'standard' ? 1.0 : 1.25)
        )
        item.id = `potion_${key}_${tier}`
        const prettyKey = key.charAt(0).toUpperCase() + key.slice(1)
        item.name = `${tierLabel} ${prettyKey} Potion`
        item.resourceKey = key
        item.resourceRestore = restore
        item.itemLevel = estimateItemLevelFromStats(
            { ...item, resourceRestore: restore },
            level
        )
        item.price = Math.max(3, Math.round(restore * 0.55))
        item.desc = `Restore ${restore} ${prettyKey}.`
    }

    return item
}

export function getSellValue(item, context = 'village') {
    if (!item) return 0

    const base =
        typeof item.price === 'number' && item.price > 0
            ? item.price
            : Math.max(1, Math.round(getItemPowerScore(item) * 6))

    // Wandering merchant generally offers worse prices.
    const factor = context === 'wandering' ? 0.45 : 0.6

    // Sell one unit for potions
    return Math.max(1, Math.floor(base * factor))
}

export function generateLootDrop({
    area = 'forest',
    playerLevel = 1,
    enemy = null,
    playerResourceKey = null
} = {}) {
    const isBoss = !!(enemy && enemy.isBoss)

    // Favor gear on bosses; favor potions on trash mobs.
    const categoryWeights = isBoss
        ? [
              ['weapon', 38],
              ['armor', 38],
              ['potion', 24]
          ]
        : [
              ['potion', 45],
              ['weapon', 30],
              ['armor', 25]
          ]

    const drops = []
    const baseLevel = rollBaseLevel(playerLevel, area, isBoss)

    // Bosses can drop multiple items.
    const dropCount = isBoss ? (Math.random() < 0.55 ? 2 : 3) : 1

    // Try to prefer a usable resource potion for the player.
    // Prefer dropping a resource potion that the player can actually use.
    const preferredResourceKey = playerResourceKey || null

    for (let i = 0; i < dropCount; i++) {
        const rarity = rollRarity(isBoss)
        const category = pickWeighted(categoryWeights)

        if (category === 'weapon') {
            drops.push(buildWeapon(baseLevel, rarity))
        } else if (category === 'armor') {
            drops.push(buildArmor(baseLevel, rarity))
        } else {
            drops.push(buildPotion(baseLevel, rarity, preferredResourceKey))
        }
    }

    // Small post-pass: ensure at least 1 potion on bosses only if no potion rolled.
    if (isBoss && !drops.some((d) => d.type === 'potion')) {
        drops.push(
            buildPotion(baseLevel, rollRarity(true), preferredResourceKey)
        )
    }

    return drops
}
