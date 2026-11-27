/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS hooks load TypeScript without extra test dependencies. */
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const ts = require("typescript");
const resolve = Module._resolveFilename;
Module._resolveFilename = function (name, ...args) {
  return resolve.call(
    this,
    name.startsWith("@/")
      ? path.join(__dirname, "../src", name.slice(2))
      : name,
    ...args,
  );
};
require.extensions[".ts"] = (module, filename) =>
  module._compile(
    ts.transpileModule(fs.readFileSync(filename, "utf8"), {
      compilerOptions: {
        esModuleInterop: true,
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
      },
    }).outputText,
    filename,
  );
process.env.NEXT_PUBLIC_API_URL = "/api/v1/";
process.env.NEXT_PUBLIC_USE_MOCKS = "false";
const { api, setUnauthorizedHandler, unwrap } = require("../src/lib/api/client.ts");
const { servicesApi } = require("../src/lib/api/endpoints/services.ts");
const { dashboardApi } = require("../src/lib/api/endpoints/dashboard.ts");
const { broadcastsApi } = require("../src/lib/api/endpoints/broadcasts.ts");
const { jobsApi } = require("../src/lib/api/endpoints/jobs.ts");
const { paymentsApi } = require("../src/lib/api/endpoints/payments.ts");
const { mapBackendJobListItem, jobListItemToJob } = require("../src/lib/api/adapters/jobs.ts");
const { QueryClient } = require("@tanstack/react-query");
const { jobKeys } = require("../src/hooks/useJobs.ts");
const { paymentKeys, invalidatePaymentDependents } = require("../src/hooks/usePayments.ts");
const { chatsApi } = require("../src/lib/api/endpoints/chats.ts");
const { usersApi } = require("../src/lib/api/endpoints/users.ts");
const { techniciansApi } = require("../src/lib/api/endpoints/technicians.ts");
const { authService } = require("../src/lib/auth-service.ts");
const reply = (body, status = 200) =>
  new Response(JSON.stringify(body), { status });
function mockFetch(handler) {
  global.fetch = async (url, options) => {
    assert.equal(options.credentials, "include");
    assert.ok(!url.includes("//"));
    return handler(url, options);
  };
}
test("parallel expired requests share a refresh and retry with cookies", async () => {
  let refreshed = false,
    refreshCount = 0;
  mockFetch(async (url) => {
    if (url.endsWith("/refresh")) {
      refreshCount++;
      await new Promise((resolve) => setTimeout(resolve, 5));
      refreshed = true;
      return reply({});
    }
    return refreshed ? reply({ ok: true }) : reply({ message: "Expired" }, 401);
  });
  const responses = await Promise.all([
    api.get("/users"),
    api.get("/admin/jobs"),
  ]);
  assert.equal(refreshCount, 1);
  assert.ok(responses.every((response) => response.data.ok));
});
test("failed refresh ends the session without retry loops", async () => {
  let unauthorized = 0,
    count = 0;
  setUnauthorizedHandler(() => unauthorized++);
  mockFetch(() => {
    count++;
    return reply({ message: "Expired" }, 401);
  });
  assert.equal((await api.get("/users")).statusCode, 401);
  assert.equal(count, 2);
  assert.equal(unauthorized, 1);
  setUnauthorizedHandler(null);
});
test("invalid login preserves the 2FA flow and surfaces validation errors", async () => {
  let count = 0;
  mockFetch(() => {
    count++;
    return reply({ message: ["Invalid email", "Invalid password"] }, 401);
  });
  assert.equal(
    (await api.post("/auth/admin/login", {})).error,
    "Invalid email, Invalid password",
  );
  assert.equal(count, 1);
});
test("service writes preserve zero fees and metadata", async () => {
  mockFetch((url, options) => {
    assert.equal(url, "/api/v1/catalog/services");
    const body = JSON.parse(options.body);
    assert.equal(body.bookingFee, 0);
    assert.equal(body.emergencyVisitFee, 0);
    assert.equal(body.description, "Fix leaks");
    assert.equal(body.categoryId, "category");
    return reply({ ...body, id: "category", createdAt: "2026-11-09" });
  });
  const service = await servicesApi.create({
    name: "Plumbing",
    categoryId: "category",
    category: "Mechanical",
    description: "Fix leaks",
    visitFee: 0,
    emergencyVisitFee: 0,
    isActive: false,
  });
  assert.equal(service.visitFee, 0);
  assert.equal(service.emergencyVisitFee, 0);
});
test("broadcasts use preview POST and paginated history", async () => {
  mockFetch((url, options) => {
    if (url.endsWith("/preview")) {
      assert.equal(options.method, "POST");
      assert.deepEqual(JSON.parse(options.body), {
        roles: ["CUSTOMER"],
        status: "active",
      });
      return reply({ userCount: 2 });
    }
    return reply({ items: [{ id: "broadcast" }], total: 1 });
  });
  assert.equal(
    (await broadcastsApi.preview({ roles: ["CUSTOMER"], status: "active" }))
      .userCount,
    2,
  );
  assert.equal((await broadcastsApi.list())[0].id, "broadcast");
});
test("ratings are persisted and booking amounts are mapped", async () => {
  const rating = {
    overall: 4.6,
    quality: 5,
    professionalism: 4,
    arrival: 5,
    communication: 4,
    value: 5,
    comment: "Good",
  };
  mockFetch((url, options) => {
    assert.equal(url, "/api/v1/admin/jobs/job/rating");
    const body = JSON.parse(options.body);
    assert.equal(body.overall, 5);
    return reply({
      id: "job",
      status: "COMPLETED",
      rating: body,
      bookingPayment: { amount: 5000 },
    });
  });
  const job = await jobsApi.rate("job", rating);
  assert.equal(job.rating.overall, 5);
  assert.equal(job.visitFee, 5000);
});
test("job creation includes payment and verified phone prerequisites", async () => {
  mockFetch((url, options) => {
    if (url.endsWith("/catalog/admin/services"))
      return reply([{ id: "category", name: "Plumbing" }]);
    const body = JSON.parse(options.body);
    assert.equal(body.paymentId, "payment");
    assert.equal(body.phoneVerificationId, "verification");
    assert.equal(body.priority, "HIGH");
    assert.equal(body.customerId, "customer");
    return reply({
      id: "job",
      status: "OPEN",
      location: { latitude: -1, longitude: 30 },
      offeredAmount: body.offeredAmount,
    });
  });
  const job = await jobsApi.create({
    customerId: "customer",
    service: "Plumbing",
    problem: "Fix leaking pipe",
    location: "Kigali",
    urgency: "HIGH",
    latitude: -1,
    longitude: 30,
    offeredAmount: 20000,
    paymentId: "payment",
    phoneVerificationId: "verification",
  });
  assert.equal(job.latitude, -1);
  assert.equal(job.offeredAmount, 20000);
});
test("chat listing uses the current room endpoint and omits empty search", async () => {
  mockFetch((url) => {
    assert.equal(url, "/api/v1/admin/chat/rooms?status=agreed");
    return reply([]);
  });
  assert.deepEqual(await chatsApi.list({ status: "agreed", search: "" }), []);
});
test("all-user pagination uses one backend page instead of merging role pages", async () => {
  mockFetch((url) => {
    assert.equal(url, "/api/v1/users?status=SUSPENDED&page=12&limit=10");
    return reply({ data: [], pagination: { total: 200, page: 12, limit: 10 } });
  });
  assert.equal(
    (await usersApi.list({ page: 12, pageSize: 10, status: "suspended" }))
      .total,
    200,
  );
});
test("technician identity updates target linked user ID", async () => {
  const profile = {
    id: "profile",
    user: {
      id: "user",
      fullName: "Jane Doe",
      phoneNumber: "+250788123456",
      status: "ACTIVE",
    },
    verificationStatus: "PENDING",
  };
  let updates = 0;
  mockFetch((url, options) => {
    if (options.method === "PATCH") {
      assert.equal(url, "/api/v1/users/user");
      assert.deepEqual(JSON.parse(options.body), { fullName: "Jane Doe" });
      updates++;
    }
    return reply(profile);
  });
  await techniciansApi.update("profile", { name: "Jane Doe" });
  assert.equal(updates, 1);
});
test("admin dashboard analytics use the matching period-aware API endpoints", async () => {
  const expected = [
    "/api/v1/admin/dashboard/overview?period=currentMonth&timezone=Africa%2FKigali",
    "/api/v1/admin/dashboard/trends?period=currentMonth&timezone=Africa%2FKigali",
    "/api/v1/admin/dashboard/breakdowns?period=currentMonth&timezone=Africa%2FKigali",
    "/api/v1/admin/dashboard/top-technicians?period=currentMonth&timezone=Africa%2FKigali",
    "/api/v1/admin/dashboard/activity?period=currentMonth&timezone=Africa%2FKigali&limit=8",
  ];
  const requested = [];
  mockFetch((url) => {
    requested.push(url);
    return reply({});
  });
  const query = { period: "currentMonth", timezone: "Africa/Kigali" };
  await Promise.all([
    dashboardApi.overview(query),
    dashboardApi.trends(query),
    dashboardApi.breakdowns(query),
    dashboardApi.topTechnicians(query),
    dashboardApi.activity({ ...query, limit: 8 }),
  ]);
  assert.deepEqual(requested.sort(), expected.sort());
});
test("admin password recovery requests, verifies, then consumes a reset grant", async () => {
  const requested = [];
  mockFetch((url, options) => {
    requested.push({ url, body: JSON.parse(options.body) });
    if (url.endsWith("/password/reset/verify")) {
      return reply({
        resetToken: "single-use-reset-token",
        expiresInSeconds: 300,
      });
    }
    return reply({ message: "If an active administrator account matches." });
  });
  await authService.requestPasswordReset("admin@fundi.rw");
  await authService.verifyPasswordResetOtp("admin@fundi.rw", "123456");
  await authService.resetPassword(
    "admin@fundi.rw",
    "single-use-reset-token",
    "NewAdmin@456",
  );
  assert.deepEqual(requested, [
    {
      url: "/api/v1/auth/admin/password/reset/request",
      body: { email: "admin@fundi.rw" },
    },
    {
      url: "/api/v1/auth/admin/password/reset/verify",
      body: { email: "admin@fundi.rw", otp: "123456" },
    },
    {
      url: "/api/v1/auth/admin/password/reset",
      body: {
        email: "admin@fundi.rw",
        resetToken: "single-use-reset-token",
        newPassword: "NewAdmin@456",
      },
    },
  ]);
});
test("multipart uploads let fetch generate the boundary", async () => {
  const form = new FormData();
  form.append("file", new Blob(["image"]), "image.png");
  mockFetch((_url, options) => {
    assert.equal(options.body, form);
    assert.equal(options.headers["Content-Type"], undefined);
    return reply({ id: "ad" });
  });
  assert.equal((await api.put("/admin/ads/ad/image", form)).data.id, "ad");
});

const summaryJob = {
  id: "job-summary", reference: "FD-1126001", status: "OPEN",
  description: "Repair pipe", service: "Plumbing", priority: "HIGH",
  createdAt: "2026-11-26T10:00:00Z", updatedAt: "2026-11-26T10:00:00Z",
  customer: { id: "customer", fullName: "Customer" },
  currentTechnician: null, bookingPayment: { amount: 5000, status: "VALID" },
  dispute: { id: "dispute", resolvedAt: null },
};

test("job lists send one bounded server query and use server totals without re-filtering", async () => {
  let requests = 0;
  mockFetch((url) => {
    requests++;
    const params = new URL(url, "http://localhost").searchParams;
    assert.equal(params.get("page"), "3");
    assert.equal(params.get("limit"), "10");
    assert.equal(params.get("priority"), "HIGH");
    assert.equal(params.get("serviceCategoryId"), "service-uuid");
    assert.equal(params.get("search"), "FD-1126");
    assert.equal(params.get("group"), "disputed");
    assert.equal(params.get("sortBy"), "offeredAmount");
    assert.equal(params.get("sortOrder"), "asc");
    for (const name of ["pageSize", "urgency", "service"]) assert.equal(params.has(name), false);
    return reply({ data: [summaryJob], pagination: { page: 3, limit: 10, total: 41, totalPages: 5 } });
  });
  const page = await jobsApi.list({ page: 3, pageSize: 10, priority: "HIGH", serviceCategoryId: "service-uuid", search: " FD-1126 ", group: "disputed", sortBy: "offeredAmount", sortOrder: "asc" });
  assert.equal(requests, 1);
  assert.equal(page.items.length, 1);
  assert.deepEqual({ total: page.total, page: page.page, pageSize: page.pageSize, totalPages: page.totalPages }, { total: 41, page: 3, pageSize: 10, totalPages: 5 });
  assert.deepEqual(page.items[0].dispute, { id: "dispute", resolvedAt: null });
});

test("job list defaults opt into pagination, omit whitespace search and preserve empty pages", async () => {
  mockFetch((url) => {
    const params = new URL(url, "http://localhost").searchParams;
    assert.equal(params.get("page"), "1");
    assert.ok(Number(params.get("limit")) > 0);
    assert.equal(params.has("search"), false);
    return reply({ data: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } });
  });
  assert.equal((await jobsApi.list({ search: "   " })).totalPages, 0);
});

test("lightweight job mapper accepts resolved disputes and nullable relations without inventing detail fields", () => {
  const row = mapBackendJobListItem({ ...summaryJob, bookingPayment: null, customer: null, dispute: { id: "dispute", resolvedAt: "2026-11-26T12:00:00Z" } });
  assert.equal(row.dispute.resolvedAt, "2026-11-26T12:00:00Z");
  assert.equal(row.customer.name, "Unknown customer");
  assert.equal(row.technician, undefined);
  assert.equal(row.bookingPaymentStatus, "PENDING");
  for (const field of ["rating", "events", "quote", "cancellationReason"]) assert.equal(field in row, false);
});

test("opening a job after listing fetches its complete detail representation", async () => {
  const requests = [];
  mockFetch((url) => {
    requests.push(url);
    if (url.includes("?")) return reply({ data: [summaryJob], pagination: { page: 1, limit: 10, total: 1, totalPages: 1 } });
    return reply({ ...summaryJob, rating: { overall: 5, comment: "Great" }, dispute: { reason: "Late", openedBy: "TECHNICIAN", openedAt: "2026-11-26T10:00:00Z" } });
  });
  await jobsApi.list();
  const job = await jobsApi.get("job-summary");
  assert.equal(requests[1], "/api/v1/admin/jobs/job-summary");
  assert.equal(job.rating.overall, 5);
  assert.equal(job.dispute.openedBy, "technician");
});

test("payments send paging, effective-status filters and sorting to the backend", async () => {
  mockFetch((url) => {
    const params = new URL(url, "http://localhost").searchParams;
    assert.equal(params.get("page"), "2");
    assert.equal(params.get("limit"), "10");
    assert.equal(params.get("status"), "EXPIRED");
    assert.equal(params.get("sortBy"), "amount");
    assert.equal(params.get("sortOrder"), "asc");
    assert.equal(params.get("search"), "MOMO");
    return reply({ data: [{ id: "payment", status: "EXPIRED", amount: 5000, job: null }], pagination: { page: 2, limit: 10, total: 55, totalPages: 6 } });
  });
  const result = await paymentsApi.list({ page: 2, limit: 10, status: "EXPIRED", sortBy: "amount", sortOrder: "asc", search: " MOMO " });
  assert.equal(result.pagination.total, 55);
  assert.equal(result.data[0].status, "EXPIRED");
});

test("payment defaults are bounded and completed-payment pages use the paginated route", async () => {
  const requested = [];
  mockFetch((url) => {
    const parsed = new URL(url, "http://localhost");
    requested.push(parsed);
    assert.equal(parsed.pathname, "/api/v1/admin/payments");
    assert.equal(parsed.searchParams.get("page"), "1");
    assert.equal(parsed.searchParams.get("limit"), "20");
    assert.equal(parsed.searchParams.has("search"), false);
    return reply({ data: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } });
  });
  await paymentsApi.list({ search: " " });
  await paymentsApi.list({ status: "COMPLETED" });
  assert.equal(requested[1].searchParams.get("status"), "COMPLETED");
});

test("financial summary uses aggregate endpoint and retains totals beyond the displayed page", async () => {
  const totals = { total: 203, amount: 420000, currency: "RWF", generatedAt: "2026-11-26T12:00:00Z", byStatus: [{ status: "VALID", count: 203, amount: 420000 }] };
  mockFetch((url) => {
    const parsed = new URL(url, "http://localhost");
    assert.equal(parsed.pathname, "/api/v1/admin/payments/summary");
    assert.equal(parsed.searchParams.get("from"), "2026-11-01T00:00:00Z");
    assert.equal(parsed.searchParams.has("page"), false);
    return reply(totals);
  });
  assert.deepEqual(await paymentsApi.summary({ from: "2026-11-01T00:00:00Z" }), totals);
});

test("list query cache keys isolate filters/pages from full job details and payment summaries", () => {
  const client = new QueryClient();
  try {
    client.setQueryData(jobKeys.list({ page: 1 }), { items: [mapBackendJobListItem(summaryJob)] });
    assert.equal(client.getQueryData(jobKeys.detail(summaryJob.id)), undefined);
    client.setQueryData(paymentKeys.list({ page: 1, status: "VALID" }), { data: [{ id: "valid" }] });
    assert.equal(client.getQueryData(paymentKeys.list({ page: 2, status: "VALID" })), undefined);
    assert.equal(client.getQueryData(paymentKeys.list({ page: 1, status: "EXPIRED" })), undefined);
    assert.equal(client.getQueryData(paymentKeys.summary({})), undefined);
  } finally { client.clear(); }
});

test("payment mutations invalidate all list pages, financial summaries, job details and dashboard analytics", async () => {
  const client = new QueryClient();
  const keys = [paymentKeys.list({ page: 2 }), paymentKeys.summary({}), jobKeys.detail("job"), ["dashboard", "analytics", { period: "today" }]];
  try {
    keys.forEach((key) => client.setQueryData(key, { existing: true }));
    client.setQueryData(["unrelated"], true);
    await invalidatePaymentDependents(client);
    keys.forEach((key) => assert.equal(client.getQueryState(key).isInvalidated, true));
    assert.equal(client.getQueryState(["unrelated"]).isInvalidated, false);
  } finally { client.clear(); }
});

test("caller abort signals cancel requests instead of returning a timeout error", async () => {
  const controller = new AbortController();
  let seenSignal;
  mockFetch(async (_url, options) => {
    seenSignal = options.signal;
    await new Promise((resolve) => setTimeout(resolve, 25));
    return reply([]);
  });
  const pending = unwrap(api.get("/admin/jobs", { signal: controller.signal }));
  controller.abort();
  await assert.rejects(pending, (error) => error.name === "AbortError");
  assert.equal(seenSignal.aborted, true);
});

test("list rows seed the detail shell without claiming complete detail fields", () => {
  const row = mapBackendJobListItem(summaryJob);
  const shell = jobListItemToJob(row);
  assert.equal(shell.id, row.id);
  assert.equal(shell.reference, row.reference);
  assert.equal(shell.customer.name, row.customer.name);
  assert.deepEqual(shell.events, []);
  assert.equal(shell.rating, undefined);
  assert.equal(shell.dispute, undefined);
  assert.equal("resolvedAt" in shell, false);
});
