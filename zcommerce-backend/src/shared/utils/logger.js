import fs from 'node:fs';
import path from 'node:path';
import pino from 'pino';
import appConfig from '../../app/config/app.config.js';
import { isTest } from '../../app/config/env.js';

const streams = [{ level: appConfig.logLevel, stream: process.stdout }];

if (!isTest) {
  try {
    fs.mkdirSync(appConfig.logsDir, { recursive: true });
    streams.push({
      level: appConfig.logLevel,
      stream: pino.destination({ dest: path.join(appConfig.logsDir, 'app.log'), mkdir: true, sync: true }),
    });
  } catch {
    // ignore: logging to file is best-effort
  }
}

export const logger = pino(
  {
    level: isTest ? 'silent' : appConfig.logLevel,
    base: { app: appConfig.name },
    timestamp: pino.stdTimeFunctions.isoTime,
    redact: ['req.headers.authorization', 'password', '*.password', '*.password_hash'],
  },
  pino.multistream(streams),
);

export default logger;
