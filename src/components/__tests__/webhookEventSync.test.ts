import { SUPPORTED_EVENTS } from '@socialflow/shared';
import { SUPPORTED_EVENTS as BACKEND_EVENTS } from '../../../backend/src/schemas/webhooks';

describe('webhook event type sync', () => {
  it('frontend and backend SUPPORTED_EVENTS are identical', () => {
    expect([...SUPPORTED_EVENTS].sort()).toEqual([...BACKEND_EVENTS].sort());
  });
});
