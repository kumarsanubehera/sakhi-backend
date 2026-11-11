import { Router } from 'express';
import Joi from 'joi';
import { authMiddleware } from '../../common/middleware/authMiddleware.js';
import { allowRoles } from '../../common/guards/roleGuard.js';
import { validate } from '../../common/validators/validate.js';
import { STAFF_ROLES } from '../../common/utils/helpers.js';
import * as pregnancyController from './pregnancy.controller.js';
const router = Router();
const objectId = Joi.string().hex().length(24);
const staff = allowRoles(...STAFF_ROLES);
router.use(authMiddleware);
router.post(
  '/',
  staff,
  validate(Joi.object({
    motherId: objectId.required(),
    lmp: Joi.date().required(),
    gravida: Joi.number().integer().min(1).default(1),
    para: Joi.number().integer().min(0).default(0),
    abortions: Joi.number().integer().min(0).default(0),
    livingChildren: Joi.number().integer().min(0).default(0),
    previousCesarean: Joi.boolean().default(false),
    previousComplications: Joi.string().allow('').default(''),
    clientId: Joi.string().trim().max(80),
  })),
  pregnancyController.create,
);
router.get('/', pregnancyController.list);
router.get('/:id', pregnancyController.getOne);
router.patch(
  '/:id',
  staff,
  validate(Joi.object({
    lmp: Joi.date(),
    gravida: Joi.number().integer().min(1),
    para: Joi.number().integer().min(0),
    abortions: Joi.number().integer().min(0),
    livingChildren: Joi.number().integer().min(0),
    previousCesarean: Joi.boolean(),
    previousComplications: Joi.string().allow(''),
  })),
  pregnancyController.update,
);
router.post(
  '/:id/outcome',
  staff,
  validate(Joi.object({
    status: Joi.string().valid('delivered', 'aborted', 'lost_to_followup').required(),
    outcome: Joi.string().valid('live_birth', 'still_birth'),
    deliveryDate: Joi.date(),
    deliveryType: Joi.string().valid('institutional', 'home'),
    babyWeightGrams: Joi.number().integer().min(300).max(6000),
  })),
  pregnancyController.outcome,
);
export default router;