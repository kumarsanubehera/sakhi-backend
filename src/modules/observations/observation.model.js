import mongoose from 'mongoose';
export const DANGER_SIGNS = [
  'vaginal_bleeding',
  'severe_headache',
  'blurred_vision',
  'convulsions',
  'reduced_fetal_movement',
  'severe_abdominal_pain',
  'fever',
  'leaking_fluid',
  'swelling_face_hands',
  'breathlessness',
];
const dipstick = { type: String, enum: ['nil', 'trace', '+', '++', '+++', ''], default: '' };
const observationSchema = new mongoose.Schema(
  {
    clientId: { type: String, trim: true },
    mother: { type: mongoose.Schema.Types.ObjectId, ref: 'Mother', required: true, index: true },
    pregnancy: { type: mongoose.Schema.Types.ObjectId, ref: 'Pregnancy', default: null },
    visit: { type: mongoose.Schema.Types.ObjectId, ref: 'Visit', default: null },
    weightKg: { type: Number, min: 20, max: 200 },
    heightCm: { type: Number, min: 100, max: 220 },
    bpSystolic: { type: Number, min: 60, max: 250 },
    bpDiastolic: { type: Number, min: 40, max: 160 },
    hemoglobin: { type: Number, min: 2, max: 20 },
    bloodGlucose: { type: Number, min: 30, max: 600 },
    temperatureC: { type: Number, min: 34, max: 43 },
    pulse: { type: Number, min: 30, max: 220 },
    fetalHeartRate: { type: Number, min: 60, max: 220 },
    fundalHeightCm: { type: Number, min: 0, max: 50 },
    urineAlbumin: dipstick,
    urineSugar: dipstick,
    fetalMovements: { type: String, enum: ['normal', 'reduced', 'absent', ''], default: '' },
    edema: { type: Boolean, default: false },
    dangerSigns: [{ type: String, enum: DANGER_SIGNS }],
    notes: { type: String, trim: true, default: '' },
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true },
);
observationSchema.index({ clientId: 1 }, { unique: true, sparse: true });
export const Observation = mongoose.model('Observation', observationSchema);