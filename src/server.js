import http from 'http';
import app from './app.js';
import { connectDB } from './config/database.js';
import { config } from './config/env.js';
import { Server } from 'socket.io';

const server = http.createServer(app);

// Initialize Socket.IO
export const io = new Server(server, {
  cors: {
    origin: '*',
  }
});

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

import { startSimulation } from './services/simulationService.js';

const startServer = async () => {
  await connectDB();
  
  server.listen(config.port, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${config.port}`);
    if (config.simulationMode) {
      startSimulation();
    }
  });
};

startServer();
