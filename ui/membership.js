/* Local commercial-model demonstration. Billing state never writes learning data. */
(function () {
  'use strict';

  var root, dialog, lastOwner, restoreFocus, modalContext, busy = false, feedback = '', selectedPeriod = 'annual';
  var planIds = ['personal', 'pilot', 'private'];
  var periodIds = ['monthly', 'quarterly', 'annual'];
  var fallbackPeriods = {
    monthly: { id: 'monthly', title: '月度', months: 1, amount: 29, priceLabel: '¥29/月' },
    quarterly: { id: 'quarterly', title: '季度', months: 3, amount: 69, priceLabel: '¥69/季' },
    annual: { id: 'annual', title: '年度', months: 12, amount: 199, priceLabel: '¥199/年' }
  };
  var copy = {
    personal: {
      eyebrow: '个人学习', title: '个人会员', priceLabel: '¥199/年',
      description: '三种周期权益相同，按所选周期模拟开通，不自动续费。',
      features: ['完整部件课程', 'AI带教额度（待配置）', '考证备考题库']
    },
    pilot: {
      eyebrow: '院校与班级', title: '院校合作', priceLabel: '3000–10000 元 / 班 / 年',
      description: '毕业后计划为 10000–30000 元 / 班 / 年，具体合作范围另行确认。',
      // Business plan P195 supports seed-school trials; the trial duration is negotiated.
      features: ['课程与3D实训教学', '班级学习进度管理', '种子学校免费试用可申请（期限待商议）']
    },
    private: {
      eyebrow: '未来方案', title: '私有化部署', priceLabel: '5–20 万元 / 校',
      description: '未来组合方案，报价尚未拆分；具体合作范围另行确认。',
      features: ['校内部署（未来）', '年度维护（未来）']
    }
  };

  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (char) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char];
    });
  }
  function billing() { return window.DemoBilling; }
  function periods() { return billing().catalog.personal.periods || fallbackPeriods; }
  function periodById(id) { return periods()[id] || null; }
  function orderSnapshot(order) {
    var period = periodById(order.period), priced = period && Number.isFinite(order.amount);
    return {
      title: priced ? period.title : '历史演示（未定价）',
      priceLabel: priced ? order.priceLabel || '¥' + order.amount : '历史演示价待定',
      months: period ? period.months : 12,
      legacy: !priced
    };
  }
  function renderPeriodPicker() {
    return '<fieldset class="membership-periods"><legend>选择订阅周期</legend><div class="membership-period-options">' + periodIds.map(function (id) {
      var period = periodById(id);
      return '<label class="membership-period-option"><input type="radio" id="membership-period-' + id + '" name="membershipPeriod" value="' + id + '"' + (selectedPeriod === id ? ' checked' : '') + ' aria-describedby="membership-personal-price membership-period-help"><span>' + esc(period.title) + (id === 'annual' ? '<small>推荐</small>' : '') + '</span></label>';
    }).join('') + '</div></fieldset>';
  }
  function plans() {
    var catalog = billing().catalog || {};
    return planIds.map(function (id) {
      var item = Array.isArray(catalog) ? catalog.find(function (p) { return p.id === id; }) : catalog[id];
      return Object.assign({}, copy[id], item || {}, { id: id });
    });
  }
  function planById(id) { return plans().find(function (plan) { return plan.id === id; }) || copy.personal; }
  function ownerLabel(owner) { return owner === '@guest' ? '游客 · 当前浏览器' : String(owner || '游客 · 当前浏览器'); }
  function date(value) {
    var parsed = new Date(typeof value === 'number' && value < 1e12 ? value * 1000 : value);
    return value && !isNaN(parsed.getTime()) ? new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(parsed) : '—';
  }
  function focusKey(element) {
    return element && root && root.contains(element) ? element.id : '';
  }
  function button(label, action, attributes, secondary) {
    return '<button type="button" class="membership-button' + (secondary ? ' is-secondary' : '') + '" data-membership-action="' + action + '" ' + (attributes || '') + '>' + label + '</button>';
  }
  function errorMessage(error) {
    return ({
      STORAGE_READ_FAILED: '浏览器未能读取演示记录，请检查存储权限后再试。',
      STORAGE_WRITE_FAILED: '浏览器未能保存演示记录，请检查存储权限后再试。',
      ORDER_NOT_FOUND: '找不到这笔模拟订单，请关闭弹窗后重新选择。',
      ORDER_TERMINAL: '这笔模拟订单已结束，请新建订单。',
      OWNER_CHANGED: '当前账号已切换，请在新账号下重新操作。',
      ACCOUNT_CHANGED: '当前账号已切换，请在新账号下重新操作。',
      INVALID_PERIOD: '请选择月度、季度或年度订阅周期。',
      INVALID_REQUEST: '请填写单位名称和有效的班级数量。'
    })[error && error.code] || '本次演示操作未完成，请重试。学习记录不受影响。';
  }

  function renderPlans(state) {
    return '<div class="membership-plans">' + plans().map(function (plan) {
      var requests = (state.requests || []).filter(function (request) { return (request.plan || request.planId) === plan.id; });
      var renew = plan.id === 'personal' && state.membership && state.membership.plan === 'personal';
      var action = plan.id === 'personal' ? 'purchase' : 'request';
      var period = periodById(selectedPeriod);
      var label = plan.id === 'personal' ? (renew ? '模拟续费' : '模拟开通') + ' · ' + period.title : '填写合作申请';
      return '<article class="membership-plan' + (plan.id === 'personal' ? ' is-personal' : '') + '">' +
        '<span class="membership-eyebrow">' + esc(copy[plan.id].eyebrow) + '</span>' +
        '<h3>' + esc(plan.id === 'personal' ? copy.personal.title : plan.title) + '</h3>' + (plan.id === 'personal' ? renderPeriodPicker() : '') +
        '<p class="membership-price"' + (plan.id === 'personal' ? ' id="membership-personal-price"' : '') + '>' + esc(plan.id === 'personal' ? period.priceLabel : plan.priceLabel) + '</p>' +
        (plan.id === 'personal' ? '<p class="membership-period-help" id="membership-period-help">' + (selectedPeriod === 'annual' ? '年度较按月支付节省 ¥149' : '同享完整课程、AI带教与备考题库') + '</p>' : '') +
        '<p class="membership-plan-description">' + esc(copy[plan.id].description) + '</p>' +
        '<ul class="membership-features">' + copy[plan.id].features.map(function (feature) { return '<li>' + esc(feature) + '</li>'; }).join('') + '</ul>' +
        '<div class="membership-plan-action">' + button(label, action, 'id="membership-plan-' + plan.id + '" data-plan="' + plan.id + '"', plan.id !== 'personal') +
        '<span class="membership-plan-note">' + (plan.id === 'personal' ? '仅模拟权益变化 · 不会扣款' : requests.length ? '已在本机记录 ' + requests.length + ' 份合作意向' : '仅本地演示 · 不发送至服务器') + '</span></div></article>';
    }).join('') + '</div>';
  }
  function renderEntitlement(state) {
    var membership = state.membership, active = billing().isMember();
    var currentPeriod = membership && periodById(membership.period);
    var title = active ? '个人会员模拟权益已开通' : membership ? '个人会员模拟权益已到期' : '尚未模拟开通个人会员';
    var description = membership ? (currentPeriod ? '最近开通周期：' + currentPeriod.title + '。' : '') + '有效期：' + date(membership.startsAt) + ' 至 ' + date(membership.expiresAt) + '。不会自动续费。' : '基础知识始终免费。可选择月度、季度或年度，体验模拟权益开通过程。';
    return '<section class="membership-panel membership-entitlement" aria-labelledby="membership-entitlement-title">' +
      '<div class="membership-panel-heading"><div><span class="membership-eyebrow">当前模拟权益</span><h3 id="membership-entitlement-title">' + title + '</h3><p>' + esc(description) + '</p></div>' +
      '<span class="membership-badge' + (active ? ' is-active' : '') + '">' + (active ? '模拟生效中' : membership ? '模拟已到期' : '未开通') + '</span></div>' +
      '<div class="membership-access" aria-label="当前演示访问状态">' + [['foundation', '基础知识'], ['models', '3D 拆解'], ['courses', '部件课程'], ['ai', 'AI 辅助'], ['exam', '考证备考']].map(function (entry) {
        var allowed = billing().hasAccess(entry[0]);
        return '<div class="membership-access-item"><span>' + entry[1] + '</span><strong class="' + (allowed ? 'is-allowed' : '') + '">' + (allowed ? '可访问' : '模拟需开通') + '</strong></div>';
      }).join('') + '</div><p class="membership-fineprint">' + (state.preview ? '已开启访问效果演示，以上状态按当前模拟权益显示。' : '访问效果演示已关闭，以上功能当前全部开放。模拟权益与实际学习进度分别保存。') + '</p></section>';
  }
  function renderOrders(state) {
    var orders = (state.orders || []).slice().sort(function (a, b) { return new Date(b.createdAt) - new Date(a.createdAt); });
    var labels = { pending: '待模拟开通', paid: '模拟开通成功', succeeded: '模拟开通成功', failed: '模拟失败', cancelled: '已取消' };
    return '<section class="membership-panel" aria-labelledby="membership-orders-title"><div class="membership-panel-heading"><div><h3 id="membership-orders-title">模拟订单</h3><p>只记录演示操作，不产生交易或实际扣款。</p></div><span class="membership-count">' + orders.length + ' 笔</span></div>' +
      (orders.length ? '<ol class="membership-order-list">' + orders.map(function (order) {
        var status = order.status || 'pending', snapshot = orderSnapshot(order);
        var label = status === 'pending' ? '继续模拟' : status === 'failed' ? '重试' : '查看';
        return '<li class="membership-order"><div class="membership-order-main"><strong>个人会员 · ' + esc(snapshot.title) + '</strong><span class="membership-order-id">' + esc(order.id) + '</span></div>' +
          '<div class="membership-order-price">' + esc(snapshot.priceLabel) + '<span>' + date(order.createdAt) + '</span></div>' +
          '<span class="membership-order-status" data-status="' + esc(status) + '">' + esc(labels[status] || '模拟订单') + '</span>' +
          button(label, 'order', 'id="membership-order-' + esc(order.id) + '" data-order="' + esc(order.id) + '"', true) + '</li>';
      }).join('') + '</ol>' : '<p class="membership-empty">还没有模拟订单。选择个人会员的订阅周期，即可体验开通、失败、取消和续费。</p>') + '</section>';
  }
  function renderRequests(state) {
    var requests = (state.requests || []).slice().reverse();
    if (!requests.length) return '';
    return '<section class="membership-panel" aria-labelledby="membership-requests-title"><div class="membership-panel-heading"><div><h3 id="membership-requests-title">本地合作意向</h3><p>这些信息未发送至服务器，也不会授予教师权限。</p></div></div><ul class="membership-request-list">' + requests.map(function (request) {
      var plan = planById(request.plan || request.planId);
      return '<li><div><strong>' + esc(request.organization) + '</strong><span>' + esc(plan.title) + ' · ' + esc(request.classes) + ' 个班级</span></div><span class="membership-badge">已在本机记录</span></li>';
    }).join('') + '</ul></section>';
  }
  function render() {
    root = document.getElementById('membershipRoot');
    if (!root) return;
    if (!billing()) { root.innerHTML = '<p class="membership-empty" role="status">套餐演示正在准备，请稍后重试。</p>'; return; }
    var state = billing().getState(), owner = billing().owner(), key = focusKey(document.activeElement);
    if (lastOwner !== undefined && lastOwner !== owner) {
      feedback = '已切换到' + ownerLabel(owner) + '的独立演示记录。';
      if (dialog && dialog.open) dialog.close();
    }
    lastOwner = owner;
    root.innerHTML = '<div class="membership-demo">' +
      '<section class="membership-intro" aria-label="商业模式演示说明"><div><span class="membership-eyebrow">商业模式演示</span><h3>当前全部开放，未来方案先体验。</h3><p>此页展示计划中的收费与合作方式。所有开通、续费和申请均为本地模拟，不会扣款或联系您。</p><span class="membership-owner">' + esc(ownerLabel(owner)) + '</span></div>' +
      '<label class="membership-preview" for="membershipPreview"><span class="membership-switch-row"><span>体验付费后访问效果</span><input id="membershipPreview" type="checkbox" role="switch"' + (state.preview ? ' checked' : '') + ' aria-describedby="membership-preview-help"></span><span id="membership-preview-help">关闭时全部开放；开启后，按模拟权益体验访问差异。基础知识始终免费。</span></label></section>' +
      '<details class="membership-demo-details"><summary>演示范围与方案说明</summary><p>个人会员采用本次拟定的演示价格：月度 ¥29、季度 ¥69、年度 ¥199，三种周期权益相同，AI 使用额度待配置。免费基础章节是本次演示的功能映射，商业计划书没有逐章列出免费名单。以上均不构成正式订阅或合作报价。</p></details>' +
      '<p class="membership-feedback" id="membershipFeedback" role="status" aria-live="polite">' + esc(feedback) + '</p>' +
      '<div class="membership-section-title"><h3>未来套餐与合作方案</h3><span>基础知识免费开放</span></div>' + renderPlans(state) + renderEntitlement(state) + renderOrders(state) + renderRequests(state) +
      '<div class="membership-reset-row"><p>演示资料保存在当前浏览器，按账号分别记录；清理浏览器资料后无法恢复。</p>' + button('恢复演示初始状态', 'reset', 'id="membership-reset"', true) + '</div></div>';
    if (key && !(dialog && dialog.open)) {
      var target = document.getElementById(key);
      if (target) target.focus({ preventScroll: true });
    }
  }

  function ensureDialog() {
    if (dialog) return;
    dialog = document.createElement('dialog');
    dialog.id = 'membershipDialog';
    dialog.className = 'membership-dialog';
    dialog.setAttribute('aria-labelledby', 'membership-dialog-title');
    document.body.appendChild(dialog);
    // Native showModal supplies focus containment, Escape, and an inert background.
    dialog.addEventListener('close', function () {
      modalContext = null;
      var target = restoreFocus && document.getElementById(restoreFocus);
      if (target && target.getClientRects().length) target.focus({ preventScroll: true });
    });
    dialog.addEventListener('click', function (event) {
      var target = event.target.closest('[data-membership-action]');
      if (target) handleAction(target);
    });
    dialog.addEventListener('submit', function (event) {
      if (event.target.id !== 'membershipRequestForm') return;
      event.preventDefault();
      var form = event.target, organization = form.elements.organization.value.trim(), classes = Number(form.elements.classes.value);
      form.elements.organization.setCustomValidity(organization ? '' : '请填写单位或院校名称。');
      form.elements.classes.setCustomValidity(Number.isSafeInteger(classes) && classes > 0 ? '' : '请填写大于 0 的整数。');
      if (!form.reportValidity()) return;
      run(function () { return billing().createRequest(modalContext.plan, { organization: organization, classes: classes }); }, function () {
        showDialogContent('<span class="membership-badge is-active">已在本机记录</span><h2 id="membership-dialog-title" tabindex="-1">合作意向已保存</h2><p>已记录' + esc(organization) + '的 ' + esc(classes) + ' 个班级合作意向。这是本地演示，信息未发送至服务器。</p><div class="membership-dialog-actions">' + button('完成', 'close') + '</div>');
      });
    });
    dialog.addEventListener('input', function (event) { if (event.target.setCustomValidity) event.target.setCustomValidity(''); });
    dialog.addEventListener('cancel', function (event) { if (busy) event.preventDefault(); });
  }
  function showDialogContent(content, initialFocus) {
    ensureDialog();
    dialog.innerHTML = '<button type="button" class="membership-dialog-close" data-membership-action="close" aria-label="关闭弹窗">×</button><div class="membership-dialog-body">' + content + '<p class="membership-dialog-error" role="status" aria-live="polite"></p></div>';
    if (!dialog.open) dialog.showModal();
    var target = dialog.querySelector(initialFocus || '#membership-dialog-title');
    if (target) target.focus({ preventScroll: true });
  }
  function openOrder(order, renew) {
    modalContext = { type: 'order', id: order.id, owner: billing().owner(), renew: !!renew };
    renderOrderDialog(order);
  }
  function safeReturn() {
    try {
      var raw = window.DemoAccess && typeof window.DemoAccess.returnUrl === 'function' ? window.DemoAccess.returnUrl() : '';
      if (raw && raw.charAt(0) === '/' && raw.slice(0, 2) !== '//') {
        var url = new URL(raw, location.origin);
        if (url.origin === location.origin && (url.pathname === '/learn.html' || (url.pathname === '/' || url.pathname === '/index.html') && /^#(?:exam|trainer|course)(?:\/|$)/.test(url.hash))) {
          return { href: url.pathname + url.search + url.hash, label: url.pathname === '/learn.html' ? '返回刚才课程' : url.hash.indexOf('#exam') === 0 ? '继续考证备考' : url.hash.indexOf('#trainer') === 0 ? '继续故障带教' : '返回课程目录' };
        }
      }
    } catch (_) { /* An unavailable return destination does not affect checkout. */ }
    return { href: '/#course', label: '返回课程目录' };
  }
  function renderOrderDialog(order) {
    var status = order.status, renew = modalContext && modalContext.renew, snapshot = orderSnapshot(order);
    var title = (renew ? '模拟续费个人会员' : '模拟开通个人会员') + ' · ' + snapshot.title;
    var content = '<span class="membership-eyebrow">模拟订单 · 不会扣款</span><h2 id="membership-dialog-title" tabindex="-1">' + title + '</h2>' +
      '<dl class="membership-order-summary"><div><dt>方案</dt><dd>个人会员</dd></div><div><dt>订阅周期</dt><dd>' + esc(snapshot.title) + '</dd></div><div><dt>金额快照</dt><dd>' + esc(snapshot.priceLabel) + '</dd></div><div><dt>模拟订单号</dt><dd class="membership-order-id">' + esc(order.id) + '</dd></div></dl>';
    if (status === 'paid' || status === 'succeeded') {
      var membership = billing().getState().membership, back = safeReturn();
      content += '<div class="membership-outcome is-success"><strong>' + (renew ? '模拟续费成功' : '模拟开通成功') + '</strong><p>个人会员模拟权益已更新' + (membership ? '，有效期至 ' + date(membership.expiresAt) : '') + '。不会自动续费，也没有实际扣款。</p></div>' +
        '<div class="membership-dialog-actions"><a class="membership-button" href="' + esc(back.href) + '">' + back.label + '</a>' + button('查看当前权益', 'close', '', true) + '</div>';
    } else if (status === 'cancelled') {
      content += '<div class="membership-outcome"><strong>模拟订单已取消</strong><p>模拟权益未因本订单改变。如需继续，可按当前所选周期重新下单。</p></div><div class="membership-dialog-actions">' + button('重新下单 · ' + esc(periodById(selectedPeriod).title), 'purchase', 'data-plan="personal"') + button('关闭', 'close', '', true) + '</div>';
    } else {
      if (status === 'failed') content += '<div class="membership-outcome is-failed"><strong>模拟开通失败</strong><p>模拟权益未因本次失败改变，可以使用同一笔订单重试。</p></div>';
      content += '<p class="membership-dialog-description">' + (snapshot.legacy ? '这笔历史演示订单保留未定价记录，模拟成功仍按原年度规则更新有效期。' : '本次按' + snapshot.title + '模拟' + (renew ? '续费' : '开通') + ' ' + snapshot.months + ' 个月。') + '不会自动续费。选择一种模拟结果：</p>' +
        '<div class="membership-payment-choices">' + button(status === 'failed' ? '重试并模拟成功' : renew ? '模拟续费成功' : '模拟开通成功', 'settle', 'data-outcome="success"') +
        button('模拟失败', 'settle', 'data-outcome="failure"', true) + button('取消模拟订单', 'settle', 'data-outcome="cancel"', true) + '</div>' +
        '<p class="membership-fineprint">关闭弹窗后，仍可从模拟订单中继续处理。</p>';
    }
    showDialogContent(content);
  }
  function openRequest(plan) {
    modalContext = { type: 'request', plan: plan, owner: billing().owner() };
    showDialogContent('<span class="membership-eyebrow">本地合作意向</span><h2 id="membership-dialog-title">' + esc(planById(plan).title) + '</h2><p>只收集演示所需的单位与班级数量。不会提交至服务器，也不会改变账号角色。</p>' +
      '<form id="membershipRequestForm"><label for="membershipOrganization">单位 / 院校名称<input id="membershipOrganization" name="organization" maxlength="80" required autocomplete="off" placeholder="填写单位或院校名称"></label>' +
      '<label for="membershipClasses">班级数量<input id="membershipClasses" name="classes" type="number" min="1" step="1" required inputmode="numeric" placeholder="例如：2"></label>' +
      '<div class="membership-dialog-actions"><button class="membership-button" type="submit">保存本地合作意向</button>' + button('取消', 'close', '', true) + '</div></form>', '#membershipOrganization');
  }
  function openReset() {
    modalContext = { type: 'reset', owner: billing().owner() };
    showDialogContent('<span class="membership-eyebrow">仅当前演示账户</span><h2 id="membership-dialog-title" tabindex="-1">恢复演示初始状态？</h2><p>清除' + esc(ownerLabel(billing().owner())) + '的模拟权益、订单与合作意向。学习进度、考试和实训记录都会保留。</p><div class="membership-dialog-actions">' + button('保留演示记录', 'close') + button('确认恢复', 'confirm-reset', '', true) + '</div>');
  }
  function run(action, after) {
    if (busy) return;
    busy = true;
    if (dialog && dialog.open) dialog.querySelectorAll('button,input').forEach(function (element) { element.disabled = true; });
    try {
      var result = action();
      feedback = '';
      if (after) after(result);
      render();
    } catch (error) {
      var message = errorMessage(error), errorBox = dialog && dialog.open && dialog.querySelector('.membership-dialog-error');
      if (errorBox) errorBox.textContent = message;
      else { feedback = message; render(); }
    } finally {
      busy = false;
      if (dialog && dialog.open) dialog.querySelectorAll('button,input').forEach(function (element) { element.disabled = false; });
    }
  }
  function handleAction(target) {
    if (busy || !billing()) return;
    if (dialog && dialog.open && modalContext && modalContext.owner !== billing().owner()) { dialog.close(); render(); return; }
    var action = target.dataset.membershipAction;
    if (!(dialog && dialog.open)) restoreFocus = target.id;
    if (action === 'close') { dialog.close(); return; }
    if (action === 'purchase') {
      var renew = !!billing().getState().membership;
      run(function () { return billing().createOrder('personal', selectedPeriod); }, function (order) { openOrder(order, renew); });
    } else if (action === 'order') {
      var state = billing().getState(), order = state.orders.find(function (entry) { return entry.id === target.dataset.order; });
      if (order) openOrder(order, !!state.membership && (order.status === 'pending' || order.status === 'failed'));
    } else if (action === 'settle' && modalContext) {
      run(function () { return billing().settle(modalContext.id, target.dataset.outcome); }, renderOrderDialog);
    } else if (action === 'request') openRequest(target.dataset.plan);
    else if (action === 'reset') openReset();
    else if (action === 'confirm-reset') run(function () { return billing().reset(); }, function () { dialog.close(); feedback = '当前账户的演示记录已恢复初始状态，学习记录已保留。'; });
  }
  function init() {
    root = document.getElementById('membershipRoot');
    if (root) {
      root.addEventListener('click', function (event) { var target = event.target.closest('[data-membership-action]'); if (target) handleAction(target); });
      root.addEventListener('change', function (event) {
        if (event.target.id === 'membershipPreview' && billing()) run(function () { return billing().setPreview(event.target.checked); });
        else if (event.target.name === 'membershipPeriod' && periodIds.includes(event.target.value)) { selectedPeriod = event.target.value; render(); }
      });
    }
    render();
  }
  window.MembershipDemo = { render: render };
  document.addEventListener('demo-billing:change', render);
  window.addEventListener('storage', function (event) { if (event.key === 'et_session' || event.key === 'et_demo_commerce_v1') render(); });
  window.addEventListener('pageshow', render);
  document.addEventListener('studio:navigation', function (event) { if (event.detail && event.detail.section !== 'membership' && dialog && dialog.open) dialog.close(); });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
