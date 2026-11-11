import mongoose from 'mongoose';
import { AppError } from '../../common/utils/helpers.js';
export const LOCATION_TYPES = ['state', 'district', 'block', 'village', 'facility'];
export const FACILITY_TYPES = ['sub_center', 'phc', 'chc', 'district_hospital', 'other'];
const locationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, trim: true, uppercase: true },
    type: { type: String, enum: LOCATION_TYPES, required: true },
    parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', default: null },
    facilityType: { type: String, enum: FACILITY_TYPES, default: null },
  },
  { timestamps: true },
);
locationSchema.index({ type: 1, parent: 1 });
export const Location = mongoose.model('Location', locationSchema);
export async function requireLocation(id, type) {
  if (!id) return null;
  const location = await Location.findById(id);
  if (!location || (type && location.type !== type)) {
    throw new AppError(type ? `Invalid ${type}` : 'Invalid location', 400);
  }
  return location;
}