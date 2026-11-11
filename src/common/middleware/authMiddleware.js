import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import { AppError, asyncHandler } from '../utils/helpers.js';
import { User } from '../../modules/users/user.model.js';
export const authMiddleware = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) throw new AppError('Authentication required', 401);
  let payload;
  try {
    payload = jwt.verify(token, env.jwtSecret);
  } catch {
    throw new AppError('Invalid or expired token', 401);
  }
  const user = await User.findById(payload.sub);
  if (!user || !user.isActive) throw new AppError('Account is inactive', 401);
  req.user = {
    id: user.id,
    role: user.role,
    name: user.name,
    phone: user.phone,
    location: user.location ? String(user.location) : null,
  };
  next();
});