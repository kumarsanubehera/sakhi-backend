import { Router } from 'express';
import Joi from 'joi';
import { authMiddleware } from '../../common/middleware/authMiddleware.js';
import { validate } from '../../common/validators/validate.js';
import { AppError, asyncHandler, pageQuery } from '../../common/utils/helpers.js';
import { created, ok } from '../../common/utils/response.js';
import { COMMUNITY_CATEGORIES, CommunityPost } from './community.model.js';
const router = Router();
const objectId = Joi.string().hex().length(24);
router.use(authMiddleware);
router.post(
  '/',
  validate(Joi.object({
    title: Joi.string().trim().min(3).max(120).required(),
    body: Joi.string().trim().min(3).max(2000).required(),
    category: Joi.string().valid(...COMMUNITY_CATEGORIES).default('general'),
    location: objectId.allow(null),
  })),
  asyncHandler(async (req, res) => {
    const post = await CommunityPost.create({ ...req.body, author: req.user.id });
    return created(res, post);
  }),
);
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { page, limit, skip } = pageQuery(req.query);
    const filter = {};
    if (req.query.category) filter.category = req.query.category;
    const [rows, total] = await Promise.all([
      CommunityPost.find(filter).populate('author', 'name role').sort({ pinned: -1, createdAt: -1 }).skip(skip).limit(limit),
      CommunityPost.countDocuments(filter),
    ]);
    return ok(res, rows, 'OK', 200, { page, limit, total });
  }),
);
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const post = await CommunityPost.findById(req.params.id).populate('author', 'name role');
    if (!post) throw new AppError('Post not found', 404);
    return ok(res, post);
  }),
);
router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const post = await CommunityPost.findById(req.params.id);
    if (!post) throw new AppError('Post not found', 404);
    const canDelete = req.user.role === 'admin' || String(post.author) === req.user.id;
    if (!canDelete) throw new AppError('You do not have access to this post', 403);
    await post.deleteOne();
    return ok(res, null, 'Post removed');
  }),
);
export default router;