import { Router } from 'express';
import Joi from 'joi';
import { authMiddleware } from '../../common/middleware/authMiddleware.js';
import { allowRoles } from '../../common/guards/roleGuard.js';
import { validate } from '../../common/validators/validate.js';
import { STAFF_ROLES } from '../../common/utils/helpers.js';
import { DANGER_SIGNS } from './observation.model.js';
import * as observationController from './observation.controller.js';
const router = Router();
const objectId = Joi.string().hex().length(24);
const dipstick = Joi.string().valid('nil', 'trace', '+', '++', '+++', '');
router.use(authMiddleware);
router.post(
  '/',
  allowRoles(...STAFF_ROLES),
  validate(Joi.object({
    motherId: objectId.required(),
    pregnancyId: objectId,
    visitId: objectId,
    weightKg: Joi.number().min(20).max(200),
    heightCm: Joi.number().min(100).max(220),
    bpSystolic: Joi.number().min(60).max(250),
    bpDiastolic: Joi.number().min(40).max(160),
    hemoglobin: Joi.number().min(2).max(20),
    bloodGlucose: Joi.number().min(30).max(600),
    temperatureC: Joi.number().min(34).max(43),
    pulse: Joi.number().min(30).max(220),
    fetalHeartRate: Joi.number().min(60).max(220),
    fundalHeightCm: Joi.number().min(0).max(50),
    urineAlbumin: dipstick,
    urineSugar: dipstick,
    fetalMovements: Joi.string().valid('normal', 'reduced', 'absent', ''),
    edema: Joi.boolean(),
    dangerSigns: Joi.array().items(Joi.string().valid(...DANGER_SIGNS)).default([]),
    notes: Joi.string().allow(''),
    clientId: Joi.string().trim().max(80),
  })),
  observationController.create,
);
router.get('/', observationController.list);
router.get('/:id', observationController.getOne);
export default router;