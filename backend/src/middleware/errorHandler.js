function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    message: 'Resource not found',
    code: 'NOT_FOUND',
  });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const status = err.statusCode || 500;
  const isProduction = process.env.NODE_ENV === 'production';

  console.error(err);

  res.status(status).json({
    success: false,
    message: isProduction && status === 500 ? 'Something went wrong' : err.message,
    code: err.code || 'INTERNAL_ERROR',
  });
}

module.exports = { notFoundHandler, errorHandler };
