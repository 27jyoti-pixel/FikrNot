const mongoose = require('mongoose');
const env = require('./env');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(env.MONGODB_URI);
    console.log('[Database] MongoDB connection established.');
    return conn;
  } catch (error) {
    const details = `${error.message || ''} ${error.cause?.message || ''}`.toLowerCase();
    let failureType = 'CONNECTION_FAILED';
    if (/enotfound|eai_again|name resolution|dns/.test(details)) failureType = 'DNS_LOOKUP_FAILED';
    else if (/authentication failed|code 18|bad auth/.test(details)) failureType = 'DATABASE_AUTH_FAILED';
    else if (/whitelist|ip access list|not authorized|timed out|server selection/.test(details)) failureType = 'NETWORK_OR_ACCESS_FAILED';
    console.error(JSON.stringify({
      event: 'mongodb_startup_failure',
      failureType,
      errorName: error.name || 'Error',
      errorCode: error.code || error.cause?.code || undefined
    }));
    process.exit(1);
  }
};

module.exports = connectDB;
