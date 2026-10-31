/* =====================================================================
   Final Round certificate page.

   Looks the candidate up in the published Final Round results, refuses
   anyone who did not pass, and then renders their certificate in the
   browser. Nothing is personalised until the backend has confirmed the
   result, which is what stops anyone minting a certificate for a name
   they simply typed in.
   ===================================================================== */
(function () {
'use strict';

var CFG = window.BBO_CONFIG || {};
var L = window.BBO_FINAL_CERT_LAYOUT || {};
var API = CFG.API_URL;
var SUPPORT = CFG.SUPPORT_EMAIL || 'bioinformatics.olympiad@gmail.com';

function $(id) { return document.getElementById(id); }
function show(id) {
  ['suggestBox', 'notFound', 'notEligible', 'certBox'].forEach(function (s) {
    $(s).classList.add('hidden');
  });
  if (id) $(id).classList.remove('hidden');
}
function toast(msg, bad) {
  var t = $('toast');
  t.textContent = msg;
  t.className = 'toast' + (bad ? ' bad' : '');
  setTimeout(function () { t.classList.add('hidden'); }, 4500);
}

/* The certificate page talks to the same endpoint as the result portal,
   but always for the final round. */
function api(payload) {
  payload.exam = 'final';
  return fetch(API, {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    redirect: 'follow'
  }).then(function (r) {
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return r.json();
  });
}

var current = null;   // the verified result being certified

function ordinal(n) {
  return window.BBOFinalCertificate.ordinalSuffix(n);
}

function render(result) {
  current = result;
  var rank = parseInt(result.rank, 10) || 0;
  var tier = window.BBOFinalCertificate.tierOf(rank);

  var badge = $('tierBadge');
  badge.textContent = tier === 'winner' ? 'Winner · Top 5'
                    : tier === 'merit'  ? 'Special Recognition'
                    : 'Participation';
  badge.className = 'tier-badge ' + (tier === 'winner' ? 'tier-winner'
                                   : tier === 'merit'  ? 'tier-merit' : 'tier-part');

  $('cName').textContent = window.BBOFinalCertificate.tidyName(result.name);
  $('cUniversity').textContent = result.university || '';
  $('cRank').textContent = rank ? (rank + ordinal(rank)) : '-';

  var score = (result.performanceScore !== undefined && result.performanceScore !== null)
    ? result.performanceScore : result.marks;
  $('cScore').textContent = Number(score).toFixed(2) + ' / ' + (L.TOTAL_MARKS || 50);
  $('cResult').textContent = String(result.result || '').toUpperCase();
  $('cId').textContent = window.BBOFinalCertificate.certificateId(result);

  $('preview').classList.add('hidden');
  $('dlBtn').disabled = false;
  $('dlBtn').textContent = 'Download my certificate →';
  show('certBox');
  $('certBox').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* A paper that did not reach the pass mark gets an explanation rather than
   a certificate, and is told its own numbers so the decision is not opaque. */
function refuse(result) {
  var score = (result.performanceScore !== undefined && result.performanceScore !== null)
    ? result.performanceScore : result.marks;
  $('neMsg').textContent =
    window.BBOFinalCertificate.tidyName(result.name) + ', your Final Round score was ' +
    Number(score).toFixed(2) + ' out of ' + (L.TOTAL_MARKS || 50) +
    ' (' + result.percent + '%), which is below the 40% pass mark.';
  show('notEligible');
  $('notEligible').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function handle(result) {
  if (String(result.result || '').toUpperCase() === 'PASS') render(result);
  else refuse(result);
}

function lookup(email) {
  $('lookupErr').textContent = '';
  $('lookupBtn').disabled = true;
  $('lookupBtn').textContent = 'Checking…';

  api({ action: 'result', email: email }).then(function (j) {
    if (j.ok && j.found) return handle(j.result);

    if (j.notPublished) {
      $('lookupErr').textContent = 'Final Round results are not published yet. Please check back later.';
      show(null);
      return;
    }
    if (j.suggestions && j.suggestions.length) {
      var ul = $('suggestList');
      ul.innerHTML = '';
      j.suggestions.forEach(function (s) {
        var li = document.createElement('li');
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'btn btn-ghost btn-sm';
        b.textContent = s.masked || s.email;
        b.addEventListener('click', function () {
          api({ action: 'resultById', id: s.id }).then(function (r) {
            if (r.ok && r.found) handle(r.result);
            else toast(r.error || 'That selection is no longer valid.', true);
          }).catch(function () { toast('Could not reach the server. Please try again.', true); });
        });
        li.appendChild(b);
        ul.appendChild(li);
      });
      show('suggestBox');
      return;
    }
    show('notFound');
  }).catch(function () {
    $('lookupErr').textContent = 'Could not reach the server. Please check your connection and try again.';
  }).then(function () {
    $('lookupBtn').disabled = false;
    $('lookupBtn').textContent = 'Find my certificate';
  });
}

/* ---------------- wiring ---------------- */
$('lookupForm').addEventListener('submit', function (e) {
  e.preventDefault();
  var v = $('emailInput').value.trim().toLowerCase();
  if (!v || v.indexOf('@') < 1) {
    $('lookupErr').textContent = 'Please enter the email address you sat the exam with.';
    return;
  }
  lookup(v);
});

['tryAgain', 'tryAgain2', 'tryAgain3', 'checkAnother'].forEach(function (id) {
  var el = $(id);
  if (!el) return;
  el.addEventListener('click', function () {
    show(null);
    $('emailInput').value = '';
    $('emailInput').focus();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
});

$('dlBtn').addEventListener('click', function () {
  if (!current) return;
  var btn = $('dlBtn');
  btn.disabled = true;
  btn.textContent = 'Preparing your certificate…';
  $('dlNote').textContent = 'Please keep this page open.';

  window.BBOFinalCertificate.generate(current).then(function (res) {
    window.BBOFinalCertificate.download(res);
    $('preview').src = res.dataUrl;
    $('preview').classList.remove('hidden');
    btn.textContent = 'Download again';
    btn.disabled = false;
    $('dlNote').textContent = 'Downloaded as ' + res.filename + '. The image above is your certificate.';
    toast('Your certificate has been downloaded.');
  }).catch(function (err) {
    btn.disabled = false;
    btn.textContent = 'Try again';
    $('dlNote').textContent = '';
    toast(err.message || 'The certificate could not be generated.', true);
  });
});

/* support addresses come from the shared config so there is one place to change them */
['nfSupport', 'footSupport'].forEach(function (id) {
  var a = $(id);
  if (!a) return;
  a.textContent = SUPPORT;
  a.href = 'mailto:' + SUPPORT;
});

if (!API) {
  $('lookupErr').textContent = 'The certificate service is not configured. Please contact ' + SUPPORT + '.';
}
})();
