const nodemailer = require('nodemailer');
const logger = require('../config/logger');

/**
 * Thin, swappable mail layer.
 *
 * Today this uses nodemailer's JSON transport, which never actually sends
 * mail over the network — it just serializes the message and lets us log
 * it. That keeps local/dev environments free of any SMTP dependency.
 *
 * To go live later, replace the transport below with a real one, e.g.:
 *
 *   nodemailer.createTransport({
 *     host: process.env.SMTP_HOST,
 *     port: process.env.SMTP_PORT,
 *     auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
 *   });
 *
 * No calling code needs to change — sendMail()'s signature stays the same.
 */
function buildTransport() {
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
    });
  }

  // Dev/default: JSON transport - no network calls, message is returned as JSON.
  return nodemailer.createTransport({ jsonTransport: true });
}

const transport = buildTransport();

async function sendMail({ to, subject, text, html }) {
  const from = process.env.MAIL_FROM || 'no-reply@crystalcoat.example';

  const info = await transport.sendMail({ from, to, subject, text, html });

  if (!process.env.SMTP_HOST) {
    // JSON transport: log so devs can see the "email" (and any reset links) in console.
    logger.info(`[mailer] (dev JSON transport) message to ${to}: ${info.message}`);
  } else {
    logger.info(`[mailer] message sent to ${to}, messageId=${info.messageId}`);
  }

  return info;
}

module.exports = { sendMail };
