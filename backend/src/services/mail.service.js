const nodemailer = require('nodemailer');
const env = require('../config/env');

let transporter = null;

if (env.mail.host) {
  transporter = nodemailer.createTransport({
    host: env.mail.host,
    port: env.mail.port,
    secure: env.mail.secure,
    auth: env.mail.user ? { user: env.mail.user, pass: env.mail.password } : undefined,
  });
} else if (env.nodeEnv === 'production') {
  console.warn('SMTP is not configured. Password reset and verification emails will not be delivered.');
}

async function sendPasswordResetEmail(to, resetUrl) {
  if (!transporter) {
    console.log(`[DEV] Password reset link for ${to}: ${resetUrl}`);
    return;
  }

  await transporter.sendMail({
    from: env.mail.from,
    to,
    subject: 'Reset your password',
    text: `Use this link to reset your password (valid for ${env.auth.resetTokenExpiryMinutes} minutes): ${resetUrl}`,
    html: `<p>Use this link to reset your password (valid for ${env.auth.resetTokenExpiryMinutes} minutes):</p><p><a href="${resetUrl}">${resetUrl}</a></p>`,
  });
}

async function sendVerificationCodeEmail(to, code, expiryMinutes) {
  if (!transporter) {
    console.log(`[DEV] Email verification code for ${to}: ${code}`);
    return;
  }

  await transporter.sendMail({
    from: env.mail.from,
    to,
    subject: 'Verify your email',
    text: `Your verification code is ${code}. It expires in ${expiryMinutes} minutes.`,
    html: `<p>Your verification code is:</p><p style="font-size:24px;font-weight:700;letter-spacing:4px;">${code}</p><p>It expires in ${expiryMinutes} minutes.</p>`,
  });
}

module.exports = { sendPasswordResetEmail, sendVerificationCodeEmail };
