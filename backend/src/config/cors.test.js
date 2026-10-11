const assert = require('node:assert/strict');
const test = require('node:test');
const cors = require('cors');
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

test('handles a login preflight with credentials, methods, and auth headers', async () => {
  const response = await runCorsPreflight('https://fikrnot-1.onrender.com');

  assert.equal(response.statusCode, 204);
  assert.equal(
    response.headers['access-control-allow-origin'],
    'https://fikrnot-1.onrender.com'
  );
  assert.equal(response.headers['access-control-allow-credentials'], 'true');
  assert.match(response.headers['access-control-allow-methods'], /POST/);
  assert.match(response.headers['access-control-allow-headers'], /authorization/i);
});

test('does not grant an unlisted origin CORS access', async () => {
  const response = await runCorsPreflight('https://unexpected.example');
  assert.equal(response.headers['access-control-allow-origin'], undefined);
});

function runCorsPreflight(origin) {
  return new Promise((resolve, reject) => {
    const headers = {};
    const request = {
      method: 'OPTIONS',
      headers: {
        origin,
        'access-control-request-method': 'POST',
        'access-control-request-headers': 'content-type,authorization'
      }
    };
    const response = {
      statusCode: 200,
      setHeader(name, value) {
        headers[name.toLowerCase()] = value;
      },
      getHeader(name) {
        return headers[name.toLowerCase()];
      },
      end() {
        resolve({ statusCode: this.statusCode, headers });
      }
    };

    cors(createCorsOptions('https://fikrnot-1.onrender.com'))(
      request,
      response,
      (error) => error
        ? reject(error)
        : resolve({ next: true, statusCode: response.statusCode, headers })
    );
  });
}
