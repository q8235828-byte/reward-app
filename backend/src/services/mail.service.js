const nodemailer = require('nodemailer');
const env = require('../config/env');
const settingsService = require('./settings.service');

// SMTP config can be overridden from the admin Settings page (stored in
// app_settings); any field left blank there falls back to the environment
// variables set at deploy time. Resolved fresh on every send (not cached
// at module load, unlike the old implementation) so a settings change
// takes effect immediately without a process restart.
async function resolveMailConfig() {
  const [dbHost, dbPort, dbSecure, dbUser, dbPassword, dbFrom] = await Promise.all([
    settingsService.getRaw('smtp_host', ''),
    settingsService.getRaw('smtp_port', ''),
    settingsService.getRaw('smtp_secure', ''),
    settingsService.getRaw('smtp_user', ''),
    settingsService.getRaw('smtp_password', ''),
    settingsService.getRaw('mail_from', ''),
  ]);

  return {
    host: dbHost || env.mail.host,
    port: dbPort ? Number(dbPort) : env.mail.port,
    secure: dbSecure ? dbSecure === 'true' : env.mail.secure,
    user: dbUser || env.mail.user,
    password: dbPassword || env.mail.password,
    from: dbFrom || env.mail.from,
  };
}

async function getMailer() {
  const config = await resolveMailConfig();
  if (!config.host) return null;

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.user ? { user: config.user, pass: config.password } : undefined,
  });

  return { transporter, from: config.from || 'no-reply@example.com' };
}

async function sendPasswordResetEmail(to, resetUrl) {
  const mailer = await getMailer();
  if (!mailer) {
    console.log(`[DEV] Password reset link for ${to}: ${resetUrl}`);
    return;
  }

  await mailer.transporter.sendMail({
    from: mailer.from,
    to,
    subject: 'Reset your password',
    text: `Use this link to reset your password (valid for ${env.auth.resetTokenExpiryMinutes} minutes): ${resetUrl}`,
    html: `<p>Use this link to reset your password (valid for ${env.auth.resetTokenExpiryMinutes} minutes):</p><p><a href="${resetUrl}">${resetUrl}</a></p>`,
  });
}

async function sendVerificationCodeEmail(to, code, expiryMinutes) {
  const mailer = await getMailer();
  if (!mailer) {
    console.log(`[DEV] Email verification code for ${to}: ${code}`);
    return;
  }

  await mailer.transporter.sendMail({
    from: mailer.from,
    to,
    subject: 'Verify your email',
    text: `Your verification code is ${code}. It expires in ${expiryMinutes} minutes.`,
    html: `<p>Your verification code is:</p><p style="font-size:24px;font-weight:700;letter-spacing:4px;">${code}</p><p>It expires in ${expiryMinutes} minutes.</p>`,
  });
}

async function sendTestEmail(to) {
  const mailer = await getMailer();
  if (!mailer) {
    const error = new Error('SMTP is not configured yet. Fill in the email settings below (or the SMTP_* environment variables) first.');
    error.statusCode = 422;
    throw error;
  }

  await mailer.transporter.sendMail({
    from: mailer.from,
    to,
    subject: 'Test email',
    text: 'This is a test email confirming your SMTP settings are working correctly.',
    html: '<p>This is a test email confirming your SMTP settings are working correctly.</p>',
  });
}

module.exports = { sendPasswordResetEmail, sendVerificationCodeEmail, sendTestEmail };
