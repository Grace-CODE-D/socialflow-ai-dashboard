# Multi-Language Translation Service - Quick Start

## 🌍 Overview

Translate your social media posts into 20+ languages instantly while preserving URLs, mentions, hashtags, and emojis.

## ✨ Key Features

- **20+ Languages** - Major world languages supported
- **Smart Preservation** - URLs, @mentions, #hashtags, emojis stay intact
- **Multi-Provider** - DeepL, Google Translate, Gemini AI
- **Auto-Detection** - Automatically detects source language
- **Batch Translation** - Translate multiple posts at once
- **Translation History** - Access previous translations
- **Export** - Download translations as JSON

## 🚀 Quick Start

### Frontend Usage

```tsx
import { TranslationWidget } from './components/TranslationWidget';

<TranslationWidget 
  text="Hello world! 🌍 Visit https://example.com #global"
  onTranslationComplete={(result) => {
    console.log('Translated to:', result.translations.length, 'languages');
  }}
/>
```

### API Usage

```bash
curl -X POST http://localhost:3001/api/translation/translate \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Amazing product launch! 🚀 #tech",
    "targetLanguages": ["es", "fr", "de"]
  }'
```

## 🔧 Setup

### Option 1: Use Gemini AI (Already Configured)
No additional setup needed! Uses your existing Gemini API key.

### Option 2: Add DeepL (Recommended for Quality)
1. Sign up at https://www.deepl.com/pro-api
2. Get your API key
3. Add to `.env.local`:
```env
DEEPL_API_KEY=your_key_here
```

### Option 3: Add Google Translate
1. Enable API at https://cloud.google.com/translate
2. Get your API key
3. Add to `.env.local`:
```env
GOOGLE_TRANSLATE_API_KEY=your_key_here
```

## 📝 Usage Examples

### Example 1: Simple Translation
```tsx
import { useTranslation } from './hooks/useTranslation';

const { translate, result, loading } = useTranslation();

await translate({
  text: 'Hello world!',
  targetLanguages: ['es', 'fr'],
});

// Result:
// Spanish: ¡Hola mundo!
// French: Bonjour le monde!
```

### Example 2: Preserve Special Elements
```tsx
await translate({
  text: 'Check out @company at https://example.com #trending 🚀',
  targetLanguages: ['es'],
  preserveUrls: true,
  preserveMentions: true,
  preserveHashtags: true,
  preserveEmojis: true,
});

// Spanish: ¡Mira @company en https://example.com #trending 🚀!
// All special elements preserved!
```

### Example 3: Batch Translation
```tsx
const posts = [
  'Post 1 content',
  'Post 2 content',
  'Post 3 content',
];

const batchResult = await translationService.batchTranslate({
  texts: posts,
  targetLanguages: ['es', 'fr', 'de'],
});

console.log(`Translated ${batchResult.translations.length} posts`);
console.log(`Total characters: ${batchResult.totalCharacters}`);
console.log(`Duration: ${batchResult.duration}ms`);
```

### Example 4: Compare Providers
```tsx
const providers = translationService.getAvailableProviders();

providers.forEach(provider => {
  console.log(`${provider.name}: ${provider.available ? '✓' : '✗'}`);
  console.log(`  Languages: ${provider.languages.length}`);
  console.log(`  Char limit: ${provider.characterLimit}`);
});
```

## 🌐 Supported Languages

| Language | Code | Native Name |
|----------|------|-------------|
| English | en | English |
| Spanish | es | Español |
| French | fr | Français |
| German | de | Deutsch |
| Italian | it | Italiano |
| Portuguese | pt | Português |
| Russian | ru | Русский |
| Japanese | ja | 日本語 |
| Korean | ko | 한국어 |
| Chinese | zh | 中文 |
| Arabic | ar | العربية |
| Hindi | hi | हिन्दी |
| Dutch | nl | Nederlands |
| Polish | pl | Polski |
| Turkish | tr | Türkçe |
| Swedish | sv | Svenska |
| Danish | da | Dansk |
| Finnish | fi | Suomi |
| Norwegian | no | Norsk |
| Czech | cs | Čeština |

## 💡 Best Practices

### 1. Choose the Right Provider
- **DeepL**: Best quality, fewer languages
- **Google Translate**: Most languages, good quality
- **Gemini AI**: Context-aware, uses existing key

### 2. Preserve Important Elements
Always enable preservation for:
- URLs (links to your content)
- Mentions (user tags)
- Hashtags (discoverability)
- Emojis (emotional context)

### 3. Validate Translations
```tsx
const validation = await translationService.validateTranslation(
  original,
  translated,
  targetLang
);

if (!validation.valid) {
  console.warn('Issues:', validation.issues);
}
```

### 4. Use Popular Language Pairs
```tsx
const popularPairs = translationService.getPopularLanguagePairs();

// English to European: es, fr, de, pt
// English to Asian: ja, ko, zh
// English to Middle East/India: ar, hi
```

## 📊 Cost Estimation

```tsx
const cost = translationService.estimateCost(
  postContent,
  ['es', 'fr', 'de', 'pt', 'ja'],
  'deepl'
);

console.log(`Characters: ${cost.characters}`);
console.log(`Estimated cost: $${cost.estimatedCost.toFixed(2)}`);
```

## 🎯 Integration with CreatePost

```tsx
// In CreatePost component
import { TranslationWidget } from './TranslationWidget';

const [showTranslation, setShowTranslation] = useState(false);
const [translations, setTranslations] = useState([]);

<button onClick={() => setShowTranslation(true)}>
  <MaterialIcon name="translate" /> Translate
</button>

{showTranslation && (
  <TranslationWidget 
    text={caption}
    onTranslationComplete={(result) => {
      setTranslations(result.translations);
      // Now user can select which translation to use
    }}
  />
)}
```

## 🔍 Translation History

```tsx
// Get history
const history = translationService.getHistory();

// Clear history
translationService.clearHistory();
```

## ⚡ Performance Tips

1. **Batch Similar Content**: Translate multiple posts together
2. **Cache Results**: Store translations for reuse
3. **Use Appropriate Provider**: DeepL for quality, Google for speed
4. **Limit Languages**: Only translate to needed languages

## 🐛 Troubleshooting

### Translation Fails
- Check API key is configured correctly
- Verify character limit not exceeded
- Check internet connection
- Review API quota/billing

### Special Elements Not Preserved
- Ensure preservation flags are enabled
- Check regex patterns match your content
- Verify placeholder restoration logic

### Poor Translation Quality
- Try different provider (DeepL > Google > Gemini)
- Add context in longer posts
- Use simpler sentence structure
- Avoid idioms and slang

## 📱 Mobile Considerations

- Translations work on all devices
- Responsive UI components
- Touch-friendly language selector
- Optimized for small screens

## 🎨 UI Components

### TranslationWidget (Compact)
- Embedded in post creation
- Quick language selection
- Inline results display

### TranslationPanel (Full-Featured)
- Standalone translation interface
- Advanced options
- History management
- Export functionality

## 🔐 Security

- API keys in environment variables only
- No sensitive data in localStorage
- Input sanitization
- Rate limiting (recommended)

## ✅ Ready to Use

The translation service works immediately with your existing Gemini AI setup. Add DeepL or Google Translate API keys for enhanced quality and more languages.

## 📚 More Information

- **Implementation Details**: `IMPLEMENTATION_340.md`
- **API Documentation**: See backend routes
- **Type Definitions**: `src/types/translation.ts`

---

**Start translating now!** No additional setup required if you have Gemini AI configured.
