import mongoose from 'mongoose';
const pregnancySchema = new mongoose.Schema(
  {
    clientId: { type: String, trim: true },
    mother: { type: mongoose.Schema.Types.ObjectId, ref: 'Mother', required: true, index: true },
    lmp: { type: Date, required: true },
    edd: { type: Date, required: true },
    gravida: { type: Number, min: 1, default: 1 },
    para: { type: Number, min: 0, default: 0 },
    abortions: { type: Number, min: 0, default: 0 },
    livingChildren: { type: Number, min: 0, default: 0 },
    previousCesarean: { type: Boolean, default: false },
    previousComplications: { type: String, trim: true, default: '' },
    status: {
      type: String,
      enum: ['ongoing', 'delivered', 'aborted', 'lost_to_followup'],
      default: 'ongoing',
    },
    riskLevel: { type: String, enum: ['low', 'moderate', 'high'], default: 'low' },
    highRisk: { type: Boolean, default: false },
    riskFlags: [{ type: String }],
    lastScreenedAt: { type: Date, default: null },
    ancCompletedCount: { type: Number, default: 0 },
    outcome: { type: String, enum: ['live_birth', 'still_birth'] },
    deliveryDate: { type: Date, default: null },
    deliveryType: { type: String, enum: ['institutional', 'home'] },
    babyWeightGrams: { type: Number, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true },
);
pregnancySchema.index({ clientId: 1 }, { unique: true, sparse: true });
pregnancySchema.index({ status: 1, riskLevel: 1 });
export const Pregnancy = mongoose.model('Pregnancy', pregnancySchema);