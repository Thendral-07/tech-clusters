import express from 'express';
import SensorData from '../models/SensorData.js';
import { protect } from '../middleware/authMiddleware.js';
import { io } from '../server.js';

const router = express.Router();

router.post('/data', async (req, res) => {
  // For physical ESP32 to push data
  const sensorData = new SensorData(req.body);
  await sensorData.save();
  io.emit(`sensor:update:${req.body.deviceId}`, sensorData);
  res.status(201).json(sensorData);
});

router.get('/latest/:deviceId', protect, async (req, res) => {
  const data = await SensorData.findOne({ deviceId: req.params.deviceId }).sort({ timestamp: -1 });
  res.json(data);
});

router.get('/history/:deviceId', protect, async (req, res) => {
  const { period } = req.query;
  let dateFilter = new Date();
  if (period === '24h') dateFilter.setHours(dateFilter.getHours() - 24);
  else if (period === '7d') dateFilter.setDate(dateFilter.getDate() - 7);
  else if (period === '30d') dateFilter.setDate(dateFilter.getDate() - 30);
  else dateFilter.setHours(dateFilter.getHours() - 24); // default 24h

  const data = await SensorData.find({
    deviceId: req.params.deviceId,
    timestamp: { $gte: dateFilter }
  }).sort({ timestamp: 1 });
  res.json(data);
});

export default router;
