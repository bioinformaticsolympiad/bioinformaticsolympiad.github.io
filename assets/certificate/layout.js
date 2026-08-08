/* =====================================================================
   BBO 3.0 certificate layout
   ---------------------------------------------------------------------
   All coordinates are in the template's own 1123 x 793 design space and
   were MEASURED from the exported template image, not guessed from font
   metrics — so the drawn fields line up with the printed labels exactly.

   The renderer works out its own scale from the template's real width, so
   swapping template.png for a higher-resolution export needs no changes
   here: everything scales with it.

   Only three values are ever drawn: Name, Rank and Unique ID. Every other
   mark comes from the template image and is never touched.
   ===================================================================== */
window.BBO_CERT_LAYOUT = {

  TEMPLATE: 'template.png',
  DESIGN_W: 1123,
  DESIGN_H: 793,

  /* Recipient name (TextBox 21: Great Vibes 54.01pt, #061D55, centred).
     The template still carries the word "Name", so that patch of white is
     painted over first — verified to contain nothing but the placeholder. */
  NAME: {
    clear: { x: 336, y: 330, w: 488, h: 96 },
    centerX: 580,
    baseline: 400,
    font: 'Great Vibes',
    sizePt: 54.01,
    color: '#061D55',
    letterSpacingPt: -0.91,
    maxWidth: 470,
    minSizePt: 24
  },

  /* Rank and Unique ID values are appended after the labels already printed
     on the template. X is the measured right edge of each label plus a word
     space; Y is the measured baseline of that line. */
  META: {
    font: 'Ibarra Real Nova',
    sizePt: 14.92,
    color: '#061D55',
    rank:     { x: 231, baseline: 645 },
    uniqueId: { x: 275, baseline: 669 }
  }
};
