/* =====================================================
   BBO 3.0 Final Round (online) - configuration
   Edit ONLY this file to change the exam settings.
   ===================================================== */
window.BBO_CONFIG = {

  /* Identifies this exam to the backend, so the final round writes to its own
     sheets and is graded against its own answer key. Do not change it without
     changing Code.gs to match. */
  EXAM_ID: "final",

  /* Same Apps Script Web App URL as the rest of the site. */
  API_URL: "https://script.google.com/macros/s/AKfycbxu9VWVo25LjQ3mS4BHr2MKJ_7fcoNRK4sr6F-NuJxvp-mJGIs6ZKjdOuFgsuvMy7pGHg/exec",

  /* ---- Exam window -------------------------------------------------------
     SET THIS BEFORE ANNOUNCING THE EXAM.
     Must be an ISO 8601 timestamp WITH the Bangladesh offset +06:00.
     The exam ends automatically DURATION_MIN minutes after START.          */
  START_ISO: "2026-10-24T21:00:00+06:00",
  DURATION_MIN: 30,

  /* Registration opens this many minutes before START. 60 = the link goes
     live one hour before, and the page shows a countdown until then.       */
  REGISTRATION_OPENS_MIN_BEFORE: 60,

  /* ---- Marking ---------------------------------------------------------- */
  TOTAL_MARKS: 50,
  MARK_PER_QUESTION: 1,
  NEGATIVE_MARKING: false,
  PASS_PERCENT: 40,

  /* ---- Behaviour -------------------------------------------------------- */
  SHUFFLE_QUESTIONS: true,   // different question order per participant
  SHUFFLE_OPTIONS: true,     // scramble option order per participant too

  /* Answers are always saved on the device instantly; this is the extra
     off-device backup. Apps Script serves roughly 11 requests/second, so keep
     this high enough that participants / interval stays well under that.    */
  AUTOSAVE_SECONDS: 240,

  /* Papers are submitted at a random moment inside this many seconds after
     the timer hits zero, so submissions do not all arrive together.         */
  SUBMIT_SPREAD_SECONDS: 240,

  ANTI_CHEAT: true,          // copy-blocking, tab-switch logging, etc.
  MAX_TAB_SWITCHES: 5,       // logged as a proctoring flag; does not auto-fail

  /* ---- Contact shown on the page ---------------------------------------- */
  SUPPORT_EMAIL: "bioinformatics.olympiad@gmail.com",
  FB_PAGE_NAME: "BioPC - A Bioinformatics Research and Training Center",
  FB_PAGE_URL: "https://www.facebook.com/BioPcLab/"
};
