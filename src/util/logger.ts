import winston from 'winston';

export const Logger = getLogger();


export function getLogger(): winston.Logger {
  return winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [],
  });
}
