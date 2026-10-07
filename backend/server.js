const app = require('./src/app');
const connectDB = require('./src/config/db');
const env = require('./src/config/env');
const migrateLocationIndexes = require('./src/config/migrateLocationIndexes');

const startServer = async () => {
  await connectDB();
  await migrateLocationIndexes();

  const server = app.listen(env.PORT, () => {
    console.log(`==================================================`);
    console.log(` FIKRNOT BACKEND SERVER RUNNING ON PORT ${env.PORT}`);
    console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`   Client URL: ${env.CLIENT_URL}`);
    console.log(`==================================================`);
  });

  process.on('unhandledRejection', (err) => {
    console.error(`[Unhandled Rejection] ${err.name}: ${err.message}`);
    server.close(() => process.exit(1));
  });
};

startServer();
