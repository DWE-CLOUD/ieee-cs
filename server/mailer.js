import nodemailer from 'nodemailer';
import { config } from './config.js';

let transporterPromise = null;

const canSendEmail = () =>
  Boolean(config.smtpHost && config.smtpUser && config.smtpPass && config.mailFrom);

const createTransporter = async () => {
  const transportConfig = {
    ...(config.smtpService ? { service: config.smtpService } : {}),
    ...(config.smtpHost ? { host: config.smtpHost } : {}),
    port: config.smtpPort,
    secure: config.smtpSecure,
    requireTLS: !config.smtpSecure,
    connectionTimeout: config.smtpConnectionTimeoutMs,
    greetingTimeout: config.smtpGreetingTimeoutMs,
    socketTimeout: config.smtpSocketTimeoutMs,
    family: config.smtpFamily,
    auth: {
      user: config.smtpUser,
      pass: config.smtpPass,
    },
    tls: {
      minVersion: 'TLSv1.2',
      servername: config.smtpHost || undefined,
    },
  };

  const transporter = nodemailer.createTransport(transportConfig);

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
      console.error('SMTP transporter setup failed', {
        code: error?.code,
        command: error?.command,
        response: error?.response,
        message: error?.message,
      });
      throw error;
    });
  }

  const transporter = await transporterPromise;
  try {
    await transporter.sendMail({
      from: config.mailFrom,
      to,
      subject,
      html,
      text,
    });
  } catch (error) {
    console.error('SMTP send failed', {
      code: error?.code,
      command: error?.command,
      response: error?.response,
      message: error?.message,
    });
    throw error;
  }
  return true;
};

export const isEmailConfigured = () => canSendEmail();
