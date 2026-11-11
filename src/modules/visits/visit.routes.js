import { Router } from 'express';
import Joi from 'joi';
import { authMiddleware } from '../../common/middleware/authMiddleware.js';
import { allowRoles } from '../../common/guards/roleGuard.js';
import { validate } from '../../common/validators/validate.js';
import { STAFF_ROLES } from '../../common/utils/helpers.js';
import * as visitController from './visit.controller.js';
const router = Router();
const objectId = Joi.string().hex().length(24);
const staff = allowRoles(...STAFF_ROLES);
router.use(authMiddleware);
router.get('/due', visitController.due);
router.post(
  '/',
  staff,
  validate(Joi.object({
    motherId: objectId.required(),
    pregnancyId: objectId.required(),
    assignedTo: objectId,
    visitType: Joi.string().valid('anc', 'pnc', 'home', 'referral_followup').required(),
    visitNumber: Joi.number().integer().min(1).default(1),
    scheduledAt: Joi.date(),
    conductedAt: Joi.date(),
    status: Joi.string().valid('scheduled', 'completed', 'missed', 'cancelled').default('scheduled'),
    place: Joi.string().allow(''),
    notes: Joi.string().allow(''),
    nextVisitAt: Joi.date(),
    clientId: Joi.string().trim().max(80),
  })),
  visitController.create,
);
router.get('/', visitController.list);
router.get('/:id', visitController.getOne);
router.patch(
  '/:id',
  staff,
  validate(Joi.object({
    status: Joi.string().valid('scheduled', 'completed', 'missed', 'cancelled'),
    scheduledAt: Joi.date().allow(null),
    conductedAt: Joi.date().allow(null),
    place: Joi.string().allow(''),
    notes: Joi.string().allow(''),
    nextVisitAt: Joi.date().allow(null),
    visitType: Joi.string().valid('anc', 'pnc', 'home', 'referral_followup'),
  })),
  visitController.update,
);
export default router;