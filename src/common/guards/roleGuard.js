import { AppError } from '../utils/helpers.js';
export const allowRoles = (...roles) => (req, _res, next) => {
  if (!req.user) {
    next(new AppError('Authentication required', 401));
    return;
  }
  if (!roles.includes(req.user.role)) {
    next(new AppError('You do not have access to this action', 403));
    return;
  }
  next();
};