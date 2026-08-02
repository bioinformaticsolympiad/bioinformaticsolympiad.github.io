/* =====================================================
   BBO 3.0 — Result checker
   The participant list stays on the server. This page sends a typed email and
   receives either one person's result or a few MASKED suggestions.
   ===================================================== */
(function () {
'use strict';

var CFG = window.BBO_RESULT_CONFIG || {};

function $(id) { return document.getElementById(id); }
function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}
/* Many names were typed in ALL CAPS or all lowercase at registration. Shouting
   someone's name back at them reads badly, so normalise those two cases —
   but leave deliberate mixed case (McDonald, d'Souza) exactly as entered. */
function tidyName(name) {
  var s = String(name || '').trim().replace(/\s+/g, ' ');
  if (!s) return '';
  var isAllCaps = s === s.toUpperCase();
  var isAllLower = s === s.toLowerCase();
  if (!isAllCaps && !isAllLower) return s;
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
  toastTimer = setTimeout(function () { t.classList.add('hidden'); }, 4000);
}
function showOnly(id) {
  ['suggestBox', 'notFound', 'resultBox'].forEach(function (s) {
    $(s).classList.toggle('hidden', s !== id);
  });
  if (id) {
    var el = $(id);
    setTimeout(function () { el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 60);
  }
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

function busy(on) {
  $('lookupBtn').disabled = on;
  $('lookupBtn').textContent = on ? 'Checking…' : 'Check result';
}

function fieldError(msg) {
  $('lookupErr').textContent = msg || '';
  $('lookupErr').classList.toggle('show', !!msg);
  $('emailInput').classList.toggle('invalid', !!msg);
}

/* ---------------- lookup ---------------- */
function lookup(email) {
  busy(true);
  fieldError('');
  api({ action: 'result', email: email }).then(function (res) {
    busy(false);
    if (!res.ok) {
      if (res.notPublished) {
        showOnly(null);
        toast('Results have not been published yet. Please check back later.', true);
        return;
      }
      fieldError(res.error || 'Something went wrong. Please try again.');
      return;
    }
    if (res.found) { renderResult(res.result); return; }
    if (res.suggestions && res.suggestions.length) { renderSuggestions(res.suggestions); return; }
    showOnly('notFound');
  }).catch(function (err) {
    busy(false);
    fieldError('Could not reach the result server (' + err.message +
      '). Check your internet connection and try again.');
  });
}

function lookupById(id, label) {
  busy(true);
  api({ action: 'resultById', id: id }).then(function (res) {
    busy(false);
    if (res.ok && res.found) { renderResult(res.result); }
    else { toast(res.error || 'Could not open that result.', true); }
  }).catch(function (err) {
    busy(false);
    toast('Could not reach the result server. Please try again.', true);
  });
}

/* ---------------- render ---------------- */
function renderSuggestions(list) {
  var html = '';
  list.forEach(function (s) {
    html += '<li><button type="button" class="suggest-btn" data-id="' + esc(s.id) + '">' +
              '<span>' +
                '<span class="sg-mail">' + esc(s.masked) + '</span><br>' +
                '<span class="sg-name">' + esc(s.name || '') + '</span>' +
              '</span>' +
              '<span class="sg-go">View →</span>' +
            '</button></li>';
  });
  $('suggestList').innerHTML = html;
  showOnly('suggestBox');
}

function renderResult(r) {
  var total = r.totalMarks || CFG.TOTAL_MARKS || 50;
  var passPct = r.passPercent || CFG.PASS_PERCENT || 40;
  var passed = String(r.result).toUpperCase() === 'PASS';

  var displayName = tidyName(r.name);
  $('rName').textContent = displayName || '—';
  $('rUniversity').textContent = r.university || '';
  $('rEmail').textContent = r.email || '';
  $('rRank').textContent = r.rank || '—';
  $('rRankOf').textContent = '';
  $('rMarks').textContent = r.marks;
  $('rTotal').textContent = total;
  $('rPercent').textContent = (Math.round(r.percent * 10) / 10) + '%';
  $('rAttempted').textContent = r.attempted;
  $('rCorrect').textContent = r.correct;
  $('rWrong').textContent = r.wrong;
  $('rBlank').textContent = r.notAnswered;
  $('rTab').textContent = r.tabSwitches;
  $('rCopy').textContent = r.copyAttempts;
  $('rShot').textContent = r.screenshotAttempts;
  $('barMax').textContent = total;
  $('passLabel').textContent = 'pass ' + passPct + '%';

  var flagged = (r.tabSwitches > 0) || (r.copyAttempts > 0) || (r.screenshotAttempts > 0);
  $('conductNote').textContent = flagged
    ? 'These figures were recorded automatically during your exam. Leaving the exam tab — including an incoming call or notification on a phone — counts as a tab switch, and did not by itself affect your marks.'
    : 'No irregularities were recorded during your examination.';

  /* score bar */
  var pctOfTotal = total ? Math.max(0, Math.min(100, (r.marks / total) * 100)) : 0;
  $('scoreBar').style.width = '0%';
  setTimeout(function () { $('scoreBar').style.width = pctOfTotal + '%'; }, 80);
  $('passLine').style.left = passPct + '%';

  /* verdict */
  var v = $('verdict');
  v.classList.remove('pass', 'fail');
  v.classList.add(passed ? 'pass' : 'fail');
  $('verdictIcon').textContent = passed ? '🎉' : '💚';
  var first = displayName.split(' ')[0] || '';
  var pctText = (Math.round(r.percent * 10) / 10) + '%';
  var scoreText = r.marks + ' out of ' + total + ' (' + pctText + ')';

  if (passed) {
    $('verdictTitle').textContent = 'Congratulations' + (first ? ', ' + first : '') + '!';
    $('verdictMsg').textContent =
      'You have passed Round 1 with ' + scoreText + ', ranking ' + r.rank +
      '. You are through to the next round — well done, and thank you for taking part.';
  } else {
    $('verdictTitle').textContent = 'Not this time' + (first ? ', ' + first : '');
    /* Tell the truth without rubbing it in. "Just short" is only honest for
       someone who was actually close — saying it to a candidate who scored 8%
       reads as sarcasm. */
    var gap = passPct - r.percent;
    var body;
    if (gap <= 10) {
      body = 'You scored ' + scoreText + ' — only ' + (Math.round(gap * 10) / 10) +
             ' percentage points short of the ' + passPct + '% needed to qualify. ' +
             'That is a narrow miss, and a frustrating one.';
    } else if (r.percent >= 15) {
      body = 'You scored ' + scoreText + ', below the ' + passPct + '% needed to qualify this time.';
    } else {
      body = 'Your paper scored ' + scoreText + '. If that does not reflect the exam you thought you sat, ' +
             'do get in touch with us.';
    }
    $('verdictMsg').textContent = body +
      ' Sitting a national olympiad at all takes real courage, and this is one paper on one evening — ' +
      'not a verdict on what you are capable of. We very much hope to see you again next year.';
  }

  /* next round */
  $('nrVenue').textContent = CFG.NEXT_ROUND_VENUE || 'University of Chittagong';
  $('nrLead').textContent = passed
    ? 'As a qualifier, you are invited to sit Round 2 in person at the ' +
      (CFG.NEXT_ROUND_VENUE || 'University of Chittagong') + '. Please plan to attend on campus — this round is not held online.'
    : 'Round 2 will be held offline at the ' + (CFG.NEXT_ROUND_VENUE || 'University of Chittagong') +
      ' for qualifying participants.';
  $('nrDetail').textContent = CFG.NEXT_ROUND_DETAIL || '';

  /* The Round 2 button appears only for a pass, and carries the verified
     lookup id so the registration form knows who is arriving — the backend
     re-checks that id against the Results sheet before letting anyone in. */
  var cta = $('r2Cta');
  if (passed && r.lookupId) {
    $('r2Btn').setAttribute('href', '../round2/?t=' + encodeURIComponent(r.lookupId));
    cta.classList.remove('hidden');
  } else {
    cta.classList.add('hidden');
  }

  showOnly('resultBox');
}

/* ---------------- wiring ---------------- */
function boot() {
  var mail = CFG.SUPPORT_EMAIL || '';
  ['nfSupport', 'footSupport'].forEach(function (id) {
    var a = $(id);
    if (a) { a.textContent = mail; a.href = 'mailto:' + mail; }
  });
  $('rTotal').textContent = CFG.TOTAL_MARKS || 50;

  $('lookupForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var v = $('emailInput').value.trim().toLowerCase();
    if (!v) { fieldError('Please enter your email address.'); return; }
    if (v.indexOf('@') < 1 || v.length < 5) {
      fieldError('That does not look like an email address. It should contain an @ sign.');
      return;
    }
    lookup(v);
  });

  $('emailInput').addEventListener('input', function () {
    if ($('lookupErr').classList.contains('show')) fieldError('');
  });

  $('suggestList').addEventListener('click', function (e) {
    var b = e.target.closest('[data-id]');
    if (b) lookupById(b.dataset.id);
  });

  ['tryAgain', 'tryAgain2', 'checkAnother'].forEach(function (id) {
    var b = $(id);
    if (!b) return;
    b.addEventListener('click', function () {
      showOnly(null);
      $('emailInput').value = '';
      fieldError('');
      $('emailInput').focus();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });

  if (!CFG.API_URL || CFG.API_URL.indexOf('http') !== 0) {
    fieldError('The result server is not configured yet. Please contact ' + mail + '.');
    $('lookupBtn').disabled = true;
  }
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();

})();
