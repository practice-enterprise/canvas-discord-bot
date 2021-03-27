import dotenv from 'dotenv';
import { buildClient } from './discord';
import { CanvasService } from './services/canvas-service';
import { ReminderService } from './services/reminder-service';
import winston from 'winston';
import { Logger } from './util/logger';
import { LoggingWinston } from '@google-cloud/logging-winston';

if (process.env.NODE_ENV == null || process.env.NODE_ENV === 'develepmont') {
  dotenv.config();
  Logger.add(new winston.transports.Console({ format: winston.format.simple(), level: 'verbose' }));
} else {
  Logger.add(new LoggingWinston({ projectId: process.env.PROJECT_ID, logName: 'discord-canvas', prefix: 's0' }));
  Logger.exceptions.handle(new LoggingWinston({ projectId: process.env.PROJECT_ID, logName: 'discord-canvas', prefix: 's0' }));
}

(async () => {
  const client = await buildClient();
  CanvasService.initAnnouncementJob('a40d37b54851efbcadb35e68bf03d698', client, '780572565240414208'); //Hard coded for now.
  ReminderService.initReminderJob(client);
})();
