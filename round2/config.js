/* =====================================================
   BBO 3.0 - Round 2 registration configuration
   ===================================================== */
window.BBO_R2_CONFIG = {

  /* Same Apps Script Web App URL as the exam and result pages. */
  API_URL: "https://script.google.com/macros/s/AKfycbxu9VWVo25LjQ3mS4BHr2MKJ_7fcoNRK4sr6F-NuJxvp-mJGIs6ZKjdOuFgsuvMy7pGHg/exec",

  VENUE: "University of Chittagong",
  EXAM_WINDOW: "3rd week of September 2026",
  DEADLINE_TEXT: "10 September 2026",
  CAPACITY: 350,

  FEE_EXAM: 500,
  FEE_FULL: 600,

  /* bKash numbers shown on the payment step. Send Money (personal). */
  BKASH_NUMBERS: ["01622488559", "01855310554"],

  WHATSAPP_URL: "https://chat.whatsapp.com/H2DNQoGnegb0dnHhnI9v1l?s=cl&p=a&mlu=4",

  SUPPORT_EMAIL: "bioinformatics.olympiad@gmail.com",
  FB_PAGE_NAME: "BioPC - A Bioinformatics Research and Training Center",
  FB_PAGE_URL: "https://www.facebook.com/BioPcLab/",

  /* Screenshots are resized in the browser before upload so a 5 MB phone photo
     does not have to travel to the server. */
  MAX_IMAGE_WIDTH: 1400,
  JPEG_QUALITY: 0.82,

  /* ---- Certificate ------------------------------------------------------
     How long the "generating" popup stays up before the download fires.
     Drawing the certificate actually takes about a second, so this is purely
     how long the participant is asked to wait. 180000 would give the literal
     "2-3 minutes"; 8 seconds is long enough to read the message without
     making 861 people sit and stare at a page.                             */
  CERT_MIN_WAIT_MS: 40000
};
