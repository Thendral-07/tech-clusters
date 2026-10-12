import express from 'express';
import cors from 'cors';

const app = express();

app.use(cors());
app.use(express.json());

import authRoutes from './routes/authRoutes.js';
import deviceRoutes from './routes/deviceRoutes.js';
import sensorRoutes from './routes/sensorRoutes.js';
import storageRoutes from './routes/storageRoutes.js';
import alertRoutes from './routes/alertRoutes.js';

app.use('/api/auth', authRoutes);
app.use('/api/device', deviceRoutes);
app.use('/api/sensors', sensorRoutes);
app.use('/api/produce', storageRoutes);
app.use('/api/alerts', alertRoutes);

// Basic health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'AgriCool API is running' });
});

export default app;
