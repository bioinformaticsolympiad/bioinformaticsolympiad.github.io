/**
 * =====================================================================
 * BBO 3.0 - Online Examination backend (Google Apps Script)
 * ---------------------------------------------------------------------
 * Handles registration, answer autosave, submission, confirmation email
 * and grading for the Biology & Bioinformatics Olympiad 3.0.
 *
 * SETUP, do these in order:
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

  /* Bump this whenever you paste in a new Code.gs. Opening the /exec URL in a
     browser shows it, so you can tell at a glance whether the deployment is
     actually serving the code you just pasted, a redeploy that silently kept
     an older version is otherwise very hard to spot.                          */
  CODE_VERSION: 'v6-final-round',
  // Must match exam/config.js START_ISO / DURATION_MIN
  START_ISO: '2026-07-31T21:00:00+06:00',
  DURATION_MIN: 40,
  GRACE_MIN: 10,            // submissions accepted this long after the deadline
  TOTAL_MARKS: 50,
  PASS_PERCENT: 40,
  NEGATIVE_MARK: 0,         // 0 = no negative marking
  SEND_EMAILS: false,       // no confirmation emails; results go on Facebook

  /* ---- Final round (online), olympiad.biopc.org/final/ ----
     Must match final/config.js START_ISO and DURATION_MIN.
     FINAL_REQUIRE_ROUND1_PASS limits the exam to candidates who passed Round 1,
     checked against the Results sheet. Registering for the (now cancelled)
     offline Round 2 is not required. Set it to false to drop the check.     */
  FINAL_START_ISO: '2026-10-24T21:00:00+06:00',
  FINAL_DURATION_MIN: 30,
  FINAL_REQUIRE_ROUND1_PASS: true,

  /* ---- Result lookup (olympiad.biopc.org/result/) ----
     Set RESULTS_PUBLISHED to false to take the result checker offline without
     touching the website. LOOKUP_SALT keeps the suggestion ids opaque; change
     it to invalidate every previously issued id.                             */
  RESULTS_PUBLISHED: true,
  LOOKUP_SALT: 'bbo3-round1-2026',
  MAX_SUGGESTIONS: 5,

  /* ---- Round 2 registration ----
     Only candidates whose Round 1 result is PASS can register, and only while
     seats remain and the deadline has not passed. Set ROUND2_OPEN to false to
     close registration by hand at any time.                                   */
  ROUND2_OPEN: false,   // closed: the final round moved online and fees were refunded
  ROUND2_CAPACITY: 350,
  ROUND2_DEADLINE_ISO: '2026-09-25T23:59:59+06:00',
  ROUND2_FEE_EXAM: 500,
  ROUND2_FEE_FULL: 600,
  ROUND2_DRIVE_FOLDER: 'BBO 3.0 Round 2 payment screenshots',
  ROUND2_WHATSAPP: 'https://chat.whatsapp.com/H2DNQoGnegb0dnHhnI9v1l?s=cl&p=a&mlu=4',
  ROUND2_MAX_UPLOAD_KB: 3000,
  EMAIL_SUBJECT: 'Your BBO 3.0 answers have been received',
  REPLY_TO: 'bioinformatics.olympiad@gmail.com',
  ORG_NAME: 'BioPC - Biology & Bioinformatics Olympiad',
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

var ROUND2_HEADERS = [
  'Timestamp', 'RegID', 'Seat', 'Name', 'University', 'Department', 'Email', 'Phone',
  'Round1Percent', 'Round1Rank', 'AttendingCU', 'Package', 'Fee',
  'PosterPresentation', 'PosterType', 'PhotographyContest', 'InstantSpeech',
  'TransactionID', 'PaymentScreenshot', 'LookupID'
];

var SHEETS = {
  REG: 'Registrations',
  AUTOSAVE: 'Autosave',
  SUB: 'Submissions',
  RESULTS: 'Results',
  ROUND2: 'Round2',
  LOG: 'ErrorLog'
};

/* The final round keeps its own sheets so nothing can mix with Round 1. */
var FINAL_SHEETS = {
  REG: 'FinalRegistrations',
  AUTOSAVE: 'FinalAutosave',
  SUB: 'FinalSubmissions',
  RESULTS: 'FinalResults'
};

var REG_HEADERS = ['Timestamp', 'Token', 'CandidateID', 'Name', 'University', 'Email', 'Phone', 'UserAgent'];
var AUTOSAVE_HEADERS = ['Timestamp', 'Token', 'AnswersJSON', 'Answered', 'TabSwitches', 'CopyAttempts',
  'ScreenshotAttempts', 'ViaBeacon', 'Telemetry'];
var SUB_HEADERS = ['Timestamp', 'SubmissionID', 'Token', 'Name', 'University', 'Email', 'Phone',
  'AnswersJSON', 'Attempted', 'Reason', 'TabSwitches', 'CopyAttempts',
  'ScreenshotAttempts', 'EmailStatus', 'Telemetry'];

var ANSWER_KEY_FINAL = {
  1:'A', 2:'A', 3:'C', 4:'C', 5:'C', 6:'A', 7:'B', 8:'D', 9:'C', 10:'B',
  11:'C', 12:'B', 13:'A', 14:'C', 15:'B', 16:'D', 17:'D', 18:'A', 19:'B', 20:'B',
  21:'A', 22:'D', 23:'A', 24:'D', 25:'C', 26:'D', 27:'C', 28:'C', 29:'C', 30:'C',
  31:'D', 32:'D', 33:'A', 34:'B', 35:'B', 36:'B', 37:'D', 38:'A', 39:'A', 40:'C',
  41:'D', 42:'B', 43:'B', 44:'D', 45:'B', 46:'A', 47:'B', 48:'A', 49:'A', 50:'D'
};

/* Which exam a request belongs to. Anything other than 'final' is Round 1,
   so older clients that send no exam field keep working unchanged. */
function examOf(d) { return clean(d && d.exam, 20) === 'final' ? 'final' : 'round1'; }
function sheetsFor(exam) { return exam === 'final' ? FINAL_SHEETS : SHEETS; }
function keyFor(exam) { return exam === 'final' ? ANSWER_KEY_FINAL : ANSWER_KEY; }
function windowFor(exam) {
  return exam === 'final'
    ? { start: CONFIG.FINAL_START_ISO, dur: CONFIG.FINAL_DURATION_MIN }
    : { start: CONFIG.START_ISO, dur: CONFIG.DURATION_MIN };
}
/* Sheets create themselves on first use, so a failed setup() can never stop an
   exam from recording papers. */
function examSheet(name, headers) {
  return sheet(name) || ensureSheet(SpreadsheetApp.getActiveSpreadsheet(), name, headers);
}

/* ======================= ONE-TIME SETUP ========================= */

function setup() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  ensureSheet(ss, SHEETS.REG, REG_HEADERS);
  ensureSheet(ss, SHEETS.AUTOSAVE, AUTOSAVE_HEADERS);
  ensureSheet(ss, SHEETS.SUB, SUB_HEADERS);
  ensureSheet(ss, SHEETS.ROUND2, ROUND2_HEADERS);
  ensureSheet(ss, SHEETS.LOG, ['Timestamp', 'Where', 'Message', 'Payload']);

  // Email queue worker, runs every 5 minutes, respects the daily quota.
  /* Only create the email worker when emails are on. Creating time-based
     triggers is the step most likely to fail with Google's generic
     "unknown error", and with SEND_EMAILS false the trigger does nothing. */
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'processEmailQueue') ScriptApp.deleteTrigger(t);
  });
  if (CONFIG.SEND_EMAILS) {
    ScriptApp.newTrigger('processEmailQueue').timeBased().everyMinutes(5).create();
  }

  var key = Object.keys(ANSWER_KEY).length;
  return notify(
    'Setup complete. Tabs ready: Registrations, Autosave, Submissions, ErrorLog. ' +
    'Answer key loaded: ' + key + ' questions. ' +
    'Next: Deploy > Manage deployments > edit > Version: New version > Deploy.'
  );
}

function ensureSheet(ss, name, headers) {
  var sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  if (sh.getLastRow() === 0) {
    sh.appendRow(headers);
  } else {
    /* Sheet already exists from an earlier setup, rewrite the header row so a
       newly added column (e.g. ScreenshotAttempts) appears without losing data.
       Existing rows keep their values; the new column is simply blank for them. */
    var width = Math.max(headers.length, sh.getLastColumn());
    var current = sh.getRange(1, 1, 1, width).getValues()[0];
    var changed = headers.some(function (h, i) { return current[i] !== h; });
    if (changed) sh.getRange(1, 1, 1, headers.length).setValues([headers]);
  }
  sh.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#0c1f4a').setFontColor('#ffffff');
  sh.setFrozenRows(1);
  return sh;
}

function sheet(name) {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
}

/**
 * Report a result without ever blocking.
 *
 * getUi().alert() opens a modal in the SPREADSHEET tab and waits for someone to
 * click OK. Run a function from the Apps Script editor and that dialog appears
 * in a tab you are not looking at, so the script sits there until it is killed
 * at the six-minute limit, which looks exactly like the code hanging.
 * toast() shows in the sheet and returns immediately; Logger.log() puts the
 * same text in the editor's execution log.
 */
function notify(message) {
  Logger.log(message);
  try {
    SpreadsheetApp.getActiveSpreadsheet().toast(message.slice(0, 240), 'BBO 3.0 Exam', 12);
  } catch (e) { /* no spreadsheet context, the log is enough */ }
  return message;
}

/* ========================= WEB ENDPOINTS ======================== */

function doGet(e) {
  return json({
    ok: true, service: CONFIG.EXAM_NAME, version: CONFIG.CODE_VERSION,
    resultsPublished: !!CONFIG.RESULTS_PUBLISHED,
    actions: ['time', 'register', 'sync', 'submit', 'result', 'resultById'],
    now: Date.now(), serverNow: Date.now()
  });
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
      case 'result':   return handleResultLookup(data);
      case 'resultById': return handleResultById(data);
      case 'round2Info':     return handleRound2Info();
      case 'round2Prefill':  return handleRound2Prefill(data);
      case 'round2Register': return handleRound2Register(data);
      default:         return json({ ok: false, error: 'Unknown action', version: CONFIG.CODE_VERSION });
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
  var exam = examOf(d);
  var SH = sheetsFor(exam);
  var name = clean(d.name, 80);
  var uni  = clean(d.university, 120);
  var mail = clean(d.email, 120).toLowerCase();
  var ph   = clean(d.phone, 20);

  if (!name || !uni || !mail || !ph) return json({ ok: false, error: 'All fields are required' });
  if (!/^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(mail)) return json({ ok: false, error: 'Invalid email address' });

  /* The final round is open to everyone who passed Round 1, whether or not
     they registered for the cancelled offline day. */
  if (exam === 'final' && CONFIG.FINAL_REQUIRE_ROUND1_PASS) {
    var qualified = readRows(SHEETS.RESULTS).some(function (r) {
      return String(r.Email).trim().toLowerCase() === mail &&
             String(r.Result).toUpperCase() === 'PASS';
    });
    if (!qualified) {
      return json({ ok: false, notEnrolled: true,
        error: 'We could not find a qualifying Round 1 result for this email. Please use the address you sat Round 1 with, or check your result first.' });
    }
  }

  var token = clean(d.token, 60) || Utilities.getUuid();
  var candidateId = 'BBO3-' + String(Math.abs(hashCode(mail))).slice(0, 6) +
                    '-' + String(Math.abs(hashCode(token))).slice(0, 4);

  // Append-only: no lock needed, and duplicates are reconciled at grading time.
  examSheet(SH.REG, REG_HEADERS).appendRow([
    new Date(), token, candidateId, name, uni, mail, ph, clean(d.userAgent, 300)
  ]);

  return json({
    ok: true, token: token, candidateId: candidateId,
    serverNow: Date.now(), startIso: windowFor(exam).start
  });
}

function handleSync(d) {
  var SH = sheetsFor(examOf(d));
  var token = clean(d.token, 60);
  if (!token) return json({ ok: false, error: 'Missing token' });

  var answers = normaliseAnswers(d.answers);
  examSheet(SH.AUTOSAVE, AUTOSAVE_HEADERS).appendRow([
    new Date(), token, JSON.stringify(answers), Object.keys(answers).length,
    Number(d.tabSwitches) || 0, Number(d.copyAttempts) || 0,
    Number(d.screenshotAttempts) || 0, d.viaBeacon ? 'yes' : '', packTelemetry(d)
  ]);

  return json({ ok: true, serverNow: Date.now() });
}

function handleSubmit(d) {
  var exam = examOf(d);
  var SH = sheetsFor(exam);
  var token = clean(d.token, 60);
  if (!token) return json({ ok: false, error: 'Missing token' });

  // Window check, generous, so a slow connection never loses a paper.
  var win = windowFor(exam);
  var endMs = new Date(win.start).getTime() + win.dur * 60000;
  if (Date.now() > endMs + CONFIG.GRACE_MIN * 60000) {
    // Still record it, but flag it for the organisers to review.
    d.reason = (d.reason || '') + '-AFTER-GRACE';
  }

  var answers = normaliseAnswers(d.answers);

  /* Identity comes from the client so we do NOT have to scan the Registrations
     sheet on every submission. With 2000 candidates that scan grows without
     bound and is the main thing that would slow the end-of-exam spike.
     Older clients did not send it, so fall back to the sheet lookup. */
  var reg = {
    name: clean(d.name, 80), university: clean(d.university, 120),
    email: clean(d.email, 120).toLowerCase(), phone: clean(d.phone, 20)
  };
  if (!reg.email) reg = findRegistration(token, SH.REG);

  /* Idempotency via the script cache, a constant-time lookup instead of
     scanning the Submissions sheet. If the cache has been evicted we may write
     a duplicate row; gradeAll() keeps the first paper per token, so a duplicate
     never affects the result. */
  var cache = CacheService.getScriptCache();
  var cacheKey = 'sub_' + exam + '_' + token;
  var cached = cache.get(cacheKey);
  if (cached) {
    return json({
      ok: true, submissionId: cached, duplicate: true,
      attempted: Object.keys(answers).length, serverNow: Date.now()
    });
  }

  var submissionId = 'BBO3-' + Utilities.formatDate(new Date(), 'Asia/Dhaka', 'ddHHmm') +
                     '-' + String(Math.abs(hashCode(token))).slice(0, 5);

  examSheet(SH.SUB, SUB_HEADERS).appendRow([
    new Date(), submissionId, token,
    reg.name, reg.university, reg.email, reg.phone,
    JSON.stringify(answers), Object.keys(answers).length,
    clean(d.reason, 40), Number(d.tabSwitches) || 0, Number(d.copyAttempts) || 0,
    Number(d.screenshotAttempts) || 0,
    CONFIG.SEND_EMAILS && reg.email ? 'PENDING' : 'SKIPPED',
    packTelemetry(d)
  ]);

  // Also keep the final answers in the autosave log as a belt-and-braces copy.
  sheet(SHEETS.AUTOSAVE).appendRow([
    new Date(), token, JSON.stringify(answers), Object.keys(answers).length,
    Number(d.tabSwitches) || 0, Number(d.copyAttempts) || 0,
    Number(d.screenshotAttempts) || 0, 'FINAL'
  ]);

  cache.put(cacheKey, submissionId, 21600);   // 6 h, the maximum

  return json({
    ok: true, submissionId: submissionId, attempted: Object.keys(answers).length,
    emailQueued: CONFIG.SEND_EMAILS && !!reg.email, serverNow: Date.now()
  });
}

/* ======================= RESULT LOOKUP =========================
   Powers olympiad.biopc.org/result/.

   The participant list never leaves this script. The page sends a typed email
   and gets back exactly one person's result, or, when the address is close but
   not exact, a short list of MASKED suggestions plus an opaque id. Selecting a
   suggestion returns the result via that id, so no email address is ever
   disclosed to someone who did not already know it.
   ================================================================ */

function resultRows() {
  var rows = readRows(SHEETS.RESULTS);
  return rows.filter(function (r) { return r.Email; });
}

/* Stable, non-reversible handle for one row. */
function lookupId(email) {
  var raw = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256, CONFIG.LOOKUP_SALT + '|' + email, Utilities.Charset.UTF_8);
  var hex = raw.map(function (b) { return ('0' + (b & 0xFF).toString(16)).slice(-2); }).join('');
  return hex.slice(0, 20);
}

/* ma••••ha@gmail.com, enough to recognise your own address, not enough to harvest. */
function maskEmail(email) {
  var at = String(email).indexOf('@');
  if (at < 1) return '•••';
  var local = email.slice(0, at), domain = email.slice(at);
  if (local.length <= 3) return local.charAt(0) + '••' + domain;
  var keep = local.length <= 6 ? 1 : 2;
  return local.slice(0, keep) + new Array(Math.max(3, local.length - keep * 2) + 1).join('•') +
         local.slice(-keep) + domain;
}

function levenshtein(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  if (Math.abs(a.length - b.length) > 4) return 99;   // cheap early exit
  var prev = [], cur = [], i, j;
  for (j = 0; j <= b.length; j++) prev[j] = j;
  for (i = 1; i <= a.length; i++) {
    cur[0] = i;
    for (j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a.charAt(i - 1) === b.charAt(j - 1) ? 0 : 1));
    }
    for (j = 0; j <= b.length; j++) prev[j] = cur[j];
  }
  return prev[b.length];
}

function packResult(r) {
  var n = function (v) { var x = parseFloat(v); return isNaN(x) ? 0 : x; };
  return {
    rank: n(r.Rank),
    name: String(r.Name || ''),
    university: String(r.University || ''),
    email: String(r.Email || ''),
    attempted: n(r.Attempted),
    correct: n(r.CorrectAnswers !== undefined ? r.CorrectAnswers : r.Correct),
    wrong: n(r.WrongAnswers !== undefined ? r.WrongAnswers : r.Wrong),
    notAnswered: n(r.NotAnswered),
    marks: n(r.Marks),
    percent: n(r.Percent),
    result: String(r.Result || ''),
    /* Handed to the result page so a qualified candidate can be sent straight
       into Round 2 registration without retyping anything, and so the backend
       can verify on arrival that they really did pass. */
    lookupId: lookupId(String(r.Email || '').trim().toLowerCase()),
    tabSwitches: n(r.TabSwitches),
    copyAttempts: n(r.CopyAttempts),
    screenshotAttempts: n(r.ScreenshotAttempts),
    totalMarks: CONFIG.TOTAL_MARKS,
    passPercent: CONFIG.PASS_PERCENT
  };
}

function handleResultLookup(d) {
  if (!CONFIG.RESULTS_PUBLISHED) {
    return json({ ok: false, error: 'Results are not published yet.', notPublished: true });
  }
  var typed = clean(d.email, 120).toLowerCase().replace(/\s+/g, '');
  if (!typed || typed.indexOf('@') < 1) {
    return json({ ok: false, error: 'Please enter the email address you registered with.' });
  }

  var rows = resultRows();
  var i, email;

  // 1. exact match
  for (i = 0; i < rows.length; i++) {
    if (String(rows[i].Email).trim().toLowerCase() === typed) {
      return json({ ok: true, found: true, result: packResult(rows[i]), total: rows.length });
    }
  }

  // 2. near matches
  var typedLocal = typed.split('@')[0], typedDomain = typed.split('@')[1] || '';
  var scored = [];
  for (i = 0; i < rows.length; i++) {
    email = String(rows[i].Email).trim().toLowerCase();
    var local = email.split('@')[0], domain = email.split('@')[1] || '';
    var dFull = levenshtein(typed, email);
    var dLocal = levenshtein(typedLocal, local);
    var score = null;
    if (dFull <= 3) score = dFull;                                   // whole-address typo
    else if (local === typedLocal) score = 1;                        // right name, wrong domain
    else if (dLocal <= 2 && domain === typedDomain) score = dLocal + 1;
    else if (dLocal <= 1) score = dLocal + 2;
    if (score !== null) scored.push({ s: score, email: email, row: rows[i] });
  }
  scored.sort(function (a, b) { return a.s - b.s || a.email.length - b.email.length; });

  var out = [];
  for (i = 0; i < scored.length && out.length < CONFIG.MAX_SUGGESTIONS; i++) {
    out.push({
      id: lookupId(scored[i].email),
      masked: maskEmail(scored[i].email),
      name: maskName(String(scored[i].row.Name || ''))
    });
  }

  return json({ ok: true, found: false, suggestions: out, total: rows.length });
}

/* First name plus an initial, helps someone spot their own row without
   publishing full names against addresses. */
function maskName(name) {
  var parts = String(name).trim().split(/\s+/);
  if (!parts[0]) return '';
  if (parts.length === 1) return parts[0];
  return parts[0] + ' ' + parts[parts.length - 1].charAt(0).toUpperCase() + '.';
}

function handleResultById(d) {
  if (!CONFIG.RESULTS_PUBLISHED) {
    return json({ ok: false, error: 'Results are not published yet.', notPublished: true });
  }
  var id = clean(d.id, 40);
  if (!id) return json({ ok: false, error: 'Missing selection' });
  var rows = resultRows();
  for (var i = 0; i < rows.length; i++) {
    if (lookupId(String(rows[i].Email).trim().toLowerCase()) === id) {
      return json({ ok: true, found: true, result: packResult(rows[i]), total: rows.length });
    }
  }
  return json({ ok: false, error: 'That selection is no longer valid. Please search again.' });
}

/* ==================== ROUND 2 REGISTRATION =====================
   Seats are limited and first-come-first-served, so the source of truth for
   "is there room" is the Round2 sheet itself, counted at the moment of writing.
   ================================================================ */

function round2Deadline() { return new Date(CONFIG.ROUND2_DEADLINE_ISO).getTime(); }

function round2Taken() {
  var sh = sheet(SHEETS.ROUND2);
  if (!sh) return 0;
  return Math.max(0, sh.getLastRow() - 1);
}

function round2State() {
  var taken = round2Taken();
  var remaining = Math.max(0, CONFIG.ROUND2_CAPACITY - taken);
  var expired = Date.now() > round2Deadline();
  return {
    open: !!CONFIG.ROUND2_OPEN && !expired && remaining > 0,
    manuallyClosed: !CONFIG.ROUND2_OPEN,
    expired: expired,
    full: remaining <= 0,
    taken: taken,
    remaining: remaining,
    capacity: CONFIG.ROUND2_CAPACITY,
    deadline: CONFIG.ROUND2_DEADLINE_ISO,
    feeExam: CONFIG.ROUND2_FEE_EXAM,
    feeFull: CONFIG.ROUND2_FEE_FULL
  };
}

function handleRound2Info() {
  var s = round2State();
  s.ok = true;
  s.serverNow = Date.now();
  return json(s);
}

/* Find the Round 1 row behind a lookup id, so the form can only be opened by
   someone who actually passed. */
function resultByLookupId(id) {
  var rows = resultRows();
  for (var i = 0; i < rows.length; i++) {
    if (lookupId(String(rows[i].Email).trim().toLowerCase()) === id) return rows[i];
  }
  return null;
}

function existingRound2(id) {
  var rows = readRows(SHEETS.ROUND2);
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i].LookupID) === id) return rows[i];
  }
  return null;
}

function handleRound2Prefill(d) {
  var id = clean(d.id, 40);
  if (!id) return json({ ok: false, error: 'Missing identifier' });

  var row = resultByLookupId(id);
  if (!row) {
    return json({ ok: false, error: 'We could not verify your Round 1 result. Please check your result again and use the button on that page.' });
  }
  if (String(row.Result).toUpperCase() !== 'PASS') {
    return json({ ok: false, error: 'Round 2 registration is open to qualified candidates only.', notQualified: true });
  }

  var already = existingRound2(id);
  var state = round2State();
  return json({
    ok: true,
    state: state,
    /* Package and fee must come back too, or a returning participant is shown
       whatever the page happens to default to rather than what they paid. */
    alreadyRegistered: already ? {
      regId: already.RegID, seat: already.Seat, whatsapp: CONFIG.ROUND2_WHATSAPP,
      packageLabel: String(already.Package || ''), fee: parseFloat(already.Fee) || 0
    } : null,
    candidate: {
      name: String(row.Name || ''),
      university: String(row.University || ''),
      email: String(row.Email || ''),
      phone: String(row.Phone || ''),
      percent: parseFloat(row.Percent) || 0,
      rank: parseFloat(row.Rank) || 0,
      marks: parseFloat(row.Marks) || 0
    },
    serverNow: Date.now()
  });
}

/* The Round2 tab is created on first use, so registration works even if
   setup() has never run successfully. */
function round2Sheet() {
  return sheet(SHEETS.ROUND2) ||
    ensureSheet(SpreadsheetApp.getActiveSpreadsheet(), SHEETS.ROUND2, ROUND2_HEADERS);
}

function round2Folder() {
  var it = DriveApp.getFoldersByName(CONFIG.ROUND2_DRIVE_FOLDER);
  return it.hasNext() ? it.next() : DriveApp.createFolder(CONFIG.ROUND2_DRIVE_FOLDER);
}

function handleRound2Register(d) {
  var id = clean(d.id, 40);
  if (!id) return json({ ok: false, error: 'Missing identifier' });

  var row = resultByLookupId(id);
  if (!row) return json({ ok: false, error: 'We could not verify your Round 1 result.' });
  if (String(row.Result).toUpperCase() !== 'PASS') {
    return json({ ok: false, error: 'Round 2 registration is open to qualified candidates only.', notQualified: true });
  }

  /* Already in? Return the same seat rather than taking a second one. */
  var already = existingRound2(id);
  if (already) {
    return json({
      ok: true, duplicate: true, regId: already.RegID, seat: already.Seat,
      packageLabel: String(already.Package || ''), fee: parseFloat(already.Fee) || 0,
      whatsapp: CONFIG.ROUND2_WHATSAPP, serverNow: Date.now()
    });
  }

  var state = round2State();
  if (!state.open) {
    return json({
      ok: false, closed: true, state: state,
      error: state.expired ? 'Registration closed on ' + Utilities.formatDate(new Date(round2Deadline()), 'Asia/Dhaka', 'd MMMM yyyy') + '.'
           : state.full ? 'All ' + CONFIG.ROUND2_CAPACITY + ' seats have been taken.'
           : 'Registration is currently closed.'
    });
  }

  /* ---- validate ---- */
  var name = clean(d.name, 90), uni = clean(d.university, 140), dept = clean(d.department, 120);
  var phone = clean(d.phone, 20), txn = clean(d.transactionId, 40);
  var attending = clean(d.attendingCU, 10);
  var pkg = clean(d.package, 10) === 'full' ? 'full' : 'exam';

  if (!name || !uni || !dept || !phone) return json({ ok: false, error: 'Please fill in every required field.' });
  if (attending !== 'yes') return json({ ok: false, error: 'Round 2 is held in person at the University of Chittagong. Seats are limited, so please register only if you can attend.' });
  if (!txn) return json({ ok: false, error: 'Please enter the bKash transaction ID.' });

  var poster = !!d.poster && pkg === 'full';
  var photo  = !!d.photography && pkg === 'full';
  var speech = !!d.speech && pkg === 'full';
  var posterType = poster ? clean(d.posterType, 30) : '';
  if (poster && !posterType) return json({ ok: false, error: 'Please choose whether your poster is research-based or idea-based.' });
  if (pkg === 'full' && !poster && !photo && !speech) {
    return json({ ok: false, error: 'Please select at least one additional segment, or choose the exam-only package.' });
  }
  var fee = pkg === 'full' ? CONFIG.ROUND2_FEE_FULL : CONFIG.ROUND2_FEE_EXAM;

  /* ---- payment screenshot -> Drive ---- */
  var fileUrl = '';
  if (d.screenshotData) {
    try {
      var approxKb = Math.round(String(d.screenshotData).length * 0.75 / 1024);
      if (approxKb > CONFIG.ROUND2_MAX_UPLOAD_KB) {
        return json({ ok: false, error: 'That image is too large (' + approxKb + ' KB). Please upload a smaller screenshot.' });
      }
      var mime = clean(d.screenshotType, 40) || 'image/jpeg';
      var ext = mime.indexOf('png') > -1 ? 'png' : 'jpg';
      var safe = name.replace(/[^A-Za-z0-9 ]/g, '').replace(/\s+/g, '_').slice(0, 40);
      var blob = Utilities.newBlob(Utilities.base64Decode(d.screenshotData), mime,
        (round2Taken() + 1) + '_' + safe + '_' + txn + '.' + ext);
      var file = round2Folder().createFile(blob);
      fileUrl = file.getUrl();
    } catch (err) {
      logError('round2-upload', err, { name: name, txn: txn });
      return json({ ok: false, error: 'We could not save your payment screenshot. Please try again, or use a smaller image.' });
    }
  } else {
    return json({ ok: false, error: 'Please attach a screenshot of your bKash payment.' });
  }

  /* ---- take the seat ---- */
  var seat = round2Taken() + 1;
  var regId = 'BBO3R2-' + ('000' + seat).slice(-3) + '-' + String(Math.abs(hashCode(id))).slice(0, 4);

  round2Sheet().appendRow([
    new Date(), regId, seat, name, uni, dept,
    String(row.Email || ''), phone,
    parseFloat(row.Percent) || 0, parseFloat(row.Rank) || 0,
    'Yes', pkg === 'full' ? 'Exam + segments' : 'Exam only', fee,
    poster ? 'Yes' : '', posterType, photo ? 'Yes' : '', speech ? 'Yes' : '',
    txn, fileUrl, id
  ]);

  var after = round2State();
  return json({
    ok: true, regId: regId, seat: seat, fee: fee,
    whatsapp: CONFIG.ROUND2_WHATSAPP,
    remaining: after.remaining, capacity: after.capacity,
    serverNow: Date.now()
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

  var COL_STATUS = 14, COL_ID = 2, COL_NAME = 4, COL_EMAIL = 6, COL_ATTEMPTED = 9;
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
        '<strong>This email confirms receipt only, it does not contain your score.</strong> ' +
        'Results will be announced later on our official channels.</p>' +
      '<p style="font-size:14px">Thank you for taking part.</p>' +
      '<p style="font-size:14px;margin-bottom:0"> - ' + escHtml(CONFIG.ORG_NAME) + '<br>' +
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

function gradeAll(exam) {
  exam = exam === 'final' ? 'final' : 'round1';
  var SH = sheetsFor(exam);
  var KEY = keyFor(exam);
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var subs = readRows(SH.SUB);
  var regs = readRows(SH.REG);
  var autos = readRows(SH.AUTOSAVE);

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
      reason: s.Reason, tabSwitches: s.TabSwitches, copyAttempts: s.CopyAttempts,
      screenshotAttempts: s.ScreenshotAttempts
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
      reason: 'no submit received', tabSwitches: a.TabSwitches, copyAttempts: a.CopyAttempts,
      screenshotAttempts: a.ScreenshotAttempts
    };
  });

  /* One paper per candidate. A candidate who opens the exam on two devices
     registers twice and can end up with two papers; the earliest sitting is
     the one that counts. Later papers are not discarded, they are written to
     a review sheet so the decision can be checked afterwards. */
  var ordered = Object.keys(records).map(function (k) { return records[k]; })
    .sort(function (a, b) { return new Date(a.when) - new Date(b.when); });

  var winnerByEmail = {}, keep = [], superseded = [];
  ordered.forEach(function (r) {
    var key = String(r.email || '').toLowerCase().trim();
    if (!key) { keep.push(r); return; }          // no email, nothing to pair it with
    if (winnerByEmail[key]) { superseded.push({ loser: r, winner: winnerByEmail[key] }); return; }
    winnerByEmail[key] = r;
    keep.push(r);
  });

  /* Count what was set aside, and single out the one case worth a human look:
     the paper we kept was only recovered from autosave, an abandoned attempt,
     while the paper we set aside was actually submitted. */
  var setAside = {}, needsLook = {};
  superseded.forEach(function (p) {
    var key = String(p.winner.email).toLowerCase().trim();
    setAside[key] = (setAside[key] || 0) + 1;
    if (p.winner.source === 'RECOVERED' && p.loser.source === 'SUBMITTED') needsLook[key] = true;
  });

  var rows = keep.map(function (r) {
    var key = String(r.email || '').toLowerCase().trim();
    var g = score(r.answers, KEY);
    var flag = '';
    if (setAside[key]) {
      flag = 'EARLIEST OF ' + (setAside[key] + 1) + ' PAPERS';
      if (needsLook[key]) flag += ' - CHECK, KEPT PAPER WAS ONLY RECOVERED';
    }
    return [
      r.when, r.submissionId, r.name, r.university, r.email, r.phone,
      g.attempted, g.correct, g.wrong, g.blank, g.marks,
      Math.round(g.marks / CONFIG.TOTAL_MARKS * 10000) / 100,
      g.marks >= CONFIG.TOTAL_MARKS * CONFIG.PASS_PERCENT / 100 ? 'PASS' : 'FAIL',
      r.source, flag, r.reason || '',
      r.tabSwitches || 0, r.copyAttempts || 0, r.screenshotAttempts || 0
    ];
  });

  // Rank by marks (descending), then by earlier submission time.
  rows.sort(function (a, b) { return b[10] - a[10] || new Date(a[0]) - new Date(b[0]); });
  rows.forEach(function (r, i) { r.unshift(i + 1); });

  var old = ss.getSheetByName(SH.RESULTS);
  if (old) ss.deleteSheet(old);
  var sh = ss.insertSheet(SH.RESULTS);
  var headers = ['Rank', 'SubmittedAt', 'SubmissionID', 'Name', 'University', 'Email', 'Phone',
    'Attempted', 'CorrectAnswers', 'WrongAnswers', 'NotAnswered', 'Marks', 'Percent',
    'Result', 'Source', 'Flag', 'Reason', 'TabSwitches', 'CopyAttempts', 'ScreenshotAttempts'];
  sh.appendRow(headers);
  sh.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#0c1f4a').setFontColor('#ffffff');
  sh.setFrozenRows(1);
  if (rows.length) sh.getRange(2, 1, rows.length, headers.length).setValues(rows);
  sh.autoResizeColumns(1, headers.length);

  /* Look the column up by name, a hard-coded index silently breaks the count
     whenever a column is added. */
  /* Papers set aside by the one-per-candidate rule, kept for audit. */
  var reviewName = SH.RESULTS + 'Superseded';
  var oldReview = ss.getSheetByName(reviewName);
  if (oldReview) ss.deleteSheet(oldReview);
  if (superseded.length) {
    var rv = ss.insertSheet(reviewName);
    var rvHeaders = ['SetAsideAt', 'SetAsideSubmissionID', 'Name', 'Email', 'SetAsideMarks',
      'SetAsideSource', 'KeptAt', 'KeptSubmissionID', 'KeptMarks', 'KeptSource', 'WhyLookAgain'];
    rv.appendRow(rvHeaders);
    rv.getRange(1, 1, 1, rvHeaders.length).setFontWeight('bold').setBackground('#7a3b00').setFontColor('#ffffff');
    rv.setFrozenRows(1);
    rv.getRange(2, 1, superseded.length, rvHeaders.length).setValues(superseded.map(function (p) {
      var lg = score(p.loser.answers, KEY), wg = score(p.winner.answers, KEY);
      return [p.loser.when, p.loser.submissionId, p.loser.name, p.loser.email, lg.marks, p.loser.source,
              p.winner.when, p.winner.submissionId, wg.marks, p.winner.source,
              (p.winner.source === 'RECOVERED' && p.loser.source === 'SUBMITTED')
                ? 'The paper kept was only recovered from autosave while this one was actually submitted'
                : ''];
    }));
    rv.autoResizeColumns(1, rvHeaders.length);
  }

  var resultCol = headers.indexOf('Result');
  var passed = rows.filter(function (r) { return r[resultCol] === 'PASS'; }).length;
  var look = Object.keys(needsLook).length;
  return notify(
    'Grading complete (' + exam + '). Papers graded: ' + rows.length +
    '. Passed (' + CONFIG.PASS_PERCENT + '%+): ' + passed +
    '. Failed: ' + (rows.length - passed) +
    (superseded.length
      ? '. ' + superseded.length + ' later paper(s) from candidates who sat twice were set aside, see the ' +
        reviewName + ' tab' + (look ? ', and ' + look + ' of them need a human decision' : '')
      : '. No candidate sat twice') +
    '. Rows marked RECOVERED were rebuilt from autosave and are worth a look.'
  );
}

/**
 * Grades one paper.
 *
 * Shuffling does not affect this. The browser scrambles only the ORDER options
 * are displayed in; the answer it stores is always that option's ORIGINAL
 * letter. So a candidate who picks the correct text stores the same letter no
 * matter which position it appeared in, and this straight comparison against
 * ANSWER_KEY is exactly right.
 */
function score(answers, key) {
  key = key || ANSWER_KEY;
  var correct = 0, wrong = 0, attempted = 0;
  var total = Object.keys(key).length;
  Object.keys(key).forEach(function (n) {
    var given = answers[n] || answers[String(n)];
    if (!given) return;
    attempted++;
    if (String(given).toUpperCase() === key[n]) correct++; else wrong++;
  });
  var marks = (correct * 1) - (wrong * CONFIG.NEGATIVE_MARK);
  return {
    correct: correct, wrong: wrong, attempted: attempted,
    blank: total - attempted, marks: Math.max(0, marks)
  };
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

function findRegistration(token, sheetName) {
  var rows = readRows(sheetName || SHEETS.REG);
  for (var i = rows.length - 1; i >= 0; i--) {
    if (rows[i].Token === token) {
      return { name: rows[i].Name, university: rows[i].University, email: rows[i].Email, phone: rows[i].Phone };
    }
  }
  return { name: '', university: '', email: '', phone: '' };
}

/* Proctoring detail, kept as one JSON column so the sheet layout does not
   have to change again every time another signal is added. The event log is
   capped because it arrives from the candidate's browser. */
function packTelemetry(d) {
  try {
    var ev = Array.isArray(d.ev) ? d.ev.slice(0, 400) : [];
    return JSON.stringify({
      awaySeconds: Number(d.awaySeconds) || 0,
      answerChanges: Number(d.answerChanges) || 0,
      panelEvents: Number(d.panelEvents) || 0,
      extensionHits: Number(d.extensionHits) || 0,
      ev: ev
    });
  } catch (e) { return ''; }
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

/* ======================= TEST ROW CLEANUP =======================
   Removes only the rows created while verifying the system. A row counts as a
   test row when its Token starts with ZZTEST_ or its Name contains one of the
   ZZ ... DELETE ME labels. Nothing else is touched.

   Run listTestRows() first to see what would go, then deleteTestRows().
   Both run from the editor; neither needs a redeploy.
   ================================================================ */

var TEST_SHEETS = [
  SHEETS.REG, SHEETS.AUTOSAVE, SHEETS.SUB, SHEETS.ROUND2,
  FINAL_SHEETS.REG, FINAL_SHEETS.AUTOSAVE, FINAL_SHEETS.SUB
];

function isTestRow(headers, row) {
  for (var i = 0; i < headers.length; i++) {
    var h = String(headers[i]);
    var v = String(row[i] == null ? '' : row[i]);
    if (h === 'Token' && v.indexOf('ZZTEST_') === 0) return true;
    if (h === 'LookupID' && v.indexOf('ZZTEST_') === 0) return true;
    if ((h === 'Name' || h === 'University' || h === 'Reason') &&
        v.toUpperCase().indexOf('DELETE ME') > -1) return true;
    if ((h === 'Name' || h === 'Reason') && v.toUpperCase().indexOf('ZZ PERF TEST') > -1) return true;
  }
  return false;
}

function scanTestRows() {
  /* Two passes.

     The autosave sheets carry only a token, no name, so a rehearsal paper
     cannot be recognised by the usual markers. Leaving those rows behind is
     not harmless: gradeAll() recovers anyone who has autosaved answers but no
     submission, so an orphaned autosave row would be marked as a real paper
     and would appear in the results under a blank identity.

     So: find the obvious test rows first, collect their tokens, and then treat
     every row carrying one of those tokens as a test row as well. */
  var all = [];
  TEST_SHEETS.forEach(function (name) {
    var sh = sheet(name);
    if (!sh || sh.getLastRow() < 2) return;
    var values = sh.getDataRange().getValues();
    var headers = values[0];
    var tokenCol = headers.indexOf('Token');
    var nameCol = headers.indexOf('Name');
    for (var r = 1; r < values.length; r++) {
      all.push({
        sheet: name, rowNumber: r + 1, headers: headers, row: values[r],
        token: tokenCol > -1 ? String(values[r][tokenCol] || '') : '',
        label: nameCol > -1 ? String(values[r][nameCol]) : '(no name column)'
      });
    }
  });

  var testTokens = {};
  all.forEach(function (x) {
    if (x.token && isTestRow(x.headers, x.row)) testTokens[x.token] = true;
  });

  return all.filter(function (x) {
    return isTestRow(x.headers, x.row) || (x.token && testTokens[x.token]);
  }).map(function (x) {
    return { sheet: x.sheet, rowNumber: x.rowNumber,
             label: x.label + (isTestRow(x.headers, x.row) ? '' : ' (matched by token)') };
  });
}

/* Preview only. Changes nothing. */
function listTestRows() {
  var found = scanTestRows();
  if (!found.length) return notify('No test rows found. Nothing to delete.');
  var per = {};
  found.forEach(function (f) { per[f.sheet] = (per[f.sheet] || 0) + 1; });
  var summary = Object.keys(per).map(function (k) { return k + ': ' + per[k]; }).join(', ');
  Logger.log(JSON.stringify(found, null, 1));
  return notify('Would delete ' + found.length + ' test row(s). ' + summary +
    '. Nothing has been deleted yet; run deleteTestRows() to remove them.');
}

/* Deletes the rows listTestRows() reports. Rows are removed bottom-up so the
   row numbers above them do not shift as we go. */
function deleteTestRows() {
  var found = scanTestRows();
  if (!found.length) return notify('No test rows found. Nothing deleted.');

  var bySheet = {};
  found.forEach(function (f) {
    (bySheet[f.sheet] = bySheet[f.sheet] || []).push(f.rowNumber);
  });

  var removed = 0, parts = [];
  Object.keys(bySheet).forEach(function (name) {
    var sh = sheet(name);
    var rows = bySheet[name].sort(function (a, b) { return b - a; });   // bottom-up
    rows.forEach(function (rowNumber) { sh.deleteRow(rowNumber); removed++; });
    parts.push(name + ': ' + rows.length);
  });

  return notify('Deleted ' + removed + ' test row(s). ' + parts.join(', ') + '.');
}

/* ===================== ADMIN CONVENIENCE ======================= */

function onOpen() {
  SpreadsheetApp.getUi().createMenu('BBO 3.0 Exam')
    .addItem('Run setup', 'setup')
    .addItem('Grade Round 1 papers', 'gradeRound1')
    .addItem('Grade Final Round papers', 'gradeFinal')
    .addItem('Send pending emails now', 'processEmailQueue')
    .addItem('Show live stats', 'showStats')
    .addItem('List test rows (preview)', 'listTestRows')
    .addItem('Delete test rows', 'deleteTestRows')
    .addToUi();
}

/* Menu entries cannot pass arguments, so each round gets a thin wrapper. */
function gradeRound1() { return gradeAll('round1'); }
function gradeFinal()  { return gradeAll('final'); }

/* ===================== PROCTORING REVIEW =========================

   Run this AFTER gradeFinal(). It does not accuse anyone and it changes no
   result. It ranks papers by how much the recorded behaviour needs
   explaining, so the short list for a live check is based on evidence rather
   than on who scored well.

   Nothing here is proof on its own. A candidate on a phone that rang, or one
   who refreshed a few times on a bad connection, will pick up points. Treat
   the output as the order in which to talk to people, never as a verdict. */
function reviewFinalPapers() { return reviewPapers('final'); }

function reviewPapers(exam) {
  exam = exam === 'final' ? 'final' : 'round1';
  var SH = sheetsFor(exam);
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var results = readRows(SH.RESULTS);
  if (!results.length) return notify('No results to review. Run grading first.');

  var tele = {};
  readRows(SH.SUB).forEach(function (s) {
    if (s.Token) tele[s.Token] = safeParse(s.Telemetry);
  });
  var byId = {};
  readRows(SH.SUB).forEach(function (s) { if (s.SubmissionID) byId[s.SubmissionID] = s; });

  var rows = results.map(function (r) {
    var sub = byId[r.SubmissionID] || {};
    var t = (sub.Token && tele[sub.Token]) || {};
    var ev = Array.isArray(t.ev) ? t.ev : [];
    var marks = Number(r.Marks) || 0;
    var away = Number(t.awaySeconds) || 0;
    var points = 0, why = [];

    /* Answers landing in a burst right after coming back from somewhere else
       is the pattern that matters most: it is what consulting something
       outside the exam actually looks like. */
    var bursts = 0;
    ev.forEach(function (e, i) {
      if (e[0] !== 'w' || e[2] < 15) return;            // a gap worth noticing
      var backAt = e[1], quick = 0;
      for (var j = i + 1; j < ev.length; j++) {
        if (ev[j][1] - backAt > 20) break;
        if (ev[j][0] === 'a' || ev[j][0] === 'c') quick++;
      }
      if (quick >= 3) bursts++;
    });
    if (bursts) { points += bursts * 3; why.push(bursts + ' answer burst(s) straight after being away'); }

    if (away >= 120) { points += 3; why.push('away ' + away + 's in total'); }
    else if (away >= 45) { points += 1; why.push('away ' + away + 's in total'); }

    if (Number(t.panelEvents)) {
      points += 4;
      why.push(t.panelEvents + ' side panel opening(s), which is what an AI assistant panel looks like');
    }
    if (Number(t.extensionHits)) {
      points += 4;
      why.push('an extension injected something into the exam page');
    }
    if (Number(r.ScreenshotAttempts)) {
      points += 2;
      why.push(r.ScreenshotAttempts + ' screenshot attempt(s)');
    }
    if (Number(r.CopyAttempts) >= 3) {
      points += 1;
      why.push(r.CopyAttempts + ' copy attempt(s)');
    }

    /* Pace. Humans speed up and slow down; a steady rhythm across a whole
       paper, with a high score, is worth a question. */
    var answers = ev.filter(function (e) { return e[0] === 'a'; });
    var gaps = [];
    for (var k = 1; k < answers.length; k++) gaps.push(answers[k][1] - answers[k - 1][1]);
    var pace = '';
    if (gaps.length >= 20) {
      var mean = gaps.reduce(function (a, b) { return a + b; }, 0) / gaps.length;
      var sd = Math.sqrt(gaps.reduce(function (a, b) { return a + (b - mean) * (b - mean); }, 0) / gaps.length);
      pace = Math.round(mean) + 's avg, ' + Math.round(sd) + 's spread';
      if (sd < 2.5 && marks >= CONFIG.TOTAL_MARKS * 0.8) {
        points += 3;
        why.push('unusually even pacing (' + pace + ') for a high score');
      }
    }

    return [points, r.Rank, r.Name, r.Email, marks, r.Result,
            away, t.panelEvents || 0, t.extensionHits || 0,
            r.TabSwitches || 0, r.CopyAttempts || 0, r.ScreenshotAttempts || 0,
            t.answerChanges || 0, pace, why.join('; ') || 'nothing notable'];
  });

  rows.sort(function (a, b) { return b[0] - a[0] || b[4] - a[4]; });

  var name = SH.RESULTS + 'Review';
  var old = ss.getSheetByName(name);
  if (old) ss.deleteSheet(old);
  var sh = ss.insertSheet(name);
  var headers = ['Concern', 'Rank', 'Name', 'Email', 'Marks', 'Result', 'AwaySeconds',
    'SidePanels', 'ExtensionHits', 'WindowSwitches', 'CopyAttempts', 'ScreenshotAttempts',
    'AnswerChanges', 'Pace', 'WhatWasRecorded'];
  sh.appendRow(headers);
  sh.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#7a1f1f').setFontColor('#ffffff');
  sh.setFrozenRows(1);
  if (rows.length) sh.getRange(2, 1, rows.length, headers.length).setValues(rows);
  sh.autoResizeColumns(1, headers.length);

  var flagged = rows.filter(function (r) { return r[0] >= 4; }).length;
  return notify(
    'Proctoring review complete. Papers examined: ' + rows.length +
    '. Worth a conversation (concern 4 or more): ' + flagged +
    '. See the ' + name + ' tab, highest concern first. This accuses nobody and changes no result, ' +
    'it only says who to speak to first.'
  );
}

function showStats() {
  var regs = sheet(SHEETS.REG).getLastRow() - 1;
  var subs = sheet(SHEETS.SUB).getLastRow() - 1;
  var autos = sheet(SHEETS.AUTOSAVE).getLastRow() - 1;
  var results = sheet(SHEETS.RESULTS) ? sheet(SHEETS.RESULTS).getLastRow() - 1 : 0;
  var fReg = sheet(FINAL_SHEETS.REG) ? sheet(FINAL_SHEETS.REG).getLastRow() - 1 : 0;
  var fSub = sheet(FINAL_SHEETS.SUB) ? sheet(FINAL_SHEETS.SUB).getLastRow() - 1 : 0;
  return notify(
    'Registered: ' + Math.max(0, regs) +
    ' | Submitted: ' + Math.max(0, subs) +
    ' | Autosave snapshots: ' + Math.max(0, autos) +
    ' | Graded results: ' + Math.max(0, results) +
    ' || FINAL registered: ' + Math.max(0, fReg) +
    ' | FINAL submitted: ' + Math.max(0, fSub)
  );
}
