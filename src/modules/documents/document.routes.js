import { Router } from 'express';
import Joi from 'joi';
import { authMiddleware } from '../../common/middleware/authMiddleware.js';
import { allowRoles } from '../../common/guards/roleGuard.js';
import { validate } from '../../common/validators/validate.js';
import { STAFF_ROLES } from '../../common/utils/helpers.js';
import { upload } from '../../config/storage.js';
import { DOC_TYPES } from './document.model.js';
import * as documentController from './document.controller.js';
const router = Router();
const objectId = Joi.string().hex().length(24);
const staff = allowRoles(...STAFF_ROLES);
router.use(authMiddleware);
router.post(
  '/',
  staff,
  upload.single('file'),
  validate(Joi.object({
    motherId: objectId.required(),
    pregnancyId: objectId.allow(''),
    docType: Joi.string().valid(...DOC_TYPES).required(),
  })),
  documentController.create,
);
router.get('/', documentController.list);
router.get('/:id/file', documentController.download);
router.get('/:id', documentController.getOne);
router.delete('/:id', staff, documentController.remove);
export default router;