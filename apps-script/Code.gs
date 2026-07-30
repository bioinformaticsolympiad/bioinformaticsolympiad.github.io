/**
 * =====================================================================
 * BBO 3.0 — Online Examination backend (Google Apps Script)
 * ---------------------------------------------------------------------
 * Handles registration, answer autosave, submission, confirmation email
 * and grading for the Biology & Bioinformatics Olympiad 3.0.
 *
 * SETUP — do these in order:
 *   1. Open the Google Sheet that will hold the data.
 *   2. Extensions ▸ Apps Script, delete the sample code, paste this file.
 *   3. Run  setup()  once (it creates every tab and the trigger).
 *   4. Deploy ▸ New deployment ▸ Web app
 *          Execute as:      Me
 *          Who has access:  Anyone
 *      Copy the /exec URL into exam/config.js  →  API_URL.
 *   5. After the exam, run  gradeAll()  to produce the Results tab.
 *
 * The answer key lives HERE and is never sent to the browser.
 * =====================================================================
 */

/* ============================ CONFIG ============================ */

var CONFIG = {
  EXAM_NAME: 'Biology & Bioinformatics Olympiad 3.0',
  // Must match exam/config.js START_ISO / DURATION_MIN
  START_ISO: '2026-07-31T21:00:00+06:00',
  DURATION_MIN: 50,
  GRACE_MIN: 10,            // submissions accepted this long after the deadline
  TOTAL_MARKS: 50,
  PASS_PERCENT: 40,
  NEGATIVE_MARK: 0,         // 0 = no negative marking
  SEND_EMAILS: true,
  EMAIL_SUBJECT: 'Your BBO 3.0 answers have been received',
  REPLY_TO: 'bioinformaticsolympiad@gmail.com',
  ORG_NAME: 'BioPC — Biology & Bioinformatics Olympiad',
  SITE_URL: 'https://olympiad.biopc.org'
};

/* ========================== ANSWER KEY ==========================
   Question number → correct option. Keep this secret.               */
var ANSWER_KEY = {
  1:'B',  2:'C',  3:'B',  4:'B',  5:'B',  6:'B',  7:'B',  8:'A',  9:'C',  10:'C',
  11:'A', 12:'A', 13:'B', 14:'D', 15:'A', 16:'B', 17:'D', 18:'D', 19:'B', 20:'C',
  21:'B', 22:'A', 23:'B', 24:'B', 25:'B', 26:'B', 27:'B', 28:'C', 29:'A', 30:'B',
  31:'B', 32:'B', 33:'C', 34:'B', 35:'A', 36:'C', 37:'C', 38:'C', 39:'A', 40:'A',
  41:'C', 42:'B', 43:'B', 44:'C', 45:'A', 46:'B', 47:'B', 48:'B', 49:'C', 50:'C'
};

var SHEETS = {
  REG: 'Registrations',
  AUTOSAVE: 'Autosave',
  SUB: 'Submissions',
  RESULTS: 'Results',
  LOG: 'ErrorLog'
};

/* ======================= ONE-TIME SETUP ========================= */

function setup() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  ensureSheet(ss, SHEETS.REG, [
    'Timestamp', 'Token', 'CandidateID', 'Name', 'University', 'Email', 'Phone', 'UserAgent'
  ]);
  ensureSheet(ss, SHEETS.AUTOSAVE, [
    'Timestamp', 'Token', 'AnswersJSON', 'Answered', 'TabSwitches', 'CopyAttempts', 'ViaBeacon'
  ]);
  ensureSheet(ss, SHEETS.SUB, [
    'Timestamp', 'SubmissionID', 'Token', 'Name', 'University', 'Email', 'Phone',
    'AnswersJSON', 'Attempted', 'Reason', 'TabSwitches', 'CopyAttempts', 'EmailStatus'
  ]);
  ensureSheet(ss, SHEETS.LOG, ['Timestamp', 'Where', 'Message', 'Payload']);

  // Email queue worker — runs every 5 minutes, respects the daily quota.
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'processEmailQueue') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('processEmailQueue').timeBased().everyMinutes(5).create();

  var key = Object.keys(ANSWER_KEY).length;
  SpreadsheetApp.getUi().alert(
    'Setup complete.\n\n' +
    'Tabs created: Registrations, Autosave, Submissions, ErrorLog\n' +
    'Answer key loaded: ' + key + ' questions\n' +
    'Email queue trigger: every 5 minutes\n\n' +
    'Next: Deploy ▸ New deployment ▸ Web app (Execute as: Me, Access: Anyone), ' +
    'then paste the /exec URL into exam/config.js.'
  );
}

function ensureSheet(ss, name, headers) {
  var sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  if (sh.getLastRow() === 0) {
    sh.appendRow(headers);
    sh.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#0c1f4a').setFontColor('#ffffff');
    sh.setFrozenRows(1);
  }
  return sh;
}

function sheet(name) {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
}

/* ========================= WEB ENDPOINTS ======================== */

function doGet(e) {
  return json({ ok: true, service: CONFIG.EXAM_NAME, now: Date.now(), serverNow: Date.now() });
}

function doPost(e) {
  var data;
  try {
    data = JSON.parse(e.postData.contents);
  } catch (err) {
    return json({ ok: false, error: 'Malformed request' });
  }

  try {
    switch (data.action) {
      case 'time':     return json({ ok: true, now: Date.now(), serverNow: Date.now() });
      case 'register': return handleRegister(data);
      case 'sync':     return handleSync(data);
      case 'submit':   return handleSubmit(data);
      default:         return json({ ok: false, error: 'Unknown action' });
    }
  } catch (err) {
    logError(data.action, err, data);
    return json({ ok: false, error: String(err && err.message || err), serverNow: Date.now() });
  }
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/* ========================== HANDLERS =========================== */

function handleRegister(d) {
  var name = clean(d.name, 80);
  var uni  = clean(d.university, 120);
  var mail = clean(d.email, 120).toLowerCase();
  var ph   = clean(d.phone, 20);

  if (!name || !uni || !mail || !ph) return json({ ok: false, error: 'All fields are required' });
  if (!/^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(mail)) return json({ ok: false, error: 'Invalid email address' });

  var token = clean(d.token, 60) || Utilities.getUuid();
  var candidateId = 'BBO3-' + String(Math.abs(hashCode(mail))).slice(0, 6) +
                    '-' + String(Math.abs(hashCode(token))).slice(0, 4);

  // Append-only: no lock needed, and duplicates are reconciled at grading time.
  sheet(SHEETS.REG).appendRow([
    new Date(), token, candidateId, name, uni, mail, ph, clean(d.userAgent, 300)
  ]);

  return json({
    ok: true, token: token, candidateId: candidateId,
    serverNow: Date.now(), startIso: CONFIG.START_ISO
  });
}

function handleSync(d) {
  var token = clean(d.token, 60);
  if (!token) return json({ ok: false, error: 'Missing token' });

  var answers = normaliseAnswers(d.answers);
  sheet(SHEETS.AUTOSAVE).appendRow([
    new Date(), token, JSON.stringify(answers), Object.keys(answers).length,
    Number(d.tabSwitches) || 0, Number(d.copyAttempts) || 0, d.viaBeacon ? 'yes' : ''
  ]);

  return json({ ok: true, serverNow: Date.now() });
}

function handleSubmit(d) {
  var token = clean(d.token, 60);
  if (!token) return json({ ok: false, error: 'Missing token' });

  // Window check — generous, so a slow connection never loses a paper.
  var endMs = new Date(CONFIG.START_ISO).getTime() + CONFIG.DURATION_MIN * 60000;
  if (Date.now() > endMs + CONFIG.GRACE_MIN * 60000) {
    // Still record it, but flag it for the organisers to review.
    d.reason = (d.reason || '') + '-AFTER-GRACE';
  }

  var answers = normaliseAnswers(d.answers);
  var reg = findRegistration(token);

  // Idempotent: a retry must not create a second submission.
  var existing = findSubmission(token);
  if (existing) {
    return json({
      ok: true, submissionId: existing.submissionId, duplicate: true,
      attempted: existing.attempted, serverNow: Date.now()
    });
  }

  var submissionId = 'BBO3-' + Utilities.formatDate(new Date(), 'Asia/Dhaka', 'ddHHmm') +
                     '-' + String(Math.abs(hashCode(token))).slice(0, 5);

  sheet(SHEETS.SUB).appendRow([
    new Date(), submissionId, token,
    reg.name, reg.university, reg.email, reg.phone,
    JSON.stringify(answers), Object.keys(answers).length,
    clean(d.reason, 40), Number(d.tabSwitches) || 0, Number(d.copyAttempts) || 0,
    CONFIG.SEND_EMAILS && reg.email ? 'PENDING' : 'SKIPPED'
  ]);

  // Also keep the final answers in the autosave log as a belt-and-braces copy.
  sheet(SHEETS.AUTOSAVE).appendRow([
    new Date(), token, JSON.stringify(answers), Object.keys(answers).length,
    Number(d.tabSwitches) || 0, Number(d.copyAttempts) || 0, 'FINAL'
  ]);

  return json({
    ok: true, submissionId: submissionId, attempted: Object.keys(answers).length,
    emailQueued: CONFIG.SEND_EMAILS && !!reg.email, serverNow: Date.now()
  });
}

/* ========================== EMAIL QUEUE ========================= */
/**
 * Sends confirmation emails in the background, a batch at a time, so a burst
 * of 2000 submissions never blocks the web app and never exceeds the daily
 * MailApp quota. Anything left over is picked up on the next run.
 */
function processEmailQueue() {
  if (!CONFIG.SEND_EMAILS) return;

  var sh = sheet(SHEETS.SUB);
  var last = sh.getLastRow();
  if (last < 2) return;

  var COL_STATUS = 13, COL_ID = 2, COL_NAME = 4, COL_EMAIL = 6, COL_ATTEMPTED = 9;
  var values = sh.getRange(2, 1, last - 1, COL_STATUS).getValues();

  var quota = MailApp.getRemainingDailyQuota();
  var budget = Math.min(quota - 5, 80);   // leave a small reserve
  if (budget <= 0) return;

  var sent = 0;
  for (var i = 0; i < values.length && sent < budget; i++) {
    if (String(values[i][COL_STATUS - 1]) !== 'PENDING') continue;
    var email = String(values[i][COL_EMAIL - 1]).trim();
    if (!email) { sh.getRange(i + 2, COL_STATUS).setValue('NO-EMAIL'); continue; }

    try {
      MailApp.sendEmail({
        to: email,
        subject: CONFIG.EMAIL_SUBJECT,
        replyTo: CONFIG.REPLY_TO,
        name: CONFIG.ORG_NAME,
        htmlBody: confirmationHtml(
          String(values[i][COL_NAME - 1]),
          String(values[i][COL_ID - 1]),
          values[i][COL_ATTEMPTED - 1]
        )
      });
      sh.getRange(i + 2, COL_STATUS).setValue('SENT ' + Utilities.formatDate(new Date(), 'Asia/Dhaka', 'dd/MM HH:mm'));
      sent++;
    } catch (err) {
      sh.getRange(i + 2, COL_STATUS).setValue('FAILED: ' + String(err).slice(0, 80));
      logError('email', err, { email: email });
    }
  }
}

function confirmationHtml(name, subId, attempted) {
  return '' +
  '<div style="font-family:Segoe UI,Arial,sans-serif;max-width:560px;margin:0 auto;color:#2c3e35">' +
    '<div style="background:#0c1f4a;color:#fff;padding:24px;border-radius:12px 12px 0 0">' +
      '<h2 style="margin:0;font-size:19px">Biology &amp; Bioinformatics Olympiad 3.0</h2>' +
      '<p style="margin:6px 0 0;opacity:.75;font-size:13px">Submission confirmation</p>' +
    '</div>' +
    '<div style="border:1px solid #c8ddd2;border-top:none;border-radius:0 0 12px 12px;padding:24px">' +
      '<p>Dear ' + escHtml(name) + ',</p>' +
      '<p>We have received your answers for the Biology &amp; Bioinformatics Olympiad 3.0. ' +
         'Your paper is recorded and no further action is needed from you.</p>' +
      '<table style="width:100%;border-collapse:collapse;margin:18px 0;font-size:14px">' +
        '<tr><td style="padding:8px;background:#f4f9f6;border:1px solid #e8f0ec">Submission ID</td>' +
            '<td style="padding:8px;border:1px solid #e8f0ec"><strong>' + escHtml(subId) + '</strong></td></tr>' +
        '<tr><td style="padding:8px;background:#f4f9f6;border:1px solid #e8f0ec">Questions attempted</td>' +
            '<td style="padding:8px;border:1px solid #e8f0ec"><strong>' + attempted + ' of ' + CONFIG.TOTAL_MARKS + '</strong></td></tr>' +
      '</table>' +
      '<p style="background:#fff5e5;border-left:4px solid #f0a500;padding:12px 14px;font-size:14px;border-radius:6px">' +
        '<strong>This email confirms receipt only — it does not contain your score.</strong> ' +
        'Results will be announced later on our official channels.</p>' +
      '<p style="font-size:14px">Thank you for taking part.</p>' +
      '<p style="font-size:14px;margin-bottom:0">— ' + escHtml(CONFIG.ORG_NAME) + '<br>' +
        '<a href="' + CONFIG.SITE_URL + '" style="color:#0d6e3a">' + CONFIG.SITE_URL + '</a></p>' +
    '</div>' +
  '</div>';
}

/* ============================ GRADING ==========================
   Run gradeAll() manually AFTER the exam has closed.
   • Scores every submission against ANSWER_KEY.
   • Recovers candidates who never managed to submit, using their last
     autosave snapshot, and marks them RECOVERED.
   • Keeps the FIRST submission per email address if someone submitted twice.
   ================================================================ */

function gradeAll() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var subs = readRows(SHEETS.SUB);
  var regs = readRows(SHEETS.REG);
  var autos = readRows(SHEETS.AUTOSAVE);

  var byToken = {};
  regs.forEach(function (r) {
    byToken[r.Token] = { name: r.Name, university: r.University, email: r.Email, phone: r.Phone };
  });

  var records = {};   // token -> record

  subs.forEach(function (s) {
    if (records[s.Token]) return;                       // first submission wins
    records[s.Token] = {
      token: s.Token, submissionId: s.SubmissionID, when: s.Timestamp,
      name: s.Name, university: s.University, email: s.Email, phone: s.Phone,
      answers: safeParse(s.AnswersJSON), source: 'SUBMITTED',
      reason: s.Reason, tabSwitches: s.TabSwitches, copyAttempts: s.CopyAttempts
    };
  });

  // Recover anyone with autosaved answers but no submission.
  var latestAuto = {};
  autos.forEach(function (a) {
    if (!a.Token) return;
    var prev = latestAuto[a.Token];
    if (!prev || new Date(a.Timestamp) >= new Date(prev.Timestamp)) latestAuto[a.Token] = a;
  });
  Object.keys(latestAuto).forEach(function (tok) {
    if (records[tok]) return;
    var a = latestAuto[tok];
    var reg = byToken[tok] || {};
    var ans = safeParse(a.AnswersJSON);
    if (!Object.keys(ans).length) return;
    records[tok] = {
      token: tok, submissionId: 'RECOVERED-' + String(Math.abs(hashCode(tok))).slice(0, 5),
      when: a.Timestamp, name: reg.name, university: reg.university,
      email: reg.email, phone: reg.phone, answers: ans, source: 'RECOVERED',
      reason: 'no submit received', tabSwitches: a.TabSwitches, copyAttempts: a.CopyAttempts
    };
  });

  // De-duplicate by email — keep the earliest paper.
  var byEmail = {};
  var rows = [];
  Object.keys(records).map(function (k) { return records[k]; })
    .sort(function (a, b) { return new Date(a.when) - new Date(b.when); })
    .forEach(function (r) {
      var key = String(r.email || '').toLowerCase().trim();
      var dup = key && byEmail[key];
      if (key) byEmail[key] = true;

      var g = score(r.answers);
      rows.push([
        r.when, r.submissionId, r.name, r.university, r.email, r.phone,
        g.attempted, g.correct, g.wrong, g.marks,
        Math.round(g.marks / CONFIG.TOTAL_MARKS * 10000) / 100,
        g.marks >= CONFIG.TOTAL_MARKS * CONFIG.PASS_PERCENT / 100 ? 'PASS' : 'FAIL',
        r.source, dup ? 'DUPLICATE EMAIL' : '', r.reason || '',
        r.tabSwitches || 0, r.copyAttempts || 0
      ]);
    });

  // Rank by marks (descending), then by earlier submission time.
  rows.sort(function (a, b) { return b[9] - a[9] || new Date(a[0]) - new Date(b[0]); });
  rows.forEach(function (r, i) { r.unshift(i + 1); });

  var old = ss.getSheetByName(SHEETS.RESULTS);
  if (old) ss.deleteSheet(old);
  var sh = ss.insertSheet(SHEETS.RESULTS);
  var headers = ['Rank', 'SubmittedAt', 'SubmissionID', 'Name', 'University', 'Email', 'Phone',
    'Attempted', 'Correct', 'Wrong', 'Marks', 'Percent', 'Result', 'Source', 'Flag',
    'Reason', 'TabSwitches', 'CopyAttempts'];
  sh.appendRow(headers);
  sh.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#0c1f4a').setFontColor('#ffffff');
  sh.setFrozenRows(1);
  if (rows.length) sh.getRange(2, 1, rows.length, headers.length).setValues(rows);
  sh.autoResizeColumns(1, headers.length);

  var passed = rows.filter(function (r) { return r[12] === 'PASS'; }).length;
  SpreadsheetApp.getUi().alert(
    'Grading complete.\n\n' +
    'Papers graded: ' + rows.length + '\n' +
    'Passed (' + CONFIG.PASS_PERCENT + '%+): ' + passed + '\n' +
    'Failed: ' + (rows.length - passed) + '\n\n' +
    'See the Results tab. Rows flagged DUPLICATE EMAIL or RECOVERED need a manual look.'
  );
}

function score(answers) {
  var correct = 0, wrong = 0, attempted = 0;
  Object.keys(ANSWER_KEY).forEach(function (n) {
    var given = answers[n] || answers[String(n)];
    if (!given) return;
    attempted++;
    if (String(given).toUpperCase() === ANSWER_KEY[n]) correct++; else wrong++;
  });
  var marks = correct - (wrong * CONFIG.NEGATIVE_MARK);
  return { correct: correct, wrong: wrong, attempted: attempted, marks: Math.max(0, marks) };
}

/* =========================== HELPERS =========================== */

function readRows(name) {
  var sh = sheet(name);
  if (!sh || sh.getLastRow() < 2) return [];
  var values = sh.getDataRange().getValues();
  var headers = values.shift();
  return values.map(function (row) {
    var o = {};
    headers.forEach(function (h, i) { o[h] = row[i]; });
    return o;
  });
}

function findRegistration(token) {
  var rows = readRows(SHEETS.REG);
  for (var i = rows.length - 1; i >= 0; i--) {
    if (rows[i].Token === token) {
      return { name: rows[i].Name, university: rows[i].University, email: rows[i].Email, phone: rows[i].Phone };
    }
  }
  return { name: '', university: '', email: '', phone: '' };
}

function findSubmission(token) {
  var rows = readRows(SHEETS.SUB);
  for (var i = 0; i < rows.length; i++) {
    if (rows[i].Token === token) {
      return { submissionId: rows[i].SubmissionID, attempted: rows[i].Attempted };
    }
  }
  return null;
}

function normaliseAnswers(raw) {
  var out = {};
  if (!raw || typeof raw !== 'object') return out;
  Object.keys(raw).forEach(function (k) {
    var n = parseInt(k, 10);
    var v = String(raw[k] || '').toUpperCase();
    if (n >= 1 && n <= 50 && ['A', 'B', 'C', 'D'].indexOf(v) > -1) out[n] = v;
  });
  return out;
}

function clean(v, max) {
  return String(v == null ? '' : v).replace(/[\r\n\t]+/g, ' ').trim().slice(0, max || 200);
}
function escHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function safeParse(s) {
  try { return JSON.parse(s) || {}; } catch (e) { return {}; }
}
function hashCode(s) {
  var h = 0;
  s = String(s);
  for (var i = 0; i < s.length; i++) { h = ((h << 5) - h) + s.charCodeAt(i); h |= 0; }
  return h;
}
function logError(where, err, payload) {
  try {
    sheet(SHEETS.LOG).appendRow([
      new Date(), where || '', String(err && err.stack || err).slice(0, 500),
      JSON.stringify(payload || {}).slice(0, 500)
    ]);
  } catch (e) { /* logging must never throw */ }
}

/* ===================== ADMIN CONVENIENCE ======================= */

function onOpen() {
  SpreadsheetApp.getUi().createMenu('BBO 3.0 Exam')
    .addItem('Run setup', 'setup')
    .addItem('Grade all papers', 'gradeAll')
    .addItem('Send pending emails now', 'processEmailQueue')
    .addItem('Show live stats', 'showStats')
    .addToUi();
}

function showStats() {
  var regs = sheet(SHEETS.REG).getLastRow() - 1;
  var subs = sheet(SHEETS.SUB).getLastRow() - 1;
  var autos = sheet(SHEETS.AUTOSAVE).getLastRow() - 1;
  var pending = readRows(SHEETS.SUB).filter(function (r) { return r.EmailStatus === 'PENDING'; }).length;
  SpreadsheetApp.getUi().alert(
    'Live exam statistics\n\n' +
    'Registered:            ' + Math.max(0, regs) + '\n' +
    'Submitted:             ' + Math.max(0, subs) + '\n' +
    'Autosave snapshots:    ' + Math.max(0, autos) + '\n' +
    'Emails still pending:  ' + pending + '\n' +
    'Email quota left today: ' + MailApp.getRemainingDailyQuota()
  );
}
