import { AppError, asyncHandler, endOfDay } from '../../common/utils/helpers.js';
import { created, ok } from '../../common/utils/response.js';
import * as motherService from '../mothers/mother.service.js';
import { Pregnancy } from '../pregnancies/pregnancy.model.js';
import { Visit } from './visit.model.js';
async function assertPregnancy(pregnancyId, motherId, actor) {
  await motherService.findInScope(motherId, actor);
  const pregnancy = await Pregnancy.findOne({ _id: pregnancyId, mother: motherId });
  if (!pregnancy) throw new AppError('Pregnancy not found for this mother', 404);
  return pregnancy;
}
async function refreshAncCount(pregnancyId) {
  const count = await Visit.countDocuments({ pregnancy: pregnancyId, visitType: 'anc', status: 'completed' });
  await Pregnancy.findByIdAndUpdate(pregnancyId, { ancCompletedCount: count });
}
function scopedMother(motherIds, motherId) {
  if (motherId) {
    if (motherIds && !motherIds.some((id) => String(id) === String(motherId))) return { mother: null };
    return { mother: motherId };
  }
  if (motherIds) return { mother: { $in: motherIds } };
  return {};
}
export const create = asyncHandler(async (req, res) => {
  const pregnancy = await assertPregnancy(req.body.pregnancyId, req.body.motherId, req.user);
  const visit = await Visit.create({
    ...req.body,
    mother: req.body.motherId,
    pregnancy: pregnancy.id,
    assignedTo: req.body.assignedTo || pregnancy.assignedTo || undefined,
    conductedBy: req.body.status === 'completed' ? req.user.id : undefined,
    conductedAt: req.body.status === 'completed' ? (req.body.conductedAt || new Date()) : req.body.conductedAt,
  });
  if (visit.status === 'completed') await refreshAncCount(pregnancy.id);
  return created(res, visit);
});
export const list = asyncHandler(async (req, res) => {
  const motherIds = await motherService.idsInScope(req.user);
  const filter = scopedMother(motherIds, req.query.motherId);
  if (req.query.pregnancyId) filter.pregnancy = req.query.pregnancyId;
  if (req.query.status) filter.status = req.query.status;
  if (req.query.visitType) filter.visitType = req.query.visitType;
  if (req.query.from || req.query.to) {
    filter.scheduledAt = {};
    if (req.query.from) filter.scheduledAt.$gte = new Date(req.query.from);
    if (req.query.to) filter.scheduledAt.$lte = new Date(req.query.to);
  }
  const rows = await Visit.find(filter).sort({ scheduledAt: 1 }).populate('mother', 'name registrationNo');
  return ok(res, rows);
});
export const due = asyncHandler(async (req, res) => {
  const motherIds = await motherService.idsInScope(req.user);
  const filter = {
    ...scopedMother(motherIds),
    status: 'scheduled',
    scheduledAt: { $lte: endOfDay() },
  };
  if (req.user.role === 'asha') filter.assignedTo = req.user.id;
  const rows = await Visit.find(filter).sort({ scheduledAt: 1 }).populate('mother', 'name registrationNo phone');
  return ok(res, rows);
});
export const getOne = asyncHandler(async (req, res) => {
  const visit = await Visit.findById(req.params.id).populate('mother', 'name registrationNo');
  if (!visit) throw new AppError('Visit not found', 404);
  await motherService.findInScope(visit.mother._id || visit.mother, req.user);
  return ok(res, visit);
});
export const update = asyncHandler(async (req, res) => {
  const visit = await Visit.findById(req.params.id);
  if (!visit) throw new AppError('Visit not found', 404);
  await motherService.findInScope(visit.mother, req.user);
  const fields = ['status', 'scheduledAt', 'conductedAt', 'place', 'notes', 'nextVisitAt', 'visitType'];
  for (const field of fields) {
    if (req.body[field] !== undefined) visit[field] = req.body[field];
  }
  if (visit.status === 'completed') {
    visit.conductedBy = visit.conductedBy || req.user.id;
    visit.conductedAt = visit.conductedAt || new Date();
  }
  if (visit.status === 'missed' || visit.status === 'cancelled') {
    visit.conductedAt = null;
  }
  await visit.save();
  await refreshAncCount(visit.pregnancy);
  return ok(res, visit, 'Visit updated');
});