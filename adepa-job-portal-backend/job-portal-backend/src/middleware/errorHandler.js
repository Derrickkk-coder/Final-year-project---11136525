// Catches errors thrown or passed via next(err) from any route/controller
// and returns a consistent JSON error shape instead of leaking stack traces.
export function errorHandler(err, req, res, next) {
  console.error(err.stack)

  const statusCode = err.statusCode || 500
  const message = err.message || 'Something went wrong on the server.'

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  })
}

// Catches requests to routes that don't exist
export function notFound(req, res, next) {
  res.status(404).json({ success: false, message: `Route not found: ${req.originalUrl}` })
}
