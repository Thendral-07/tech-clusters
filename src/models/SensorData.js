import mongoose from 'mongoose';

const sensorDataSchema = new mongoose.Schema({
  deviceId: { type: String, required: true },
  chamberTemperature: { type: Number, required: true },
  ambientTemperature: { type: Number, required: true },
  batteryPercentage: { type: Number, required: true },
  batteryVoltage: { type: Number, required: true },
  solarVoltage: { type: Number, required: true },
  solarPower: { type: Number, required: true },
  powerConsumption: { type: Number, required: true },
  peltierStatus: { type: Boolean, required: true },
  fanStatus: { type: Boolean, required: true },
  timestamp: { type: Date, default: Date.now }
});

export default mongoose.model('SensorData', sensorDataSchema);
