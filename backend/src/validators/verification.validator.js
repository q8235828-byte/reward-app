const { z } = require('zod');

const confirmCodeSchema = z.object({
  code: z.string().trim().regex(/^\d{6}$/, 'Enter the 6-digit code.'),
});

module.exports = { confirmCodeSchema };
