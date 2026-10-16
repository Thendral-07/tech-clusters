/**
 * AgriCool IoT Sensor Simulator
 * Simulates an ESP32 micro-controller transmitting sensor readings
 * to the AgriCool backend API (Render live URL or Localhost)
 */

const TARGET_URL =
  process.env.TARGET_URL ||
  (process.argv.includes('--local')
    ? 'http://localhost:5000/api/sensors/data'
    : 'https://tech-clusters.onrender.com/api/sensors/data');

const DEVICE_ID = process.env.DEVICE_ID || 'ESP32_AGRICOOL_001';
const INTERVAL_MS = parseInt(process.env.INTERVAL_MS, 10) || 4000;

console.log('='.repeat(65));
console.log('🌱 AgriCool ESP32 Sensor Telemetry Simulator');
console.log(`📡 Target API Endpoint: ${TARGET_URL}`);
console.log(`📦 Simulated Device ID:  ${DEVICE_ID}`);
console.log(`⏱️  Transmission Rate:   Every ${INTERVAL_MS / 1000} seconds`);
console.log('Press Ctrl+C to terminate simulation at any time.');
console.log('='.repeat(65));

// Initial State for realistic physical cold-room dynamics
let state = {
  chamberTemperature: 5.2,
  ambientTemperature: 29.5,
  batteryPercentage: 82.0,
  batteryVoltage: 12.55,
  solarVoltage: 18.4,
  solarPower: 68.0,
  powerConsumption: 12.0,
  peltierStatus: false,
  fanStatus: false,
};

let packetCount = 0;

function stepPhysics() {
  // Ambient temperature slight random walk
  state.ambientTemperature = +(
    29.0 + Math.sin(Date.now() / 60000) * 3 + (Math.random() * 0.4 - 0.2)
  ).toFixed(1);

  // Peltier cooling control logic (Thermostat: Cool if > 6.0°C, stop if < 3.5°C)
  if (state.chamberTemperature >= 6.0) {
    state.peltierStatus = true;
    state.fanStatus = true;
  } else if (state.chamberTemperature <= 3.5) {
    state.peltierStatus = false;
    state.fanStatus = false;
  }

  // Thermal dynamics
  if (state.peltierStatus) {
    state.chamberTemperature = +(
      state.chamberTemperature -
      (0.15 + Math.random() * 0.05)
    ).toFixed(2);
    state.powerConsumption = +(68.0 + Math.random() * 4).toFixed(1);
  } else {
    state.chamberTemperature = +(
      state.chamberTemperature +
      (0.08 + Math.random() * 0.04)
    ).toFixed(2);
    state.powerConsumption = +(6.5 + Math.random() * 1.5).toFixed(1);
  }

  // Solar & Battery dynamics
  const daytimeFactor = 0.85; // Simulated daytime sunlight
  state.solarVoltage = +(18.0 + Math.random() * 1.2 * daytimeFactor).toFixed(2);
  state.solarPower = +(60.0 + Math.random() * 25 * daytimeFactor).toFixed(1);

  if (state.solarPower > state.powerConsumption) {
    state.batteryPercentage = Math.min(
      100,
      +(state.batteryPercentage + 0.1).toFixed(1)
    );
  } else {
    state.batteryPercentage = Math.max(
      10,
      +(state.batteryPercentage - 0.1).toFixed(1)
    );
  }
  state.batteryVoltage = +(
    11.8 + (state.batteryPercentage / 100) * 1.4
  ).toFixed(2);
}

async function sendSensorPacket() {
  stepPhysics();
  packetCount++;

  const payload = {
    deviceId: DEVICE_ID,
    chamberTemperature: state.chamberTemperature,
    ambientTemperature: state.ambientTemperature,
    batteryPercentage: state.batteryPercentage,
    batteryVoltage: state.batteryVoltage,
    solarVoltage: state.solarVoltage,
    solarPower: state.solarPower,
    powerConsumption: state.powerConsumption,
    peltierStatus: state.peltierStatus,
    fanStatus: state.fanStatus,
  };

  const startTime = Date.now();

  try {
    const response = await fetch(TARGET_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const elapsed = Date.now() - startTime;
    const resData = await response.json();

    if (response.ok && resData.success) {
      console.log(
        `[#${packetCount}] ✅ Sent in ${elapsed}ms | ` +
          `Chamber: ${payload.chamberTemperature}°C | ` +
          `Ambient: ${payload.ambientTemperature}°C | ` +
          `Battery: ${payload.batteryPercentage}% (${payload.batteryVoltage}V) | ` +
          `Solar: ${payload.solarPower}W | ` +
          `Peltier: ${payload.peltierStatus ? 'ON ❄️' : 'OFF'} | ` +
          `Fan: ${payload.fanStatus ? 'ON 🌀' : 'OFF'}`
      );
    } else {
      console.error(
        `[#${packetCount}] ⚠️ Server responded with HTTP ${response.status}:`,
        resData
      );
    }
  } catch (err) {
    console.error(
      `[#${packetCount}] ❌ Transmission failed: ${err.message}`
    );
  }
}

// Initial transmission immediately, then repeated on interval
sendSensorPacket();
const intervalHandle = setInterval(sendSensorPacket, INTERVAL_MS);

// Handle clean shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Stopping simulator. Total packets transmitted:', packetCount);
  clearInterval(intervalHandle);
  process.exit(0);
});
