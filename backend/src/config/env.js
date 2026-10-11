const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

module.exports = {
  PORT: process.env.PORT || 5000,
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/fikrnot',
  JWT_SECRET: process.env.JWT_SECRET || 'fikrnot_default_secret_key_2026',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || '',
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || '',
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || '',
  CLIENT_URL: process.env.CLIENT_URL || 'https://fikrnot-1.onrender.com',
  DEMO_RECTOR_EMAIL: process.env.DEMO_RECTOR_EMAIL || '',
  DEMO_RECTOR_PASSWORD: process.env.DEMO_RECTOR_PASSWORD || '',
  DEMO_HOSTEL_NAME: process.env.DEMO_HOSTEL_NAME || 'FikrNot Demo Hostel'
};
