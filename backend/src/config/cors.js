const PRODUCTION_CLIENT_ORIGINS = ['https://fikrnot-1.onrender.com'];
const LOCAL_CLIENT_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:5173'
];

const parseClientOrigins = (configuredOrigins = '') => {
  const configured = String(configuredOrigins)
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  return [...new Set([
    ...PRODUCTION_CLIENT_ORIGINS,
    ...LOCAL_CLIENT_ORIGINS,
    ...configured
  ])];
};

const createCorsOptions = (configuredOrigins) => {
  const allowedOrigins = new Set(parseClientOrigins(configuredOrigins));

  return {
    origin(origin, callback) {
      if (origin && allowedOrigins.has(origin)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    optionsSuccessStatus: 204
  };
};

module.exports = { createCorsOptions, parseClientOrigins };
