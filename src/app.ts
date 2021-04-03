import dotenv from 'dotenv';
import { ShardService } from './services/shard-service';

if (process.env.NODE_ENV == null || process.env.NODE_ENV === 'develepmont') {
  dotenv.config();
}

(async () => {
  new ShardService(process.env.API_URL || '');
})();
