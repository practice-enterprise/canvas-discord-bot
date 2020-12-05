import dotenv from 'dotenv';
import { buildClient } from './discord';
import { checkreminderinit } from './checkreminders';

if (process.env.NODE_ENV == null || process.env.NODE_ENV === 'develepmont') {
  dotenv.config();
}

(async () => {
  const client = await buildClient();
  checkreminderinit(client);
})();
