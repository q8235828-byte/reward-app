const { z } = require('zod');

const listReferralsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(20),
});

module.exports = { listReferralsQuerySchema };
