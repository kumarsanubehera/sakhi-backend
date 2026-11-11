import { asyncHandler } from '../../common/utils/helpers.js';
import { ok } from '../../common/utils/response.js';
import * as authService from './auth.service.js';
export const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body.phone, req.body.password);
  return ok(res, result, 'Logged in');
});
export const me = asyncHandler(async (req, res) => {
  const user = await authService.me(req.user.id);
  return ok(res, user);
});
export const changePassword = asyncHandler(async (req, res) => {
  await authService.changePassword(req.user.id, req.body.currentPassword, req.body.newPassword);
  return ok(res, null, 'Password updated');
});