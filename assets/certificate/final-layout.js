/* =====================================================================
   BBO 3.0 Final Round certificate layout.

   The Final Round sheet is its own design, not a reskin of Round 1: a
   ruled frame on a warm ground, an engraved all-caps title, a sealed tier
   medal, and the recipient set in serif rather than script. Only the
   genuine artwork carries over, the two logos, the signature and the
   partner badges, so it reads as the same olympiad without being the same
   certificate.

   Coordinates are in the template's own 1123 x 793 design space. The
   templates are exported at twice that; the renderer takes its scale from
   the image it is handed, so a larger export needs no change here.

   The three tiers differ only in colour, title and citation. Everything
   drawn at run time sits in the same place on all three, which is why one
   layout serves them all.
   ===================================================================== */
window.BBO_FINAL_CERT_LAYOUT = {

  TEMPLATES: {
    winner:        'final-winner.png',
    merit:         'final-merit.png',
    participation: 'final-participation.png'
  },

  DESIGN_W: 1123,
  DESIGN_H: 793,
  TOTAL_MARKS: 50,
  ISSUE_DATE: '31/10/26',

  /* The recipient sits on the ruled band at y=378. Nothing is printed
     there, so unlike Round 1 there is no placeholder to paint out: the
     clear box is deliberately empty, because painting white here would
     leave a pale patch on the warm ground. */
  NAME: {
    clear: { x: 0, y: 0, w: 0, h: 0 },
    centerX: 561,
    baseline: 352,
    font: 'Cormorant Garamond',
    weight: 600,
    sizePt: 40,
    color: '#16263f',
    letterSpacingPt: 0,
    maxWidth: 600,
    minSizePt: 20
  },

  /* Credentials are ruled off along the foot, left of the signature. The
     foot rule sits at y=578 and the badges below it, so these four lines
     have the lower left corner to themselves. */
  META: {
    font: 'Ibarra Real Nova',
    sizePt: 11.5,
    color: '#2b3a47',
    x: 88,
    lines: {
      rank:      498,
      score:     520,
      uniqueId:  542,
      issueDate: 564
    },
    ordinal: { scale: 0.62, rise: 0.36, gap: 0.04 }
  }
};
