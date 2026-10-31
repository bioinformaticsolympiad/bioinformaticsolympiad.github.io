/* =====================================================================
   BBO 3.0 Final Round certificate generator.

   Deliberately separate from the Round 1 generator. Round 1 certificates
   are already in people's hands and must keep rendering exactly as they
   did, so nothing here touches that code path.

   Three templates, chosen by placing:
     ranks 1 to 5    Certificate of Excellence   (winner)
     ranks 6 to 15   Certificate of Merit        (special recognition)
     the rest        Certificate of Participation
   Only candidates who passed are eligible; the page refuses before it
   ever reaches this file.
   ===================================================================== */
(function () {
'use strict';

var PT_TO_PX = 96 / 72;
function L() { return window.BBO_FINAL_CERT_LAYOUT || {}; }

/* The templates live beside this script, not beside the page including it,
   so paths are resolved against this file's own URL. That lets the
   certificate page sit at any depth without rewriting the layout. */
var ASSET_BASE = (function () {
  var s = document.currentScript;
  if (!s) {
    var all = document.getElementsByTagName('script');
    s = all[all.length - 1];
  }
  var src = (s && s.src) || '';
  return src ? src.replace(/[^\/]+$/, '') : '';
})();
function assetUrl(name) {
  if (/^(https?:)?\/\//.test(name) || name.charAt(0) === '/') return name;
  return ASSET_BASE + name;
}

function tierOf(rank) {
  var n = parseInt(rank, 10);
  if (!isFinite(n) || n < 1) return 'participation';
  if (n <= 5) return 'winner';
  if (n <= 15) return 'merit';
  return 'participation';
}

/* Final round ids carry an F so they can never be confused with a Round 1
   certificate, which used BBO3-<rank>. */
function certificateId(r) {
  var given = String((r && (r.finalCertificateId || r.certificateId)) || '').trim();
  if (given) return given;
  var rank = parseInt(r && r.rank, 10);
  if (!rank || rank < 1) return 'BBO3F-000';
  return 'BBO3F-' + (rank < 1000 ? ('00' + rank).slice(-3) : String(rank));
}

function ordinalSuffix(n) {
  var v = Math.abs(parseInt(n, 10)) % 100;
  if (v >= 11 && v <= 13) return 'th';
  switch (v % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
}

/* Names registered in ALL CAPS or all lowercase should not be printed that
   way; deliberate mixed case is left exactly as entered. */
function tidyName(name) {
  var s = String(name || '').trim().replace(/\s+/g, ' ');
  if (!s) return '';
  if (s !== s.toUpperCase() && s !== s.toLowerCase()) return s;
  return s.replace(/\S+/g, function (w) {
    return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
  });
}

/* Scores are made distinct to however many decimals it took, so the
   printed value must not round them back together. Two decimals is the
   floor, not a ceiling. */
function formatScore(n) {
  var t = String(Math.round(n * 1e6) / 1e6);
  var dot = t.indexOf('.');
  if (dot < 0) return t + '.00';
  var decimals = t.length - dot - 1;
  return decimals === 1 ? t + '0' : t;
}

/* The score printed is the performance score, which carries the speed
   fraction that separates candidates who tie on marks. It is printed bare,
   without a total: two candidates on the same whole mark differ only in the
   decimals, and "41.908 / 50" invites the reader to round that away. */
function scoreText(r) {
  var v = r && r.performanceScore;
  if (v === undefined || v === null || v === '') v = (r && r.marks) || 0;
  var n = parseFloat(v);
  if (!isFinite(n)) n = 0;
  return formatScore(n);
}

function loadImage(src) {
  return new Promise(function (resolve, reject) {
    var img = new Image();
    img.onload = function () { resolve(img); };
    img.onerror = function () { reject(new Error('Could not load the certificate template.')); };
    img.src = src;
  });
}

function waitForFonts() {
  var l = L();
  if (!document.fonts || !document.fonts.load) return Promise.resolve();
  return Promise.all([
    document.fonts.load((l.NAME.weight ? l.NAME.weight + ' ' : '') + '60px "' + l.NAME.font + '"', 'Sample Name'),
    document.fonts.load('20px "' + l.META.font + '"', 'Rank 123')
  ]).then(function () { return document.fonts.ready; })
    .catch(function () { /* draw anyway rather than fail outright */ });
}

function trackedWidth(ctx, text, tracking) {
  if (!tracking) return ctx.measureText(text).width;
  var w = 0;
  for (var i = 0; i < text.length; i++) w += ctx.measureText(text[i]).width + tracking;
  return w - tracking;
}
function drawTracked(ctx, text, centerX, baseline, tracking) {
  if (!tracking) {
    ctx.textAlign = 'center';
    ctx.fillText(text, centerX, baseline);
    return;
  }
  var total = trackedWidth(ctx, text, tracking);
  var x = centerX - total / 2;
  ctx.textAlign = 'left';
  for (var i = 0; i < text.length; i++) {
    ctx.fillText(text[i], x, baseline);
    x += ctx.measureText(text[i]).width + tracking;
  }
}

/**
 * record: { name, rank, performanceScore, totalMarks?, issueDate? }
 * returns { blob, dataUrl, filename, id, tier, width, height }
 */
function generate(record) {
  var l = L();
  var tier = tierOf(record && record.rank);
  var src = assetUrl((l.TEMPLATES && l.TEMPLATES[tier]) || l.TEMPLATES.participation);

  return Promise.all([loadImage(src), waitForFonts()]).then(function (r) {
    var img = r[0];
    var s = img.naturalWidth / l.DESIGN_W;

    var canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    var ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    ctx.textBaseline = 'alphabetic';

    /* ---------- name ---------- */
    var N = l.NAME;
    var name = tidyName(record.name) || 'Participant';

    /* Round 1 printed the word "Name" and had to be covered. This design
       prints nothing there, so a clear box of zero size means do nothing;
       painting white would leave a pale patch on the warm ground. */
    if (N.clear && N.clear.w > 0 && N.clear.h > 0) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(N.clear.x * s, N.clear.y * s, N.clear.w * s, N.clear.h * s);
    }

    ctx.fillStyle = N.color;
    var sizePx = N.sizePt * PT_TO_PX * s;
    var minPx = N.minSizePt * PT_TO_PX * s;
    var tracking = (N.letterSpacingPt || 0) * PT_TO_PX * s;
    var maxW = N.maxWidth * s;
    for (;;) {
      ctx.font = (N.weight ? N.weight + ' ' : '') + sizePx + 'px "' + N.font + '", Georgia, serif';
      if (trackedWidth(ctx, name, tracking) <= maxW || sizePx <= minPx) break;
      sizePx -= 1.5;
    }
    drawTracked(ctx, name, N.centerX * s, N.baseline * s, tracking);

    /* ---------- the label column ----------
       The template carries no labels, so each line is drawn whole. That
       keeps every baseline exactly where this file says it is, instead of
       depending on how a browser happened to lay out the template. */
    var M = l.META;
    var id = certificateId(record);
    var metaPx = M.sizePt * PT_TO_PX * s;
    var metaFont = function (px) { return px + 'px "' + M.font + '", Georgia, serif'; };

    ctx.fillStyle = M.color;
    ctx.textAlign = 'left';
    ctx.font = metaFont(metaPx);

    var x = M.x * s;
    var rankNum = parseInt(record.rank, 10);

    /* rank, with the ordinal ending raised like a typeset superscript */
    var rankLabel = 'Rank: ';
    ctx.fillText(rankLabel, x, M.lines.rank * s);
    var afterLabel = x + ctx.measureText(rankLabel).width;
    if (isFinite(rankNum) && rankNum > 0) {
      var digits = String(rankNum);
      ctx.fillText(digits, afterLabel, M.lines.rank * s);
      var o = M.ordinal || { scale: 0.62, rise: 0.36, gap: 0.04 };
      var afterX = afterLabel + ctx.measureText(digits).width + metaPx * o.gap;
      ctx.font = metaFont(metaPx * o.scale);
      ctx.fillText(ordinalSuffix(rankNum), afterX, M.lines.rank * s - metaPx * o.rise);
      ctx.font = metaFont(metaPx);
    } else {
      ctx.fillText(String(record.rank || '-'), afterLabel, M.lines.rank * s);
    }

    ctx.fillText('Score: ' + scoreText(record), x, M.lines.score * s);
    ctx.fillText('Unique ID: ' + id, x, M.lines.uniqueId * s);
    ctx.fillText('Issue Date: ' + (record.issueDate || l.ISSUE_DATE), x, M.lines.issueDate * s);

    var safe = name.replace(/[^A-Za-z0-9 ]/g, '').replace(/\s+/g, '_').slice(0, 40) || 'Participant';
    var filename = 'BBO3-Final-Certificate-' + safe + '-' + id + '.png';

    return new Promise(function (resolve) {
      canvas.toBlob(function (blob) {
        resolve({
          blob: blob, dataUrl: canvas.toDataURL('image/png'),
          filename: filename, id: id, tier: tier,
          width: canvas.width, height: canvas.height
        });
      }, 'image/png');
    });
  });
}

function download(result) {
  var url = URL.createObjectURL(result.blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = result.filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(function () { URL.revokeObjectURL(url); }, 5000);
}

window.BBOFinalCertificate = {
  generate: generate,
  download: download,
  certificateId: certificateId,
  ordinalSuffix: ordinalSuffix,
  tidyName: tidyName,
  tierOf: tierOf
};
})();
