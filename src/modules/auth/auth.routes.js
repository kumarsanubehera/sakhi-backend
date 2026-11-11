import { Router } from 'express';
import Joi from 'joi';
import { authMiddleware } from '../../common/middleware/authMiddleware.js';
import { validate } from '../../common/validators/validate.js';
import * as authController from './auth.controller.js';
const router = Router();
const phone = Joi.string().pattern(/^[6-9]\d{9}$/).required();
router.post(
  '/login',
  validate(Joi.object({ phone, password: Joi.string().required() })),
  authController.login,
);
router.get('/me', authMiddleware, authController.me);
router.post(
  '/change-password',
  authMiddleware,
  validate(Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string().min(8).max(72).required(),
  })),
  authController.changePassword,
);
export default router;