/* Pure VM checks: never reads or writes a browser/user storage profile. */
const assert = require('node:assert/strict'), fs = require('node:fs'), vm = require('node:vm');
const KEY = 'et_demo_commerce_v1', values = new Map(), writes = [], events = [], listeners = {};
let now = Date.UTC(2026, 9, 21, 9), writeFailure = false, readFailure = false, ignoreWrites = false, clockHook = null;
class Clock extends Date {
  constructor(...args) { super(...(args.length ? args : [now])); }
  static now() { if (clockHook) { const hook = clockHook; clockHook = null; hook(); } return now; }
}
const localStorage = {
  getItem(key) { if (readFailure && key === KEY) throw Error('Blocked read'); return values.get(key) ?? null; },
  setItem(key, value) { if (writeFailure) throw Error('Quota exceeded'); if (!ignoreWrites) { writes.push(key); values.set(key, String(value)); } },
  removeItem(key) { writes.push(key); values.delete(key); }
};
const context = {
  localStorage, Date: Clock, Math, module: { exports: {} },
  document: { dispatchEvent(event) { events.push(event); return true; } },
  CustomEvent: class { constructor(type, options) { this.type = type; this.detail = options.detail; } },
  addEventListener(type, handler) { listeners[type] = handler; },
  fetch() { throw Error('No network is allowed in the local demonstration'); }
};
context.window = context; vm.createContext(context);
vm.runInContext(fs.readFileSync(new URL('../ui/demo-billing.js', 'file://' + __filename), 'utf8'), context);
const api = context.DemoBilling, plain = value => JSON.parse(JSON.stringify(value));
const account = name => name === null ? values.delete('et_session') : values.set('et_session', JSON.stringify(name));
function fails(code, fn) {
  const before = values.get(KEY), eventCount = events.length;
  assert.throws(fn, e => e.code === code, code);
  assert.equal(values.get(KEY), before, code + ': no persistent mutation');
  assert.equal(events.length, eventCount, code + ': no success event');
}
function utcYear(time) {
  const date = new Date(time), month = date.getUTCMonth(); date.setUTCFullYear(date.getUTCFullYear() + 1);
  if (date.getUTCMonth() !== month) date.setUTCDate(0); return date.getTime();
}
const learning = { 'et_courseflow:bev:motor:alice': '{"read":true,"answers":[1,2],"gameResults":[]}', et_role: 'student', 'et_users': '{"alice":{"role":"student"}}' };
Object.entries(learning).forEach(([key, value]) => values.set(key, value));
assert.equal(context.module.exports, api, 'UMD CommonJS export and browser API agree');
assert.deepEqual(Object.keys(api.catalog), ['personal', 'pilot', 'private']);
assert.equal(api.catalog.personal.priceLabel, '¥199/年');
assert.deepEqual(plain(api.catalog.personal.periods), {
  monthly: { id: 'monthly', title: '月度', months: 1, amount: 29, priceLabel: '¥29/月' },
  quarterly: { id: 'quarterly', title: '季度', months: 3, amount: 69, priceLabel: '¥69/季' },
  annual: { id: 'annual', title: '年度', months: 12, amount: 199, priceLabel: '¥199/年' }
});
assert(Object.isFrozen(api.catalog.personal.periods) && Object.isFrozen(api.catalog.personal.periods.monthly));
assert.equal(api.catalog.pilot.priceLabel, '3000–10000元/班/年');
assert(api.catalog.pilot.features.some(text => text.includes('10000–30000元/班/年（未来）')));
assert.equal(api.catalog.private.priceLabel, '5–20万元/校');
assert(api.catalog.private.features.some(text => text.includes('部署与年维护') && text.includes('尚未拆分')));
assert(Object.isFrozen(api.catalog.personal.features));
assert.deepEqual(plain(api.catalog.personal.features), ['完整部件课程', 'AI 带教', '考证题库']);
assert.equal(api.owner(), '@guest');
assert.deepEqual(plain(api.getState()), { owner: '@guest', preview: false, membership: null, orders: [], requests: [] });
for (const feature of ['foundation', 'models', 'courses', 'ai', 'exam', 'unknown']) assert.equal(api.hasAccess(feature), true, 'preview off preserves existing access');
api.setPreview(true);
for (const feature of ['foundation', 'models']) assert.equal(api.hasAccess(feature), true);
for (const feature of ['courses', 'ai', 'exam', 'unknown']) assert.equal(api.hasAccess(feature), false);
assert.equal(api.isMember(), false);
assert.equal(events.at(-1).type, 'demo-billing:change');
assert.equal(events.at(-1).detail.owner, '@guest');
fails('INVALID_PREVIEW', () => api.setPreview('true'));
for (const plan of [null, 'pilot', 'private', 'unknown']) fails('INVALID_PLAN', () => api.createOrder(plan));
for (const period of [null, '', 'annual ', 'weekly', '__proto__', 1, {}]) fails('INVALID_PERIOD', () => api.createOrder('personal', period));
fails('INVALID_OUTCOME', () => api.settle('missing', 'paid'));
fails('ORDER_NOT_FOUND', () => api.settle('missing', 'success'));

const order = api.createOrder('personal');
assert.equal(order.status, 'pending'); assert.equal(order.owner, '@guest');
assert.equal(order.period, 'annual'); assert.equal(order.amount, 199);
assert.equal(order.priceLabel, '¥199/年'); assert.equal(order.createdAt, now);
assert.equal(api.settle(order.id, 'failure').status, 'failed');
assert.equal(api.isMember(), false, 'a failed simulation grants nothing');
assert.equal(api.settle(order.id, 'failure').status, 'failed');
assert.equal(api.settle(order.id, 'success').status, 'paid', 'failed orders may retry');
const membership = api.getState().membership;
assert.equal(membership.plan, 'personal'); assert.equal(membership.startsAt, now);
assert.equal(membership.expiresAt, utcYear(now));
for (const feature of ['courses', 'ai', 'exam']) assert.equal(api.hasAccess(feature), true);
now += 3600000;
api.settle(order.id, 'success');
assert.deepEqual(plain(api.getState().membership), plain(membership), 'same paid order never extends twice');
fails('ORDER_TERMINAL', () => api.settle(order.id, 'failure'));
fails('ORDER_TERMINAL', () => api.settle(order.id, 'cancel'));
const renewal = api.createOrder('personal'); api.settle(renewal.id, 'success');
assert.equal(api.getState().membership.startsAt, membership.startsAt);
assert.equal(api.getState().membership.expiresAt, utcYear(membership.expiresAt), 'renew from existing expiry');
const cancelled = api.createOrder('personal'), beforeCancel = plain(api.getState().membership);
assert.equal(api.settle(cancelled.id, 'cancel').status, 'cancelled');
assert.equal(api.settle(cancelled.id, 'cancel').status, 'cancelled');
fails('ORDER_TERMINAL', () => api.settle(cancelled.id, 'success'));
fails('ORDER_TERMINAL', () => api.settle(cancelled.id, 'failure'));
assert.deepEqual(plain(api.getState().membership), beforeCancel);
const failedCancel = api.createOrder('personal'); api.settle(failedCancel.id, 'failure'); api.settle(failedCancel.id, 'cancel');
fails('ORDER_TERMINAL', () => api.settle(failedCancel.id, 'success'));
now = api.getState().membership.expiresAt;
assert.equal(api.isMember(), false); assert.equal(api.hasAccess('ai'), false, 'expiry boundary closes member access');
const expiredRenewal = api.createOrder('personal'); api.settle(expiredRenewal.id, 'success');
assert.equal(api.getState().membership.startsAt, now); assert.equal(api.getState().membership.expiresAt, utcYear(now));

account('alice'); assert.equal(api.owner(), 'alice');
assert.equal(api.isMember(), false); assert.equal(api.getState().preview, false);
api.setPreview(true); const aliceOrder = api.createOrder('personal');
account('bob'); api.setPreview(true);
fails('ORDER_NOT_FOUND', () => api.settle(aliceOrder.id, 'success'));
account(null); fails('ORDER_NOT_FOUND', () => api.settle(aliceOrder.id, 'success'));
assert.equal(api.isMember(), true, 'guest retains its own membership');
account('alice'); api.settle(aliceOrder.id, 'success');
assert.equal(api.isMember(), true);
account('bob'); assert.equal(api.isMember(), false); assert.equal(api.hasAccess('courses'), false);
const request = api.createRequest('pilot', { organization: '  示例学校  ', classes: 3, contact: 'must-not-be-stored' });
assert.equal(request.status, 'demo'); assert.equal(request.organization, '示例学校'); assert.equal(request.classes, 3);
assert.equal('contact' in request, false); assert.equal(api.isMember(), false, 'B2B intent is not a purchase or role assignment');
api.createRequest('private', { organization: '示例学校', classes: 2 });
fails('INVALID_PLAN', () => api.createRequest('personal', { organization: '学校', classes: 2 }));
for (const fields of [null, {}, { organization: ' ', classes: 1 }, { organization: '学校', classes: 0 }, { organization: '学校', classes: 1.5 }, { organization: '学校', classes: '2' }]) fails('INVALID_REQUEST', () => api.createRequest('pilot', fields));
const exposed = api.getState(); exposed.preview = false; exposed.requests.length = 0;
assert.equal(api.getState().preview, true); assert.equal(api.getState().requests.length, 2, 'returned state is detached');
request.organization = 'changed'; assert.equal(api.getState().requests[0].organization, '示例学校');

const pending = api.createOrder('personal'), raw = values.get(KEY);
writeFailure = true;
for (const fn of [() => api.createOrder('personal'), () => api.setPreview(false), () => api.settle(pending.id, 'success'), () => api.createRequest('pilot', { organization: '学校', classes: 1 }), () => api.reset()]) fails('STORAGE_WRITE_FAILED', fn);
writeFailure = false; assert.equal(values.get(KEY), raw); assert.equal(api.isMember(), false);
ignoreWrites = true; fails('STORAGE_WRITE_FAILED', () => api.createOrder('personal')); ignoreWrites = false;
readFailure = true;
assert.equal(api.getState().membership, null, 'unreadable storage has a safe read default');
fails('STORAGE_READ_FAILED', () => api.createOrder('personal')); readFailure = false;
clockHook = () => account('alice'); fails('ACCOUNT_CHANGED', () => api.settle(pending.id, 'success'));
account('bob'); assert.equal(api.getState().orders.find(o => o.id === pending.id).status, 'pending', 'account switch aborts before save');

const eventCount = events.length;
listeners.storage({ key: KEY }); assert.equal(events.length, eventCount + 1);
listeners.storage({ key: 'unrelated' }); assert.equal(events.length, eventCount + 1);
account('alice'); listeners.storage({ key: 'et_session' });
assert.equal(events.at(-1).detail.owner, 'alice'); assert.equal(events.at(-1).detail.state.membership.plan, 'personal');
listeners.storage({ key: null }); assert.equal(events.at(-1).detail.owner, 'alice');
account('bob'); api.reset();
assert.deepEqual(plain(api.getState()), { owner: 'bob', preview: false, membership: null, orders: [], requests: [] });
account('alice'); assert.equal(api.isMember(), true, 'reset only removes current owner');
account(null); assert.equal(api.isMember(), true);
Object.entries(learning).forEach(([key, value]) => assert.equal(values.get(key), value, 'learning/role data untouched'));

for (const identity of ['__proto__', 'constructor', '']) {
  account(identity); assert.equal(api.owner(), identity); api.setPreview(true); const o = api.createOrder('personal'); api.settle(o.id, 'success'); assert.equal(api.isMember(), true); api.reset(); assert.equal(api.isMember(), false);
}
assert.equal({}.membership, undefined, 'owner keys cannot pollute object prototypes');
values.set('et_session', '{broken'); assert.equal(api.owner(), '@guest');
values.set('et_session', JSON.stringify({ name: 'alice' })); assert.equal(api.owner(), '@guest');
values.set('et_session', '123'); assert.equal(api.owner(), '@guest');
account('bad-data');
for (const broken of ['{broken', 'null', '[]', '{"version":1,"owners":[]}', '{"version":2,"owners":{}}']) {
  values.set(KEY, broken); const before = writes.length; assert.equal(api.getState().membership, null); assert.equal(api.getState().orders.length, 0); assert.equal(writes.length, before, 'safe default does not rewrite corrupted storage');
}
values.set(KEY, JSON.stringify({ version: 1, owners: { 'bad-data': { preview: 'true', membership: { plan: 'private', startsAt: now, expiresAt: now + 999999 }, orders: [{ ...order, owner: 'alice' }, { ...order, owner: 'bad-data', plan: 'unknown' }], requests: [{ ...request, owner: 'bad-data', classes: -1 }] } } }));
assert.deepEqual(plain(api.getState()), { owner: 'bad-data', preview: false, membership: null, orders: [], requests: [] });
api.setPreview(true); assert.equal(api.hasAccess('exam'), false, 'corrupted commerce does not grant paid access');
const doc = JSON.parse(values.get(KEY)); doc.owners['bad-data'].membership = { plan: 'personal', startsAt: now + 1000, expiresAt: now + 999999 }; values.set(KEY, JSON.stringify(doc));
assert.equal(api.isMember(), false, 'future-dated membership is inactive');
doc.owners['bad-data'].membership.startsAt = 'bad'; values.set(KEY, JSON.stringify(doc)); assert.equal(api.getState().membership, null);
now = Date.UTC(2028, 1, 29, 15, 30); api.reset(); const leapOrder = api.createOrder('personal'); api.settle(leapOrder.id, 'success');
assert.equal(api.getState().membership.expiresAt, Date.UTC(2029, 1, 28, 15, 30), 'one UTC calendar year clamps leap day');

// Exact calendar examples independently specify the desired target date,
// including milliseconds, leap years, month ends and year transitions.
const calendar = [
  ['monthly', [2026, 0, 31], [2026, 1, 28]],
  ['monthly', [2028, 0, 31], [2028, 1, 29]],
  ['monthly', [2026, 7, 31], [2026, 8, 30]],
  ['monthly', [2026, 11, 31], [2027, 0, 31]],
  ['quarterly', [2026, 0, 31], [2026, 3, 30]],
  ['quarterly', [2026, 10, 30], [2027, 1, 28]],
  ['quarterly', [2027, 11, 31], [2028, 2, 31]],
  ['annual', [2028, 1, 29], [2029, 1, 28]],
  ['annual', [2026, 11, 31], [2027, 11, 31]]
];
calendar.forEach(([period, from, to], index) => {
  account('calendar-' + index); now = Date.UTC(...from, 23, 59, 59, 987); api.setPreview(true);
  const o = api.createOrder('personal', period), quote = api.catalog.personal.periods[period];
  assert.equal(o.period, period); assert.equal(o.amount, quote.amount); assert.equal(o.priceLabel, quote.priceLabel);
  assert.equal(api.hasAccess('ai'), false);
  api.settle(o.id, 'success');
  assert.equal(api.getState().membership.period, period);
  assert.equal(api.getState().membership.expiresAt, Date.UTC(...to, 23, 59, 59, 987), period + ': UTC month-end target');
  for (const feature of ['foundation', 'models', 'courses', 'ai', 'exam']) assert.equal(api.hasAccess(feature), true, 'all paid periods have identical benefits');
  const expiry = api.getState().membership.expiresAt; api.settle(o.id, 'success');
  assert.equal(api.getState().membership.expiresAt, expiry, period + ': idempotent settlement');
});

account('mixed-periods'); now = Date.UTC(2026, 0, 31, 9); api.setPreview(true);
const month = api.createOrder('personal', 'monthly'); api.settle(month.id, 'failure'); api.settle(month.id, 'success');
assert.equal(api.getState().membership.expiresAt, Date.UTC(2026, 1, 28, 9));
now = Date.UTC(2026, 1, 10, 9);
const quarter = api.createOrder('personal', 'quarterly'); api.settle(quarter.id, 'success');
assert.equal(api.getState().membership.startsAt, Date.UTC(2026, 0, 31, 9));
assert.equal(api.getState().membership.expiresAt, Date.UTC(2026, 4, 28, 9), 'mixed renewal extends existing expiry by the order period');
assert.equal(api.getState().membership.period, 'quarterly');
const annual = api.createOrder('personal'); api.settle(annual.id, 'success');
assert.equal(api.getState().membership.expiresAt, Date.UTC(2027, 4, 28, 9));
assert.equal(api.getState().orders.find(o => o.id === month.id).period, 'monthly', 'later purchases do not relabel earlier orders');
now = api.getState().membership.expiresAt;
assert.equal(api.isMember(), false);
const afterExpiry = api.createOrder('personal', 'quarterly'); api.settle(afterExpiry.id, 'success');
assert.equal(api.getState().membership.startsAt, now);
assert.equal(api.getState().membership.expiresAt, Date.UTC(2027, 7, 28, 9), 'expired quarterly purchase starts from now');
const unpaid = api.createOrder('personal', 'monthly'); api.settle(unpaid.id, 'cancel');
fails('ORDER_TERMINAL', () => api.settle(unpaid.id, 'success'));

// An order is a persisted quote, not a live lookup into today's price list.
account('quote-snapshot'); now = Date.UTC(2026, 10, 30, 10);
const quoted = api.createOrder('personal', 'monthly');
quoted.amount = 999; quoted.priceLabel = 'mutated return value';
assert.equal(api.getState().orders[0].amount, 29); assert.equal(api.getState().orders[0].priceLabel, '¥29/月');
const snapshotDoc = JSON.parse(values.get(KEY));
snapshotDoc.owners['quote-snapshot'].orders[0].amount = 25;
snapshotDoc.owners['quote-snapshot'].orders[0].priceLabel = '¥25/月';
values.set(KEY, JSON.stringify(snapshotDoc));
assert.equal(api.getState().orders[0].amount, 25, 'previous quote is not silently repriced to current catalog');
api.settle(quoted.id, 'failure'); const quotedPaid = api.settle(quoted.id, 'success');
assert.equal(quotedPaid.period, 'monthly'); assert.equal(quotedPaid.amount, 25); assert.equal(quotedPaid.priceLabel, '¥25/月');
assert.equal(api.catalog.personal.periods.monthly.amount, 29, 'stored quote does not alter current price list');

// Historical annual records have no precise amount. Reading or migrating must
// never turn the previous “百元级” wording into a ¥199 payment claim.
account('history'); now = Date.UTC(2027, 0, 15, 11);
const historicMember = { plan: 'personal', startsAt: Date.UTC(2026, 0, 15, 11), expiresAt: Date.UTC(2030, 0, 15, 11) };
const historyDoc = JSON.parse(values.get(KEY));
historyDoc.owners.history = { preview: true, membership: historicMember, orders: ['paid', 'pending', 'failed', 'cancelled'].map(status => ({ id: 'historic-' + status, owner: 'history', plan: 'personal', status, createdAt: Date.UTC(2026, 0, 15), priceLabel: '百元级/年' })), requests: [] };
values.set(KEY, JSON.stringify(historyDoc)); const historicRaw = values.get(KEY);
let history = api.getState();
assert.equal(history.membership.period, 'annual'); assert.equal(api.isMember(), true);
assert(history.orders.every(o => o.period === 'annual' && o.amount === null && o.priceLabel === '历史演示价待定'));
assert.equal(values.get(KEY), historicRaw, 'reading history does not rewrite it');
const historicPaid = api.settle('historic-paid', 'success');
assert.equal(historicPaid.amount, null); assert.equal(historicPaid.priceLabel, '历史演示价待定');
assert.equal(api.getState().membership.expiresAt, historicMember.expiresAt, 'old paid record is not granted twice');
assert.equal(api.getState().orders[0].amount, null, 'legacy amount marker survives migration to explicit annual');
api.settle('historic-failed', 'success');
assert.equal(api.getState().membership.expiresAt, Date.UTC(2031, 0, 15, 11), 'unpaid legacy retry keeps annual duration');
assert.equal(api.getState().orders.find(o => o.id === 'historic-failed').amount, null);
fails('ORDER_TERMINAL', () => api.settle('historic-cancelled', 'success'));
api.setPreview(false); api.setPreview(true);
assert(api.getState().orders.every(o => o.amount === null && o.priceLabel === '历史演示价待定'), 'unrelated mutations do not invent historical prices');

account('invalid-period');
const invalidDoc = JSON.parse(values.get(KEY));
invalidDoc.owners['invalid-period'] = { preview: true, membership: { ...historicMember, period: 'weekly' }, orders: [{ id: 'unknown-period', owner: 'invalid-period', plan: 'personal', period: 'weekly', amount: 1, priceLabel: '¥1/周', status: 'pending', createdAt: now }], requests: [] };
values.set(KEY, JSON.stringify(invalidDoc));
assert.equal(api.isMember(), false); assert.equal(api.getState().orders.length, 0);
fails('ORDER_NOT_FOUND', () => api.settle('unknown-period', 'success'));
assert.equal(api.getState().membership, null, 'unknown stored period never becomes annual access');

assert(writes.every(key => key === KEY), 'all writes use one commerce key with no username suffix');
Object.entries(learning).forEach(([key, value]) => assert.equal(values.get(key), value));
console.log('PASS: monthly ¥29 / quarterly ¥69 / annual ¥199 snapshots and UTC month-end renewal, legacy annual/unknown-price compatibility, identical benefits, failed retry, terminal cancellation, idempotency, expiry, owner/guest isolation, malformed data, storage failure/readback, document events, scoped reset and untouched learning/roles.');
