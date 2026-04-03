import { config } from './config.js';

const appName = config.appName;

const escapeHtml = (value) =>
  String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const baseTemplate = ({ preheader, title, intro, ctaLabel, ctaHref, outro }) => ({
  subjectTitle: title,
  html: `
    <div style="margin:0;padding:24px;background:#f6f1e8;font-family:Inter,Arial,sans-serif;color:#141414;">
      <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</div>
      <div style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:24px;overflow:hidden;border:1px solid #e5dccd;">
        <div style="padding:32px 32px 20px;background:linear-gradient(135deg,#111111 0%,#2a2a2a 100%);color:#ffffff;">
          <div style="font-size:12px;letter-spacing:0.18em;text-transform:uppercase;opacity:0.7;">${escapeHtml(
            appName
          )}</div>
          <h1 style="margin:16px 0 0;font-size:32px;line-height:1.1;font-family:Georgia,serif;">${escapeHtml(
            title
          )}</h1>
        </div>
        <div style="padding:32px;">
          <p style="margin:0 0 20px;font-size:16px;line-height:1.7;color:#353535;">${escapeHtml(intro)}</p>
          ${
            ctaHref && ctaLabel
              ? `<p style="margin:28px 0;">
                   <a href="${ctaHref}" style="display:inline-block;padding:14px 22px;border-radius:999px;background:#111111;color:#ffffff;text-decoration:none;font-weight:600;">
                     ${escapeHtml(ctaLabel)}
                   </a>
                 </p>
                 <p style="margin:0 0 20px;font-size:13px;line-height:1.6;color:#6b6b6b;word-break:break-all;">${escapeHtml(
                   ctaHref
                 )}</p>`
              : ''
          }
          <p style="margin:0;font-size:14px;line-height:1.7;color:#6b6b6b;">${escapeHtml(outro)}</p>
        </div>
      </div>
    </div>
  `,
});

export const buildWelcomeEmail = ({ email, fullName }) => {
  const firstName = fullName?.trim() || email.split('@')[0];
  const title = `Welcome to ${appName}`;
  const intro = `${firstName}, your account is ready. You can now sign in, explore upcoming events, apply for positions, and manage your profile in ${appName}.`;
  const ctaHref = config.appUrl || '';
  const template = baseTemplate({
    preheader: `Your ${appName} account is ready`,
    title,
    intro,
    ctaLabel: ctaHref ? 'Open Website' : '',
    ctaHref,
    outro: 'If you did not create this account, reply to this email and the team can help.',
  });

  return {
    subject: title,
    html: template.html,
    text: `${title}\n\n${intro}\n\n${ctaHref ? `${ctaHref}\n\n` : ''}If you did not create this account, reply to this email and the team can help.`,
  };
};

export const buildPasswordResetEmail = ({ email, resetUrl }) => {
  const title = 'Reset your password';
  const intro = `We received a request to reset the password for ${email}. Use the button below to choose a new password.`;
  const template = baseTemplate({
    preheader: 'Use this link to reset your password',
    title,
    intro,
    ctaLabel: 'Reset Password',
    ctaHref: resetUrl,
    outro: 'This link will expire in 1 hour. If you did not request it, you can ignore this email.',
  });

  return {
    subject: `${appName} password reset`,
    html: template.html,
    text: `${title}\n\n${intro}\n\n${resetUrl}\n\nThis link will expire in 1 hour. If you did not request it, you can ignore this email.`,
  };
};

export const buildMagicLoginEmail = ({ email, magicUrl }) => {
  const title = 'Your magic sign-in link';
  const intro = `Use this one-time link to sign in to ${appName} without entering a password for ${email}.`;
  const template = baseTemplate({
    preheader: 'Use this one-time link to sign in',
    title,
    intro,
    ctaLabel: 'Sign In Instantly',
    ctaHref: magicUrl,
    outro: 'This link will expire in 20 minutes and can only be used once. If you did not request it, ignore this email.',
  });

  return {
    subject: `${appName} magic login`,
    html: template.html,
    text: `${title}\n\n${intro}\n\n${magicUrl}\n\nThis link will expire in 20 minutes and can only be used once. If you did not request it, ignore this email.`,
  };
};
