import { AppError, eddFromLmp, makeRegistrationNo, pick } from '../../common/utils/helpers.js';
import { Mother } from '../mothers/mother.model.js';
import { Pregnancy } from '../pregnancies/pregnancy.model.js';
import { Visit } from '../visits/visit.model.js';
import { Observation } from '../observations/observation.model.js';
import { Referral } from '../referrals/referral.model.js';
import * as motherService from '../mothers/mother.service.js';
const MODELS = {
  mother: Mother,
  pregnancy: Pregnancy,
  visit: Visit,
  observation: Observation,
  referral: Referral,
};
const FIELDS = {
  mother: ['name', 'age', 'dob', 'phone', 'alternatePhone', 'husbandOrGuardian', 'address', 'village', 'block', 'district', 'facility', 'bloodGroup', 'abhaId', 'rchId', 'aadhaarLast4', 'status', 'clientId', 'registrationNo', 'assignedAsha', 'userAccount'],
  pregnancy: ['mother', 'lmp', 'edd', 'gravida', 'para', 'abortions', 'livingChildren', 'previousCesarean', 'previousComplications', 'status', 'clientId'],
  visit: ['mother', 'pregnancy', 'visitType', 'visitNumber', 'scheduledAt', 'conductedAt', 'status', 'place', 'notes', 'nextVisitAt', 'clientId', 'assignedTo'],
  observation: ['mother', 'pregnancy', 'visit', 'weightKg', 'heightCm', 'bpSystolic', 'bpDiastolic', 'hemoglobin', 'bloodGlucose', 'temperatureC', 'pulse', 'fetalHeartRate', 'fundalHeightCm', 'urineAlbumin', 'urineSugar', 'fetalMovements', 'edema', 'dangerSigns', 'notes', 'clientId'],
  referral: ['mother', 'pregnancy', 'visit', 'facility', 'priority', 'reason', 'clinicalNotes', 'status', 'clientId'],
};
async function assertReadable(doc, entity, actor) {
  if (!doc) return;
  if (entity === 'mother') await motherService.findInScope(doc.id, actor);
  else if (doc.mother) await motherService.findInScope(doc.mother, actor);
}
export async function pushChanges(changes, actor) {
  const results = [];
  for (const change of changes || []) {
    const clientId = change.clientId;
    try {
      const Model = MODELS[change.entity];
      if (!Model) throw new AppError('Unknown entity', 400);
      if (change.op && change.op !== 'upsert') throw new AppError('Only upsert is supported', 400);
      const payload = pick(change.payload || {}, FIELDS[change.entity]);
      if (clientId) payload.clientId = clientId;
      if (change.entity === 'mother' && actor.role === 'asha') payload.assignedAsha = actor.id;
      if (change.entity === 'pregnancy' && payload.lmp && !payload.edd) payload.edd = eddFromLmp(payload.lmp);
      if (payload.mother) await motherService.findInScope(payload.mother, actor);
      const recordId = change.payload?._id;
      let existing = recordId
        ? await Model.findById(recordId)
        : clientId
          ? await Model.findOne({ clientId })
          : null;
      await assertReadable(existing, change.entity, actor);
      if (existing && change.updatedAt && new Date(change.updatedAt) < existing.updatedAt) {
        results.push({ clientId, status: 'skipped', id: existing.id, message: 'Server copy is newer' });
        continue;
      }
      if (change.entity === 'referral' && !existing) payload.referredBy = actor.id;
      if (change.entity === 'observation') payload.recordedBy = actor.id;
      if (change.entity === 'mother' && !existing) {
        payload.createdBy = actor.id;
        if (!payload.name) throw new AppError('Mother name is required', 400);
        if (!payload.registrationNo) payload.registrationNo = makeRegistrationNo();
      }
      if (change.entity === 'pregnancy' && !existing && (!payload.mother || !payload.lmp)) {
        throw new AppError('Pregnancy needs a mother and LMP', 400);
      }
      let saved;
      if (existing) {
        Object.assign(existing, payload);
        saved = await existing.save();
      } else {
        saved = await Model.create(payload);
      }
      results.push({ clientId, status: 'applied', id: saved.id });
    } catch (error) {
      results.push({ clientId, status: 'error', message: error.message || 'Sync failed' });
    }
  }
  return { serverTime: new Date().toISOString(), results };
}
export async function pullChanges(since, actor) {
  const moment = since ? new Date(since) : new Date(0);
  if (Number.isNaN(moment.getTime())) throw new AppError('Invalid since date', 400);
  const motherIds = await motherService.idsInScope(actor);
  const child = { updatedAt: { $gt: moment } };
  if (motherIds) child.mother = { $in: motherIds };
  const [mothers, pregnancies, visits, observations, referrals] = await Promise.all([
    Mother.find({ ...motherService.scopeFilter(actor), updatedAt: { $gt: moment } }),
    Pregnancy.find(child),
    Visit.find(child),
    Observation.find(child),
    Referral.find(child),
  ]);
  return {
    serverTime: new Date().toISOString(),
    mothers,
    pregnancies,
    visits,
    observations,
    referrals,
  };
}