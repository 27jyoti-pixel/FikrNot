const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const env = require('./config/env');
const errorHandler = require('./middlewares/errorMiddleware');

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const hostelRoutes = require('./routes/hostelRoutes');
const lostRoutes = require('./routes/lostRoutes');
const foundRoutes = require('./routes/foundRoutes');
const matchRoutes = require('./routes/matchRoutes');
const claimRoutes = require('./routes/claimRoutes');
const recoveryRoutes = require('./routes/recoveryRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');

const app = express();

// Security middleware
app.use(helmet());

// CORS setup
const corsOptions = {
  origin: env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
};
app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static uploads for local fallback
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/hostels', hostelRoutes);
app.use('/api/lost', lostRoutes);
app.use('/api/found', foundRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/claims', claimRoutes);
app.use('/api/recovery', recoveryRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/analytics', analyticsRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'FikrNot Backend API is healthy and operational',
    timestamp: new Date()
  });
});

// 404 Handler for unknown routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Cannot find endpoint ${req.originalUrl} on this server`
  });
});

// Centralized error handler
app.use(errorHandler);

module.exports = app;
