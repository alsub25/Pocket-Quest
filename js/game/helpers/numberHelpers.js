// js/game/helpers/numberHelpers.js
// Number utility functions
//
// Extracted from gameOrchestrator.js to provide reusable numeric operations.
// These are used across combat, stats, and UI rendering.

/**
 * Ensures a number is finite, returning a default value if not
 * @param {*} n - Value to check
 * @param {number} fallback - Fallback value if not finite
 * @returns {number} Finite number or fallback
 */
export function finiteNumber(n, fallback = 0) {
    const num = Number(n)
    return Number.isFinite(num) ? num : fallback
}

/**
 * Clamps a number to a specified range
 * @param {number} value - Value to clamp
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Clamped value
 */
export function clampNumber(value, min, max) {
    const v = finiteNumber(value, min)
    return Math.min(Math.max(v, min), max)
}

/**
 * Clamps a finite number (returns 0 if not finite)
 * @param {*} x - Value to clamp
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Clamped finite value
 */
export function clampFinite(x, min, max) {
    const n = Number(x)
    if (!Number.isFinite(n)) return 0
    return Math.min(Math.max(n, min), max)
}

/**
 * Safe wrapper around a function to catch exceptions
 * @param {Function} fn - Function to execute safely
 * @param {*} fallback - Fallback value if function throws
 * @returns {*} Function result or fallback
 */
export function safe(fn, fallback = null) {
    try {
        return typeof fn === 'function' ? fn() : fallback
    } catch (_) {
        return fallback
    }
}

/**
 * Formats a number as a percentage with optional decimal places
 * @param {number} value - Value to format (e.g., 0.25 for 25%)
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted percentage string
 */
export function formatPercentage(value, decimals = 0) {
    const pct = finiteNumber(value * 100, 0)
    return pct.toFixed(decimals) + '%'
}

/**
 * Formats a large number with k/M/B suffixes
 * @param {number} num - Number to format
 * @returns {string} Formatted number string
 */
export function formatLargeNumber(num) {
    const n = finiteNumber(num, 0)
    if (n >= 1000000000) return (n / 1000000000).toFixed(1) + 'B'
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
    if (n >= 1000) return (n / 1000).toFixed(1) + 'k'
    return String(Math.floor(n))
}
