import mongoose from 'mongoose';
import Produce from '../models/Produce.js';
import { config } from '../config/env.js';
import { connectDB } from '../config/database.js';

const seedProduce = async () => {
  try {
    await connectDB();
    await Produce.deleteMany(); // Clear existing
    
    const produceList = [
      { name: 'Tomato', minimumTemperature: 10, maximumTemperature: 15, description: 'Store at 10-15°C to preserve flavor and texture.', icon: 'tomato' },
      { name: 'Cucumber', minimumTemperature: 10, maximumTemperature: 12, description: 'Sensitive to chilling injury below 10°C.', icon: 'cucumber' },
      { name: 'Capsicum', minimumTemperature: 7, maximumTemperature: 10, description: 'Requires high humidity. Keep above 7°C to prevent pitting.', icon: 'capsicum' },
      { name: 'Carrot', minimumTemperature: 0, maximumTemperature: 5, description: 'Best stored near 0°C with high humidity.', icon: 'carrot' },
      { name: 'Broccoli', minimumTemperature: 0, maximumTemperature: 4, description: 'Cool rapidly after harvest to maintain green color.', icon: 'broccoli' },
      { name: 'Mango', minimumTemperature: 13, maximumTemperature: 15, description: 'Tropically sensitive. Do not refrigerate below 13°C.', icon: 'mango' }
    ];

    await Produce.insertMany(produceList);
    console.log('Produce data seeded successfully');
    process.exit();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

seedProduce();
