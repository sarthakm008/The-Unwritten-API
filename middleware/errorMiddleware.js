function notFound(_req, res) {
  res.status(404).json({ success: false, message: 'Route not found' });
}
function errorHandler(err, _req, res, _next) {
  console.error(err);
  if (err.status && err.status < 500) {
    return res.status(err.status).json({ success: false, message: err.message });
  }
  const dbDown = err.name === 'MongooseServerSelectionError' || err.message?.includes('MONGODB_URI');
  return res.status(dbDown ? 503 : 500).json({ success: false, message: dbDown ? 'Game service is temporarily unavailable' : 'An unexpected error occurred' });
}
module.exports = { notFound, errorHandler };
