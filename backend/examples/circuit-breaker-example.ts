/**
 * Circuit Breaker Pattern Example
 * 
 * Demonstrates how circuit breakers protect against cascading failures
 * when external APIs are down or experiencing issues.
 */

import { circuitBreakerService } from '../src/services/CircuitBreakerService';
import { aiService } from '../src/services/AIService';
import { twitterService } from '../src/services/TwitterService';

/**
 * Example 1: Basic Circuit Breaker Usage
 */
async function basicExample() {
  console.log('\n=== Example 1: Basic Circuit Breaker ===\n');

  // Simulate an unreliable API call
  const unreliableAPI = async () => {
    if (Math.random() < 0.7) {
      throw new Error('API temporarily unavailable');
    }
    return 'Success!';
  };

  // Execute with circuit breaker protection
  try {
    const result = await circuitBreakerService.execute(
      'ai',
      unreliableAPI,
      async () => 'Fallback response'
    );
    console.log('Result:', result);
  } catch (error) {
    console.error('Error:', error);
  }

  // Check circuit status
  const stats = circuitBreakerService.getStats('ai');
  console.log('Circuit Stats:', stats);
}

/**
 * Example 2: AI Service with Circuit Breaker
 */
async function aiServiceExample() {
  console.log('\n=== Example 2: AI Service ===\n');

  if (!aiService.isAvailable()) {
    console.log('⚠️  AI service not configured. Set API_KEY environment variable.');
    return;
  }

  try {
    // Generate caption with automatic circuit breaker protection
    const caption = await aiService.generateCaption(
      'New product launch',
      'instagram',
      'exciting'
    );
    console.log('Generated Caption:', caption);
  } catch (error) {
    console.error('AI Service Error:', error);
  }

  // Check circuit status
  const status = aiService.getCircuitStatus();
  console.log('AI Circuit Status:', status);
}

/**
 * Example 3: Twitter Service with Circuit Breaker
 */
async function twitterServiceExample() {
  console.log('\n=== Example 3: Twitter Service ===\n');

  if (!twitterService.isConfigured()) {
    console.log('⚠️  Twitter service not configured. Set TWITTER_BEARER_TOKEN.');
    return;
  }

  try {
    // Post tweet with automatic circuit breaker protection
    const tweet = await twitterService.postTweet({
      text: 'Testing circuit breaker pattern! 🚀 #DevOps',
    });
    console.log('Posted Tweet:', tweet);
  } catch (error) {
    console.error('Twitter Service Error:', error);
  }

  // Check circuit status
  const status = twitterService.getCircuitStatus();
  console.log('Twitter Circuit Status:', status);
}

/**
 * Example 4: Simulating Circuit Opening
 */
async function circuitOpeningExample() {
  console.log('\n=== Example 4: Circuit Opening Simulation ===\n');

  const failingAPI = async () => {
    throw new Error('Service is down');
  };

  console.log('Triggering multiple failures...');

  // Trigger failures to open circuit
  for (let i = 0; i < 10; i++) {
    try {
      await circuitBreakerService.execute(
        'twitter',
        failingAPI,
        async () => 'Fallback'
      );
    } catch (error) {
      console.log(`Attempt ${i + 1}: Failed`);
    }
  }

  // Check if circuit is open
  const isOpen = circuitBreakerService.isOpen('twitter');
  console.log('\nCircuit is now:', isOpen ? '🔴 OPEN' : '🟢 CLOSED');

  // Try to make a call when circuit is open
  try {
    await circuitBreakerService.execute('twitter', failingAPI);
  } catch (error) {
    console.log('Request rejected (circuit is open):', error);
  }

  // Get detailed stats
  const stats = circuitBreakerService.getStats('twitter');
  console.log('\nDetailed Stats:', {
    state: stats.state,
    failures: stats.failures,
    rejects: stats.rejects,
    successes: stats.successes,
  });
}

/**
 * Example 5: Monitoring All Circuit Breakers
 */
async function monitoringExample() {
  console.log('\n=== Example 5: Monitoring All Circuits ===\n');

  // Execute some operations
  const mockSuccess = async () => 'success';
  
  await circuitBreakerService.execute('ai', mockSuccess);
  await circuitBreakerService.execute('twitter', mockSuccess);
  await circuitBreakerService.execute('translation', mockSuccess);

  // Get all stats
  const allStats = circuitBreakerService.getStats();
  
  console.log('All Circuit Breakers:');
  (allStats as any[]).forEach(stat => {
    console.log(`\n${stat.name}:`);
    console.log(`  State: ${stat.state}`);
    console.log(`  Successes: ${stat.successes}`);
    console.log(`  Failures: ${stat.failures}`);
    console.log(`  Avg Latency: ${stat.latency.mean.toFixed(2)}ms`);
  });
}

/**
 * Example 6: Manual Circuit Control
 */
async function manualControlExample() {
  console.log('\n=== Example 6: Manual Circuit Control ===\n');

  // Manually open circuit
  console.log('Manually opening AI circuit...');
  circuitBreakerService.open('ai');
  console.log('Circuit is open:', circuitBreakerService.isOpen('ai'));

  // Try to execute (will be rejected)
  try {
    await circuitBreakerService.execute(
      'ai',
      async () => 'success'
    );
  } catch (error) {
    console.log('Request rejected as expected');
  }

  // Manually close circuit
  console.log('\nManually closing AI circuit...');
  circuitBreakerService.close('ai');
  console.log('Circuit is open:', circuitBreakerService.isOpen('ai'));

  // Now it should work
  const result = await circuitBreakerService.execute(
    'ai',
    async () => 'success'
  );
  console.log('Request succeeded:', result);
}

/**
 * Run all examples
 */
async function main() {
  console.log('🔌 Circuit Breaker Pattern Examples\n');
  console.log('Demonstrates resilient external API integration\n');

  try {
    await basicExample();
    await aiServiceExample();
    await twitterServiceExample();
    await circuitOpeningExample();
    await monitoringExample();
    await manualControlExample();

    console.log('\n✅ All examples completed!\n');
  } catch (error) {
    console.error('\n❌ Example failed:', error);
  } finally {
    // Cleanup
    circuitBreakerService.shutdown();
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

export { main };
