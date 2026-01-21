// js/game/ui/languageSelector.js
// Language selector UI component for AI-powered localization

import { SUPPORTED_LANGUAGES } from '../services/aiTranslationService.js'

/**
 * Create and render language selector UI
 * @param {Object} engine - Game engine instance
 * @param {HTMLElement} container - Container element for the selector
 * @param {Function} onLanguageChange - Callback when language changes
 */
export function createLanguageSelector(engine, container, onLanguageChange) {
  if (!container || !engine) return

  const i18n = engine.getService?.('i18n') || engine.i18n
  if (!i18n) return

  const currentLocale = i18n.getLocale()

  // Create language selector HTML
  const selectorHtml = `
    <div class="language-selector">
      <label for="language-select" class="language-label">
        <span class="language-icon">🌐</span>
        <span class="language-text">Language</span>
      </label>
      <select id="language-select" class="language-dropdown">
        ${Object.keys(SUPPORTED_LANGUAGES).map(code => `
          <option value="${code}" ${code === currentLocale ? 'selected' : ''}>
            ${SUPPORTED_LANGUAGES[code].nativeName}
          </option>
        `).join('')}
      </select>
    </div>
  `

  container.innerHTML = selectorHtml

  // Add event listener for language change
  const selectElement = container.querySelector('#language-select')
  if (selectElement) {
    selectElement.addEventListener('change', (e) => {
      const newLocale = e.target.value
      i18n.setLocale(newLocale)
      
      if (onLanguageChange) {
        onLanguageChange(newLocale)
      }

      // Dispatch custom event for other parts of the app
      if (typeof CustomEvent !== 'undefined') {
        const event = new CustomEvent('languageChanged', { 
          detail: { locale: newLocale }
        })
        document.dispatchEvent(event)
      }
    })
  }
}

/**
 * Get current selected language
 * @param {Object} engine - Game engine instance
 * @returns {string} Current locale code
 */
export function getCurrentLanguage(engine) {
  const i18n = engine.getService?.('i18n') || engine.i18n
  if (!i18n) return 'en-US'
  return i18n.getLocale()
}

/**
 * Set language
 * @param {Object} engine - Game engine instance
 * @param {string} locale - Locale code to set
 */
export function setLanguage(engine, locale) {
  const i18n = engine.getService?.('i18n') || engine.i18n
  if (!i18n) return
  i18n.setLocale(locale)
}

/**
 * Create inline language switcher button
 * @param {Object} engine - Game engine instance
 * @param {Function} onClick - Callback when clicked
 * @returns {HTMLElement} Language switcher button element
 */
export function createLanguageSwitcherButton(engine, onClick) {
  const button = document.createElement('button')
  button.className = 'language-switcher-btn'
  button.innerHTML = '🌐'
  button.title = 'Change Language'
  button.setAttribute('aria-label', 'Change Language')
  
  button.addEventListener('click', (e) => {
    e.preventDefault()
    if (onClick) onClick(e)
  })
  
  return button
}

/**
 * Apply language to page elements with data-i18n attribute
 * @param {Object} engine - Game engine instance
 */
export function applyTranslations(engine) {
  const i18n = engine.getService?.('i18n') || engine.i18n
  if (!i18n) return

  const elements = document.querySelectorAll('[data-i18n]')
  elements.forEach(element => {
    const key = element.getAttribute('data-i18n')
    if (key) {
      element.textContent = i18n.t(key)
    }
  })
}
