import winston from 'winston';

export const Logger = getLogger();


export function getLogger(): winston.Logger {
  return winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [],
    levels: {
      emerg: 0,
      alert: 1,
      crit: 2,
      error: 3,
      warn: 4,
      notice: 5,
      info: 6,
      debug: 7
    }
  });
}
