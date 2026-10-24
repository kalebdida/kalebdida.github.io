import { createRelay } from '../relay.mjs';

export const config = {
  path: '/notes',
  rateLimit: { windowLimit: 3, windowSize: 60, aggregateBy: ['ip'] },
};

export default createRelay('/notes');
