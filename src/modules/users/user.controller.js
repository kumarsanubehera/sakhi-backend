import { AppError, asyncHandler, escapeRegex, pageQuery } from '../../common/utils/helpers.js';
import { created, ok } from '../../common/utils/response.js';
import { User } from './user.model.js';
import * as userService from './user.service.js';
export const create = asyncHandler(async (req, res) => {
  const user = await userService.createUser(req.body);
  return created(res, user);
});
export const list = asyncHandler(async (req, res) => {
  const { page, limit, skip } = pageQuery(req.query);
  const filter = {};
  if (req.query.role) filter.role = req.query.role;
  if (req.query.q) {
    const q = new RegExp(escapeRegex(req.query.q), 'i');
    filter.$or = [{ name: q }, { phone: q }];
  }
  const [rows, total] = await Promise.all([
    User.find(filter).populate('location', 'name type code').sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);
  return ok(res, rows, 'OK', 200, { page, limit, total });
});
export const getOne = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'medical_officer' && req.user.id !== req.params.id) {
    throw new AppError('You do not have access to this user', 403);
  }
  const user = await User.findById(req.params.id).populate('location', 'name type code');
  if (!user) throw new AppError('User not found', 404);
  return ok(res, user);
});
export const update = asyncHandler(async (req, res) => {
  const user = await userService.updateUser(req.params.id, req.body, req.user);
  return ok(res, user, 'User updated');
});