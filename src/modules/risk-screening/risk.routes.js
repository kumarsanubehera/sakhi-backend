import { Router } from 'express';
import Joi from 'joi';
import { authMiddleware } from '../../common/middleware/authMiddleware.js';
import { allowRoles } from '../../common/guards/roleGuard.js';
import { validate } from '../../common/validators/validate.js';
import { STAFF_ROLES } from '../../common/utils/helpers.js';
import * as riskController from './risk.controller.js';
const router = Router();
const objectId = Joi.string().hex().length(24);
router.use(authMiddleware);
router.post(
  '/screen',
  allowRoles(...STAFF_ROLES),
  validate(Joi.object({
    pregnancyId: objectId.required(),
    observationId: objectId,
  })),
  riskController.screen,
);
router.get('/pregnancies', riskController.list);
export default router;