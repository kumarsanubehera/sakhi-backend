import { AppError } from '../../common/utils/helpers.js';
import { notify } from '../notifications/notification.service.js';
import { Pregnancy } from '../pregnancies/pregnancy.model.js';
const EMERGENCY = new Set([
  'severe_hypertension',
  'severe_anemia',
  'convulsions',
  'vaginal_bleeding',
  'absent_fetal_movement',
  'abnormal_fhr',
  'breathlessness',
  'leaking_fluid',
  'pre_eclampsia',
]);
function ageOf(mother) {
  if (mother?.age) return mother.age;
  if (!mother?.dob) return null;
  return Math.floor((Date.now() - new Date(mother.dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
}
function pushFlag(flags, code, severity, message) {
  if (!flags.some((flag) => flag.code === code)) flags.push({ code, severity, message });
}
export function assess({ mother, pregnancy, observation }) {
  const flags = [];
  const age = ageOf(mother);
  if (age != null && age < 18) pushFlag(flags, 'adolescent', 'high', 'Age under 18 needs closer follow-up');
  if (age != null && age > 35) pushFlag(flags, 'advanced_age', 'moderate', 'Age over 35');
  if ((pregnancy?.gravida || 0) >= 5) pushFlag(flags, 'high_parity', 'moderate', 'Fifth pregnancy or more');
  if (pregnancy?.previousCesarean) pushFlag(flags, 'previous_cesarean', 'moderate', 'Previous cesarean');
  if (pregnancy?.previousComplications) {
    pushFlag(flags, 'previous_complications', 'moderate', 'Previous pregnancy complication recorded');
  }
  if (observation) {
    const sys = observation.bpSystolic;
    const dia = observation.bpDiastolic;
    if ((sys != null && sys >= 160) || (dia != null && dia >= 110)) {
      pushFlag(flags, 'severe_hypertension', 'high', 'Severe high blood pressure');
    } else if ((sys != null && sys >= 140) || (dia != null && dia >= 90)) {
      pushFlag(flags, 'hypertension', 'moderate', 'High blood pressure');
    }
    if (observation.hemoglobin != null && observation.hemoglobin < 7) {
      pushFlag(flags, 'severe_anemia', 'high', 'Severe anemia (Hb below 7 g/dL)');
    } else if (observation.hemoglobin != null && observation.hemoglobin < 11) {
      pushFlag(flags, 'anemia', 'moderate', 'Anemia (Hb below 11 g/dL)');
    }
    if (observation.fetalHeartRate != null && (observation.fetalHeartRate < 110 || observation.fetalHeartRate > 160)) {
      pushFlag(flags, 'abnormal_fhr', 'high', 'Fetal heart rate outside 110–160');
    }
    if (observation.bloodGlucose != null && observation.bloodGlucose >= 200) {
      pushFlag(flags, 'high_glucose', 'high', 'Blood glucose is very high');
    } else if (observation.bloodGlucose != null && observation.bloodGlucose >= 140) {
      pushFlag(flags, 'raised_glucose', 'moderate', 'Blood glucose needs a lab check');
    }
    if (observation.fetalMovements === 'absent') {
      pushFlag(flags, 'absent_fetal_movement', 'high', 'Fetal movements absent');
    } else if (observation.fetalMovements === 'reduced') {
      pushFlag(flags, 'reduced_fetal_movement', 'moderate', 'Fetal movements reduced');
    }
    if (['++', '+++'].includes(observation.urineAlbumin)) {
      pushFlag(flags, 'heavy_albuminuria', 'high', 'Urine albumin is ++ or more');
    } else if (['trace', '+'].includes(observation.urineAlbumin)) {
      pushFlag(flags, 'albuminuria', 'moderate', 'Urine albumin is present');
    }
    if (['++', '+++'].includes(observation.urineSugar)) {
      pushFlag(flags, 'urine_sugar', 'moderate', 'Urine sugar is ++ or more');
    }
    if (observation.edema) pushFlag(flags, 'edema', 'moderate', 'Swelling recorded');
    for (const sign of observation.dangerSigns || []) {
      const high = ['vaginal_bleeding', 'convulsions', 'leaking_fluid', 'breathlessness', 'severe_headache', 'blurred_vision', 'severe_abdominal_pain'].includes(sign);
      pushFlag(flags, sign, high ? 'high' : 'moderate', `Danger sign: ${sign.replaceAll('_', ' ')}`);
    }
    const hypertensive = flags.some((flag) => flag.code === 'hypertension' || flag.code === 'severe_hypertension');
    const protein = ['+', '++', '+++'].includes(observation.urineAlbumin);
    if (hypertensive && protein) pushFlag(flags, 'pre_eclampsia', 'high', 'High blood pressure with urine albumin');
  }

  const level = flags.some((flag) => flag.severity === 'high')
    ? 'high'
    : flags.some((flag) => flag.severity === 'moderate')
      ? 'moderate'
      : 'low';
  const recommendations = [];
  if (flags.some((flag) => flag.code === 'anemia' || flag.code === 'severe_anemia')) {
    recommendations.push('Continue iron and folic acid, and repeat hemoglobin if it is falling.');
  }
  if (flags.some((flag) => flag.code.includes('hypertension') || flag.code === 'pre_eclampsia')) {
    recommendations.push('Recheck blood pressure after rest. Do not send her home if it stays high.');
  }
  if (level === 'low') recommendations.push('Continue the routine ANC schedule and counsel on danger signs.');
  if (level !== 'low') recommendations.push('Tell the family the warning signs that mean they should leave for the facility the same day.');
  const emergency = flags.some((flag) => EMERGENCY.has(flag.code));
  const referral = level === 'low' ? null : {
    suggested: true,
    priority: emergency ? 'emergency' : 'urgent',
    facilityLevel: emergency ? 'district_hospital' : 'phc',
  };
  return { level, highRisk: level === 'high', flags, recommendations, referral };
}
export async function applyScreening({ mother, pregnancy, observation }) {
  const result = assess({ mother, pregnancy, observation });
  if (!pregnancy) return result;
  const previous = pregnancy.riskLevel;
  pregnancy.riskLevel = result.level;
  pregnancy.highRisk = result.highRisk;
  pregnancy.riskFlags = result.flags.map((flag) => flag.code);
  pregnancy.lastScreenedAt = new Date();
  await pregnancy.save();
  if (result.level === 'high' && previous !== 'high' && mother?.assignedAsha) {
    await notify({
      user: mother.assignedAsha,
      title: 'High-risk pregnancy',
      body: `${mother.name} screened high risk. Arrange a referral today.`,
      type: 'high_risk',
      data: { motherId: String(mother.id || mother._id), pregnancyId: String(pregnancy.id) },
    });
  }
  return result;
}
export const screen = asyncHandler(async (req, res) => {
  const { Observation } = await import('../observations/observation.model.js');
  const { Mother } = await import('../mothers/mother.model.js');
  const pregnancy = await Pregnancy.findById(req.body.pregnancyId);
  if (!pregnancy) throw new AppError('Pregnancy not found', 404);
  const { findInScope } = await import('../mothers/mother.service.js');
  await findInScope(pregnancy.mother, req.user);
  const mother = await Mother.findById(pregnancy.mother);
  const observation = req.body.observationId
    ? await Observation.findOne({ _id: req.body.observationId, pregnancy: pregnancy.id })
    : await Observation.findOne({ pregnancy: pregnancy.id }).sort({ createdAt: -1 });
  if (req.body.observationId && !observation) throw new AppError('Observation not found', 404);
  const result = await applyScreening({ mother, pregnancy, observation });
  return ok(res, result, 'Screening complete');
});
export const list = asyncHandler(async (req, res) => {
  const { idsInScope } = await import('../mothers/mother.service.js');
  const motherIds = await idsInScope(req.user);
  const filter = { status: 'ongoing' };
  if (req.query.level) filter.riskLevel = req.query.level;
  if (motherIds) filter.mother = { $in: motherIds };
  const rows = await Pregnancy.find(filter)
    .populate('mother', 'name registrationNo phone assignedAsha')
    .sort({ lastScreenedAt: -1 });
  return ok(res, rows);
});