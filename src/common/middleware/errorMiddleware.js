import { env } from '../../config/env.js';
import { AppError } from '../utils/helpers.js';
function normalize(err) {
  if (err instanceof AppError) return err;
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map((item) => item.message).join(', ');
    return new AppError(message || 'Validation failed', 400);
  }
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || err.keyValue || {})[0] || 'value';
    return new AppError(`${field} already exists`, 409);
  }
  if (err.name === 'CastError') return new AppError('Invalid id', 400);
  if (err.name === 'MulterError') return new AppError(err.message, 400);
  if (err.message && err.message.startsWith('Only JPEG')) return new AppError(err.message, 400);
  return err;
}
export function errorMiddleware(err, _req, res, _next) {
  const normalized = normalize(err);
  const status = normalized.statusCode || 500;
  if (status >= 500) console.error(err);
  const hide = status >= 500 && env.nodeEnv === 'production';
  const body = {
    success: false,
    message: hide ? 'Internal server error' : normalized.message || 'Internal server error',
  };
  if (normalized.details) body.details = normalized.details;
  res.status(status).json(body);
}