/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS hooks load TypeScript without extra test dependencies. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const resolve = Module._resolveFilename;
Module._resolveFilename = function (name, ...args) {
  return resolve.call(this, name.startsWith('@/') ? path.join(__dirname, '../src', name.slice(2)) : name, ...args);
};
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { esModuleInterop: true, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText, filename);
process.env.NEXT_PUBLIC_API_URL = '/api/v1/';
process.env.NEXT_PUBLIC_USE_MOCKS = 'false';
const { api, setUnauthorizedHandler } = require('../src/lib/api/client.ts');
const { servicesApi } = require('../src/lib/api/endpoints/services.ts');
const { broadcastsApi } = require('../src/lib/api/endpoints/broadcasts.ts');
const { jobsApi } = require('../src/lib/api/endpoints/jobs.ts');
const { chatsApi } = require('../src/lib/api/endpoints/chats.ts');
const { usersApi } = require('../src/lib/api/endpoints/users.ts');
const { techniciansApi } = require('../src/lib/api/endpoints/technicians.ts');
const reply = (body, status = 200) => new Response(JSON.stringify(body), { status });
function mockFetch(handler) {
  global.fetch = async (url, options) => {
    assert.equal(options.credentials, 'include');
    assert.ok(!url.includes('//'));
    return handler(url, options);
  };
}
test('parallel expired requests share a refresh and retry with cookies', async () => {
  let refreshed = false, refreshCount = 0;
  mockFetch(async (url) => {
    if (url.endsWith('/refresh')) {
      refreshCount++;
      await new Promise((resolve) => setTimeout(resolve, 5));
      refreshed = true;
      return reply({});
    }
    return refreshed ? reply({ ok: true }) : reply({ message: 'Expired' }, 401);
  });
  const responses = await Promise.all([api.get('/users'), api.get('/admin/jobs')]);
  assert.equal(refreshCount, 1);
  assert.ok(responses.every((response) => response.data.ok));
});
test('failed refresh ends the session without retry loops', async () => {
  let unauthorized = 0, count = 0;
  setUnauthorizedHandler(() => unauthorized++);
  mockFetch(() => { count++; return reply({ message: 'Expired' }, 401); });
  assert.equal((await api.get('/users')).statusCode, 401);
  assert.equal(count, 2);
  assert.equal(unauthorized, 1);
  setUnauthorizedHandler(null);
});
test('invalid login preserves the 2FA flow and surfaces validation errors', async () => {
  let count = 0;
  mockFetch(() => { count++; return reply({ message: ['Invalid email', 'Invalid password'] }, 401); });
  assert.equal((await api.post('/auth/admin/login', {})).error, 'Invalid email, Invalid password');
  assert.equal(count, 1);
});
test('category writes preserve zero fees and metadata', async () => {
  mockFetch((url, options) => {
    assert.equal(url, '/api/v1/catalog/categories');
    const body = JSON.parse(options.body);
    assert.equal(body.bookingFee, 0);
    assert.equal(body.emergencyVisitFee, 0);
    assert.equal(body.description, 'Fix leaks');
    assert.equal(body.isActive, false);
    return reply({ ...body, id: 'category', createdAt: '2026-11-09' });
  });
  const service = await servicesApi.create({ name: 'Plumbing', category: 'Mechanical', description: 'Fix leaks', visitFee: 0, emergencyVisitFee: 0, isActive: false });
  assert.equal(service.visitFee, 0);
  assert.equal(service.emergencyVisitFee, 0);
});
test('broadcasts use preview POST and paginated history', async () => {
  mockFetch((url, options) => {
    if (url.endsWith('/preview')) {
      assert.equal(options.method, 'POST');
      assert.deepEqual(JSON.parse(options.body), { roles: ['CUSTOMER'], status: 'active' });
      return reply({ userCount: 2 });
    }
    return reply({ items: [{ id: 'broadcast' }], total: 1 });
  });
  assert.equal((await broadcastsApi.preview({ roles: ['CUSTOMER'], status: 'active' })).userCount, 2);
  assert.equal((await broadcastsApi.list())[0].id, 'broadcast');
});
test('ratings are persisted and booking amounts are mapped', async () => {
  const rating = { overall: 4.6, quality: 5, professionalism: 4, arrival: 5, communication: 4, value: 5, comment: 'Good' };
  mockFetch((url, options) => {
    assert.equal(url, '/api/v1/admin/jobs/job/rating');
    const body = JSON.parse(options.body);
    assert.equal(body.overall, 5);
    return reply({ id: 'job', status: 'COMPLETED', rating: body, bookingPayment: { amount: 5000 } });
  });
  const job = await jobsApi.rate('job', rating);
  assert.equal(job.rating.overall, 5);
  assert.equal(job.visitFee, 5000);
});
test('job creation includes payment and verified phone prerequisites', async () => {
  mockFetch((url, options) => {
    if (url.endsWith('/catalog/categories')) return reply([{ id: 'category', name: 'Plumbing' }]);
    const body = JSON.parse(options.body);
    assert.equal(body.paymentId, 'payment');
    assert.equal(body.phoneVerificationId, 'verification');
    assert.equal(body.priority, 'HIGH');
    assert.equal(body.customerId, 'customer');
    return reply({ id: 'job', status: 'OPEN', location: { latitude: -1, longitude: 30 }, offeredAmount: body.offeredAmount });
  });
  const job = await jobsApi.create({ customerId: 'customer', service: 'Plumbing', problem: 'Fix leaking pipe', location: 'Kigali', urgency: 'Today', latitude: -1, longitude: 30, offeredAmount: 20000, paymentId: 'payment', phoneVerificationId: 'verification' });
  assert.equal(job.latitude, -1);
  assert.equal(job.offeredAmount, 20000);
});
test('conversation filters use backend enums and omit empty search', async () => {
  mockFetch((url) => {
    assert.equal(url, '/api/v1/admin/conversations?status=AGREED');
    return reply({ data: [] });
  });
  assert.deepEqual(await chatsApi.list({ status: 'agreed', search: '' }), []);
});
test('all-user pagination uses one backend page instead of merging role pages', async () => {
  mockFetch((url) => {
    assert.equal(url, '/api/v1/users?status=SUSPENDED&page=12&limit=10');
    return reply({ data: [], pagination: { total: 200, page: 12, limit: 10 } });
  });
  assert.equal((await usersApi.list({ page: 12, pageSize: 10, status: 'suspended' })).total, 200);
});
test('technician identity updates target linked user ID', async () => {
  const profile = { id: 'profile', user: { id: 'user', fullName: 'Jane Doe', phoneNumber: '+250788123456', status: 'ACTIVE' }, verificationStatus: 'PENDING' };
  let updates = 0;
  mockFetch((url, options) => {
    if (options.method === 'PATCH') {
      assert.equal(url, '/api/v1/users/user');
      assert.deepEqual(JSON.parse(options.body), { fullName: 'Jane Doe' });
      updates++;
    }
    return reply(profile);
  });
  await techniciansApi.update('profile', { name: 'Jane Doe' });
  assert.equal(updates, 1);
});
test('multipart uploads let fetch generate the boundary', async () => {
  const form = new FormData();
  form.append('file', new Blob(['image']), 'image.png');
  mockFetch((_url, options) => {
    assert.equal(options.body, form);
    assert.equal(options.headers['Content-Type'], undefined);
    return reply({ id: 'ad' });
  });
  assert.equal((await api.put('/admin/ads/ad/image', form)).data.id, 'ad');
});
