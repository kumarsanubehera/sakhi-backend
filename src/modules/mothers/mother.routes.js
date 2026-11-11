import { Router } from 'express';
import Joi from 'joi';
import { authMiddleware } from '../../common/middleware/authMiddleware.js';
import { allowRoles } from '../../common/guards/roleGuard.js';
import { validate } from '../../common/validators/validate.js';
import { STAFF_ROLES } from '../../common/utils/helpers.js';
import * as motherController from './mother.controller.js';
const router = Router();
const objectId = Joi.string().hex().length(24);
const staff = allowRoles(...STAFF_ROLES);
const motherBody = Joi.object({
  name: Joi.string().trim().min(2).max(80).required(),
  age: Joi.number().integer().min(12).max(55),
  dob: Joi.date().allow(null),
  phone: Joi.string().pattern(/^[6-9]\d{9}$/).allow(''),
  alternatePhone: Joi.string().pattern(/^[6-9]\d{9}$/).allow(''),
  husbandOrGuardian: Joi.string().trim().max(80).allow(''),
  address: Joi.string().trim().max(240).allow(''),
  village: objectId.allow(null),
  block: objectId.allow(null),
  district: objectId.allow(null),
  facility: objectId.allow(null),
  assignedAsha: objectId.allow(null),
  userAccount: objectId.allow(null),
  bloodGroup: Joi.string().valid('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'),
  abhaId: Joi.string().trim().max(20).allow(''),
  rchId: Joi.string().trim().max(30).allow(''),
  aadhaarLast4: Joi.string().pattern(/^\d{4}$/).allow(''),
  status: Joi.string().valid('active', 'postpartum', 'referred', 'inactive'),
  clientId: Joi.string().trim().max(80),
});
router.use(authMiddleware);
router.post('/', staff, validate(motherBody), motherController.create);
router.get('/', motherController.list);
router.get('/:id', motherController.getOne);
router.patch('/:id', staff, validate(motherBody.fork(
  ['name'],
  (field) => field.optional(),
)), motherController.update);
export default router;