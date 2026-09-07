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

module.exports = { sendTestEmail };
