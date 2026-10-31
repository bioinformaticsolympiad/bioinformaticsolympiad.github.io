/* =====================================================================
   BBO 3.0 Final Round certificate layout.

   Coordinates are in the template's own 1123 x 793 design space, the same
   space the Round 1 layout uses, so the two rounds line up field for
   field. The templates themselves are exported at twice that size; the
   renderer works its scale out from the image it is given, so a larger
   export needs no change here.

   The three templates differ only in the subtitle and the citation
   paragraph. Everything drawn at run time sits in identical positions on
   all three, which is why one layout serves all of them.
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

  /* Recipient name. The templates still carry the printed word "Name", so
     that patch is painted out first, exactly as in Round 1. */
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

  /* The label column is drawn whole, labels and values together, because
     the templates carry no labels of their own. The band from y=606 to
     y=710 was cleared when the templates were built, and the partner logos
     begin at y=709, so these four baselines sit in clear space. */
  META: {
    font: 'Ibarra Real Nova',
    sizePt: 14.92,
    color: '#061D55',
    x: 176,
    lines: {
      rank:      624,
      score:     646,
      uniqueId:  668,
      issueDate: 690
    },
    ordinal: { scale: 0.62, rise: 0.36, gap: 0.04 }
  }
};
