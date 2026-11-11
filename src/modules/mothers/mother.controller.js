import { asyncHandler, escapeRegex, pageQuery } from '../../common/utils/helpers.js';
import { created, ok } from '../../common/utils/response.js';
import { Mother, withMotherRefs } from './mother.model.js';
import * as motherService from './mother.service.js';
export const create = asyncHandler(async (req, res) => {
  const mother = await motherService.create(req.body, req.user);
  return created(res, mother);
});
export const list = asyncHandler(async (req, res) => {
  const { page, limit, skip } = pageQuery(req.query);
  const filter = { ...motherService.scopeFilter(req.user) };
  if (req.query.status) filter.status = req.query.status;
  if (req.query.village) filter.village = req.query.village;
  if (req.query.assignedAsha && req.user.role !== 'asha') filter.assignedAsha = req.query.assignedAsha;
  if (req.query.q) {
    const q = new RegExp(escapeRegex(req.query.q), 'i');
    filter.$and = [...(filter.$and || []), {
      $or: [{ name: q }, { phone: q }, { registrationNo: q }],
    }];
  }
  const [rows, total] = await Promise.all([
    withMotherRefs(Mother.find(filter)).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Mother.countDocuments(filter),
  ]);
  return ok(res, rows, 'OK', 200, { page, limit, total });
});
export const getOne = asyncHandler(async (req, res) => {
  await motherService.findInScope(req.params.id, req.user);
  const mother = await withMotherRefs(Mother.findById(req.params.id));
  return ok(res, mother);
});
export const update = asyncHandler(async (req, res) => {
  const mother = await motherService.update(req.params.id, req.body, req.user);
  return ok(res, mother, 'Mother updated');
});