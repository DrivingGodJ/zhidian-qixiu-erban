/* Local commerce demonstration only: no payment network, server or account roles. */
(function (root, factory) {
  var api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.DemoBilling = api;
})(typeof window !== 'undefined' ? window : globalThis, function (root) {
  'use strict';
  var KEY = 'et_demo_commerce_v1', sequence = 0;
  var periods = {
    monthly: { id: 'monthly', title: '月度', months: 1, amount: 29, priceLabel: '¥29/月' },
    quarterly: { id: 'quarterly', title: '季度', months: 3, amount: 69, priceLabel: '¥69/季' },
    annual: { id: 'annual', title: '年度', months: 12, amount: 199, priceLabel: '¥199/年' }
  };
  Object.keys(periods).forEach(function (id) { Object.freeze(periods[id]); }); Object.freeze(periods);
  var catalog = {
    personal: { id: 'personal', title: '个人会员', priceLabel: periods.annual.priceLabel, periods: periods, kind: 'subscription', features: ['完整部件课程', 'AI 带教', '考证题库'] },
    pilot: { id: 'pilot', title: '学校试点合作', priceLabel: '3000–10000元/班/年', kind: 'request', features: ['提交本地合作意向演示', '公司阶段参考：10000–30000元/班/年（未来）', '具体合作范围与价格另行确认'] },
    private: { id: 'private', title: '私有化合作（未来）', priceLabel: '5–20万元/校', kind: 'request', features: ['未来方案，仅提交本地合作意向演示', '部署与年维护的组合参考，尚未拆分计价', '具体部署与维护范围另行确认'] }
  };
  Object.keys(catalog).forEach(function (id) { Object.freeze(catalog[id].features); Object.freeze(catalog[id]); });
  Object.freeze(catalog);
  function error(code, message) { var e = new Error(message); e.code = code; return e; }
  function storage() { return root.localStorage || (typeof localStorage !== 'undefined' ? localStorage : null); }
  function object(value) { return value !== null && typeof value === 'object' && !Array.isArray(value); }
  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function finiteTime(value) { return Number.isFinite(value) && value >= 0 && value <= 8640000000000000; }
  function own(value, key) { return Object.prototype.hasOwnProperty.call(value, key); }
  function validPeriod(value) { return typeof value === 'string' && own(periods, value); }
  function owner() {
    try { var value = JSON.parse(storage().getItem('et_session')); return typeof value === 'string' ? value : '@guest'; }
    catch (_) { return '@guest'; }
  }
  function empty() { return { preview: false, membership: null, orders: [], requests: [] }; }
  function documentState(writing) {
    var raw;
    try { raw = storage().getItem(KEY); }
    catch (_) { if (writing) throw error('STORAGE_READ_FAILED', '无法读取本地演示记录，请检查浏览器存储。'); }
    try {
      var doc = JSON.parse(raw);
      if (object(doc) && doc.version === 1 && object(doc.owners)) return doc;
    } catch (_) {}
    return { version: 1, owners: {} };
  }
  function safeState(value, identity) {
    var state = empty(); if (!object(value)) return state;
    state.preview = value.preview === true;
    var m = value.membership;
    if (object(m) && m.plan === 'personal' && (!own(m, 'period') || validPeriod(m.period)) && finiteTime(m.startsAt) && finiteTime(m.expiresAt) && m.expiresAt > m.startsAt) state.membership = { plan: 'personal', period: own(m, 'period') ? m.period : 'annual', startsAt: m.startsAt, expiresAt: m.expiresAt };
    var seen = new Set();
    if (Array.isArray(value.orders)) value.orders.forEach(function (o) {
      if (!object(o) || typeof o.id !== 'string' || !o.id || seen.has(o.id) || o.owner !== identity || o.plan !== 'personal' || !finiteTime(o.createdAt) || !['pending', 'paid', 'failed', 'cancelled'].includes(o.status)) return;
      var legacy = !own(o, 'period') || (o.period === 'annual' && o.amount === null && o.priceLabel === '历史演示价待定');
      if (!legacy && (!validPeriod(o.period) || !Number.isSafeInteger(o.amount) || o.amount <= 0 || typeof o.priceLabel !== 'string' || !o.priceLabel.trim())) return;
      seen.add(o.id);
      // Read historical records without inventing a price. New records retain
      // their checkout quote even when the currently advertised price changes.
      var order = { id: o.id, owner: identity, plan: 'personal', period: legacy ? 'annual' : o.period, status: o.status, createdAt: o.createdAt, amount: legacy ? null : o.amount, priceLabel: legacy ? '历史演示价待定' : o.priceLabel };
      if (finiteTime(o.settledAt)) order.settledAt = o.settledAt;
      state.orders.push(order);
    });
    seen.clear();
    if (Array.isArray(value.requests)) value.requests.forEach(function (r) {
      if (!object(r) || typeof r.id !== 'string' || !r.id || seen.has(r.id) || r.owner !== identity || !['pilot', 'private'].includes(r.plan) || r.status !== 'demo' || !finiteTime(r.createdAt) || typeof r.organization !== 'string' || !r.organization.trim() || !Number.isSafeInteger(r.classes) || r.classes <= 0) return;
      seen.add(r.id);
      state.requests.push({ id: r.id, owner: identity, plan: r.plan, status: 'demo', createdAt: r.createdAt, priceLabel: catalog[r.plan].priceLabel, organization: r.organization.trim(), classes: r.classes });
    });
    return state;
  }
  function current(doc, identity) { return safeState(own(doc.owners, identity) ? doc.owners[identity] : null, identity); }
  function exposed(state, identity) { return Object.assign({ owner: identity }, clone(state)); }
  function getState() { var identity = owner(); return exposed(current(documentState(false), identity), identity); }
  function notify(identity, state) {
    var target = root.document || (typeof document !== 'undefined' ? document : root);
    var Event = root.CustomEvent || (typeof CustomEvent !== 'undefined' ? CustomEvent : null);
    if (typeof target.dispatchEvent === 'function' && typeof Event === 'function') target.dispatchEvent(new Event('demo-billing:change', { detail: { owner: identity, state: exposed(state, identity) } }));
  }
  function mutate(update, erase) {
    var identity = owner(), doc = documentState(true), state = current(doc, identity), result = update(state, identity, Date.now(), doc);
    if (owner() !== identity) throw error('ACCOUNT_CHANGED', '账号已切换，请在当前账号下重新操作。');
    if (erase) delete doc.owners[identity];
    else Object.defineProperty(doc.owners, identity, { value: state, enumerable: true, configurable: true, writable: true });
    var raw = JSON.stringify(doc);
    try {
      storage().setItem(KEY, raw);
      if (storage().getItem(KEY) !== raw) throw new Error('Storage readback differs');
    } catch (_) { throw error('STORAGE_WRITE_FAILED', '演示记录未能保存，请检查浏览器存储后重试。'); }
    if (owner() !== identity) throw error('ACCOUNT_CHANGED', '账号已切换，请在当前账号下查看演示记录。');
    notify(identity, erase ? empty() : state);
    return clone(result);
  }
  function active(state, now) { var m = state.membership; return !!m && m.plan === 'personal' && m.startsAt <= now && m.expiresAt > now; }
  function isMember() { return active(getState(), Date.now()); }
  function hasAccess(feature) {
    var state = getState();
    if (!state.preview || feature === 'foundation' || feature === 'models') return true;
    return ['courses', 'ai', 'exam'].includes(feature) && active(state, Date.now());
  }
  function setPreview(value) {
    if (typeof value !== 'boolean') throw error('INVALID_PREVIEW', '请选择是否启用付费演示。');
    return mutate(function (state, identity) { state.preview = value; return exposed(state, identity); });
  }
  function id(prefix, doc, now) {
    var used = new Set();
    Object.keys(doc.owners).forEach(function (identity) { var s = doc.owners[identity]; if (!object(s)) return; ['orders', 'requests'].forEach(function (list) { if (Array.isArray(s[list])) s[list].forEach(function (item) { if (object(item)) used.add(item.id); }); }); });
    var random = root.crypto && typeof root.crypto.randomUUID === 'function' ? root.crypto.randomUUID() : Math.random().toString(36).slice(2), value;
    do { value = prefix + '-' + now.toString(36) + '-' + random + '-' + (++sequence); } while (used.has(value));
    return value;
  }
  function createOrder(plan, period) {
    if (plan !== 'personal') throw error('INVALID_PLAN', '当前仅支持个人会员模拟订单。');
    if (period === undefined) period = 'annual';
    if (!validPeriod(period)) throw error('INVALID_PERIOD', '请选择月度、季度或年度会员周期。');
    return mutate(function (state, identity, now, doc) {
      var quote = periods[period];
      var order = { id: id('demo-order', doc, now), owner: identity, plan: 'personal', period: period, status: 'pending', createdAt: now, amount: quote.amount, priceLabel: quote.priceLabel };
      state.orders.push(order); return order;
    });
  }
  function extendPeriod(base, period) {
    if (!validPeriod(period)) throw error('INVALID_PERIOD', '会员周期记录无效，请新建演示订单。');
    var date = new Date(base), day = date.getUTCDate();
    date.setUTCDate(1); date.setUTCMonth(date.getUTCMonth() + periods[period].months);
    var last = new Date(date.getTime()); last.setUTCMonth(last.getUTCMonth() + 1, 0);
    date.setUTCDate(Math.min(day, last.getUTCDate()));
    if (!finiteTime(date.getTime())) throw error('INVALID_MEMBERSHIP', '会员有效期超出可记录范围。');
    return date.getTime();
  }
  function settle(orderID, outcome) {
    if (!['success', 'failure', 'cancel'].includes(outcome)) throw error('INVALID_OUTCOME', '请选择模拟成功、失败或取消。');
    if (typeof orderID !== 'string' || !orderID) throw error('ORDER_NOT_FOUND', '当前账号下未找到该演示订单。');
    return mutate(function (state, identity, now) {
      var order = state.orders.find(function (o) { return o.id === orderID && o.owner === identity; });
      if (!order) throw error('ORDER_NOT_FOUND', '当前账号下未找到该演示订单。');
      if (order.status === 'paid') { if (outcome === 'success') return order; throw error('ORDER_TERMINAL', '该订单已模拟成功，不能改为失败或取消。'); }
      if (order.status === 'cancelled') { if (outcome === 'cancel') return order; throw error('ORDER_TERMINAL', '该订单已取消，请新建演示订单。'); }
      if (outcome === 'success') {
        var member = active(state, now), base = member ? state.membership.expiresAt : now;
        state.membership = { plan: 'personal', period: order.period, startsAt: member ? state.membership.startsAt : now, expiresAt: extendPeriod(base, order.period) };
        order.status = 'paid';
      } else order.status = outcome === 'failure' ? 'failed' : 'cancelled';
      order.settledAt = now; return order;
    });
  }
  function createRequest(plan, fields) {
    if (!['pilot', 'private'].includes(plan)) throw error('INVALID_PLAN', '请选择学校试点或未来私有化合作意向。');
    if (!object(fields) || typeof fields.organization !== 'string' || !fields.organization.trim() || !Number.isSafeInteger(fields.classes) || fields.classes <= 0) throw error('INVALID_REQUEST', '请填写学校或机构名称及正整数班级数。');
    return mutate(function (state, identity, now, doc) {
      var request = { id: id('demo-request', doc, now), owner: identity, plan: plan, status: 'demo', createdAt: now, priceLabel: catalog[plan].priceLabel, organization: fields.organization.trim(), classes: fields.classes };
      state.requests.push(request); return request;
    });
  }
  function reset() { return mutate(function (_, identity) { return exposed(empty(), identity); }, true); }
  if (typeof root.addEventListener === 'function') root.addEventListener('storage', function (event) {
    if (event.key === KEY || event.key === 'et_session' || event.key === null) { var state = getState(); notify(state.owner, state); }
  });
  return Object.freeze({ catalog: catalog, owner: owner, getState: getState, setPreview: setPreview, hasAccess: hasAccess, isMember: isMember, createOrder: createOrder, settle: settle, createRequest: createRequest, reset: reset });
});
