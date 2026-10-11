const assert = require('node:assert/strict');
const test = require('node:test');
const { createCorsOptions, parseClientOrigins } = require('./cors');

test('allows the deployed client and localhost development origins', () => {
  const origins = parseClientOrigins('https://preview.fikrnot.example');

  assert.ok(origins.includes('https://fikrnot-1.onrender.com'));
  assert.ok(origins.includes('http://localhost:3000'));
  assert.ok(origins.includes('http://localhost:5173'));
  assert.ok(origins.includes('https://preview.fikrnot.example'));
});

test('uses explicit credentialed CORS methods and headers without wildcard origin', () => {
  const options = createCorsOptions('https://fikrnot-1.onrender.com');

  assert.equal(options.credentials, true);
  assert.ok(options.methods.includes('OPTIONS'));
  assert.ok(options.allowedHeaders.includes('Authorization'));
  assert.equal(typeof options.origin, 'function');
});

test('approves known origins and omits CORS permission for unknown origins', async () => {
  const { origin } = createCorsOptions('https://fikrnot-1.onrender.com');
  const check = (value) => new Promise((resolve, reject) => {
    origin(value, (error, allowed) => error ? reject(error) : resolve(allowed));
  });

  assert.equal(await check('https://fikrnot-1.onrender.com'), true);
  assert.equal(await check('http://localhost:3000'), true);
  assert.equal(await check('https://unexpected.example'), false);
});
