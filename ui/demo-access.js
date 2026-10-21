/* Optional future-pricing preview. This is a local demonstration, not payment authorization. */
(function () {
  'use strict';
  var names = { courses: '车型部件课程', ai: 'AI 故障带教', exam: '考证备考题库' };
  var returnKey = 'et_demo_return_v1';
  function allowed(feature) { return !window.DemoBilling || DemoBilling.hasAccess(feature); }
  function safePath(value) {
    try {
      var url = new URL(value, location.origin);
      if (url.origin !== location.origin) return null;
      if (url.pathname === '/learn.html' || ((url.pathname === '/' || url.pathname === '/index.html') && /^#(course|trainer|exam)(\/|$)/.test(url.hash))) return url.pathname + url.search + url.hash;
    } catch (_) {}
    return null;
  }
  function remember() {
    var path = safePath(location.href);
    if (path) try { sessionStorage.setItem(returnKey, JSON.stringify({ owner: DemoBilling.owner(), path: path })); } catch (_) {}
  }
  function returnUrl() {
    try {
      var saved = JSON.parse(sessionStorage.getItem(returnKey));
      return saved && saved.owner === DemoBilling.owner() ? safePath(saved.path) : null;
    } catch (_) { return null; }
  }
  function gateHtml(feature) {
    remember();
    return '<section class="demo-access-gate" aria-label="会员权益演示"><span class="demo-access-eyebrow">付费模式演示</span><h2>' + (names[feature] || names.courses) + ' · 个人会员权益</h2><p>你正在体验未来的付费模式。模拟开通会员后可继续，基础课程与 3D 拆解台始终开放。</p><div class="demo-access-actions"><a class="demo-access-primary" href="/#membership">查看方案 / 模拟开通</a><button type="button" data-demo-exit>退出付费演示，继续使用</button></div><small>当前平台仍全部开放；这里仅演示访问区别，不收取费用。</small><p class="demo-access-error" role="alert"></p></section>';
  }
  function requireAccess(feature) {
    if (allowed(feature)) return true;
    remember();
    if (window.go) go('membership');
    return false;
  }
  function mountLearnGate(title) {
    document.getElementById('courseTitle').textContent = title || '车型部件课程';
    document.getElementById('courseMeta').textContent = '付费模式演示';
    document.getElementById('lessonContent').innerHTML = gateHtml('courses');
    document.getElementById('lessonContent').classList.remove('game-mode');
    document.getElementById('lessonFooter').hidden = true;
    document.querySelector('.course-progress-summary').hidden = true;
    document.title = (title || '部件课程') + ' · 会员权益演示';
  }
  function refresh() {
    if (!document.body.classList.contains('studio-app')) return;
    var state = DemoBilling.getState(), member = DemoBilling.isMember();
    var chip = document.getElementById('membershipStatus');
    if (chip) {
      chip.textContent = state.preview ? (member ? '会员已开通 · 演示' : '免费体验 · 演示') : '会员方案';
      chip.classList.toggle('preview-active', state.preview);
    }
    var host = document.querySelector('.vehicle-course-section');
    if (host) {
      var note = document.getElementById('courseDemoNotice');
      if (!note) { note = document.createElement('div'); note.id = 'courseDemoNotice'; note.className = 'demo-access-notice'; host.prepend(note); }
      note.hidden = !state.preview;
      note.textContent = member ? '会员演示已开通 · 完成原理学习与练习后，再进入对应实训。' : '付费模式演示 · 上方基础课程免费，以下部件课程需模拟开通个人会员。';
      host.querySelectorAll('.chapter-row a[href]').forEach(function (a) {
        var q = new URL(a.href).searchParams, status = courseStatus(q.get('vehicle'), q.get('part'), q.get('lesson'));
        a.textContent = courseButtonLabel(q.get('vehicle'), q.get('part'), q.get('lesson'), status) + ' →';
      });
    }
    var trainer = document.getElementById('p-trainer'), layout = trainer.querySelector('.trainer-layout');
    var gate = document.getElementById('trainerDemoGate');
    if (!gate) { gate = document.createElement('div'); gate.id = 'trainerDemoGate'; layout.before(gate); }
    var locked = !allowed('ai');
    if (locked && !gate.childElementCount) gate.innerHTML = gateHtml('ai');
    if (locked && trainer.classList.contains('active')) remember();
    gate.hidden = !locked; layout.hidden = locked; layout.inert = locked;
    var exam = document.getElementById('p-exam');
    var examLocked = !allowed('exam');
    if (examLocked && exam.classList.contains('active')) remember();
    if (exam.classList.contains('active') && exam.dataset.demoLocked !== String(examLocked)) {
      if (examLocked && window.mock) { clearInterval(window.mockTimer); window.mock = null; }
      exam.dataset.demoLocked = String(examLocked);
      if (examLocked) document.getElementById('examBox').innerHTML = gateHtml('exam');
      else if (exam.querySelector('.demo-access-gate')) window.studioNavigate(location.href);
    }
    if (window.MembershipDemo) MembershipDemo.render();
  }
  document.addEventListener('click', function (event) {
    var button = event.target.closest('[data-demo-exit]');
    if (!button) return;
    try { DemoBilling.setPreview(false); }
    catch (error) { button.closest('.demo-access-gate').querySelector('.demo-access-error').textContent = error.message; }
  });
  document.addEventListener('demo-billing:change', refresh);
  document.addEventListener('studio:navigation', refresh);
  window.addEventListener('storage', function (event) { if (event.key === 'et_session') { if (typeof window.refreshUserUI === 'function') refreshUserUI(); else refresh(); } });
  window.addEventListener('focus', refresh);
  document.addEventListener('DOMContentLoaded', refresh, { once: true });
  window.DemoAccess = { allowed: allowed, require: requireAccess, gateHtml: gateHtml, mountLearnGate: mountLearnGate, returnUrl: returnUrl, remember: remember, refresh: refresh };
})();
