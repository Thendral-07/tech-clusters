import mongoose from 'mongoose';

const sensorDataSchema = new mongoose.Schema({
  deviceId: { type: String, default: 'UNKNOWN', trim: true },
  chamberTemperature: { type: Number, default: null },
  ambientTemperature: { type: Number, default: null },
  batteryPercentage: { type: Number, default: null },
  batteryVoltage: { type: Number, default: null },
  solarVoltage: { type: Number, default: null },
  solarPower: { type: Number, default: null },
  powerConsumption: { type: Number, default: null },
  peltierStatus: { type: Boolean, default: null },
  fanStatus: { type: Boolean, default: null },
  timestamp: { type: Date, default: Date.now }
}, {
  collection: 'sensorData',
  strict: false,
  versionKey: false
});

export default mongoose.model('SensorData', sensorDataSchema);

