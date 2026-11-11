import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { ROLE_NAMES } from '../roles/role.model.js';
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, unique: true, trim: true },
    email: { type: String, trim: true, lowercase: true, default: '' },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ROLE_NAMES, required: true },
    location: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', default: null },
    language: { type: String, enum: ['en', 'hi'], default: 'en' },
    fcmToken: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date, default: null },
  },
  { timestamps: true },
);
userSchema.pre('save', async function hashPassword() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});
userSchema.methods.comparePassword = function comparePassword(plain) {
  return bcrypt.compare(plain, this.password);
};
userSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.password;
    return ret;
  },
});
export const User = mongoose.model('User', userSchema);