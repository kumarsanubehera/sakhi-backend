import { AppError, asyncHandler } from '../../common/utils/helpers.js';
import { created, ok } from '../../common/utils/response.js';
import * as motherService from '../mothers/mother.service.js';
import { Referral } from './referral.model.js';
import { notify } from '../notifications/notification.service.js';
import { User } from '../users/user.model.js';
async function loadInScope(id, actor) {
  const referral = await Referral.findById(id).populate('mother', 'name registrationNo').populate('facility', 'name type');
  if (!referral) throw new AppError('Referral not found', 404);
  await motherService.findInScope(referral.mother._id || referral.mother, actor);
  return referral;
}
export const create = asyncHandler(async (req, res) => {
  const mother = await motherService.findInScope(req.body.motherId, req.user);
  const referral = await Referral.create({
    mother: mother.id,
    pregnancy: req.body.pregnancyId,
    visit: req.body.visitId,
    facility: req.body.facility,
    priority: req.body.priority,
    reason: req.body.reason,
    clinicalNotes: req.body.clinicalNotes,
    clientId: req.body.clientId,
    referredBy: req.user.id,
  });
  if (req.body.priority === 'emergency') {
    const officers = await User.find({
      role: 'medical_officer',
      isActive: true,
      ...(mother.district ? { location: mother.district } : {}),
    }).select('_id');
    await Promise.all(officers.map((officer) => notify({
      user: officer.id,
      title: 'Emergency referral',
      body: `${mother.name} needs an emergency referral. ${req.body.reason}`,
      type: 'referral',
      data: { referralId: String(referral.id), motherId: String(mother.id) },
    })));
  }
  return created(res, referral);
});
export const list = asyncHandler(async (req, res) => {
  const motherIds = await motherService.idsInScope(req.user);
  const filter = {};
  if (req.query.motherId) {
    if (motherIds && !motherIds.some((id) => String(id) === req.query.motherId)) return ok(res, []);
    filter.mother = req.query.motherId;
  } else if (motherIds) filter.mother = { $in: motherIds };
  if (req.query.status) filter.status = req.query.status;
  if (req.query.priority) filter.priority = req.query.priority;
  const rows = await Referral.find(filter)
    .populate('mother', 'name registrationNo')
    .populate('facility', 'name type')
    .sort({ createdAt: -1 });
  return ok(res, rows);
});
export const getOne = asyncHandler(async (req, res) => {
  return ok(res, await loadInScope(req.params.id, req.user));
});
export const update = asyncHandler(async (req, res) => {
  const referral = await Referral.findById(req.params.id);
  if (!referral) throw new AppError('Referral not found', 404);
  await motherService.findInScope(referral.mother, req.user);
  const fields = ['status', 'priority', 'clinicalNotes', 'facility'];
  for (const field of fields) {
    if (req.body[field] !== undefined) referral[field] = req.body[field];
  }
  if (['completed', 'cancelled'].includes(referral.status)) referral.closedAt = referral.closedAt || new Date();
  await referral.save();
  return ok(res, referral, 'Referral updated');
});