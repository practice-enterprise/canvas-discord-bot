import dotenv from 'dotenv';
import { buildClient } from './discord';
import { CanvasService } from './services/canvas-service';
import { ReminderService } from './services/reminder-service';

if (process.env.NODE_ENV == null || process.env.NODE_ENV === 'develepmont') {
  dotenv.config();
}

(async () => {
  const client = await buildClient();
  CanvasService.initAnnouncementJob('a40d37b54851efbcadb35e68bf03d698'); //hardcoded id for test canvas table
  ReminderService.initReminderJob(client);
})();
