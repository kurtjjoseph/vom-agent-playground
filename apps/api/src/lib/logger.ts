import pino from 'pino';

const isDev = process.env.NODE_ENV === 'development';

export function createLogger(name: string) {
  return pino(
    {
      level: process.env.LOG_LEVEL || 'info',
      name,
    },
    isDev
      ? pino.transport({
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
          },
        })
      : undefined
  );
}
