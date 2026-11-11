import { AppError, pick } from '../../common/utils/helpers.js';
import { Role } from '../roles/role.model.js';
import { User } from './user.model.js';
const SELF_FIELDS = ['name', 'language', 'fcmToken', 'email'];
const ADMIN_FIELDS = [...SELF_FIELDS, 'role', 'isActive', 'location', 'phone', 'password'];
export async function createUser(input) {
  const role = await Role.findOne({ name: input.role });
  if (!role) throw new AppError('Unknown role', 400);
  const existing = await User.findOne({ phone: input.phone });
  if (existing) throw new AppError('phone already exists', 409);
  return User.create(input);
}
export async function updateUser(userId, input, actor) {
  const user = await User.findById(userId);
  if (!user) throw new AppError('User not found', 404);
  const isSelf = actor.id === user.id;
  if (actor.role !== 'admin' && !isSelf) throw new AppError('You do not have access to this user', 403);
  const fields = actor.role === 'admin' ? ADMIN_FIELDS : SELF_FIELDS;
  Object.assign(user, pick(input, fields));
  if (input.role && actor.role === 'admin') {
    const role = await Role.findOne({ name: input.role });
    if (!role) throw new AppError('Unknown role', 400);
  }
  await user.save();
  return user;
}