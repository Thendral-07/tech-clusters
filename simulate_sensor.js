/**
 * AgriCool ESP32 Sensor Simulation
 * Replicates the exact behavior, formulas, and JSON payload
 * of the AgriCool ESP32 Arduino sketch (AGRICOOL_001)
 */

const TARGET_URL =
  process.env.TARGET_URL ||
  (process.argv.includes('--local')
    ? 'http://localhost:5000/api/sensors/data'
    : 'https://tech-clusters.onrender.com/api/sensors/data');

// Configuration from Arduino sketch
const DEVICE_ID = 'AGRICOOL_001';
const TARGET_MIN_TEMP = 5.0;  // Cold storage minimum target (°C)
const TARGET_MAX_TEMP = 10.0; // Cold storage maximum target (°C)
const SEND_INTERVAL_MS = parseInt(process.env.INTERVAL_MS, 10) || 5000;

// Lead-acid battery state-of-charge estimator (Exact mirror of Arduino function)
function estimateBatteryPercentage(voltage) {
  if (voltage >= 12.7) return 100.0;
  if (voltage >= 12.5) return 80.0;
  if (voltage >= 12.3) return 60.0;
  if (voltage >= 12.1) return 40.0;
  if (voltage >= 11.9) return 20.0;
  return 0.0;
}

// Simulated physical state
let chamberTemp = 8.5; // Starting chamber temperature (°C)
let ambientTemp = 31.2; // Ambient temperature outside box (°C)
let batteryVoltage = 12.6; // Volts (from divider)
let solarVoltage = 18.4; // Volts (from solar panel)
let peltierOn = false;
let fanOn = false;

// updateCooling mirror of Arduino logic
function updateCooling(temp) {
  if (Number.isNaN(temp) || temp < -50 || temp > 100) {
    peltierOn = false;
    fanOn = false;
  } else {
    // Hysteresis prevents rapid relay switching
    if (temp > TARGET_MAX_TEMP) {
      peltierOn = true;
      fanOn = true;
    } else if (temp < TARGET_MIN_TEMP) {
      peltierOn = false;
      fanOn = false;
    }
  }
}

// Thermal and electrical step simulation
function stepSimulation() {
  // Update ambient temperature with realistic small environmental drift
  ambientTemp = +(30.5 + Math.sin(Date.now() / 60000) * 2.5 + (Math.random() * 0.4 - 0.2)).toFixed(2);

  // If peltier is active, chamber cools down; otherwise, it warms up towards ambient
  if (peltierOn) {
    chamberTemp = +(chamberTemp - (0.35 + Math.random() * 0.15)).toFixed(2);
  } else {
    chamberTemp = +(chamberTemp + (0.25 + Math.random() * 0.1)).toFixed(2);
  }

  // Update cooling relay states based on current chamberTemp
  updateCooling(chamberTemp);

  // Solar and Battery Voltage fluctuations
  solarVoltage = +(17.8 + Math.random() * 1.5).toFixed(2);

  if (peltierOn) {
    // Under peltier load, battery voltage drops slightly
    batteryVoltage = Math.max(11.8, +(batteryVoltage - 0.02).toFixed(2));
  } else {
    // Solar charging recovery
    batteryVoltage = Math.min(12.8, +(batteryVoltage + 0.03).toFixed(2));
  }
}

let packetCount = 0;

async function sendSensorData() {
  stepSimulation();
  packetCount++;

  const batteryPercentage = estimateBatteryPercentage(batteryVoltage);

  // Exactly matches doc structure in Arduino sketch
  const payload = {
    deviceId: DEVICE_ID,
    chamberTemperature: chamberTemp,
    ambientTemperature: ambientTemp,
    batteryPercentage: batteryPercentage,
    batteryVoltage: batteryVoltage,
    solarVoltage: solarVoltage,
    solarPower: null,
    powerConsumption: null,
    peltierStatus: peltierOn,
    fanStatus: fanOn,
  };

  const startTime = Date.now();

  try {
    const res = await fetch(TARGET_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const elapsed = Date.now() - startTime;
    const json = await res.json();

    if (res.ok && json.success) {
      console.log(
        `[#${packetCount}] ✅ Sent in ${elapsed}ms -> ` +
          `Device: ${DEVICE_ID} | ` +
          `Chamber: ${chamberTemp}°C (${peltierOn ? 'COOLING ❄️' : 'IDLE ⏸️'}) | ` +
          `Ambient: ${ambientTemp}°C | ` +
          `Battery: ${batteryVoltage}V (${batteryPercentage}%) | ` +
          `Solar: ${solarVoltage}V | ` +
          `Relays: Peltier=${peltierOn ? 'ON' : 'OFF'}, Fan=${fanOn ? 'ON' : 'OFF'}`
      );
    } else {
      console.error(`[#${packetCount}] ⚠️ Error response:`, json);
    }
  } catch (err) {
    console.error(`[#${packetCount}] ❌ Network error: ${err.message}`);
  }
}

console.log('='.repeat(70));
console.log('🚀 AgriCool ESP32 Arduino Reference Simulator');
console.log(`📡 URL:        ${TARGET_URL}`);
console.log(`🆔 Device ID:  ${DEVICE_ID}`);
console.log(`❄️ Target:     ${TARGET_MIN_TEMP}°C - ${TARGET_MAX_TEMP}°C`);
console.log(`⏱️ Interval:   ${SEND_INTERVAL_MS}ms`);
console.log('='.repeat(70));

// Send first packet immediately
sendSensorData();

// Repeated transmissions
const timer = setInterval(sendSensorData, SEND_INTERVAL_MS);

process.on('SIGINT', () => {
  console.log(`\n🛑 Simulator stopped. Total packets: ${packetCount}`);
  clearInterval(timer);
  process.exit(0);
});
