const path = require('path');
const fs = require('fs');
const express = require('express');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const cors = require('cors');
const env = require('./config/env');
const healthRoutes = require('./routes/health.routes');
const authRoutes = require('./routes/auth.routes');
const walletRoutes = require('./routes/wallet.routes');
const transactionRoutes = require('./routes/transaction.routes');
const planRoutes = require('./routes/plan.routes');
const depositRoutes = require('./routes/deposit.routes');
const withdrawalRoutes = require('./routes/withdrawal.routes');
const referralRoutes = require('./routes/referral.routes');
const publicSettingsRoutes = require('./routes/publicSettings.routes');
const internalRoutes = require('./routes/internal.routes');
const adminRoutes = require('./routes/admin.routes');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

const app = express();

// Hostinger terminates SSL upstream and proxies plain HTTP to this app -
// trust proxy so rate limiting and secure cookies see the real client IP/protocol.
app.set('trust proxy', 1);

app.use(helmet());

// Same-origin architecture (frontend/dist is served by this same app in
// production; the Vite dev proxy avoids CORS entirely in development) -
// there's no legitimate cross-origin caller, so the allowed origin is
// pinned to APP_URL rather than left permissive.
app.use(cors({ origin: env.appUrl, credentials: true }));

// 2mb (not the default 100kb) because the admin settings PATCH can carry a
// base64-encoded logo upload in one of its fields (see logo_url setting).
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(cookieParser());

app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/deposits', depositRoutes);
app.use('/api/withdrawals', withdrawalRoutes);
app.use('/api/referrals', referralRoutes);
app.use('/api/settings', publicSettingsRoutes);
app.use('/api/internal', internalRoutes);
app.use('/api/admin', adminRoutes);

// Serve the built React SPA (frontend/dist, produced by `npm run build`
// inside /frontend) if it exists. In local dev the frontend runs on its
// own Vite dev server instead, so this stays inert until a real build is
// present - checked once at startup, not per request.
const frontendDistPath = path.join(__dirname, '../../frontend/dist');
const frontendIndexPath = path.join(frontendDistPath, 'index.html');
const frontendBuildExists = fs.existsSync(frontendIndexPath);

if (frontendBuildExists) {
  app.use(express.static(frontendDistPath));
}

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  if (frontendBuildExists) return res.sendFile(frontendIndexPath);
  return next();
});

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
