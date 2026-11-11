import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import { AppError } from '../../common/utils/helpers.js';
import { User } from '../users/user.model.js';
import { Role } from '../roles/role.model.js';
function signToken(user) {
  return jwt.sign({ sub: user.id, role: user.role }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
}
async function publicUser(user) {
  const plain = user.toJSON();
  const role = await Role.findOne({ name: user.role }).lean();
  plain.permissions = role?.permissions || [];
  return plain;
}
export async function login(phone, password) {
  const user = await User.findOne({ phone }).select('+password');
  if (!user || !user.isActive) throw new AppError('Invalid phone or password', 401);
  const matches = await user.comparePassword(password);
  if (!matches) throw new AppError('Invalid phone or password', 401);
  user.lastLoginAt = new Date();
  await user.save();
  return { token: signToken(user), user: await publicUser(user) };
}
export async function me(userId) {
  const user = await User.findById(userId).populate('location', 'name type code');
  if (!user) throw new AppError('Account not found', 404);
  return publicUser(user);
}
export async function changePassword(userId, currentPassword, newPassword) {
  const user = await User.findById(userId).select('+password');
  if (!user) throw new AppError('Account not found', 404);
  const matches = await user.comparePassword(currentPassword);
  if (!matches) throw new AppError('Current password is incorrect', 400);
  user.password = newPassword;
  await user.save();
}