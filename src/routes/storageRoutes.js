import express from 'express';
import Produce from '../models/Produce.js';
import ActiveStorage from '../models/ActiveStorage.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, async (req, res) => {
  const produce = await Produce.find({});
  res.json(produce);
});

router.get('/:id', protect, async (req, res) => {
  const produce = await Produce.findById(req.params.id);
  res.json(produce);
});

router.post('/select', protect, async (req, res) => {
  const { deviceId, produceId } = req.body;
  await ActiveStorage.updateMany({ deviceId, status: 'Active' }, { status: 'Completed' });
  const active = new ActiveStorage({ deviceId, produceId });
  await active.save();
  res.json(active);
});

export default router;
