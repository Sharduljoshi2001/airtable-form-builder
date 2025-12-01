const mongoose = require('mongoose');
require('dotenv').config();

async function connectDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Database connected successfully');
  } catch (error) {
    console.error('Database connection failed:', error.message);
    process.exit(1);
  }
}

mongoose.connection.on('connected', () => {
  console.log('Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('Mongoose disconnected from MongoDB');
});

process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('Database connection closed');
  process.exit(0);
});

module.exports = connectDatabase;
