import mongoose from 'mongoose';

const produceSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  minimumTemperature: { type: Number, required: true },
  maximumTemperature: { type: Number, required: true },
  description: { type: String },
  icon: { type: String }
});

export default mongoose.model('Produce', produceSchema);
