import mongoose from 'mongoose';

const alertSchema = new mongoose.Schema({
  deviceId: { type: String, required: true },
  type: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  severity: { type: String, enum: ['Normal', 'Warning', 'Critical'], default: 'Normal' },
  isRead: { type: Boolean, default: false },
  timestamp: { type: Date, default: Date.now }
});

export default mongoose.model('Alert', alertSchema);
