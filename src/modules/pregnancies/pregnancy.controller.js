import { ANC_WEEKS, AppError, addDays, asyncHandler, eddFromLmp } from '../../common/utils/helpers.js';
import { created, ok } from '../../common/utils/response.js';
import { Mother } from '../mothers/mother.model.js';
import * as motherService from '../mothers/mother.service.js';
import { Pregnancy } from './pregnancy.model.js';
import { Visit } from '../visits/visit.model.js';
async function loadInScope(id, actor) {
  const pregnancy = await Pregnancy.findById(id);
  if (!pregnancy) throw new AppError('Pregnancy not found', 404);
  await motherService.findInScope(pregnancy.mother, actor);
  return pregnancy;
}
function pregnancyFilter(motherIds, query) {
  const filter = { ...motherService.forMothers(motherIds, query.motherId) };
  if (query.status) filter.status = query.status;
  if (query.riskLevel) filter.riskLevel = query.riskLevel;
  return filter;
}
export const create = asyncHandler(async (req, res) => {
  const mother = await motherService.findInScope(req.body.motherId, req.user);
  const ongoing = await Pregnancy.exists({ mother: mother.id, status: 'ongoing' });
  if (ongoing) throw new AppError('This mother already has an ongoing pregnancy', 409);
  const lmp = new Date(req.body.lmp);
  const pregnancy = await Pregnancy.create({
    mother: mother.id,
    lmp,
    edd: eddFromLmp(lmp),
    gravida: req.body.gravida,
    para: req.body.para,
    abortions: req.body.abortions,
    livingChildren: req.body.livingChildren,
    previousCesarean: req.body.previousCesarean,
    previousComplications: req.body.previousComplications,
    clientId: req.body.clientId,
    createdBy: req.user.id,
  });
  const visits = ANC_WEEKS.map((week, index) => ({
    mother: mother.id,
    pregnancy: pregnancy.id,
    assignedTo: mother.assignedAsha,
    visitType: 'anc',
    visitNumber: index + 1,
    scheduledAt: addDays(lmp, week * 7),
    status: 'scheduled',
    place: 'Home or village health day',
  }));
  try {
    await Visit.insertMany(visits);
  } catch (error) {
    await pregnancy.deleteOne();
    throw error;
  }
  return created(res, pregnancy, 'Pregnancy registered and ANC visits scheduled');
});
export const list = asyncHandler(async (req, res) => {
  const motherIds = await motherService.idsInScope(req.user);
  const rows = await Pregnancy.find(pregnancyFilter(motherIds, req.query))
    .populate('mother', 'name registrationNo phone status')
    .sort({ edd: 1 });
  return ok(res, rows);
});
export const getOne = asyncHandler(async (req, res) => {
  const pregnancy = await loadInScope(req.params.id, req.user);
  await pregnancy.populate('mother', 'name registrationNo phone assignedAsha');
  return ok(res, pregnancy);
});
export const update = asyncHandler(async (req, res) => {
  const pregnancy = await loadInScope(req.params.id, req.user);
  if (req.body.lmp) {
    pregnancy.lmp = req.body.lmp;
    pregnancy.edd = eddFromLmp(req.body.lmp);
  }
  const fields = ['gravida', 'para', 'abortions', 'livingChildren', 'previousCesarean', 'previousComplications'];
  for (const field of fields) {
    if (req.body[field] !== undefined) pregnancy[field] = req.body[field];
  }
  await pregnancy.save();
  return ok(res, pregnancy, 'Pregnancy updated');
});
export const outcome = asyncHandler(async (req, res) => {
  const pregnancy = await loadInScope(req.params.id, req.user);
  if (pregnancy.status !== 'ongoing') throw new AppError('Pregnancy is already closed', 400);
  const fields = ['status', 'outcome', 'deliveryDate', 'deliveryType', 'babyWeightGrams'];
  for (const field of fields) {
    if (req.body[field] !== undefined) pregnancy[field] = req.body[field];
  }
  await pregnancy.save();
  await Visit.updateMany(
    { pregnancy: pregnancy.id, status: 'scheduled' },
    { status: 'cancelled' },
  );
  if (req.body.status === 'delivered') {
    await Mother.findByIdAndUpdate(pregnancy.mother, { status: 'postpartum' });
  }
  return ok(res, pregnancy, 'Pregnancy outcome recorded');
});