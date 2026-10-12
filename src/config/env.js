import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT || 5000,
  mongoUri: process.env.MONGO_URI || 'mongodb+srv://tamilthendralkp_db_user:Samy2007@cluster0.ok2l777.mongodb.net/?appName=Cluster0',
  jwtSecret: process.env.JWT_SECRET || 'agricool_super_secret_key_2026',
  simulationMode: process.env.SIMULATION_MODE !== 'false', // Default to true
};
