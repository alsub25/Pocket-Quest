# AI-Powered Localization System

## Overview

Emberwood: The Blackbark Oath now includes an AI-powered localization system that enables the game to be played in multiple languages. The system supports both pre-translated content and dynamic AI-powered translation using services like OpenAI and Google Translate.

## Features

### Supported Languages

- 🇺🇸 English (en-US) - Base language
- 🇪🇸 Spanish (es-ES)
- 🇫🇷 French (fr-FR)
- 🇩🇪 German (de-DE)
- 🇯🇵 Japanese (ja-JP)
- 🇨🇳 Chinese Simplified (zh-CN)
- 🇧🇷 Portuguese (pt-BR)
- 🇷🇺 Russian (ru-RU)
- 🇰🇷 Korean (ko-KR)
- 🇮🇹 Italian (it-IT)

### Translation Modes

1. **Local Mode** (Default)
   - Uses pre-translated content
   - No API calls required
   - Instant translations
   - Offline-capable

2. **AI Translation Mode**
   - OpenAI GPT-powered translations
   - Google Translate API support
   - Context-aware translations for fantasy RPG content
   - Automatic caching to minimize API calls

## Architecture

### Core Components

```
js/game/services/
  └── aiTranslationService.js     # AI translation service with caching

js/game/plugins/
  └── i18nPlugin.js                # Enhanced i18n plugin with AI support

js/game/data/locales/
  ├── index.js                     # Locale data index
  └── en-US.js                     # English base translations

js/game/ui/
  └── languageSelector.js          # Language selection UI component
```

### How It Works

1. **Translation Service** (`aiTranslationService.js`)
   - Manages multiple translation providers (OpenAI, Google, Local)
   - Implements intelligent caching to avoid redundant API calls
   - Provides batch translation for efficiency
   - Falls back to original text if translation fails

2. **i18n Plugin** (`i18nPlugin.js`)
   - Integrates AI translation service with the game engine
   - Loads locale-specific translations
   - Provides `translateWithAI()` method for dynamic translations
   - Manages language switching

3. **Settings Integration** (`settingsPlugin.js`)
   - Stores language preferences persistently
   - Manages AI translation settings
   - Handles API key configuration (optional)

4. **UI Components** (`languageSelector.js`)
   - Language selector dropdown
   - Language switcher button
   - Automatic translation of UI elements with `data-i18n` attributes

## Usage

### For Players

#### Changing Language

1. Open the game settings
2. Find the "Language" section
3. Select your preferred language from the dropdown
4. The UI will update immediately

#### Enabling AI Translation

1. In settings, enable "AI Translation"
2. Select a translation provider (OpenAI or Google Translate)
3. Optionally provide an API key for better translations
4. The game will now dynamically translate content using AI

### For Developers

#### Adding a New Translation

1. Create a new locale file in `js/game/data/locales/`:

```javascript
// js/game/data/locales/es-ES.js
export const translations = {
  'ui.new_game': 'Nuevo Juego',
  'ui.continue': 'Continuar',
  // ... more translations
}
```

2. Import and register in `js/game/data/locales/index.js`:

```javascript
import { translations as esES } from './es-ES.js'

export const localeData = {
  'en-US': enUS,
  'es-ES': esES  // Add your new locale
}
```

#### Using Translations in Code

```javascript
// Get i18n service from engine
const i18n = engine.getService('i18n')

// Simple translation
const text = i18n.t('ui.new_game')

// Translation with parameters
const message = i18n.t('msg.language_changed', { language: 'Spanish' })

// AI-powered translation (async)
const translated = await i18n.translateWithAI('Welcome to Emberwood', 'es-ES')
```

#### Adding Translatable UI Elements

Use the `data-i18n` attribute for automatic translation:

```html
<button data-i18n="ui.save">Save</button>
<h1 data-i18n="char.create_character">Create Character</h1>
```

Then call `applyTranslations()` to translate all marked elements:

```javascript
import { applyTranslations } from './ui/languageSelector.js'
applyTranslations(engine)
```

#### Configuring AI Translation

```javascript
import { createAiTranslationService } from './services/aiTranslationService.js'

const translationService = createAiTranslationService({
  apiProvider: 'openai',  // or 'google', 'local'
  apiKey: 'your-api-key-here'
})

// Translate text
const translated = await translationService.translate(
  'Hello, adventurer!',
  'es-ES',  // target language
  'en-US'   // source language
)
```

## Configuration

### Translation Providers

#### Local Mode (Default)
- No configuration needed
- Uses pre-translated content only
- Best for offline play

#### OpenAI
- Requires OpenAI API key
- Best translation quality
- Context-aware for RPG content
- Model: GPT-3.5-turbo

```javascript
translationService.configure('openai', 'sk-...')
```

#### Google Translate
- Requires Google Cloud API key
- Good translation quality
- Fast and reliable

```javascript
translationService.configure('google', 'your-google-api-key')
```

### Caching

The system automatically caches all translations to minimize API calls:

```javascript
// Get cache statistics
const stats = translationService.getCacheStats()
console.log(`Cache size: ${stats.size} translations`)

// Export cache for persistence
const cacheData = translationService.exportCache()
localStorage.setItem('translation_cache', JSON.stringify(cacheData))

// Import cache on startup
const savedCache = JSON.parse(localStorage.getItem('translation_cache'))
translationService.importCache(savedCache)

// Clear cache if needed
translationService.clearCache()
```

## Best Practices

1. **Use Translation Keys**: Always use translation keys (e.g., `'ui.new_game'`) instead of hardcoded strings
2. **Pre-translate Common Text**: Add frequently used text to locale files to avoid API calls
3. **Cache Translations**: The system caches automatically, but persist the cache for better performance
4. **Provide Context**: For AI translations, the system provides fantasy RPG context automatically
5. **Fallback Gracefully**: The system falls back to English if translations fail

## Performance

- **Local Mode**: Instant (0ms)
- **Cached Translations**: Instant (0ms)
- **OpenAI API**: ~1-3 seconds per translation
- **Google Translate API**: ~0.5-1 second per translation

The caching system ensures that each unique text is only translated once, making subsequent loads nearly instant.

## Security

- API keys are stored securely in settings
- Never commit API keys to source control
- Use environment variables for production deployments
- Consider using a backend proxy for API calls in production

## Future Enhancements

- [ ] Community-contributed translations
- [ ] Translation memory for consistency
- [ ] Offline translation packages
- [ ] Voice-over support for multiple languages
- [ ] Right-to-left language support (Arabic, Hebrew)
- [ ] Translation quality feedback system

## Credits

AI-powered localization system developed for Emberwood: The Blackbark Oath v1.2.90.
