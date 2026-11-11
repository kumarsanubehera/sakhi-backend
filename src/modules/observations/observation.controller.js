import { AppError, asyncHandler } from '../../common/utils/helpers.js';
import { created, ok } from '../../common/utils/response.js';
import { DANGER_SIGNS, Observation } from './observation.model.js';
import * as motherService from '../mothers/mother.service.js';
import { Pregnancy } from '../pregnancies/pregnancy.model.js';
import { Visit } from '../visits/visit.model.js';
import { applyScreening } from '../risk-screening/risk.controller.js';
export { DANGER_SIGNS };
export const create = asyncHandler(async (req, res) => {
  const mother = await motherService.findInScope(req.body.motherId, req.user);
  let pregnancy = null;
  if (req.body.pregnancyId) {
    pregnancy = await Pregnancy.findOne({ _id: req.body.pregnancyId, mother: mother.id });
    if (!pregnancy) throw new AppError('Pregnancy not found for this mother', 404);
  }
  if (req.body.visitId) {
    const visit = await Visit.findOne({ _id: req.body.visitId, mother: mother.id });
    if (!visit) throw new AppError('Visit not found for this mother', 404);
  }
  const observation = await Observation.create({
    ...req.body,
    mother: mother.id,
    pregnancy: pregnancy?.id,
    visit: req.body.visitId,
    recordedBy: req.user.id,
  });
  const screening = await applyScreening({ mother, pregnancy, observation });
  return created(res, { observation, screening });
});
export const list = asyncHandler(async (req, res) => {
  const motherIds = await motherService.idsInScope(req.user);
  const filter = {};
  if (req.query.motherId) {
    if (motherIds && !motherIds.some((id) => String(id) === req.query.motherId)) {
      return ok(res, []);
    }
    filter.mother = req.query.motherId;
  } else if (motherIds) {
    filter.mother = { $in: motherIds };
  }
  if (req.query.pregnancyId) filter.pregnancy = req.query.pregnancyId;
  if (req.query.visitId) filter.visit = req.query.visitId;
  const rows = await Observation.find(filter).sort({ createdAt: -1 });
  return ok(res, rows);
});
export const getOne = asyncHandler(async (req, res) => {
  const observation = await Observation.findById(req.params.id);
  if (!observation) throw new AppError('Observation not found', 404);
  await motherService.findInScope(observation.mother, req.user);
  return ok(res, observation);
});