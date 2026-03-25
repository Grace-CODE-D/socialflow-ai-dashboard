import { Router, Request, Response } from 'express';
import { circuitBreakerService } from '../services/CircuitBreakerService';
import { aiService } from '../services/AIService';
import { twitterService } from '../services/TwitterService';

const router = Router();

/**
 * GET /api/circuit-breaker/status
 * Get status of all circuit breakers
 */
router.get('/status', (req: Request, res: Response) => {
  try {
    const stats = circuitBreakerService.getStats();
    res.json({
      success: true,
      circuitBreakers: stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/circuit-breaker/status/:service
 * Get status of a specific circuit breaker
 */
router.get('/status/:service', (req: Request, res: Response) => {
  try {
    const { service } = req.params;
    const stats = circuitBreakerService.getStats(service as any);
    res.json({
      success: true,
      circuitBreaker: stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      error: error instanceof Error ? error.message : 'Circuit breaker not found',
    });
  }
});

/**
 * POST /api/circuit-breaker/reset
 * Reset all circuit breakers
 */
router.post('/reset', (req: Request, res: Response) => {
  try {
    circuitBreakerService.resetAll();
    res.json({
      success: true,
      message: 'All circuit breakers reset',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/circuit-breaker/:service/open
 * Manually open a circuit breaker
 */
router.post('/:service/open', (req: Request, res: Response) => {
  try {
    const { service } = req.params;
    circuitBreakerService.open(service as any);
    res.json({
      success: true,
      message: `Circuit breaker opened for ${service}`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/circuit-breaker/:service/close
 * Manually close a circuit breaker
 */
router.post('/:service/close', (req: Request, res: Response) => {
  try {
    const { service } = req.params;
    circuitBreakerService.close(service as any);
    res.json({
      success: true,
      message: `Circuit breaker closed for ${service}`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/circuit-breaker/health
 * Health check for all protected services
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    const health = {
      ai: {
        configured: aiService.isAvailable(),
        circuitOpen: circuitBreakerService.isOpen('ai'),
      },
      twitter: {
        configured: twitterService.isConfigured(),
        circuitOpen: circuitBreakerService.isOpen('twitter'),
      },
      translation: {
        circuitOpen: circuitBreakerService.isOpen('translation'),
      },
    };

    const allHealthy = !health.ai.circuitOpen && 
                       !health.twitter.circuitOpen && 
                       !health.translation.circuitOpen;

    res.status(allHealthy ? 200 : 503).json({
      success: allHealthy,
      services: health,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
