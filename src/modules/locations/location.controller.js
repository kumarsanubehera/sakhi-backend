import { AppError, asyncHandler, pageQuery } from '../../common/utils/helpers.js';
import { created, ok } from '../../common/utils/response.js';
import { Location } from './location.model.js';
export const create = asyncHandler(async (req, res) => {
  if (req.body.type !== 'state' && !req.body.parent) {
    throw new AppError('Parent location is required', 400);
  }
  if (req.body.type === 'state') req.body.parent = null;
  if (req.body.type !== 'facility') req.body.facilityType = null;
  const location = await Location.create(req.body);
  return created(res, location);
});
export const list = asyncHandler(async (req, res) => {
  const { page, limit, skip } = pageQuery(req.query);
  const filter = {};
  if (req.query.type) filter.type = req.query.type;
  if (req.query.parent) filter.parent = req.query.parent;
  const [rows, total] = await Promise.all([
    Location.find(filter).populate('parent', 'name type code').sort({ name: 1 }).skip(skip).limit(limit),
    Location.countDocuments(filter),
  ]);
  return ok(res, rows, 'OK', 200, { page, limit, total });
});
export const getOne = asyncHandler(async (req, res) => {
  const location = await Location.findById(req.params.id).populate('parent', 'name type code');
  if (!location) throw new AppError('Location not found', 404);
  return ok(res, location);
});
export const update = asyncHandler(async (req, res) => {
  const location = await Location.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!location) throw new AppError('Location not found', 404);
  return ok(res, location, 'Location updated');
});
export const remove = asyncHandler(async (req, res) => {
  const child = await Location.exists({ parent: req.params.id });
  if (child) throw new AppError('Remove child locations first', 400);
  const location = await Location.findByIdAndDelete(req.params.id);
  if (!location) throw new AppError('Location not found', 404);
  return ok(res, null, 'Location removed');
});
