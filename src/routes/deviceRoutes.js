import express from 'express';
import Device from '../models/Device.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/status', protect, async (req, res) => {
  const devices = await Device.find({});
  res.json(devices);
});

router.get('/current/:id', protect, async (req, res) => {
  const device = await Device.findOne({ deviceId: req.params.id });
  res.json(device);
});

router.put('/settings/:id', protect, async (req, res) => {
  const device = await Device.findOneAndUpdate({ deviceId: req.params.id }, req.body, { new: true });
  res.json(device);
});

router.post('/control', protect, async (req, res) => {
  const { deviceId, peltierStatus, fanStatus, automaticMode } = req.body;
  const device = await Device.findOneAndUpdate({ deviceId }, { peltierStatus, fanStatus, automaticMode }, { new: true });
  res.json(device);
});

export default router;
