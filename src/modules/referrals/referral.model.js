import mongoose from 'mongoose';
const referralSchema = new mongoose.Schema(
  {
    clientId: { type: String, trim: true },
    mother: { type: mongoose.Schema.Types.ObjectId, ref: 'Mother', required: true, index: true },
    pregnancy: { type: mongoose.Schema.Types.ObjectId, ref: 'Pregnancy', default: null },
    visit: { type: mongoose.Schema.Types.ObjectId, ref: 'Visit', default: null },
    referredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    facility: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', default: null },
    priority: { type: String, enum: ['routine', 'urgent', 'emergency'], default: 'urgent' },
    reason: { type: String, required: true, trim: true },
    clinicalNotes: { type: String, trim: true, default: '' },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'completed', 'cancelled'],
      default: 'pending',
    },
    referredAt: { type: Date, default: () => new Date() },
    closedAt: { type: Date, default: null },
  },
  { timestamps: true },
);
referralSchema.index({ clientId: 1 }, { unique: true, sparse: true });
referralSchema.index({ status: 1, priority: 1 });
export const Referral = mongoose.model('Referral', referralSchema);