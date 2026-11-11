import { Router } from 'express';
import Joi from 'joi';
import { authMiddleware } from '../../common/middleware/authMiddleware.js';
import { allowRoles } from '../../common/guards/roleGuard.js';
import { validate } from '../../common/validators/validate.js';
import { ROLE_NAMES } from '../roles/role.model.js';
import * as userController from './user.controller.js';
const router = Router();
const objectId = Joi.string().hex().length(24);
router.use(authMiddleware);
router.post(
  '/',
  allowRoles('admin'),
  validate(Joi.object({
    name: Joi.string().trim().min(2).max(80).required(),
    phone: Joi.string().pattern(/^[6-9]\d{9}$/).required(),
    email: Joi.string().email().allow(''),
    password: Joi.string().min(8).max(72).required(),
    role: Joi.string().valid(...ROLE_NAMES).required(),
    location: objectId.allow(null),
    language: Joi.string().valid('en', 'hi'),
  })),
  userController.create,
);
router.get('/', allowRoles('admin', 'medical_officer'), userController.list);
router.get('/:id', userController.getOne);
router.patch(
  '/:id',
  validate(Joi.object({
    name: Joi.string().trim().min(2).max(80),
    phone: Joi.string().pattern(/^[6-9]\d{9}$/),
    email: Joi.string().email().allow(''),
    password: Joi.string().min(8).max(72),
    role: Joi.string().valid(...ROLE_NAMES),
    location: objectId.allow(null),
    language: Joi.string().valid('en', 'hi'),
    fcmToken: Joi.string().allow(''),
    isActive: Joi.boolean(),
  })),
  userController.update,
);
export default router;