function dbErrorResponse(res, err) {
  console.error(err);
  return res.status(500).json({
    error: 'db error',
    details: err && err.message ? err.message : String(err)
  });
}

function invalidJsonErrorHandler(err, req, res, next) {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'Invalid JSON payload' });
  }
  return next(err);
}

module.exports = {
  dbErrorResponse,
  invalidJsonErrorHandler
};
