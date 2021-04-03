import dotenv from 'dotenv';
import { ShardService } from './services/shard-service';
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
  new ShardService(process.env.API_URL || '');
})();
