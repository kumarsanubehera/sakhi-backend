import mongoose from 'mongoose';
import { ROLE_NAMES } from '../roles/role.model.js';
const announcementSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    body: { type: String, required: true, trim: true },
    audience: { type: [{ type: String, enum: ROLE_NAMES }], default: [] },
    location: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', default: null },
    startsAt: { type: Date, default: () => new Date() },
    endsAt: { type: Date, default: null },
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
);
export const Announcement = mongoose.model('Announcement', announcementSchema);