/* =====================================================
   BBO 3.0 — Online Examination engine
   ---------------------------------------------------
   Design notes
   • Answers are saved to localStorage on every click (instant, offline-proof)
     and pushed to the server on a jittered interval, so 2000 candidates do not
     all hit the backend in the same second.
   • The countdown runs off a monotonic clock seeded from SERVER time, so
     changing the device clock mid-exam does not buy extra minutes.
   • The answer key is not in this file. Grading happens on the server.
   ===================================================== */
(function () {
'use strict';

/* ---------------------------------------------------------------------------
   Browser capability gate.
   Runs before anything else and uses only syntax that parses everywhere, so a
   browser too old to sit the exam gets a plain explanation instead of a blank
   or half-broken page at 9 PM. Guarded features (AbortController, sendBeacon,
   Intl, performance.now) are NOT listed here — the code already falls back for
   those. These four are genuinely required.
   --------------------------------------------------------------------------- */
(function () {
  var missing = [];
  if (typeof window.Promise === 'undefined') missing.push('Promise');
  if (typeof window.fetch === 'undefined') missing.push('fetch');
  if (typeof window.JSON === 'undefined') missing.push('JSON');
  if (!document.documentElement.closest) missing.push('Element.closest');
  if (!missing.length) return;

  document.addEventListener('DOMContentLoaded', function () {
    document.body.innerHTML =
      '<div style="font-family:Arial,sans-serif;max-width:520px;margin:12vh auto;padding:0 1.5rem;' +
      'text-align:center;color:#2c3e35;line-height:1.7">' +
      '<div style="font-size:2.5rem">⚠️</div>' +
      '<h1 style="color:#0c1f4a;font-size:1.4rem;margin:.75rem 0">Your browser is too old for this exam</h1>' +
      '<p>This examination needs a modern browser. Please open this same link in ' +
      '<strong>Google Chrome</strong> (or Microsoft Edge, Firefox, or Safari) and register again.</p>' +
      '<p style="font-size:.85rem;color:#5a7066">If you are using Opera Mini, turn off data-saving mode ' +
      'or switch browser &mdash; it cannot run this exam.</p>' +
      '<p style="font-size:.8rem;color:#5a7066">Missing: ' + missing.join(', ') + '</p>' +
      '</div>';
  });
})();

var CFG = window.BBO_CONFIG || {};
var QUESTIONS = window.BBO_QUESTIONS || [];
var LETTERS = ['A', 'B', 'C', 'D'];
var LS_KEY = 'bbo3_exam_state_v1';
var API_READY = CFG.API_URL && CFG.API_URL.indexOf('http') === 0;

/* ---------------- tiny helpers ---------------- */
function $(id) { return document.getElementById(id); }
function show(id) {
  ['screenRegister', 'screenWait', 'screenExam', 'screenDone', 'screenBlocked', 'screenPreOpen']
    .forEach(function (s) { $(s).classList.toggle('hidden', s !== id); });
  window.scrollTo(0, 0);
}
function pad(n) { return (n < 10 ? '0' : '') + n; }
function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}
var toastTimer;
function toast(msg, isErr) {
  var t = $('toast');
  t.textContent = msg;
  t.classList.toggle('err', !!isErr);
  t.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function () { t.classList.add('hidden'); }, 3800);
}
function confirmModal(title, body, okLabel) {
  return new Promise(function (resolve) {
    $('modalTitle').textContent = title;
    $('modalBody').textContent = body;
    $('modalOk').textContent = okLabel || 'Confirm';
    $('modal').classList.remove('hidden');
    function done(v) {
      $('modal').classList.add('hidden');
      $('modalOk').onclick = null;
      $('modalCancel').onclick = null;
      resolve(v);
    }
    $('modalOk').onclick = function () { done(true); };
    $('modalCancel').onclick = function () { done(false); };
  });
}

/* ---------------- exam window ---------------- */
var START_MS = Date.parse(CFG.START_ISO);
var DURATION_MS = (CFG.DURATION_MIN || 50) * 60000;
var END_MS = START_MS + DURATION_MS;
var OPEN_MS = START_MS - (CFG.REGISTRATION_OPENS_MIN_BEFORE || 60) * 60000;

var BD = { timeZone: 'Asia/Dhaka', hour: 'numeric', minute: '2-digit', hour12: true };
var BD_FULL = { timeZone: 'Asia/Dhaka', dateStyle: 'full', timeStyle: 'short' };
function fmt(ms, opt) {
  try { return new Intl.DateTimeFormat('en-GB', opt || BD_FULL).format(new Date(ms)); }
  catch (e) { return new Date(ms).toString(); }
}
/* "Friday at 9:00 pm" — the weekday is derived from the date, so it stays
   correct by itself if the exam is ever moved to another day. */
function fmtDay(ms) {
  try {
    var day = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Dhaka', weekday: 'long' })
      .format(new Date(ms));
    return day + ' at ' + fmt(ms, BD);
  } catch (e) { return fmt(ms, BD); }
}

/* Monotonic server-anchored clock.
   serverAnchor = server time at handshake; perfAnchor = performance.now() then.
   now() therefore ignores any later change to the device clock. */
var serverAnchor = Date.now();
var perfAnchor = (window.performance && performance.now) ? performance.now() : 0;
function perf() { return (window.performance && performance.now) ? performance.now() : Date.now() - serverAnchor; }
function now() { return serverAnchor + (perf() - perfAnchor); }
function setServerTime(ms) {
  if (!ms || isNaN(ms)) return;
  serverAnchor = ms;
  perfAnchor = perf();
}

/* ---------------- state ---------------- */
var S = {
  token: null, candidateId: null,
  name: '', university: '', email: '', phone: '',
  answers: {},          // { questionNumber: ORIGINAL option letter 'A'|'B'|'C'|'D' }
  review: {},           // { questionNumber: true }
  order: null,          // shuffled question numbers
  optOrder: null,       // { questionNumber: [originalIndex, ...] } display order
  submitted: false, submissionId: null, submittedAt: null,
  tabSwitches: 0, copyAttempts: 0, screenshotAttempts: 0,
  startedAt: null, dirty: false, lastSync: 0
};

function saveLocal() {
  try { localStorage.setItem(LS_KEY, JSON.stringify(S)); } catch (e) { /* private mode */ }
}
function loadLocal() {
  try {
    var raw = localStorage.getItem(LS_KEY);
    if (!raw) return false;
    var o = JSON.parse(raw);
    if (!o || !o.token) return false;
    Object.keys(o).forEach(function (k) { S[k] = o[k]; });
    return true;
  } catch (e) { return false; }
}

/* ---------------- backend ---------------- */
/* text/plain keeps this a "simple" CORS request — no preflight, which Apps
   Script cannot answer. */
function api(payload, timeoutMs) {
  if (!API_READY) return Promise.reject(new Error('offline-mode'));
  var ctrl = window.AbortController ? new AbortController() : null;
  var t = setTimeout(function () { ctrl && ctrl.abort(); }, timeoutMs || 20000);
  return fetch(CFG.API_URL, {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    signal: ctrl ? ctrl.signal : undefined,
    redirect: 'follow'
  }).then(function (r) {
    clearTimeout(t);
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return r.json();
  }).then(function (j) {
    if (j && j.serverNow) setServerTime(j.serverNow);
    if (!j || !j.ok) throw new Error((j && j.error) || 'Server rejected the request');
    return j;
  }).catch(function (e) { clearTimeout(t); throw e; });
}
/* Exponential backoff — important when 2000 clients retry at once. */
function apiRetry(payload, tries) {
  tries = tries || 4;
  var attempt = 0;
  function go() {
    attempt++;
    return api(payload).catch(function (err) {
      if (attempt >= tries || err.message === 'offline-mode') throw err;
      var wait = Math.min(1000 * Math.pow(2, attempt), 15000) + Math.random() * 1200;
      return new Promise(function (res) { setTimeout(res, wait); }).then(go);
    });
  }
  return go();
}

function setSaveStatus(kind, text) {
  var el = $('saveStatus');
  el.classList.remove('saving', 'offline');
  if (kind) el.classList.add(kind);
  $('saveText').textContent = text;
}

/* ---------------- autosave ---------------- */
var syncTimer = null;
function syncNow(force) {
  if (S.submitted) return Promise.resolve();
  if (!S.dirty && !force) return Promise.resolve();
  if (!API_READY) { setSaveStatus('offline', 'Saved on device'); S.dirty = false; return Promise.resolve(); }
  setSaveStatus('saving', 'Saving…');
  var snapshot = JSON.stringify(S.answers);
  return apiRetry({
    action: 'sync', token: S.token, answers: S.answers, review: S.review,
    tabSwitches: S.tabSwitches, copyAttempts: S.copyAttempts,
    screenshotAttempts: S.screenshotAttempts
  }, 3).then(function () {
    if (JSON.stringify(S.answers) === snapshot) S.dirty = false;
    S.lastSync = now();
    setSaveStatus('', 'Saved');
  }).catch(function () {
    setSaveStatus('offline', 'Saved on device');
  });
}
function startAutosave() {
  if (syncTimer) return;
  var base = (CFG.AUTOSAVE_SECONDS || 45) * 1000;
  function schedule() {
    /* jitter spreads 2000 clients across the whole interval */
    var wait = base + Math.random() * base * 0.6;
    syncTimer = setTimeout(function () { syncNow().then(schedule); }, wait);
  }
  schedule();
}

/* ---------------- registration ---------------- */
var VALID = {
  name: function (v) {
    if (v.trim().length < 3) return 'Please enter your full name (at least 3 characters).';
    if (!/[a-zA-Zঀ-৿]/.test(v)) return 'Please enter a valid name.';
    return '';
  },
  university: function (v) {
    return v.trim().length < 2 ? 'Please enter your university or institution.' : '';
  },
  email: function (v) {
    v = v.trim();
    if (!/^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(v)) return 'Please enter a valid email address.';
    return '';
  },
  phone: function (v) {
    var d = v.replace(/[^\d]/g, '');
    if (/^01\d{9}$/.test(d)) return '';                 // 01XXXXXXXXX
    if (/^8801\d{9}$/.test(d)) return '';               // 8801XXXXXXXXX
    if (d.length >= 8 && d.length <= 15) return '';     // international
    return 'Please enter a valid phone number (e.g. 01712345678).';
  }
};
function fieldError(name, msg) {
  var input = $('f' + name.charAt(0).toUpperCase() + name.slice(1));
  var err = $('err' + name.charAt(0).toUpperCase() + name.slice(1));
  if (input) input.classList.toggle('invalid', !!msg);
  if (err) { err.textContent = msg; err.classList.toggle('show', !!msg); }
}

function initRegistration() {
  $('ruleStart').textContent = fmt(START_MS, BD);

  ['name', 'university', 'email', 'phone'].forEach(function (f) {
    var el = $('f' + f.charAt(0).toUpperCase() + f.slice(1));
    el.addEventListener('blur', function () { fieldError(f, VALID[f](el.value)); });
    el.addEventListener('input', function () { if (el.classList.contains('invalid')) fieldError(f, VALID[f](el.value)); });
  });

  $('regForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var data = {};
    var bad = false;
    ['name', 'university', 'email', 'phone'].forEach(function (f) {
      var el = $('f' + f.charAt(0).toUpperCase() + f.slice(1));
      var v = el.value.trim().replace(/\s+/g, ' ');
      var msg = VALID[f](v);
      fieldError(f, msg);
      if (msg) bad = true;
      data[f] = v;
    });
    if (!$('fAgree').checked) {
      $('errAgree').textContent = 'You must accept the rules before continuing.';
      $('errAgree').classList.add('show');
      bad = true;
    } else { $('errAgree').classList.remove('show'); }
    if (bad) { toast('Please correct the highlighted fields.', true); return; }

    var btn = $('regSubmit');
    btn.disabled = true;
    btn.textContent = 'Registering…';
    $('regNote').className = 'form-note';
    $('regNote').textContent = 'Contacting the exam server…';

    var localToken = 'c_' + Math.random().toString(36).slice(2) + Date.now().toString(36);

    var finish = function (serverData) {
      S.token = (serverData && serverData.token) || localToken;
      S.candidateId = (serverData && serverData.candidateId) || localToken;
      S.name = data.name; S.university = data.university;
      S.email = data.email; S.phone = data.phone;
      if (!S.order) S.order = buildOrder();
      if (!S.optOrder) S.optOrder = buildOptOrder();
      saveLocal();
      goWaitingRoom();
    };

    if (!API_READY) {
      $('regNote').textContent = 'Practice mode — the backend is not configured yet.';
      setTimeout(function () { finish(null); }, 400);
      return;
    }

    apiRetry({
      action: 'register', token: localToken,
      name: data.name, university: data.university, email: data.email, phone: data.phone,
      userAgent: navigator.userAgent
    }, 4).then(finish).catch(function (err) {
      btn.disabled = false;
      btn.textContent = 'Register & continue';
      $('regNote').className = 'form-note error';
      $('regNote').textContent = 'Could not reach the exam server (' + err.message +
        '). Check your internet connection and try again. If it keeps failing, email ' + CFG.SUPPORT_EMAIL + '.';
    });
  });

  $('editReg').addEventListener('click', function () {
    $('fName').value = S.name; $('fUniversity').value = S.university;
    $('fEmail').value = S.email; $('fPhone').value = S.phone;
    $('fAgree').checked = true;
    $('regSubmit').disabled = false;
    $('regSubmit').textContent = 'Save & continue';
    show('screenRegister');
  });
}

function shuffle(arr) {
  for (var i = arr.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
  }
  return arr;
}

function buildOrder() {
  var order = QUESTIONS.map(function (q) { return q.n; });
  return CFG.SHUFFLE_QUESTIONS ? shuffle(order) : order;
}

/* Per-question display order of the four options, as ORIGINAL indices.
   The stored answer is always the option's ORIGINAL letter, so the server's
   answer key keeps working unchanged no matter how options are displayed. */
function buildOptOrder() {
  var map = {};
  QUESTIONS.forEach(function (q) {
    var idx = q.o.map(function (_, i) { return i; });
    map[q.n] = CFG.SHUFFLE_OPTIONS ? shuffle(idx) : idx;
  });
  return map;
}

/* ---------------- before the link opens ---------------- */
var preTimer = null;
function fbLabel() {
  var name = CFG.FB_PAGE_NAME || 'our official Facebook page';
  return CFG.FB_PAGE_URL
    ? '<a href="' + esc(CFG.FB_PAGE_URL) + '" target="_blank" rel="noopener">' + esc(name) + '</a>'
    : esc(name);
}
function goPreOpen() {
  var openTxt = fmtDay(OPEN_MS), startTxt = fmtDay(START_MS);
  $('preOpenTime').textContent = openTxt;
  $('preExamTime').textContent = startTxt;
  $('preRuleOpen').textContent = openTxt;
  $('preRuleStart').textContent = startTxt;
  $('preReadyTime').textContent = startTxt;
  $('preRuleDur').textContent = CFG.DURATION_MIN;
  $('preDuration').textContent = CFG.DURATION_MIN + ' minutes';
  $('preRuleFb').innerHTML = fbLabel();
  $('preSupport').innerHTML = '<a href="mailto:' + esc(CFG.SUPPORT_EMAIL) + '">' + esc(CFG.SUPPORT_EMAIL) + '</a>';
  show('screenPreOpen');
  clearInterval(preTimer);
  preTimer = setInterval(tickPreOpen, 250);
  tickPreOpen();
}
function tickPreOpen() {
  var left = OPEN_MS - now();
  if (left <= 0) {
    clearInterval(preTimer);
    /* Registration just opened — move them straight on, no refresh needed. */
    if (S.token && !S.submitted) goWaitingRoom(); else show('screenRegister');
    return;
  }
  var s = Math.floor(left / 1000);
  $('poH').textContent = pad(Math.floor(s / 3600));
  $('poM').textContent = pad(Math.floor(s / 60) % 60);
  $('poS').textContent = pad(s % 60);
}

/* ---------------- waiting room ---------------- */
var waitTimer = null;
function goWaitingRoom() {
  $('waitName').textContent = S.name.split(' ')[0] || 'candidate';
  $('waitStartText').textContent = fmt(START_MS);
  $('waitDetails').innerHTML =
    '<dt>Name</dt><dd>' + esc(S.name) + '</dd>' +
    '<dt>University</dt><dd>' + esc(S.university) + '</dd>' +
    '<dt>Email</dt><dd>' + esc(S.email) + '</dd>' +
    '<dt>Phone</dt><dd>' + esc(S.phone) + '</dd>';
  show('screenWait');
  /* Set the interval BEFORE the first tick: if the exam is already due to
     start, tickWait() calls startExam() straight away, and a timer created
     afterwards would survive and fire startExam() a second time. */
  clearInterval(waitTimer);
  waitTimer = setInterval(tickWait, 250);
  tickWait();
}
function tickWait() {
  var left = START_MS - now();
  if (left <= 0) { clearInterval(waitTimer); startExam(); return; }
  var s = Math.floor(left / 1000);
  $('cdH').textContent = pad(Math.floor(s / 3600));
  $('cdM').textContent = pad(Math.floor(s / 60) % 60);
  $('cdS').textContent = pad(s % 60);
}

/* ---------------- exam ---------------- */
var examTimer = null;
var examStarted = false;
function startExam() {
  if (S.submitted) return goDone();
  if (examStarted) return;          // never bind the click handlers twice
  examStarted = true;
  clearInterval(waitTimer);
  if (!S.startedAt) { S.startedAt = now(); saveLocal(); }
  if (!S.order || S.order.length !== QUESTIONS.length) S.order = buildOrder();
  if (!S.optOrder || Object.keys(S.optOrder).length !== QUESTIONS.length) S.optOrder = buildOptOrder();

  renderQuestions();
  $('headerRight').classList.remove('hidden');
  show('screenExam');
  if (CFG.ANTI_CHEAT) enableAntiCheat();
  startAutosave();
  syncNow(true);
  clearInterval(examTimer);
  examTimer = setInterval(tickExam, 500);
  tickExam();   // interval first, for the same reason as in goWaitingRoom()

  $('btnSubmit').addEventListener('click', function () {
    var blank = QUESTIONS.length - Object.keys(S.answers).length;
    var msg = blank > 0
      ? 'You have left ' + blank + ' question' + (blank > 1 ? 's' : '') +
        ' unanswered. There is no negative marking, so a guess can only help you. Submit anyway?'
      : 'You have answered all 50 questions. Once submitted you cannot change your answers.';
    confirmModal('Submit your answers?', msg, 'Yes, submit').then(function (ok) {
      if (ok) submitExam('manual');
    });
  });
}

function tickExam() {
  var left = END_MS - now();
  var el = $('timer');
  if (left <= 0) {
    el.textContent = '00:00';
    el.className = 'timer critical';
    clearInterval(examTimer);
    submitExam('auto-timeout');
    return;
  }
  var s = Math.ceil(left / 1000);
  var m = Math.floor(s / 60);
  el.textContent = pad(m) + ':' + pad(s % 60);
  el.className = 'timer' + (left <= 60000 ? ' critical' : left <= 300000 ? ' warning' : '');
  if (left <= 300000 && !tickExam._warned5) {
    tickExam._warned5 = true;
    toast('5 minutes remaining.');
  }
  if (left <= 60000 && !tickExam._warned1) {
    tickExam._warned1 = true;
    toast('1 minute remaining — your paper will submit automatically.', true);
  }
}

function renderQuestions() {
  var byNum = {};
  QUESTIONS.forEach(function (q) { byNum[q.n] = q; });

  var listHtml = '', navHtml = '';
  S.order.forEach(function (num, idx) {
    var q = byNum[num];
    if (!q) return;
    var pos = idx + 1;
    /* displayOrder[p] = original index of the option shown in position p.
       data-opt carries the ORIGINAL letter (what gets graded); the visible
       badge shows the positional letter the candidate sees. */
    var displayOrder = (S.optOrder && S.optOrder[num]) || [0, 1, 2, 3];
    var opts = displayOrder.map(function (origIdx, pos) {
      var origLetter = LETTERS[origIdx];
      var shownLetter = LETTERS[pos];
      var sel = S.answers[num] === origLetter;
      return '<label class="opt' + (sel ? ' sel' : '') + '" data-q="' + num + '" data-opt="' + origLetter + '">' +
             '<input type="radio" name="q' + num + '" value="' + origLetter + '"' + (sel ? ' checked' : '') + '>' +
             '<span class="letter">' + shownLetter + '</span>' +
             '<span class="opt-text">' + esc(q.o[origIdx]) + '</span></label>';
    }).join('');

    listHtml +=
      '<article class="q-card' + (S.answers[num] ? ' answered' : '') + (S.review[num] ? ' review' : '') +
        '" id="q' + num + '" data-q="' + num + '" data-pos="' + pos + '">' +
        '<div class="q-head">' +
          '<span class="q-num">' + pos + '</span>' +
          '<span class="q-tag">' + esc(q.s) + '</span>' +
          '<button type="button" class="q-mark' + (S.review[num] ? ' on' : '') + '" data-mark="' + num + '">' +
            (S.review[num] ? '★ Marked' : '☆ Mark for review') + '</button>' +
        '</div>' +
        '<p class="q-text">' + esc(q.t) + '</p>' +
        '<div class="opts">' + opts + '</div>' +
      '</article>';

    navHtml += '<button type="button" data-goto="' + num + '" class="' +
      (S.answers[num] ? 'answered' : '') + (S.review[num] ? ' review' : '') + '">' + pos + '</button>';
  });

  $('questionList').innerHTML = listHtml;
  $('navGrid').innerHTML = navHtml;

  $('questionList').addEventListener('click', function (e) {
    var opt = e.target.closest('.opt');
    if (opt) { selectAnswer(Number(opt.dataset.q), opt.dataset.opt); return; }
    var mark = e.target.closest('[data-mark]');
    if (mark) { toggleReview(Number(mark.dataset.mark)); }
  });
  $('navGrid').addEventListener('click', function (e) {
    var b = e.target.closest('[data-goto]');
    if (!b) return;
    var card = $('q' + b.dataset.goto);
    if (card) card.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  updateProgress();
}

function selectAnswer(num, letter) {
  S.answers[num] = letter;
  S.dirty = true;
  saveLocal();

  var card = $('q' + num);
  if (card) {
    card.classList.add('answered');
    card.querySelectorAll('.opt').forEach(function (o) {
      o.classList.toggle('sel', o.dataset.opt === letter);
      var input = o.querySelector('input');
      if (input) input.checked = (o.dataset.opt === letter);
    });
  }
  var navBtn = $('navGrid').querySelector('[data-goto="' + num + '"]');
  if (navBtn) navBtn.classList.add('answered');
  updateProgress();
}

function toggleReview(num) {
  S.review[num] = !S.review[num];
  if (!S.review[num]) delete S.review[num];
  S.dirty = true;
  saveLocal();
  var card = $('q' + num);
  var btn = card && card.querySelector('[data-mark]');
  if (card) card.classList.toggle('review', !!S.review[num]);
  if (btn) {
    btn.classList.toggle('on', !!S.review[num]);
    btn.textContent = S.review[num] ? '★ Marked' : '☆ Mark for review';
  }
  var navBtn = $('navGrid').querySelector('[data-goto="' + num + '"]');
  if (navBtn) navBtn.classList.toggle('review', !!S.review[num]);
}

function updateProgress() {
  var total = QUESTIONS.length;
  var done = Object.keys(S.answers).length;
  $('progressFill').style.width = (done / total * 100) + '%';
  $('progressCount').textContent = done + ' of ' + total + ' answered';
  $('statAnswered').textContent = done;
  $('statBlank').textContent = total - done;
  var marked = Object.keys(S.review).length;
  $('progressSection').textContent = marked ? marked + ' marked for review' : '';
  $('submitSummary').textContent = done === total
    ? 'All ' + total + ' questions answered.'
    : 'You have answered ' + done + ' of ' + total + '. Unanswered questions score zero — there is no penalty for guessing.';
}

/* ---------------- submission ---------------- */
var submitting = false;
function submitExam(reason) {
  if (S.submitted || submitting) return;
  submitting = true;
  clearTimeout(syncTimer);
  clearInterval(examTimer);

  var payload = {
    action: 'submit', token: S.token, answers: S.answers, review: S.review,
    reason: reason, tabSwitches: S.tabSwitches, copyAttempts: S.copyAttempts,
    screenshotAttempts: S.screenshotAttempts,
    startedAt: S.startedAt, clientSubmittedAt: now(),
    /* Sending the identity here lets the server skip scanning the
       Registrations sheet, which is what makes submission slow once there are
       thousands of rows. The server falls back to a lookup if these are absent. */
    name: S.name, university: S.university, email: S.email, phone: S.phone
  };
  var attempted = Object.keys(S.answers).length;

  $('btnSubmit').disabled = true;
  $('btnSubmit').textContent = 'Submitting…';
  setSaveStatus('saving', 'Submitting…');

  var finalize = function (res) {
    S.submitted = true;
    S.submissionId = (res && res.submissionId) || ('LOCAL-' + String(S.token).slice(-6).toUpperCase());
    S.submittedAt = now();
    S.attempted = attempted;
    S.emailQueued = !!(res && res.emailQueued);
    saveLocal();
    goDone();
  };

  if (!API_READY) { setTimeout(function () { finalize(null); }, 500); return; }

  /* Auto-submits at the deadline are spread over SUBMIT_SPREAD_SECONDS so 2000
     papers do not land in the same second; a manual submit goes immediately. */
  var delay = reason === 'auto-timeout'
    ? Math.random() * (CFG.SUBMIT_SPREAD_SECONDS || 240) * 1000 : 0;
  if (delay > 4000) {
    $('submitSummary').textContent = 'Time is up. Your paper is being submitted — ' +
      'please keep this page open until you see the confirmation. This can take a ' +
      'few minutes while everyone submits at once.';
  }
  setTimeout(function () {
    apiRetry(payload, 6).then(finalize).catch(function (err) {
      submitting = false;
      $('btnSubmit').disabled = false;
      $('btnSubmit').textContent = 'Retry submission';
      setSaveStatus('offline', 'Not submitted');
      toast('Submission failed: ' + err.message + '. Your answers are safe on this device — press Retry.', true);
      /* keep trying quietly in the background */
      setTimeout(function () { if (!S.submitted) submitExam(reason + '-retry'); }, 20000);
    });
  }, delay);
}

function goDone() {
  clearInterval(examTimer);
  clearTimeout(syncTimer);
  $('headerRight').classList.add('hidden');
  $('doneId').textContent = S.submissionId || '—';
  $('doneName').textContent = S.name || '—';
  $('doneAttempted').textContent = (S.attempted != null ? S.attempted : Object.keys(S.answers).length) + ' of ' + QUESTIONS.length;
  $('doneTime').textContent = fmt(S.submittedAt || now(), BD);
  $('doneFb').innerHTML = fbLabel();
  if (!API_READY) {
    $('doneEmailNote').innerHTML = '<strong>Practice mode.</strong> Nothing was sent to a server.';
  }
  disableAntiCheat();
  show('screenDone');
}

/* ---------------- proctoring ---------------- */
var acHandlers = [];
function on(target, type, fn, opts) {
  target.addEventListener(type, fn, opts);
  acHandlers.push([target, type, fn, opts]);
}
function enableAntiCheat() {
  document.body.classList.add('no-select');

  var block = function (e) {
    e.preventDefault();
    S.copyAttempts++;
    S.dirty = true;
    saveLocal();
    toast('Copying, cutting and pasting are disabled during the exam.', true);
    return false;
  };
  on(document, 'copy', block);
  on(document, 'cut', block);
  on(document, 'paste', block);
  on(document, 'contextmenu', function (e) { e.preventDefault(); });
  on(document, 'dragstart', function (e) { e.preventDefault(); });
  on(document, 'selectstart', function (e) {
    if (e.target.closest && e.target.closest('.q-text, .opt-text')) e.preventDefault();
  });

  on(document, 'keydown', function (e) {
    var k = (e.key || '').toLowerCase();
    var ctrl = e.ctrlKey || e.metaKey;
    /* copy / save / print / view-source / find */
    if (ctrl && ['c', 'x', 'v', 's', 'p', 'u', 'a', 'f'].indexOf(k) > -1) {
      e.preventDefault(); S.copyAttempts++; saveLocal();
      toast('This shortcut is disabled during the exam.', true);
      return;
    }
    /* devtools */
    if (k === 'f12' || (ctrl && e.shiftKey && ['i', 'j', 'c'].indexOf(k) > -1)) {
      e.preventDefault();
      toast('Developer tools are not allowed during the exam.', true);
    }
    /* Screenshot attempts. The operating system takes the screenshot before the
       browser sees the key, so this RECORDS the attempt — it cannot block it,
       and it cannot see screenshots taken on a phone at all. */
    if (k === 'printscreen' || (ctrl && e.shiftKey && k === 's') ||
        (e.metaKey && e.shiftKey && ['3', '4', '5'].indexOf(k) > -1)) {
      S.screenshotAttempts++;
      S.dirty = true;
      saveLocal();
      syncNow(true);
      var b = $('warnBanner');
      b.textContent = 'Screenshots are not permitted. This attempt has been recorded.';
      b.classList.remove('hidden');
      setTimeout(function () { b.classList.add('hidden'); }, 6000);
    }
  });

  on(document, 'visibilitychange', function () {
    if (document.hidden && !S.submitted) {
      S.tabSwitches++;
      S.dirty = true;
      saveLocal();
      syncNow(true);
    } else if (!document.hidden && S.tabSwitches > 0 && !S.submitted) {
      var banner = $('warnBanner');
      banner.textContent = 'Warning: you left the exam window (' + S.tabSwitches + ' time' +
        (S.tabSwitches > 1 ? 's' : '') + '). This is recorded and reviewed.';
      banner.classList.remove('hidden');
      setTimeout(function () { banner.classList.add('hidden'); }, 6000);
      if (S.tabSwitches >= (CFG.MAX_TAB_SWITCHES || 5)) {
        toast('You have left the exam window ' + S.tabSwitches + ' times. Further switching may disqualify you.', true);
      }
    }
  });

  /* last-ditch save if the tab is closed or the phone rings */
  on(window, 'pagehide', flushBeacon);
  on(window, 'beforeunload', function (e) {
    flushBeacon();
    if (!S.submitted) { e.preventDefault(); e.returnValue = ''; return ''; }
  });
}
function disableAntiCheat() {
  document.body.classList.remove('no-select');
  acHandlers.forEach(function (h) { h[0].removeEventListener(h[1], h[2], h[3]); });
  acHandlers = [];
}
function flushBeacon() {
  saveLocal();
  if (!API_READY || S.submitted || !S.token) return;
  try {
    var body = JSON.stringify({
      action: 'sync', token: S.token, answers: S.answers, review: S.review,
      tabSwitches: S.tabSwitches, copyAttempts: S.copyAttempts,
      screenshotAttempts: S.screenshotAttempts, viaBeacon: true
    });
    if (navigator.sendBeacon) {
      navigator.sendBeacon(CFG.API_URL, new Blob([body], { type: 'text/plain;charset=utf-8' }));
    }
  } catch (e) { /* nothing more we can do */ }
}

/* ---------------- boot ---------------- */
function blocked(title, msg) {
  $('blockTitle').textContent = title;
  $('blockMsg').textContent = msg;
  show('screenBlocked');
}

function boot() {
  if (isNaN(START_MS)) {
    blocked('Exam not configured', 'The exam start time has not been set correctly. Please contact ' + CFG.SUPPORT_EMAIL + '.');
    return;
  }
  if (!QUESTIONS.length) {
    blocked('Questions unavailable', 'The question paper could not be loaded. Please refresh the page.');
    return;
  }

  var had = loadLocal();
  initRegistration();

  /* Ask the server for the true time before deciding which screen to show. */
  var ready = API_READY
    ? api({ action: 'time' }, 12000).then(function (r) { if (r.now) setServerTime(r.now); }).catch(function () {})
    : Promise.resolve();

  ready.then(function () {
    var t = now();

    if (had && S.submitted) { goDone(); return; }
    if (t >= END_MS) {
      if (had && S.token && Object.keys(S.answers).length) {
        /* Exam ended while they were offline — push the paper up now. */
        submitExam('late-recovery');
      } else {
        blocked('The exam has closed',
          'This examination ended at ' + fmt(END_MS, BD) + '. If you sat the exam and your paper was not submitted, email ' +
          CFG.SUPPORT_EMAIL + ' immediately.');
      }
      return;
    }
    if (t >= START_MS) {
      if (had && S.token) { startExam(); }
      else {
        /* Late arrival: they may still register, but the clock does not restart. */
        var mins = Math.ceil((END_MS - t) / 60000);
        $('regNote').className = 'form-note error';
        $('regNote').textContent = 'The exam has already started — about ' + mins +
          ' minute' + (mins > 1 ? 's' : '') + ' remain. Register quickly to begin.';
        show('screenRegister');
      }
      return;
    }
    if (t < OPEN_MS) { goPreOpen(); return; }
    if (had && S.token) { goWaitingRoom(); } else { show('screenRegister'); }
  });
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();

})();
