/* eslint-disable @typescript-eslint/no-require-imports -- Dependency-free Chrome DevTools test harness. */
// Run against `next start`, not next dev. Every API call is intercepted with
// deterministic fixtures: no real account, cookies, database or mutations used.
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { once } = require('node:events');

const origin = process.env.UI_TEST_ORIGIN || 'http://localhost:3102';
const baseline = process.argv.includes('--baseline');
const latency = 150;
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const stamp = '2026-11-26T10:00:00.000Z';
const jobs = Array.from({ length: 25 }, (_, i) => ({
  id: `job-${i + 1}`, reference: `FD-1126${i + 1}`, status: 'OPEN', priority: 'NORMAL',
  description: `Repair pipe ${i + 1}`, service: 'Plumbing', createdAt: stamp, updatedAt: stamp,
  location: { address: 'Kigali', latitude: -1.9, longitude: 30 },
  customer: { id: 'customer', fullName: 'Customer', phoneNumber: '+250788123456' },
  currentTechnician: null, bookingPayment: { amount: 5000, status: 'VALID' }, dispute: null,
}));
const range = { period: 'currentMonth', from: '2026-11-01T00:00:00Z', to: '2026-12-01T00:00:00Z', toExclusive: true, timezone: 'Africa/Kigali' };
const overview = {
  range, generatedAt: stamp, filters: {},
  users: { newAccounts: 0, byRoleAndStatus: [] },
  technicians: { newProfiles: 0, currentByVerificationStatus: [], currentByAvailability: [] },
  jobs: { created: 25, completedInPeriod: 0, createdByStatusAndRequestType: [] },
  payments: { count: 25, bookingAmount: 125000, byStatusAndRequestType: [] },
  disputes: { opened: 0, currentlyUnresolved: 0 }, chat: { messages: 0, roomsCreated: 0 },
  ratings: { count: 0, responseCount: 0, averageScore: null }, broadcasts: { sent: 0 },
  notificationsCreated: 0, conversations: [], technicianDocuments: [], cancellationRequests: [], jobOffers: [],
  advertisements: { lifetimeCount: 0, lifetimeImpressions: 0, lifetimeClicks: 0, clickThroughRate: null },
  catalog: { newCategories: [], newServices: [], currentCategories: [], currentServices: [] }, auditEvents: 0,
};
function page(data, query) {
  const page = Number(query.get('page') || 1), limit = Number(query.get('limit') || 10);
  return { data: data.slice((page - 1) * limit, page * limit), pagination: { page, limit, total: data.length, totalPages: Math.ceil(data.length / limit) } };
}
function fixture(url) {
  const u = new URL(url), route = u.pathname.replace(/^.*\/api\/v1/, '');
  if (route === '/auth/admin/me') return { id: 'admin', fullName: 'Admin', email: 'admin@example.test', role: 'SUPER_ADMIN' };
  if (route === '/admin/jobs/summary') return { active: 25, completed: 0, openDisputes: 0 };
  if (route === '/admin/jobs') return page(jobs.filter((job) => !u.searchParams.get('search') || job.description.includes(u.searchParams.get('search'))), u.searchParams);
  if (route.startsWith('/admin/jobs/')) return jobs.find((job) => route.endsWith(job.id)) ?? jobs[0];
  if (route === '/catalog/admin/services') return [{ id: 'service', name: 'Plumbing', category: { name: 'Mechanical' }, isActive: true, bookingFee: 5000 }];
  if (route === '/users' || route === '/admin/technicians') return page([], u.searchParams);
  if (route === '/admin/ads') return { items: [] };
  if (route === '/admin/payments/summary') return { total: 25, amount: 125000, currency: 'RWF', generatedAt: stamp, byStatus: [{ status: 'VALID', count: 25, amount: 125000 }, { status: 'COMPLETED', count: 0, amount: 0 }] };
  if (route === '/admin/payments') return page(u.searchParams.get('status') === 'COMPLETED' ? [] : jobs.map((job) => ({
    id: `payment-${job.id}`, jobId: job.id, amount: 5000, status: 'VALID', paidAt: stamp, validUntil: '2026-12-30T00:00:00Z',
    externalPaymentId: `REF-${job.id}`, phoneNumber: '+250788123456', customer: job.customer,
    serviceCategory: { id: 'service', name: 'Plumbing' }, job: { ...job, assignmentHistory: [] }, extensionCount: 0,
  })), u.searchParams);
  if (route === '/admin/dashboard/overview') return overview;
  if (route === '/admin/dashboard/trends') return { range, interval: 'day', series: [] };
  if (route === '/admin/dashboard/breakdowns') return { range, catalog: { categoriesByStatus: [], servicesByCategoryAndStatus: [] }, jobs: { statusRequestTypePriority: [], serviceCategories: [] }, payments: [], ratingsByItem: [], technicians: { verificationStatus: [], availabilityStatus: [] } };
  if (route.startsWith('/admin/dashboard/')) return { range, data: [], pagination: { total: 0, limit: 8, offset: 0, hasMore: false } };
  return [];
}

async function main() {
  const profile = fs.mkdtempSync(path.join(process.env.TEMP || os.tmpdir(), 'fundi-ui-'));
  const chrome = spawn(process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new', '--remote-debugging-port=0', `--user-data-dir=${profile}`, '--no-first-run', '--no-default-browser-check', '--disable-background-networking', 'about:blank',
  ], { stdio: ['ignore', 'ignore', 'pipe'] });
  let ws;
  try {
    const endpoint = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Chrome startup timeout')), 15000);
      chrome.once('error', reject);
      chrome.stderr.on('data', (chunk) => {
        const match = chunk.toString().match(/DevTools listening on (ws:\/\/\S+)/);
        if (match) { clearTimeout(timeout); resolve(match[1]); }
      });
    });
    ws = new WebSocket(endpoint);
    await once(ws, 'open');
    let id = 0, sessionId;
    const pending = new Map(), requests = [], errors = [], seenRequestIds = new Set();
    const send = (method, params = {}, session = sessionId) => new Promise((resolve, reject) => {
      const key = ++id;
      const timeout = setTimeout(() => {
        pending.delete(key);
        reject(new Error(`CDP timeout: ${method}`));
      }, 10000);
      pending.set(key, {
        method,
        resolve: (value) => { clearTimeout(timeout); resolve(value); },
        reject: (error) => { clearTimeout(timeout); reject(error); },
      });
      ws.send(JSON.stringify({ id: key, method, params, ...(session ? { sessionId: session } : {}) }));
    });
    ws.addEventListener('message', async ({ data }) => {
      const message = JSON.parse(data);
      try {
      if (message.id) {
        const request = pending.get(message.id);
        pending.delete(message.id);
        if (message.error) {
          console.error('CDP command failed', request?.method, String(message.error?.message ?? message.error));
          request?.reject(new Error(String(message.error?.message ?? message.error)));
        } else request?.resolve(message.result);
      } else if (message.method === 'Fetch.requestPaused') {
        const { requestId, request } = message.params;
        if (request.method !== 'OPTIONS' && !seenRequestIds.has(message.params.requestId)) {
          seenRequestIds.add(message.params.requestId);
          requests.push({ url: request.url, method: request.method });
        }
        await delay(latency);
        const cors = [
          { name: 'Content-Type', value: 'application/json' },
          { name: 'Access-Control-Allow-Origin', value: origin },
          { name: 'Access-Control-Allow-Credentials', value: 'true' },
          { name: 'Access-Control-Allow-Headers', value: 'content-type, ngrok-skip-browser-warning' },
          { name: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,PATCH,DELETE,OPTIONS' },
        ];
        const preflight = request.method === 'OPTIONS';
        await send('Fetch.fulfillRequest', {
          requestId,
          responseCode: preflight ? 204 : 200,
          responseHeaders: cors,
          body: preflight ? '' : Buffer.from(JSON.stringify(fixture(request.url))).toString('base64'),
        }).catch(() => {});
      } else if (message.method === 'Runtime.exceptionThrown') {
        errors.push(message.params.exceptionDetails.exception?.description || message.params.exceptionDetails.text);
      } else if (message.method === 'Runtime.consoleAPICalled' && message.params.type === 'error') {
        errors.push(message.params.args.map((arg) => String(arg.value ?? arg.description ?? '')).join(' '));
      }
      } catch (error) {
        console.error('CDP message handler failed:', error);
      }
    });
    const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
    ({ sessionId } = await send('Target.attachToTarget', { targetId, flatten: true }));
    await send('Page.enable');
    await send('Runtime.enable');
    await send('Fetch.enable', { patterns: [{ urlPattern: '*api/v1/*' }] });
    await send('Page.addScriptToEvaluateOnNewDocument', { source: `window.EventSource = class extends EventTarget { constructor() { super(); window.__stream = this; setTimeout(() => this.onopen?.(), 0); } close() {} };` });
    const evaluate = async (expression) => {
      const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
      if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
      return result.result.value;
    };
    const waitFor = async (expression) => {
      const deadline = Date.now() + 15000;
      while (Date.now() < deadline) { if (await evaluate(expression)) return; await delay(25); }
      const body = await evaluate('document.body.innerText').catch(() => '');
      throw new Error(`UI timeout: ${expression}\nDOM: ${body}\nErrors: ${errors.join('\n')}\nRequests: ${requests.map((r) => r.url).join('\n')}`);
    };
    const click = (selector) => evaluate(`document.querySelector(${JSON.stringify(selector)})?.click()`);
    const counts = () => requests.reduce((map, request) => {
      const u = new URL(request.url), key = u.pathname + (u.pathname.endsWith('/users') ? `?role=${u.searchParams.get('role')}` : '');
      map[key] = (map[key] || 0) + 1; return map;
    }, {});
    const metrics = { mode: baseline ? 'before' : 'after', apiFixtureLatencyMs: latency };
    let started = performance.now();
    await send('Page.navigate', { url: `${origin}/admin/jobs` });
    await waitFor(`!!document.querySelector('tr[aria-label="Open job FD-11261"]')`);
    metrics.jobsReadyMs = Math.round(performance.now() - started);
    await delay(250);
    metrics.jobsInitialRequests = counts();
    if (!baseline) {
      assert.equal(requests.some(({ url }) => url.includes('/users') || url.includes('/admin/ads')), false, 'Closed dialogs and unrelated ads must not load');
    }

    const row = 'tr[aria-label="Open job FD-11261"]';
    await evaluate(`document.querySelector(${JSON.stringify(row)}).focus()`);
    await delay(400);
    const beforeDetail = requests.length;
    started = performance.now();
    await click(row);
    await waitFor(`location.pathname === '/admin/jobs/job-1' && document.body.innerText.includes('Timeline')`);
    metrics.prefetchedDetailReadyMs = Math.round(performance.now() - started);
    await delay(200);
    metrics.detailRequestsAfterClick = requests.slice(beforeDetail).map(({ url }) => new URL(url).pathname);
    if (!baseline) assert.deepEqual(metrics.detailRequestsAfterClick, [], 'Warm detail and closed dialogs require no new requests');

    await click('a[href="/admin/payments"]');
    await waitFor(`document.body.innerText.includes('REF-job-1')`);
    await delay(250);
    metrics.throughPaymentsRequests = counts();
    if (!baseline) assert.equal(requests.filter(({ url }) => url.includes('/auth/admin/me')).length, 1, 'SPA navigation must not restore auth again');
    if (!baseline) assert.equal(requests.some(({ url }) => url.includes('/users')), false, 'Inactive payroll must not load');

    await click('a[href="/admin"]');
    await waitFor(`document.body.innerText.includes('Reporting controls') && !document.body.innerText.includes('Could not load dashboard')`);
    await delay(500);
    const beforeRefresh = requests.length;
    await evaluate(`[...document.querySelectorAll('button')].find(el => el.textContent.trim() === 'Refresh').click()`);
    await delay(500);
    metrics.dashboardRefreshRequests = requests.slice(beforeRefresh).map(({ url }) => new URL(url).pathname);
    if (!baseline) assert.equal(metrics.dashboardRefreshRequests.some((url) => /top-technicians|activity/.test(url)), false, 'Refresh must exclude hidden sections');
    assert.deepEqual(errors, [], 'No browser runtime errors');
    console.log(JSON.stringify(metrics, null, 2));
    await send('Browser.close', {}, undefined);
  } finally {
    ws?.close();
    chrome.kill();
    await delay(250);
    fs.rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
  }
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
