const { z } = require('zod');

// Optional date override (YYYY-MM-DD) for manual backfill/testing by
// whoever holds CRON_SECRET. A plain cron POST with no body omits it and
// defaults to today, inside the controller.
const processDailyRewardsSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be in YYYY-MM-DD format').optional(),
});

module.exports = { processDailyRewardsSchema };
