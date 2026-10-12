import mongoose from 'mongoose';

const deviceSchema = new mongoose.Schema({
  deviceId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  status: { type: String, enum: ['Online', 'Offline'], default: 'Online' },
  simulationMode: { type: Boolean, default: true },
  targetMinTemperature: { type: Number, default: 5 },
  targetMaxTemperature: { type: Number, default: 10 },
  automaticMode: { type: Boolean, default: true },
  peltierStatus: { type: Boolean, default: false },
  fanStatus: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model('Device', deviceSchema);
