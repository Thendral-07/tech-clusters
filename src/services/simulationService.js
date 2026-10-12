import Device from '../models/Device.js';
import SensorData from '../models/SensorData.js';
import Alert from '../models/Alert.js';
import { io } from '../server.js';

let simulationInterval;

export const startSimulation = () => {
  if (simulationInterval) return;
  console.log('Starting Simulation Engine...');
  
  simulationInterval = setInterval(async () => {
    try {
      const devices = await Device.find({ simulationMode: true });
      for (const device of devices) {
        // Fetch last sensor data or initialize
        let lastData = await SensorData.findOne({ deviceId: device.deviceId }).sort({ timestamp: -1 });
        
        if (!lastData) {
          lastData = {
            chamberTemperature: 24,
            ambientTemperature: 31,
            batteryPercentage: 75,
            batteryVoltage: 12.5,
            solarVoltage: 18.0,
            solarPower: 65,
            powerConsumption: 0,
            peltierStatus: false,
            fanStatus: false
          };
        }

        // Automatic Mode Logic
        if (device.automaticMode) {
          if (lastData.chamberTemperature > device.targetMaxTemperature) {
            device.peltierStatus = true;
            device.fanStatus = true;
          } else if (lastData.chamberTemperature < device.targetMinTemperature) {
            device.peltierStatus = false;
            device.fanStatus = false;
          }
          await device.save();
        }

        // Simulate Temperature
        let newChamberTemp = lastData.chamberTemperature;
        if (device.peltierStatus) {
          newChamberTemp -= 0.15; // Cooling
        } else {
          // Warm up towards ambient
          if (newChamberTemp < lastData.ambientTemperature) {
            newChamberTemp += 0.05;
          }
        }

        // Simulate Solar (Simple daytime logic based on hour could be added, here just random fluctuation)
        const isDayTime = new Date().getHours() > 6 && new Date().getHours() < 18;
        const newSolarPower = isDayTime ? Math.floor(Math.random() * (80 - 40 + 1)) + 40 : 0;
        const newSolarVoltage = isDayTime ? 17.0 + Math.random() : 0;

        // Simulate Power Consumption
        let newPower = 5; // Base power for ESP32/sensors
        if (device.peltierStatus) newPower += 65;
        if (device.fanStatus) newPower += 5;

        // Simulate Battery
        let newBatteryPercentage = lastData.batteryPercentage;
        if (newSolarPower > 0) {
          newBatteryPercentage += 0.1; // Charging
        }
        if (newPower > 10) {
          newBatteryPercentage -= 0.05; // Discharging
        }
        newBatteryPercentage = Math.max(0, Math.min(100, newBatteryPercentage)); // Clamp 0-100

        const newSensorData = new SensorData({
          deviceId: device.deviceId,
          chamberTemperature: Number(newChamberTemp.toFixed(2)),
          ambientTemperature: lastData.ambientTemperature,
          batteryPercentage: Number(newBatteryPercentage.toFixed(1)),
          batteryVoltage: Number((11.0 + (newBatteryPercentage / 100) * 2.5).toFixed(2)),
          solarVoltage: Number(newSolarVoltage.toFixed(2)),
          solarPower: newSolarPower,
          powerConsumption: newPower,
          peltierStatus: device.peltierStatus,
          fanStatus: device.fanStatus
        });

        await newSensorData.save();

        // Emit real-time data
        io.emit(`sensor:update:${device.deviceId}`, newSensorData);
        io.emit(`device:update:${device.deviceId}`, device);
        
        // Alert Logic
        if (newChamberTemp > device.targetMaxTemperature + 2) {
            const alertExists = await Alert.findOne({ deviceId: device.deviceId, type: 'TEMPERATURE_HIGH', isRead: false });
            if (!alertExists) {
                const alert = new Alert({
                    deviceId: device.deviceId,
                    type: 'TEMPERATURE_HIGH',
                    title: 'Temperature Above Target',
                    description: `Current Temperature: ${newChamberTemp.toFixed(1)}°C. Target Range: ${device.targetMinTemperature}°C – ${device.targetMaxTemperature}°C`,
                    severity: 'Warning'
                });
                await alert.save();
                io.emit(`alert:new:${device.deviceId}`, alert);
            }
        }
        
        if (newBatteryPercentage < 20) {
             const alertExists = await Alert.findOne({ deviceId: device.deviceId, type: 'BATTERY_LOW', isRead: false });
             if (!alertExists) {
                 const alert = new Alert({
                    deviceId: device.deviceId,
                    type: 'BATTERY_LOW',
                    title: 'Low Battery',
                    description: `Battery is below 20%. Currently at ${newBatteryPercentage.toFixed(1)}%.`,
                    severity: 'Critical'
                });
                await alert.save();
                io.emit(`alert:new:${device.deviceId}`, alert);
             }
        }
      }
    } catch (error) {
      console.error('Simulation Error:', error.message);
    }
  }, 5000); // Run every 5 seconds
};

export const stopSimulation = () => {
  if (simulationInterval) {
    clearInterval(simulationInterval);
    simulationInterval = null;
    console.log('Simulation Engine Stopped.');
  }
};
