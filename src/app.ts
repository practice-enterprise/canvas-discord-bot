import dotenv from 'dotenv';
import winston from 'winston';
import { Logger } from './util/logger';
import { LoggingWinston } from '@google-cloud/logging-winston';
import { MeshService } from './services/mesh-service';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const exitHook = require('async-exit-hook');

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

export let mesh: MeshService | undefined;

exitHook((callback: () => void) => {
  if (mesh) {
    Logger.info('Leaving mesh before shutdown');
    mesh.destroy().then(() => callback());
  } else {
    callback();
  }
});


(async () => {
  mesh = new MeshService();
})();

