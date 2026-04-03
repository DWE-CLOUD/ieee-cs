import nodemailer from 'nodemailer';
import { google } from 'googleapis';
import { config } from './config.js';

let transporterPromise = null;
let gmailClientPromise = null;

const canSendWithResend = () => Boolean(config.resendApiKey && config.mailFrom);

const canSendEmail = () =>
  Boolean(config.smtpHost && config.smtpUser && config.smtpPass && config.mailFrom);

const canSendWithGmailApi = () =>
  Boolean(
    config.gmailClientId &&
      config.gmailClientSecret &&
      config.gmailRefreshToken &&
      config.smtpUser &&
      config.mailFrom
  );

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

const createGmailClient = async () => {
  const oauth2Client = new google.auth.OAuth2(
    config.gmailClientId,
    config.gmailClientSecret,
    config.gmailRedirectUri
  );

  oauth2Client.setCredentials({
    refresh_token: config.gmailRefreshToken,
  });

  await oauth2Client.getAccessToken();

  return google.gmail({
    version: 'v1',
    auth: oauth2Client,
  });
};

const toBase64Url = (input) =>
  Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');

const buildRawEmail = ({ to, subject, html, text }) => {
  const lines = [
    `From: ${config.mailFrom}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    'MIME-Version: 1.0',
    'Content-Type: multipart/alternative; boundary="boundary_123456"',
    '',
    '--boundary_123456',
    'Content-Type: text/plain; charset="UTF-8"',
    '',
    text || '',
    '',
    '--boundary_123456',
    'Content-Type: text/html; charset="UTF-8"',
    '',
    html || '',
    '',
    '--boundary_123456--',
  ];

  return toBase64Url(lines.join('\r\n'));
};

export const sendEmail = async ({ to, subject, html, text }) => {
  if (canSendWithResend()) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.resendApiKey}`,
        },
        body: JSON.stringify({
          from: config.mailFrom,
          to: [to],
          subject,
          html,
          text,
        }),
      });

      if (!response.ok) {
        const payload = await response.text();
        console.error('Resend send failed', {
          status: response.status,
          body: payload,
        });
        throw new Error(`Resend email failed with status ${response.status}`);
      }

      return true;
    } catch (error) {
      console.error('Resend transport failed', {
        message: error?.message,
      });
      throw error;
    }
  }

  if (canSendWithGmailApi()) {
    if (!gmailClientPromise) {
      gmailClientPromise = createGmailClient().catch((error) => {
        gmailClientPromise = null;
        console.error('Gmail API setup failed', {
          code: error?.code,
          response: error?.response?.data || error?.response,
          message: error?.message,
        });
        throw error;
      });
    }

    const gmail = await gmailClientPromise;

    try {
      await gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: buildRawEmail({ to, subject, html, text }),
        },
      });
      return true;
    } catch (error) {
      console.error('Gmail API send failed', {
        code: error?.code,
        response: error?.response?.data || error?.response,
        message: error?.message,
      });
      throw error;
    }
  }

  if (!canSendEmail()) {
    console.warn(`Email skipped for ${to}: Resend, Gmail API, and SMTP are all unconfigured`);
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

export const isEmailConfigured = () => canSendWithResend() || canSendWithGmailApi() || canSendEmail();
