import nodemailer from 'nodemailer';
import mailConfig from '../../app/config/mail.config.js';
import { logger } from './logger.js';

let transport;

/** SMTP when configured, otherwise a JSON transport that just logs the message. */
export function getTransport() {
  if (!transport) {
    transport = mailConfig.enabled ? nodemailer.createTransport(mailConfig.smtp) : nodemailer.createTransport({ jsonTransport: true });
  }
  return transport;
}

export async function sendMail({ to, subject, html, text, from }) {
  if (!to) return null;
  const info = await getTransport().sendMail({ from: from || mailConfig.from, to, subject, html, text });
  logger.info({ to, subject, messageId: info.messageId, transport: mailConfig.enabled ? 'smtp' : 'json' }, 'Email sent');
  return info;
}
