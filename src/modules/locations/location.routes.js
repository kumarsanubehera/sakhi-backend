import { Router } from 'express';
import Joi from 'joi';
import { authMiddleware } from '../../common/middleware/authMiddleware.js';
import { allowRoles } from '../../common/guards/roleGuard.js';
import { validate } from '../../common/validators/validate.js';
import { FACILITY_TYPES, LOCATION_TYPES } from './location.model.js';
import * as locationController from './location.controller.js';
const router = Router();
const objectId = Joi.string().hex().length(24);
const admin = allowRoles('admin');
const body = Joi.object({
  name: Joi.string().trim().min(2).max(80).required(),
  code: Joi.string().trim().min(2).max(20).required(),
  type: Joi.string().valid(...LOCATION_TYPES).required(),
  parent: objectId.allow(null),
  facilityType: Joi.string().valid(...FACILITY_TYPES).allow(null),
});
router.use(authMiddleware);
router.post('/', admin, validate(body), locationController.create);
router.get('/', locationController.list);
router.get('/:id', locationController.getOne);
router.patch('/:id', admin, validate(body.fork(['name', 'code', 'type'], (field) => field.optional())), locationController.update);
router.delete('/:id', admin, locationController.remove);
export default router;