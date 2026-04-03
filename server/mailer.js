import nodemailer from 'nodemailer';
import { config } from './config.js';

let transporterPromise = null;

const canSendEmail = () =>
  Boolean(config.smtpHost && config.smtpUser && config.smtpPass && config.mailFrom);

const createTransporter = async () => {
  const transporter = nodemailer.createTransport({
    host: config.smtpHost,
    port: config.smtpPort,
    secure: config.smtpSecure,
    auth: {
      user: config.smtpUser,
      pass: config.smtpPass,
    },
  });

  await transporter.verify();
  return transporter;
};

export const sendEmail = async ({ to, subject, html, text }) => {
  if (!canSendEmail()) {
    console.warn(`Email skipped for ${to}: SMTP is not configured`);
    return false;
  }

  if (!transporterPromise) {
    transporterPromise = createTransporter().catch((error) => {
      transporterPromise = null;
      throw error;
    });
  }

  const transporter = await transporterPromise;
  await transporter.sendMail({
    from: config.mailFrom,
    to,
    subject,
    html,
    text,
  });
  return true;
};

export const isEmailConfigured = () => canSendEmail();
