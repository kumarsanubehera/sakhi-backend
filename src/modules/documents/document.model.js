import mongoose from 'mongoose';
export const DOC_TYPES = ['ultrasound', 'lab_report', 'consent', 'prescription', 'id_proof', 'other'];
const documentSchema = new mongoose.Schema(
  {
    mother: { type: mongoose.Schema.Types.ObjectId, ref: 'Mother', required: true, index: true },
    pregnancy: { type: mongoose.Schema.Types.ObjectId, ref: 'Pregnancy', default: null },
    docType: { type: String, enum: DOC_TYPES, required: true },
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    storageKey: { type: String, required: true },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
);
export const Document = mongoose.model('Document', documentSchema);