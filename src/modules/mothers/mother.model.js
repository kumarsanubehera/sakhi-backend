import mongoose from 'mongoose';
const motherSchema = new mongoose.Schema(
  {
    registrationNo: { type: String, required: true, unique: true, trim: true },
    clientId: { type: String, trim: true },
    name: { type: String, required: true, trim: true },
    age: { type: Number, min: 12, max: 55 },
    dob: { type: Date, default: null },
    phone: { type: String, trim: true, default: '' },
    alternatePhone: { type: String, trim: true, default: '' },
    husbandOrGuardian: { type: String, trim: true, default: '' },
    address: { type: String, trim: true, default: '' },
    village: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', default: null },
    block: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', default: null },
    district: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', default: null },
    facility: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', default: null },
    assignedAsha: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    userAccount: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    bloodGroup: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'],
      default: 'Unknown',
    },
    abhaId: { type: String, trim: true, default: '' },
    rchId: { type: String, trim: true, default: '' },
    aadhaarLast4: { type: String, trim: true, default: '' },
    status: {
      type: String,
      enum: ['active', 'postpartum', 'referred', 'inactive'],
      default: 'active',
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true },
);
motherSchema.index({ assignedAsha: 1, status: 1 });
motherSchema.index({ phone: 1 });
motherSchema.index({ clientId: 1 }, { unique: true, sparse: true });
export const Mother = mongoose.model('Mother', motherSchema);
const POPULATE = [
  { path: 'assignedAsha', select: 'name phone role' },
  { path: 'village block district facility', select: 'name type code' },
];
export function withMotherRefs(query) {
  return query.populate(POPULATE);
}