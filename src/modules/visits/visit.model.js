import mongoose from 'mongoose';
const visitSchema = new mongoose.Schema(
  {
    clientId: { type: String, trim: true },
    mother: { type: mongoose.Schema.Types.ObjectId, ref: 'Mother', required: true, index: true },
    pregnancy: { type: mongoose.Schema.Types.ObjectId, ref: 'Pregnancy', required: true, index: true },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    conductedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    visitType: { type: String, enum: ['anc', 'pnc', 'home', 'referral_followup'], required: true },
    visitNumber: { type: Number, min: 1, default: 1 },
    scheduledAt: { type: Date, default: null },
    conductedAt: { type: Date, default: null },
    status: {
      type: String,
      enum: ['scheduled', 'completed', 'missed', 'cancelled'],
      default: 'scheduled',
    },
    place: { type: String, trim: true, default: '' },
    notes: { type: String, trim: true, default: '' },
    nextVisitAt: { type: Date, default: null },
    reminderSentAt: { type: Date, default: null },
  },
  { timestamps: true },
);
visitSchema.index({ clientId: 1 }, { unique: true, sparse: true });
visitSchema.index({ status: 1, scheduledAt: 1 });
export const Visit = mongoose.model('Visit', visitSchema);