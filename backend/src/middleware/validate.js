// source: 'body' (default) validates/replaces req.body. 'query' validates
// req.query and stores the parsed result on req.validated.query instead of
// reassigning req.query, since some Express/query-parser setups expose
// req.query as a non-writable getter.
function validate(schema, source = 'body') {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const message = result.error.issues.map((issue) => issue.message).join('; ');
      return res.status(422).json({ success: false, message, code: 'VALIDATION_ERROR' });
    }
    if (source === 'body') {
      req.body = result.data;
    } else {
      req.validated = req.validated || {};
      req.validated[source] = result.data;
    }
    return next();
  };
}

module.exports = { validate };
