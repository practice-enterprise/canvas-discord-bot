import dotenv from 'dotenv';
import { buildClient } from './discord';
import { ReminderService } from './services/reminder-service';

if (process.env.NODE_ENV == null || process.env.NODE_ENV === 'develepmont') {
  dotenv.config();
}

(async () => {
  const client = await buildClient();
  ReminderService.initReminderJob(client);
})();
