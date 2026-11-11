import mongoose from 'mongoose';
export const ROLE_NAMES = ['admin', 'asha', 'anm', 'medical_officer', 'mother'];
const roleSchema = new mongoose.Schema(
  {
    name: { type: String, enum: ROLE_NAMES, required: true, unique: true },
    label: { type: String, required: true },
    permissions: [{ type: String }],
  },
  { timestamps: true },
);
export const Role = mongoose.model('Role', roleSchema);