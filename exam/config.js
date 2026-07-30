/* =====================================================
   BBO 3.0 Online Exam — configuration
   Edit ONLY this file to change exam settings.
   ===================================================== */
window.BBO_CONFIG = {

  /* ---- 1. Backend URL -------------------------------------------------
     Paste the Google Apps Script Web App URL here after you deploy it.
     It looks like: https://script.google.com/macros/s/AKfy..../exec
     Until this is set, the page runs in OFFLINE PRACTICE mode.            */
  API_URL: "PASTE_YOUR_APPS_SCRIPT_WEB_APP_URL_HERE",

  /* ---- 2. Exam window -------------------------------------------------
     START must be an ISO 8601 timestamp WITH the Bangladesh offset +06:00.
     Example below = 31 July 2026, 9:00:00 PM Bangladesh time.
     The exam ends automatically DURATION_MIN minutes after START.         */
  START_ISO: "2026-07-30T21:00:00+06:00",
  DURATION_MIN: 50,

  /* Registration opens this many minutes before START, so participants can
     fill in their details ahead of time and wait on the countdown screen.
     1440 = 24 hours. Raise it if you want registration open for longer
     (2880 = 2 days, 10080 = 1 week).                                       */
  REGISTRATION_OPENS_MIN_BEFORE: 2880,

  /* ---- 3. Marking ----------------------------------------------------- */
  TOTAL_MARKS: 50,
  MARK_PER_QUESTION: 1,
  NEGATIVE_MARKING: false,
  PASS_PERCENT: 40,

  /* ---- 4. Behaviour --------------------------------------------------- */
  SHUFFLE_QUESTIONS: true,   // different question order per participant
  SHUFFLE_OPTIONS: true,     // scramble option order per participant too
  /* How often answers are pushed to the server. Answers are ALWAYS saved on
     the device instantly; this is the extra off-device backup. Raising this
     number reduces server load — at 2000 candidates keep it at 90 or above.  */
  AUTOSAVE_SECONDS: 90,
  ANTI_CHEAT: true,          // copy-blocking, tab-switch logging, etc.
  MAX_TAB_SWITCHES: 5,       // logged as a proctoring flag; does not auto-fail

  /* ---- 5. Contact shown on the page ----------------------------------- */
  SUPPORT_EMAIL: "bioinformaticsolympiad@gmail.com"
};
