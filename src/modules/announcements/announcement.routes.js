import { Router } from 'express';
import Joi from 'joi';
import { authMiddleware } from '../../common/middleware/authMiddleware.js';
import { allowRoles } from '../../common/guards/roleGuard.js';
import { validate } from '../../common/validators/validate.js';
import { AppError, asyncHandler } from '../../common/utils/helpers.js';
import { created, ok } from '../../common/utils/response.js';
import { ROLE_NAMES } from '../roles/role.model.js';
import { Announcement } from './announcement.model.js';
const router = Router();
const objectId = Joi.string().hex().length(24);
const editors = allowRoles('admin', 'medical_officer');
const body = Joi.object({
  title: Joi.string().trim().min(3).max(140).required(),
  body: Joi.string().trim().min(3).max(2000).required(),
  audience: Joi.array().items(Joi.string().valid(...ROLE_NAMES)).default([]),
  location: objectId.allow(null),
  startsAt: Joi.date(),
  endsAt: Joi.date().allow(null),
  isActive: Joi.boolean(),
});
router.use(authMiddleware);
router.post(
  '/',
  editors,
  validate(body),
  asyncHandler(async (req, res) => {
    const announcement = await Announcement.create({ ...req.body, createdBy: req.user.id });
    return created(res, announcement);
  }),
);
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const now = new Date();
    const filter = req.user.role === 'admin' && req.query.all === 'true'
      ? {}
      : {
          isActive: true,
          startsAt: { $lte: now },
          $and: [
            { $or: [{ endsAt: null }, { endsAt: { $gte: now } }] },
            { $or: [{ audience: { $size: 0 } }, { audience: req.user.role }] },
            { $or: [{ location: null }, ...(req.user.location ? [{ location: req.user.location }] : [])] },
          ],
        };
    const rows = await Announcement.find(filter).sort({ startsAt: -1 });
    return ok(res, rows);
  }),
);
router.patch(
  '/:id',
  editors,
  validate(body.fork(['title', 'body'], (field) => field.optional())),
  asyncHandler(async (req, res) => {
    const announcement = await Announcement.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!announcement) throw new AppError('Announcement not found', 404);
    return ok(res, announcement, 'Announcement updated');
  }),
);
router.delete(
  '/:id',
  editors,
  asyncHandler(async (req, res) => {
    const announcement = await Announcement.findByIdAndDelete(req.params.id);
    if (!announcement) throw new AppError('Announcement not found', 404);
    return ok(res, null, 'Announcement removed');
  }),
);
export default router;