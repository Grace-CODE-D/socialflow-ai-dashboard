/**
 * Example usage of Translation Service
 */

import { translationService } from '../src/services/TranslationService';

// Example 1: Basic translation
async function basicTranslation() {
  console.log('=== Basic Translation ===\n');

  const result = await translationService.translate({
    text: 'Hello world! Welcome to our platform.',
    targetLanguages: ['es', 'fr', 'de'],
  });

  console.log(`Original (${result.sourceLanguage}): ${result.originalText}`);
  console.log('\nTranslations:');
  result.translations.forEach(t => {
    console.log(`  ${t.languageName}: ${t.text}`);
  });
  console.log('\n');
}

// Example 2: Preserve special elements
async function preserveElements() {
  console.log('=== Preserve Special Elements ===\n');

  const postContent = `Check out our new feature! 🚀 
Visit https://example.com for details.
Tag @company and use #innovation #tech`;

  const result = await translationService.translate({
    text: postContent,
    targetLanguages: ['es', 'ja'],
    preserveUrls: true,
    preserveMentions: true,
    preserveHashtags: true,
    preserveEmojis: true,
  });

  console.log('Original:', result.originalText);
  console.log('\nPreserved Elements:');
  result.preservedElements.forEach(el => {
    console.log(`  ${el.type}: ${el.value}`);
  });
  
  console.log('\nTranslations:');
  result.translations.forEach(t => {
    console.log(`\n${t.languageName}:`);
    console.log(t.text);
  });
  console.log('\n');
}

// Example 3: Batch translation
async function batchTranslation() {
  console.log('=== Batch Translation ===\n');

  const posts = [
    'Good morning! Have a great day! ☀️',
    'New product launching soon! Stay tuned! 🎉',
    'Thank you for your support! ❤️',
  ];

  const batchResult = await translationService.batchTranslate({
    texts: posts,
    targetLanguages: ['es', 'fr'],
  });

  console.log(`Translated ${batchResult.translations.length} posts`);
  console.log(`Total characters: ${batchResult.totalCharacters}`);
  console.log(`Duration: ${batchResult.duration}ms`);
  console.log(`Provider: ${batchResult.provider}`);
  
  console.log('\nResults:');
  batchResult.translations.forEach((result, index) => {
    console.log(`\nPost ${index + 1}:`);
    result.translations.forEach(t => {
      console.log(`  ${t.languageName}: ${t.text}`);
    });
  });
  console.log('\n');
}

// Example 4: Language detection
async function languageDetection() {
  console.log('=== Language Detection ===\n');

  const texts = [
    'Hello world',
    'Bonjour le monde',
    'Hola mundo',
    'こんにちは世界',
    '你好世界',
  ];

  for (const text of texts) {
    const result = await translationService.translate({
      text,
      targetLanguages: ['en'],
    });
    
    console.log(`"${text}" → Detected: ${result.sourceLanguage.toUpperCase()}`);
  }
  console.log('\n');
}

// Example 5: Get supported languages
function listSupportedLanguages() {
  console.log('=== Supported Languages ===\n');

  const languages = translationService.getSupportedLanguages();
  
  console.log(`Total: ${languages.length} languages\n`);
  
  languages.forEach(lang => {
    console.log(`${lang.flag} ${lang.name} (${lang.code}) - ${lang.nativeName}`);
  });
  console.log('\n');
}

// Example 6: Check available providers
function checkProviders() {
  console.log('=== Available Translation Providers ===\n');

  const providers = translationService.getAvailableProviders();

  providers.forEach(provider => {
    console.log(`${provider.name}:`);
    console.log(`  Status: ${provider.available ? '✓ Available' : '✗ Not configured'}`);
    console.log(`  Languages: ${provider.languages.length}`);
    console.log(`  Character Limit: ${provider.characterLimit.toLocaleString()}`);
    if (provider.rateLimit) {
      console.log(`  Rate Limit: ${provider.rateLimit.toLocaleString()} chars/month`);
    }
    console.log('');
  });
}

// Example 7: Popular language pairs
function popularLanguagePairs() {
  console.log('=== Popular Language Pairs ===\n');

  const pairs = translationService.getPopularLanguagePairs();

  pairs.forEach(pair => {
    console.log(`${pair.label}:`);
    console.log(`  From: ${pair.from.toUpperCase()}`);
    console.log(`  To: ${pair.to.map(l => l.toUpperCase()).join(', ')}`);
    console.log('');
  });
}

// Example 8: Cost estimation
function estimateTranslationCost() {
  console.log('=== Cost Estimation ===\n');

  const postContent = 'This is a sample post that we want to translate to multiple languages.';
  const targetLanguages = ['es', 'fr', 'de', 'pt', 'ja'];

  const deeplCost = translationService.estimateCost(postContent, targetLanguages, 'deepl');
  const googleCost = translationService.estimateCost(postContent, targetLanguages, 'google');

  console.log('Post length:', postContent.length, 'characters');
  console.log('Target languages:', targetLanguages.length);
  console.log('Total characters:', deeplCost.characters);
  console.log('');
  console.log('DeepL cost:', `$${deeplCost.estimatedCost.toFixed(4)}`);
  console.log('Google cost:', `$${googleCost.estimatedCost.toFixed(4)}`);
  console.log('\n');
}

// Example 9: Translation history
async function translationHistory() {
  console.log('=== Translation History ===\n');

  // Perform a translation
  await translationService.translate({
    text: 'Sample post for history',
    targetLanguages: ['es'],
  });

  // Get history
  const history = translationService.getHistory();
  
  console.log(`Total translations in history: ${history.length}`);
  
  if (history.length > 0) {
    const latest = history[0];
    console.log('\nLatest translation:');
    console.log(`  Original: ${latest.originalText}`);
    console.log(`  Languages: ${latest.translations.map(t => t.language).join(', ')}`);
    console.log(`  Provider: ${latest.provider}`);
    console.log(`  Time: ${latest.timestamp.toLocaleString()}`);
  }
  console.log('\n');
}

// Run all examples
async function runAllExamples() {
  try {
    await basicTranslation();
    await preserveElements();
    await batchTranslation();
    await languageDetection();
    listSupportedLanguages();
    checkProviders();
    popularLanguagePairs();
    estimateTranslationCost();
    await translationHistory();
    
    console.log('✅ All examples completed successfully!');
  } catch (error) {
    console.error('Error running examples:', error);
  }
}

// Run if executed directly
if (require.main === module) {
  runAllExamples();
}

export {
  basicTranslation,
  preserveElements,
  batchTranslation,
  languageDetection,
  listSupportedLanguages,
  checkProviders,
  popularLanguagePairs,
  estimateTranslationCost,
  translationHistory,
};
