const settingsService = require('../services/settings.service');

// Only a safe, user-relevant subset - not the full app_settings table
// (that's GET /api/admin/settings). The withdrawal page needs these
// values to show limits/eligibility before the user submits, rather than
// only finding out via a failed request.
async function getPublicSettings(req, res, next) {
  try {
    const [
      minimumWithdrawal,
      maximumWithdrawal,
      withdrawalMinAccountAgeDays,
      currency,
      referralThreshold,
      siteName,
      logoUrl,
    ] = await Promise.all([
      settingsService.getNumber('minimum_withdrawal', 500),
      settingsService.getNumber('maximum_withdrawal', 25000),
      settingsService.getNumber('withdrawal_min_account_age_days', 14),
      settingsService.getRaw('currency', 'PKR'),
      settingsService.getNumber('referral_threshold', 5),
      settingsService.getRaw('site_name', 'Rewards'),
      settingsService.getRaw('logo_url', ''),
    ]);

    res.status(200).json({
      success: true,
      data: {
        settings: {
          minimumWithdrawal,
          maximumWithdrawal,
          withdrawalMinAccountAgeDays,
          currency,
          referralThreshold,
          siteName: siteName || 'Rewards',
          logoUrl: logoUrl || '',
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { getPublicSettings };
