import express from 'express';
import Alert from '../models/Alert.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/:deviceId', protect, async (req, res) => {
  const alerts = await Alert.find({ deviceId: req.params.deviceId }).sort({ timestamp: -1 });
  res.json(alerts);
});

router.put('/:id/read', protect, async (req, res) => {
  const alert = await Alert.findByIdAndUpdate(req.params.id, { isRead: true }, { new: true });
  res.json(alert);
});

router.put('/read-all/:deviceId', protect, async (req, res) => {
  await Alert.updateMany({ deviceId: req.params.deviceId }, { isRead: true });
  res.json({ message: 'All alerts marked as read' });
});

export default router;
