/* =====================================================================
   BBO 3.0, certificate generator
   Draws the template image, then the three personalised fields, and hands
   back a PNG blob. Nothing else on the certificate is altered.
   ===================================================================== */
(function () {
'use strict';

var PT_TO_PX = 96 / 72;
function L() { return window.BBO_CERT_LAYOUT || {}; }

/* Unique ID rule: use whatever the sheet holds; otherwise BBO3-<rank>
   zero-padded to three digits, so rank 5 becomes BBO3-005. */
function certificateId(r) {
  var given = String((r && (r.certificateId || r.uniqueId)) || '').trim();
  if (given) return given;
  var rank = parseInt(r && r.rank, 10);
  if (!rank || rank < 1) return 'BBO3-000';
  return 'BBO3-' + (rank < 1000 ? ('00' + rank).slice(-3) : String(rank));
}

/* 1st, 2nd, 3rd, 4th … and the 11th/12th/13th exceptions, so rank 111
   reads 111th rather than 111st. */
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

/* Many names were registered in ALL CAPS or all lowercase; a certificate
   should not shout. Deliberate mixed case is left exactly as entered. */
function tidyName(name) {
  var s = String(name || '').trim().replace(/\s+/g, ' ');
  if (!s) return '';
  if (s !== s.toUpperCase() && s !== s.toLowerCase()) return s;
  return s.replace(/\S+/g, function (w) {
    return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
  });
}

function loadImage(src) {
  return new Promise(function (resolve, reject) {
    var img = new Image();
    img.onload = function () { resolve(img); };
    img.onerror = function () { reject(new Error('Could not load the certificate template.')); };
    img.src = src;
  });
}

/* The webfonts must be rasterised before drawing, or the canvas silently
   falls back to a default face and the certificate looks wrong. */
function waitForFonts() {
  var l = L();
  if (!document.fonts || !document.fonts.load) return Promise.resolve();
  return Promise.all([
    document.fonts.load('60px "' + l.NAME.font + '"', 'Sample Name'),
    document.fonts.load('20px "' + l.META.font + '"', 'Rank 123')
  ]).then(function () { return document.fonts.ready; })
    .catch(function () { /* draw anyway rather than fail outright */ });
}

/* Canvas letterSpacing is not universally supported, so track manually. */
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
 * record: { name, rank, certificateId? }
 * returns { blob, dataUrl, filename, id, width, height }
 */
function generate(record, templateSrc) {
  var l = L();
  var src = templateSrc || l.TEMPLATE;

  return Promise.all([loadImage(src), waitForFonts()]).then(function (r) {
    var img = r[0];

    /* Scale is derived from the template actually supplied, so a larger
       export simply produces a larger certificate with no code changes. */
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

    /* hide the printed "Name" placeholder */
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(N.clear.x * s, N.clear.y * s, N.clear.w * s, N.clear.h * s);

    ctx.fillStyle = N.color;
    var sizePx = N.sizePt * PT_TO_PX * s;
    var minPx = N.minSizePt * PT_TO_PX * s;
    var tracking = (N.letterSpacingPt || 0) * PT_TO_PX * s;
    var maxW = N.maxWidth * s;

    /* long names shrink rather than run past the template's ruled area */
    for (;;) {
      ctx.font = sizePx + 'px "' + N.font + '", cursive';
      if (trackedWidth(ctx, name, tracking) <= maxW || sizePx <= minPx) break;
      sizePx -= 1.5;
    }
    drawTracked(ctx, name, N.centerX * s, N.baseline * s, tracking);

    /* ---------- rank, unique id, issue date ---------- */
    var M = l.META;
    var id = certificateId(record);
    var metaPx = M.sizePt * PT_TO_PX * s;
    var metaFont = function (px) { return px + 'px "' + M.font + '", Georgia, serif'; };

    ctx.fillStyle = M.color;
    ctx.textAlign = 'left';
    ctx.font = metaFont(metaPx);

    /* rank, with its ordinal ending set as a superscript */
    var rankNum = parseInt(record.rank, 10);
    if (isFinite(rankNum) && rankNum > 0) {
      var digits = String(rankNum);
      ctx.fillText(digits, M.rank.x * s, M.rank.baseline * s);
      var o = M.ordinal || { scale: 0.62, rise: 0.36, gap: 0.04 };
      var afterX = M.rank.x * s + ctx.measureText(digits).width + metaPx * o.gap;
      ctx.font = metaFont(metaPx * o.scale);
      ctx.fillText(ordinalSuffix(rankNum), afterX, M.rank.baseline * s - metaPx * o.rise);
      ctx.font = metaFont(metaPx);
    } else {
      ctx.fillText(String(record.rank || '-'), M.rank.x * s, M.rank.baseline * s);
    }

    ctx.fillText(id, M.uniqueId.x * s, M.uniqueId.baseline * s);

    /* issue date, the template's own "Date:" line is replaced */
    var D = l.DATE;
    if (D) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(D.clear.x * s, D.clear.y * s, D.clear.w * s, D.clear.h * s);
      ctx.fillStyle = M.color;
      ctx.fillText(D.label + (record.issueDate || D.value), D.x * s, D.baseline * s);
    }

    var safe = name.replace(/[^A-Za-z0-9 ]/g, '').replace(/\s+/g, '_').slice(0, 40) || 'Participant';
    var filename = 'BBO3-Certificate-' + safe + '-' + id + '.png';

    return new Promise(function (resolve) {
      canvas.toBlob(function (blob) {
        resolve({
          blob: blob,
          dataUrl: canvas.toDataURL('image/png'),
          filename: filename,
          id: id,
          width: canvas.width,
          height: canvas.height
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

window.BBOCertificate = {
  generate: generate,
  download: download,
  certificateId: certificateId,
  tidyName: tidyName,
  ordinalSuffix: ordinalSuffix
};

})();
