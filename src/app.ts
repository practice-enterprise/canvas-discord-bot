import dotenv from 'dotenv';
import { buildClient } from './discord';
import { CanvasService } from './services/canvas-service';
import { ReminderService } from './services/reminder-service';
import { ShardService } from './services/shard-service';

if (process.env.NODE_ENV == null || process.env.NODE_ENV === 'develepmont') {
  dotenv.config();
}

(async () => {
  new ShardService(process.env.API_URL || '');
})();
