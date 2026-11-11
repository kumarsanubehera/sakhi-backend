import { Router } from 'express';
import Joi from 'joi';
import { authMiddleware } from '../../common/middleware/authMiddleware.js';
import { allowRoles } from '../../common/guards/roleGuard.js';
import { validate } from '../../common/validators/validate.js';
import { STAFF_ROLES } from '../../common/utils/helpers.js';
import * as referralController from './referral.controller.js';
const router = Router();
const objectId = Joi.string().hex().length(24);
const staff = allowRoles(...STAFF_ROLES);
router.use(authMiddleware);
router.post(
  '/',
  staff,
  validate(Joi.object({
    motherId: objectId.required(),
    pregnancyId: objectId,
    visitId: objectId,
    facility: objectId.allow(null),
    priority: Joi.string().valid('routine', 'urgent', 'emergency').default('urgent'),
    reason: Joi.string().trim().min(3).max(300).required(),
    clinicalNotes: Joi.string().allow('').default(''),
    clientId: Joi.string().trim().max(80),
  })),
  referralController.create,
);
router.get('/', referralController.list);
router.get('/:id', referralController.getOne);
router.patch(
  '/:id',
  staff,
  validate(Joi.object({
    status: Joi.string().valid('pending', 'accepted', 'completed', 'cancelled'),
    priority: Joi.string().valid('routine', 'urgent', 'emergency'),
    clinicalNotes: Joi.string().allow(''),
    facility: objectId.allow(null),
  })),
  referralController.update,
);
export default router;