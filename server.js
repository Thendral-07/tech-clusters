const express = require('express');
const mongoose = require('mongoose');
const dns = require('dns');
require('dotenv').config();

// Ensure public DNS resolvers are used to avoid Windows ISP SRV lookup failures
try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch (e) {
  // Ignore if custom DNS cannot be set
}

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

// Express JSON middleware to parse incoming JSON payloads
app.use(express.json());

// Mongoose Schema for sensor readings
const sensorDataSchema = new mongoose.Schema(
  {
    deviceId: {
      type: String,
      required: true,
      trim: true,
    },
    chamberTemperature: {
      type: Number,
      required: true,
    },
    ambientTemperature: {
      type: Number,
      default: null,
    },
    batteryPercentage: {
      type: Number,
      default: null,
    },
    batteryVoltage: {
      type: Number,
      default: null,
    },
    solarVoltage: {
      type: Number,
      default: null,
    },
    solarPower: {
      type: Number,
      default: null,
    },
    powerConsumption: {
      type: Number,
      default: null,
    },
    peltierStatus: {
      type: Boolean,
      default: null,
    },
    fanStatus: {
      type: Boolean,
      default: null,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    collection: 'sensorData',
    versionKey: false,
  }
);

// Index on deviceId and timestamp for high query performance
sensorDataSchema.index({ deviceId: 1, timestamp: -1 });

const SensorData = mongoose.model('SensorData', sensorDataSchema);

// 1. Health Check Endpoint
app.get('/', (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'AgriCool backend is running',
  });
});

// Helper validation function for sensor data payloads
function validateSensorPayload(body) {
  const errors = [];

  // deviceId: Required non-empty string
  if (typeof body.deviceId !== 'string' || body.deviceId.trim() === '') {
    errors.push('deviceId is required and must be a non-empty string');
  }

  // chamberTemperature: Required number
  if (
    body.chamberTemperature === undefined ||
    body.chamberTemperature === null ||
    typeof body.chamberTemperature !== 'number' ||
    Number.isNaN(body.chamberTemperature)
  ) {
    errors.push('chamberTemperature is required and must be a valid number');
  }

  // Optional numeric fields (allow number or null)
  const numericFields = [
    'ambientTemperature',
    'batteryPercentage',
    'batteryVoltage',
    'solarVoltage',
    'solarPower',
    'powerConsumption',
  ];

  numericFields.forEach((field) => {
    if (
      body[field] !== undefined &&
      body[field] !== null &&
      (typeof body[field] !== 'number' || Number.isNaN(body[field]))
    ) {
      errors.push(`${field} must be a valid number or null`);
    }
  });

  // Optional boolean fields (allow boolean or null)
  const booleanFields = ['peltierStatus', 'fanStatus'];

  booleanFields.forEach((field) => {
    if (
      body[field] !== undefined &&
      body[field] !== null &&
      typeof body[field] !== 'boolean'
    ) {
      errors.push(`${field} must be a boolean or null`);
    }
  });

  return errors;
}

// 2. Insert Sensor Data Endpoint
app.post('/api/sensors/data', async (req, res) => {
  try {
    const payload = req.body;

    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request body. Expected a JSON object.',
      });
    }

    const validationErrors = validateSensorPayload(payload);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors,
      });
    }

    // Prepare sensor reading document with server-generated timestamp
    const sensorDoc = new SensorData({
      deviceId: payload.deviceId.trim(),
      chamberTemperature: payload.chamberTemperature,
      ambientTemperature:
        payload.ambientTemperature !== undefined ? payload.ambientTemperature : null,
      batteryPercentage:
        payload.batteryPercentage !== undefined ? payload.batteryPercentage : null,
      batteryVoltage:
        payload.batteryVoltage !== undefined ? payload.batteryVoltage : null,
      solarVoltage: payload.solarVoltage !== undefined ? payload.solarVoltage : null,
      solarPower: payload.solarPower !== undefined ? payload.solarPower : null,
      powerConsumption:
        payload.powerConsumption !== undefined ? payload.powerConsumption : null,
      peltierStatus:
        payload.peltierStatus !== undefined ? payload.peltierStatus : null,
      fanStatus: payload.fanStatus !== undefined ? payload.fanStatus : null,
      timestamp: new Date(),
    });

    const savedDoc = await sensorDoc.save();

    // Log successful insertion without exposing credentials or sensitive internals
    console.log(
      `[Sensor Data Saved] Device: ${savedDoc.deviceId} | Chamber Temp: ${savedDoc.chamberTemperature}°C | Timestamp: ${savedDoc.timestamp.toISOString()}`
    );

    return res.status(201).json({
      success: true,
      message: 'Sensor data saved successfully',
      data: {
        deviceId: savedDoc.deviceId,
        chamberTemperature: savedDoc.chamberTemperature,
        ambientTemperature: savedDoc.ambientTemperature,
        timestamp: savedDoc.timestamp,
      },
    });
  } catch (error) {
    console.error('Error saving sensor data:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while saving sensor data',
      error: error.message,
    });
  }
});

// Database Connection & Server Initialization
if (!MONGODB_URI || MONGODB_URI === 'your_mongodb_atlas_connection_string') {
  console.error(
    'Error: Valid MONGODB_URI must be provided in .env before starting the server.'
  );
  console.error('Please configure your MongoDB Atlas connection string in .env');
}

mongoose
  .connect(MONGODB_URI, {
    dbName: 'agricool',
  })
  .then(() => {
    console.log('Connected to MongoDB Atlas (Database: agricool, Collection: sensorData)');
    app.listen(PORT, () => {
      console.log(`AgriCool backend server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB Atlas connection error:', err.message);
    process.exit(1);
  });
