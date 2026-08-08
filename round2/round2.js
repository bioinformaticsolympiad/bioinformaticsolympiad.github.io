/* =====================================================
   BBO 3.0 - Round 2 registration
   Entry is gated on a verified Round 1 PASS: the page arrives with ?t=<lookupId>
   from the result page, and the server re-checks that id before showing the form
   and again before taking a seat.
   ===================================================== */
(function () {
'use strict';

var CFG = window.BBO_R2_CONFIG || {};
var LOOKUP_ID = null;
var CERT_MODE = false;
var CANDIDATE = null;
var STATE = null;
var SHOT = null;          // { data: base64, type: mime, kb: number }

function $(id) { return document.getElementById(id); }
function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}
/* Many names were registered in ALL CAPS or all lowercase; normalise those two
   cases so the page does not shout, but leave deliberate mixed case alone. */
function tidyName(name) {
  var s = String(name || '').trim().replace(/\s+/g, ' ');
  if (!s) return '';
  if (s !== s.toUpperCase() && s !== s.toLowerCase()) return s;
  return s.replace(/\S+/g, function (w) {
    return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
  });
}

var toastTimer;
function toast(msg, isErr) {
  var t = $('toast');
  t.textContent = msg;
  t.classList.toggle('err', !!isErr);
  t.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function () { t.classList.add('hidden'); }, 4200);
}
function show(id) {
  ['gateBox', 'loadingBox', 'mainBox', 'closedBox', 'doneBox'].forEach(function (s) {
    $(s).classList.toggle('hidden', s !== id);
  });
  window.scrollTo(0, 0);
}
function api(payload) {
  return fetch(CFG.API_URL, {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    redirect: 'follow'
  }).then(function (r) {
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return r.json();
  });
}
function fieldError(name, msg) {
  var input = $('f' + name);
  var err = $('err' + name);
  if (input) input.classList.toggle('invalid', !!msg);
  if (err) { err.textContent = msg || ''; err.classList.toggle('show', !!msg); }
  return !msg;
}

/* ---------------- image handling ----------------
   A bKash screenshot straight off a phone can be 3-6 MB, which is slow to
   upload on mobile data and wasteful in Drive. Redraw it through a canvas at a
   sensible width first, the transaction ID stays perfectly legible. */
function compressImage(file) {
  return new Promise(function (resolve, reject) {
    if (!/^image\//.test(file.type)) {
      reject(new Error('Please choose an image file (JPG or PNG).'));
      return;
    }
    var reader = new FileReader();
    reader.onerror = function () { reject(new Error('Could not read that file.')); };
    reader.onload = function () {
      var img = new Image();
      img.onerror = function () { reject(new Error('That file does not look like a valid image.')); };
      img.onload = function () {
        var maxW = CFG.MAX_IMAGE_WIDTH || 1400;
        var scale = Math.min(1, maxW / img.width);
        var w = Math.round(img.width * scale), h = Math.round(img.height * scale);
        var canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        var ctx = canvas.getContext('2d');
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, w, h);           // flatten transparency for JPEG
        ctx.drawImage(img, 0, 0, w, h);
        var dataUrl = canvas.toDataURL('image/jpeg', CFG.JPEG_QUALITY || 0.82);
        var base64 = dataUrl.split(',')[1];
        resolve({
          data: base64, type: 'image/jpeg',
          kb: Math.round(base64.length * 0.75 / 1024),
          preview: dataUrl
        });
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

/* ---------------- package / segments ---------------- */
function currentPackage() { return $('fPackage').value === 'full' ? 'full' : 'exam'; }

function syncPackage() {
  var pkg = currentPackage();
  var fee = pkg === 'full' ? (CFG.FEE_FULL || 600) : (CFG.FEE_EXAM || 500);
  $('payAmount').textContent = fee;
  Array.prototype.forEach.call(document.querySelectorAll('.payAmt2'), function (el) {
    el.textContent = fee;
  });
  $('segmentsWrap').classList.toggle('hidden', pkg !== 'full');

  /* keep the pricing cards in step with the dropdown, both ways */
  var examCard = $('pkgExam').closest('.fee-card');
  var fullCard = $('pkgFull').closest('.fee-card');
  examCard.classList.toggle('selected', pkg === 'exam');
  fullCard.classList.toggle('selected', pkg === 'full');
  $('pkgExam').checked = pkg === 'exam';
  $('pkgFull').checked = pkg === 'full';

  if (pkg !== 'full') {
    fieldError('Segments', '');
    fieldError('PosterType', '');
  }
}

function syncPoster() {
  var on = $('segPoster').checked && currentPackage() === 'full';
  $('posterTypeWrap').classList.toggle('hidden', !on);
  if (!on) fieldError('PosterType', '');
}

/* ---------------- validation ---------------- */
function validate() {
  var ok = true;
  var v = function (id) { return $(id).value.trim().replace(/\s+/g, ' '); };

  if (v('fName').length < 3) ok = fieldError('Name', 'Please enter your full name.') && ok;
  else fieldError('Name', '');

  if (v('fUniversity').length < 2) ok = fieldError('University', 'Please enter your university or institution.') && ok;
  else fieldError('University', '');

  if (v('fDepartment').length < 2) ok = fieldError('Department', 'Please enter your department.') && ok;
  else fieldError('Department', '');

  var d = v('fPhone').replace(/[^\d]/g, '');
  if (!(/^01\d{9}$/.test(d) || /^8801\d{9}$/.test(d) || (d.length >= 8 && d.length <= 15))) {
    ok = fieldError('Phone', 'Please enter a valid phone number (e.g. 01712345678).') && ok;
  } else fieldError('Phone', '');

  var att = $('fAttending').value;
  if (!att) ok = fieldError('Attending', 'Please answer this question.') && ok;
  else if (att === 'no') ok = fieldError('Attending', 'Round 2 can only be taken in person, so we cannot hold a seat for you.') && ok;
  else fieldError('Attending', '');

  if (currentPackage() === 'full') {
    var any = $('segPoster').checked || $('segPhoto').checked || $('segSpeech').checked;
    if (!any) {
      $('errSegments').textContent = 'Choose at least one segment, or switch to the ৳' + (CFG.FEE_EXAM || 500) + ' exam-only package.';
      $('errSegments').classList.add('show');
      ok = false;
    } else { $('errSegments').classList.remove('show'); }

    if ($('segPoster').checked && !$('fPosterType').value) {
      ok = fieldError('PosterType', 'Please choose research-based or idea-based.') && ok;
    } else fieldError('PosterType', '');
  }

  if (v('fTxn').length < 4) ok = fieldError('Txn', 'Please enter the bKash transaction ID from your confirmation message.') && ok;
  else fieldError('Txn', '');

  if (!SHOT) {
    $('errShot').textContent = 'Please attach a screenshot of your bKash payment.';
    $('errShot').classList.add('show');
    ok = false;
  } else { $('errShot').classList.remove('show'); }

  if (!$('fConfirm').checked) {
    $('errConfirm').textContent = 'Please confirm before submitting.';
    $('errConfirm').classList.add('show');
    ok = false;
  } else { $('errConfirm').classList.remove('show'); }

  return ok;
}

/* ---------------- seats ---------------- */
function renderSeats(s) {
  if (!s) return;
  var taken = s.taken || 0, cap = s.capacity || CFG.CAPACITY || 350;
  var pct = Math.min(100, Math.round(taken / cap * 100));
  $('seatFill').style.width = '0%';
  setTimeout(function () { $('seatFill').style.width = pct + '%'; }, 80);
  if (s.remaining > 0) {
    $('seatText').textContent = s.remaining + ' of ' + cap + ' seats still available';
    $('seatSub').textContent = '· ' + taken + ' already registered';
  } else {
    $('seatText').textContent = 'All ' + cap + ' seats are taken';
    $('seatSub').textContent = '';
  }
}

/* Live seat count for the public info view. Purely additive: if the backend is
   unreachable the meter simply stays hidden and the page reads normally. */
function loadPublicSeats() {
  api({ action: 'round2Info' }).then(function (s) {
    if (!s || !s.ok || !s.capacity) return;
    var pct = Math.min(100, Math.round((s.taken || 0) / s.capacity * 100));
    $('infoSeatMeter').classList.remove('hidden');
    setTimeout(function () { $('infoSeatFill').style.width = pct + '%'; }, 80);
    if (s.remaining > 0) {
      $('infoSeatText').textContent = s.remaining + ' of ' + s.capacity + ' seats still available';
      $('infoSeatSub').textContent = '· ' + (s.taken || 0) + ' already registered';
    } else {
      $('infoSeatText').textContent = 'All ' + s.capacity + ' seats are taken';
      $('infoSeatSub').textContent = '';
    }
  }).catch(function () { /* leave the meter hidden */ });
}

function closedScreen(state, message) {
  $('closedMsg').textContent = message ||
    (state && state.expired ? 'Registration closed on ' + (CFG.DEADLINE_TEXT || 'the deadline') + '.'
     : state && state.full ? 'All ' + (state.capacity || CFG.CAPACITY) + ' seats have been taken.'
     : 'Registration is currently closed.');
  if (state && state.full) $('closedTitle').textContent = 'The hall is full';
  show('closedBox');
}

/* ---------------- submit ---------------- */
function submitForm() {
  if (!validate()) {
    toast('Please correct the highlighted fields.', true);
    var bad = document.querySelector('.invalid, .err.show');
    if (bad) bad.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }

  var btn = $('submitBtn');
  btn.disabled = true;
  btn.textContent = 'Submitting…';
  $('formNote').className = 'form-note';
  $('formNote').textContent = 'Uploading your payment screenshot, please do not close this page.';

  var pkg = currentPackage();
  api({
    action: 'round2Register',
    id: LOOKUP_ID,
    name: $('fName').value.trim(),
    university: $('fUniversity').value.trim(),
    department: $('fDepartment').value.trim(),
    phone: $('fPhone').value.trim(),
    attendingCU: $('fAttending').value,
    package: pkg,
    poster: pkg === 'full' && $('segPoster').checked,
    posterType: $('fPosterType').value,
    photography: pkg === 'full' && $('segPhoto').checked,
    speech: pkg === 'full' && $('segSpeech').checked,
    transactionId: $('fTxn').value.trim(),
    screenshotData: SHOT.data,
    screenshotType: SHOT.type
  }).then(function (res) {
    if (!res.ok) {
      btn.disabled = false;
      btn.textContent = 'Complete Round 2 registration';
      if (res.closed) { closedScreen(res.state, res.error); return; }
      $('formNote').className = 'form-note error';
      $('formNote').textContent = res.error || 'Registration failed. Please try again.';
      toast(res.error || 'Registration failed.', true);
      return;
    }
    renderDone(res, pkg);
  }).catch(function (err) {
    btn.disabled = false;
    btn.textContent = 'Complete Round 2 registration';
    $('formNote').className = 'form-note error';
    $('formNote').textContent = 'Could not reach the server (' + err.message +
      '). Check your connection and press the button again. Your details are still here.';
  });
}

function renderDone(res, pkg) {
  $('dRegId').textContent = res.regId || '-';
  $('dSeat').textContent = res.seat ? ('#' + res.seat) : '-';
  /* What the server recorded always wins. `pkg` is only the fallback for the
     moment right after submitting, before a stored row exists to read back. */
  $('dPackage').textContent = res.packageLabel ||
    (pkg === 'full' ? 'Exam + segments' : 'Exam only');
  $('dFee').textContent = '৳' + (res.fee || (pkg === 'full' ? CFG.FEE_FULL : CFG.FEE_EXAM));
  if (res.duplicate) {
    $('doneLead').textContent = 'You were already registered for Round 2, here are your existing details. ' +
      'You have not been charged or counted twice.';
  }
  var wa = res.whatsapp || CFG.WHATSAPP_URL;
  $('waBtn').setAttribute('href', wa);
  $('waFallback').innerHTML = 'If the button does not open WhatsApp, copy this link: <br><span class="small">' + esc(wa) + '</span>';
  if (CFG.FB_PAGE_URL) $('fbBtn').setAttribute('href', CFG.FB_PAGE_URL);
  else $('fbBtn').classList.add('hidden');
  show('doneBox');
}

/* ---------------- certificate ----------------
   Reached from the result page with &cert=1. The registration page stays
   fully usable while this runs; the popup is the only overlay. */
function certUI(state, title, msg) {
  var p = $('certPopup');
  p.classList.remove('hidden', 'done', 'error');
  if (state) p.classList.add(state);
  $('certSpinner').classList.toggle('hidden', state === 'done' || state === 'error');
  $('certTick').classList.toggle('hidden', state !== 'done');
  $('certClose').classList.toggle('hidden', !state);
  $('certTitle').textContent = title;
  $('certMsg').textContent = msg;
}

function runCertificate(candidate) {
  if (!window.BBOCertificate) return;

  var waitMs = CFG.CERT_MIN_WAIT_MS != null ? CFG.CERT_MIN_WAIT_MS : 8000;
  certUI(null, 'Your certificate is generating',
    'It will take 1 minute. Please don\'t leave this page.');

  $('certClose').onclick = function () { $('certPopup').classList.add('hidden'); };

  var started = Date.now();
  var record = {
    name: candidate.name,
    rank: candidate.rank,
    certificateId: candidate.certificateId || ''
  };

  window.BBOCertificate.generate(record, '../assets/certificate/template.png')
    .then(function (out) {
      /* Hold the popup for the promised interval even though the drawing
         itself is quick, so the message on screen stays truthful. */
      var wait = Math.max(0, waitMs - (Date.now() - started));
      setTimeout(function () {
        window.BBOCertificate.download(out);
        certUI('done', 'Congratulations!',
          'Your certificate has been downloaded in your device.');
        var manual = $('certManual');
        manual.classList.remove('hidden');
        manual.setAttribute('href', out.dataUrl);
        manual.setAttribute('download', out.filename);
      }, wait);
    })
    .catch(function (err) {
      certUI('error', 'Certificate could not be generated',
        (err && err.message ? err.message + ' ' : '') + 'Please reload the page and try again.');
    });
}

/* ---------------- boot ---------------- */
function setAll(selector, text) {
  Array.prototype.forEach.call(document.querySelectorAll(selector), function (el) {
    el.textContent = text;
  });
}

function fillStaticCopy() {
  var venue = CFG.VENUE || 'University of Chittagong';
  ['heroVenue', 'heroVenue2', 'fVenue'].forEach(function (id) { if ($(id)) $(id).textContent = venue; });
  if ($('fDate')) $('fDate').textContent = CFG.EXAM_WINDOW || '';
  if ($('fDeadline')) $('fDeadline').textContent = CFG.DEADLINE_TEXT || '';
  if ($('fCapacity')) $('fCapacity').textContent = (CFG.CAPACITY || 350) + ' seats';
  ['capInline', 'capInline2'].forEach(function (id) { if ($(id)) $(id).textContent = CFG.CAPACITY || 350; });

  /* the public info view uses classes, since those fields appear twice on the page */
  setAll('.iVenue', venue);
  setAll('.iDate', CFG.EXAM_WINDOW || '');
  setAll('.iDeadline', CFG.DEADLINE_TEXT || '');
  setAll('.iCapacity', (CFG.CAPACITY || 350) + ' seats');
  setAll('.iCapNum', CFG.CAPACITY || 350);
  Array.prototype.forEach.call(document.querySelectorAll('.fee-amt'), function (el, i) {
    el.textContent = i === 0 ? (CFG.FEE_EXAM || 500) : (CFG.FEE_FULL || 600);
  });
  var mail = CFG.SUPPORT_EMAIL || '';
  if ($('closedSupport')) { $('closedSupport').textContent = mail; $('closedSupport').href = 'mailto:' + mail; }

  var nums = CFG.BKASH_NUMBERS || [];
  $('bkashNumbers').innerHTML = nums.map(function (n) {
    return '<span class="bkash-num">' + esc(n) + '<button type="button" data-copy="' + esc(n) + '">Copy</button></span>';
  }).join('');
  $('bkashNumbers').addEventListener('click', function (e) {
    var b = e.target.closest('[data-copy]');
    if (!b) return;
    var text = b.getAttribute('data-copy');
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(function () { toast('Copied ' + text); },
        function () { toast('Could not copy, please type it manually.', true); });
    } else { toast('Please note the number: ' + text); }
  });
}

function wireForm() {
  $('fPackage').addEventListener('change', syncPackage);
  [$('pkgExam'), $('pkgFull')].forEach(function (radio) {
    radio.addEventListener('change', function () {
      $('fPackage').value = radio.value;
      syncPackage();
      $('fPackage').scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  });
  $('segPoster').addEventListener('change', syncPoster);

  $('fAttending').addEventListener('change', function () {
    var no = $('fAttending').value === 'no';
    $('cannotAttend').classList.toggle('hidden', !no);
    if (!no) fieldError('Attending', '');
  });

  $('fShot').addEventListener('change', function () {
    var file = this.files && this.files[0];
    if (!file) { SHOT = null; $('shotPreview').classList.add('hidden'); return; }
    $('shotHint').textContent = 'Processing image…';
    compressImage(file).then(function (out) {
      SHOT = out;
      $('shotImg').src = out.preview;
      $('shotPreview').classList.remove('hidden');
      $('shotHint').textContent = 'Ready to upload (' + out.kb + ' KB after shrinking).';
      $('errShot').classList.remove('show');
    }).catch(function (err) {
      SHOT = null;
      $('shotPreview').classList.add('hidden');
      $('shotHint').textContent = 'JPG or PNG. Large photos are shrunk automatically before upload.';
      $('errShot').textContent = err.message;
      $('errShot').classList.add('show');
    });
  });

  $('r2Form').addEventListener('submit', function (e) {
    e.preventDefault();
    submitForm();
  });
}

function boot() {
  fillStaticCopy();
  wireForm();
  syncPackage();

  var m = location.search.match(/[?&]t=([^&]+)/);
  LOOKUP_ID = m ? decodeURIComponent(m[1]) : null;
  CERT_MODE = /[?&]cert=1\b/.test(location.search);

  if (!CFG.API_URL || CFG.API_URL.indexOf('http') !== 0) {
    $('gateTitle').textContent = 'Registration is not available yet';
    $('gateMsg').textContent = 'The registration server is not configured. Please contact ' + (CFG.SUPPORT_EMAIL || 'the organisers') + '.';
    show('gateBox');
    return;
  }
  if (!LOOKUP_ID) { show('gateBox'); loadPublicSeats(); return; }

  api({ action: 'round2Prefill', id: LOOKUP_ID }).then(function (res) {
    if (!res.ok) {
      $('gateTitle').textContent = res.notQualified ? 'Round 2 is for qualified candidates' : 'We could not verify your result';
      $('gateMsg').textContent = res.error || 'Please check your result again and use the button on that page.';
      show('gateBox');
      return;
    }

    CANDIDATE = res.candidate;
    STATE = res.state;

    /* Certificate runs regardless of which screen the registration flow
       lands on, already registered, closed, or the form itself. */
    if (CERT_MODE) runCertificate(CANDIDATE);

    if (res.alreadyRegistered) {
      var prev = res.alreadyRegistered;
      renderDone({
        regId: prev.regId, seat: prev.seat, whatsapp: prev.whatsapp,
        packageLabel: prev.packageLabel, fee: prev.fee, duplicate: true
      }, prev.fee >= (CFG.FEE_FULL || 600) ? 'full' : 'exam');
      return;
    }
    if (STATE && !STATE.open) { closedScreen(STATE); return; }

    var nice = tidyName(CANDIDATE.name);
    $('fName').value = nice;
    $('fUniversity').value = CANDIDATE.university || '';
    $('fPhone').value = CANDIDATE.phone || '';
    $('fScore').value = (Math.round(CANDIDATE.percent * 10) / 10) + '%';
    $('vName').textContent = nice;
    $('vScore').textContent = Math.round(CANDIDATE.percent * 10) / 10;
    $('vRank').textContent = CANDIDATE.rank || '-';

    renderSeats(STATE);
    show('mainBox');
  }).catch(function (err) {
    $('gateTitle').textContent = 'Could not reach the server';
    $('gateMsg').textContent = 'Please check your internet connection and reload this page. (' + err.message + ')';
    show('gateBox');
  });
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();

})();
