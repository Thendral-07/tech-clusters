import mongoose from 'mongoose';

const activeStorageSchema = new mongoose.Schema({
  deviceId: { type: String, required: true },
  produceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Produce', required: true },
  selectedAt: { type: Date, default: Date.now },
  status: { type: String, enum: ['Active', 'Completed'], default: 'Active' }
});

export default mongoose.model('ActiveStorage', activeStorageSchema);
