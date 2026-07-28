/**
 * @deprecated This file is deprecated and will be removed in a future version.
 *
 * The canonical implementation lives at:
 * backend/src/services/TwitterService.ts
 *
 * This wrapper re-exports from the canonical location for backward compatibility.
 * Please update your imports to use the canonical location directly:
 *
 * Before:
 *   import { twitterService } from '../services/TwitterService';
 *
 * After:
 *   import { twitterService } from '../../services/TwitterService';
 *
 * See backend/docs/module-architecture.md for the migration plan.
 */

// Re-export everything from the canonical implementation
export {
  TwitterPost,
  TwitterUser,
  TwitterPostRequest,
  TwitterService,
  twitterService,
} from '../../../services/TwitterService';
