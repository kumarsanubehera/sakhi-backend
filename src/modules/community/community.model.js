import mongoose from 'mongoose';
export const COMMUNITY_CATEGORIES = ['general', 'nutrition', 'immunization', 'hygiene', 'mental_health'];
const communitySchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    body: { type: String, required: true, trim: true },
    category: { type: String, enum: COMMUNITY_CATEGORIES, default: 'general' },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    location: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', default: null },
    pinned: { type: Boolean, default: false },
  },
  { timestamps: true },
);
export const CommunityPost = mongoose.model('CommunityPost', communitySchema);