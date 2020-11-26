import dotenv from 'dotenv';
import { buildClient } from './discord';

if (process.env.NODE_ENV == null || process.env.NODE_ENV === 'develepmont') {
  dotenv.config();
}

(async () => {
  await buildClient();
})();
