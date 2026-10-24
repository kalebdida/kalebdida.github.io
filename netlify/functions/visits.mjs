import { createRelay } from '../relay.mjs';

export const config = {
  path: '/visits',
  rateLimit: { windowLimit: 60, windowSize: 60, aggregateBy: ['ip'] },
};

export default createRelay('/visits');
