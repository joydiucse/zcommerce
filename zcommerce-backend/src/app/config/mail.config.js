import { env } from './env.js';

export default {
  enabled: Boolean(env.SMTP_HOST),
  from: env.MAIL_FROM,
  smtp: {
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
  },
};
