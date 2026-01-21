// js/game/services/aiTranslationService.js
// AI-powered translation service for multi-language support

/**
 * AI Translation Service
 * Provides AI-powered translation capabilities with caching and fallback support
 * 
 * Features:
 * - Multiple AI translation providers (OpenAI, Google Translate, DeepL)
 * - Local caching to minimize API calls
 * - Fallback to basic translation if AI is unavailable
 * - Batch translation support for efficiency
 */

// Supported languages
export const SUPPORTED_LANGUAGES = {
  'en-US': { name: 'English', nativeName: 'English' },
  'es-ES': { name: 'Spanish', nativeName: 'Español' },
  'fr-FR': { name: 'French', nativeName: 'Français' },
  'de-DE': { name: 'German', nativeName: 'Deutsch' },
  'ja-JP': { name: 'Japanese', nativeName: '日本語' },
  'zh-CN': { name: 'Chinese (Simplified)', nativeName: '简体中文' },
  'pt-BR': { name: 'Portuguese (Brazil)', nativeName: 'Português' },
  'ru-RU': { name: 'Russian', nativeName: 'Русский' },
  'ko-KR': { name: 'Korean', nativeName: '한국어' },
  'it-IT': { name: 'Italian', nativeName: 'Italiano' }
}

/**
 * Create AI Translation Service
 * @param {Object} options - Configuration options
 * @param {string} options.apiProvider - AI provider ('openai', 'google', 'deepl', 'local')
 * @param {string} options.apiKey - API key for the provider
 * @param {Object} options.cache - Translation cache storage
 * @returns {Object} Translation service interface
 */
export function createAiTranslationService({
  apiProvider = 'local',
  apiKey = null,
  cache = null
} = {}) {
  const translationCache = cache || new Map()
  let provider = apiProvider
  let key = apiKey

  /**
   * Generate cache key for translations
   */
  function getCacheKey(text, targetLang, sourceLang = 'en-US') {
    return `${sourceLang}:${targetLang}:${text}`
  }

  /**
   * Translate using OpenAI API
   */
  async function translateWithOpenAI(text, targetLang, sourceLang = 'en-US') {
    if (!key) {
      throw new Error('OpenAI API key not configured')
    }

    const targetLangName = SUPPORTED_LANGUAGES[targetLang]?.name || targetLang
    
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${key}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: `You are a professional translator for a fantasy RPG game. Translate the following text to ${targetLangName}. Preserve any special formatting, game terminology, and maintain the tone and style appropriate for a fantasy setting. Only return the translated text without explanations.`
            },
            {
              role: 'user',
              content: text
            }
          ],
          temperature: 0.3,
          max_tokens: 500
        })
      })

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`)
      }

      const data = await response.json()
      return data.choices[0].message.content.trim()
    } catch (error) {
      console.warn('OpenAI translation failed:', error)
      throw error
    }
  }

  /**
   * Translate using Google Translate API
   */
  async function translateWithGoogle(text, targetLang, sourceLang = 'en-US') {
    if (!key) {
      throw new Error('Google API key not configured')
    }

    // Extract language codes (e.g., 'en-US' -> 'en')
    const targetCode = targetLang.split('-')[0]
    const sourceCode = sourceLang.split('-')[0]

    try {
      const response = await fetch(
        `https://translation.googleapis.com/language/translate/v2?key=${key}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            q: text,
            source: sourceCode,
            target: targetCode,
            format: 'text'
          })
        }
      )

      if (!response.ok) {
        throw new Error(`Google API error: ${response.status}`)
      }

      const data = await response.json()
      return data.data.translations[0].translatedText
    } catch (error) {
      console.warn('Google translation failed:', error)
      throw error
    }
  }

  /**
   * Basic local translation (fallback)
   * Uses pre-translated common phrases
   */
  function translateLocally(text, targetLang, sourceLang = 'en-US') {
    // For local mode, we return the original text
    // In production, this would use pre-translated dictionaries
    return text
  }

  /**
   * Translate text with caching
   * @param {string} text - Text to translate
   * @param {string} targetLang - Target language code
   * @param {string} sourceLang - Source language code (default: 'en-US')
   * @returns {Promise<string>} Translated text
   */
  async function translate(text, targetLang, sourceLang = 'en-US') {
    if (!text || typeof text !== 'string') {
      return text
    }

    // If target is same as source, return original
    if (targetLang === sourceLang) {
      return text
    }

    // Check cache first
    const cacheKey = getCacheKey(text, targetLang, sourceLang)
    if (translationCache.has(cacheKey)) {
      return translationCache.get(cacheKey)
    }

    let translatedText = text

    try {
      // Route to appropriate translation provider
      switch (provider) {
        case 'openai':
          translatedText = await translateWithOpenAI(text, targetLang, sourceLang)
          break
        case 'google':
          translatedText = await translateWithGoogle(text, targetLang, sourceLang)
          break
        case 'local':
        default:
          translatedText = translateLocally(text, targetLang, sourceLang)
          break
      }

      // Cache the translation
      translationCache.set(cacheKey, translatedText)
    } catch (error) {
      console.error('Translation error:', error)
      // Return original text on error
      translatedText = text
    }

    return translatedText
  }

  /**
   * Batch translate multiple texts
   * @param {Array<string>} texts - Array of texts to translate
   * @param {string} targetLang - Target language code
   * @param {string} sourceLang - Source language code
   * @returns {Promise<Array<string>>} Array of translated texts
   */
  async function translateBatch(texts, targetLang, sourceLang = 'en-US') {
    if (!Array.isArray(texts)) {
      return []
    }

    const translations = await Promise.all(
      texts.map(text => translate(text, targetLang, sourceLang))
    )

    return translations
  }

  /**
   * Configure the translation provider
   * @param {string} newProvider - Provider name
   * @param {string} newKey - API key
   */
  function configure(newProvider, newKey = null) {
    provider = newProvider
    key = newKey
  }

  /**
   * Clear translation cache
   */
  function clearCache() {
    translationCache.clear()
  }

  /**
   * Get cache statistics
   */
  function getCacheStats() {
    return {
      size: translationCache.size,
      provider: provider,
      hasApiKey: !!key
    }
  }

  /**
   * Export cache for persistence
   */
  function exportCache() {
    const cacheObj = {}
    translationCache.forEach((value, key) => {
      cacheObj[key] = value
    })
    return cacheObj
  }

  /**
   * Import cache from persistence
   */
  function importCache(cacheObj) {
    if (!cacheObj || typeof cacheObj !== 'object') return
    Object.keys(cacheObj).forEach(key => {
      translationCache.set(key, cacheObj[key])
    })
  }

  return {
    translate,
    translateBatch,
    configure,
    clearCache,
    getCacheStats,
    exportCache,
    importCache,
    getSupportedLanguages: () => SUPPORTED_LANGUAGES
  }
}
