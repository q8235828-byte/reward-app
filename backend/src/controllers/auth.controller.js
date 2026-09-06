const crypto = require('crypto');
const authService = require('../services/auth.service');
const env = require('../config/env');

function setAuthCookies(res, token) {
  res.cookie(env.auth.cookieName, token, {
    httpOnly: true,
    secure: env.nodeEnv === 'production',
    sameSite: 'lax',
    maxAge: env.auth.cookieMaxAgeMs,
    path: '/',
  });
  // Not httpOnly on purpose - see the comment on csrfCookieName in
  // config/env.js. Generated fresh per login, independent of the JWT.
  res.cookie(env.auth.csrfCookieName, crypto.randomBytes(24).toString('hex'), {
    httpOnly: false,
    secure: env.nodeEnv === 'production',
    sameSite: 'lax',
    maxAge: env.auth.cookieMaxAgeMs,
    path: '/',
  });
}

function clearAuthCookies(res) {
  res.clearCookie(env.auth.cookieName, { path: '/' });
  res.clearCookie(env.auth.csrfCookieName, { path: '/' });
}

async function register(req, res, next) {
  try {
    const user = await authService.register(req.body);
    res.status(201).json({ success: true, message: 'Registration successful.', data: { user } });
  } catch (error) {
    next(error);
  }
}

async function login(req, res, next) {
  try {
    const { token, user } = await authService.login(req.body);
    setAuthCookies(res, token);
    res.status(200).json({ success: true, message: 'Login successful.', data: { user } });
  } catch (error) {
    next(error);
  }
}

async function logout(req, res, next) {
  try {
    await authService.logout(req.user.id);
    clearAuthCookies(res);
    res.status(200).json({ success: true, message: 'Logged out.' });
  } catch (error) {
    next(error);
  }
}

async function me(req, res) {
  res.status(200).json({ success: true, data: { user: req.user } });
}

async function changePassword(req, res, next) {
  try {
    await authService.changePassword({ userId: req.user.id, ...req.body });
    clearAuthCookies(res);
    res.status(200).json({ success: true, message: 'Password updated successfully. Please log in again.' });
  } catch (error) {
    next(error);
  }
}

async function requestPasswordReset(req, res, next) {
  try {
    await authService.requestPasswordReset(req.body);
    res.status(200).json({ success: true, message: 'If that email is registered, a reset link has been sent.' });
  } catch (error) {
    next(error);
  }
}

async function confirmPasswordReset(req, res, next) {
  try {
    await authService.confirmPasswordReset(req.body);
    res.status(200).json({ success: true, message: 'Password has been reset. You can now log in.' });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  register, login, logout, me, changePassword, requestPasswordReset, confirmPasswordReset,
};
