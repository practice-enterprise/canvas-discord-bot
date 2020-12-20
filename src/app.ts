import dotenv from 'dotenv';
import { buildClient } from './discord';
import { ReminderService } from './services/reminder-service';
import winston from 'winston';
import { Logger } from './util/logger';
import { LoggingWinston } from '@google-cloud/logging-winston';

if (process.env.NODE_ENV == null || process.env.NODE_ENV === 'develepmont') {
  dotenv.config();
  Logger.add(new winston.transports.Console({ format: winston.format.combine(winston.format.colorize(), winston.format.simple()), level: 'debug' }));
  winston.addColors({
    warn: 'yellow',
    error: 'red',
    crit: 'red',
    info: 'blue'
  });
} else {
  Logger.add(new LoggingWinston({ projectId: process.env.PROJECT_ID, logName: 'discord-canvas', prefix: 's0' }));
  Logger.exceptions.handle(new LoggingWinston({ projectId: process.env.PROJECT_ID, logName: 'discord-canvas', prefix: 's0' }));
}

(async () => {
  const client = await buildClient();
  ReminderService.initReminderJob(client);
})();
