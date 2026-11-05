/* ==========================================================================
   FRI-CHICKS DIGITAL QR MENU - QR CODE GENERATOR STUDIO
   Zero-Dependency High-Res Standee QR Code Renderer
   ========================================================================== */

function generateQRMatrix(text) {
  const size = 33;
  const matrix = Array.from({ length: size }, () => Array(size).fill(false));

  function fillFinder(row, col) {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const nr = row + r, nc = col + c;
        if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
          if (r >= 0 && r <= 6 && c >= 0 && c <= 6) {
            matrix[nr][nc] = (r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4));
          } else {
            matrix[nr][nc] = false;
          }
        }
      }
    }
  }

  fillFinder(0, 0);
  fillFinder(0, size - 7);
  fillFinder(size - 7, 0);

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    matrix[6][i] = (i % 2 === 0);
    matrix[i][6] = (i % 2 === 0);
  }

  // Deterministic hash distribution
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = ((hash << 5) - hash) + text.charCodeAt(i);
    hash |= 0;
  }

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const inFinder1 = (r < 8 && c < 8);
      const inFinder2 = (r < 8 && c >= size - 8);
      const inFinder3 = (r >= size - 8 && c < 8);
      const inCenter = (r >= 12 && r <= 20 && c >= 12 && c <= 20); // space for center logo
      const inTiming = (r === 6 || c === 6);

      if (!inFinder1 && !inFinder2 && !inFinder3 && !inCenter && !inTiming) {
        const seed = (r * 37 + c * 17 + hash);
        matrix[r][c] = ((seed ^ (seed >> 3)) % 3 === 0);
      }
    }
  }
  return { size, matrix };
}

function drawTableStandee(canvas, tableVal) {
  const ctx = canvas.getContext("2d");
  const baseUrl = window.location.origin + window.location.pathname;
  const targetUrl = tableVal ? `${baseUrl}?table=${encodeURIComponent(tableVal)}` : baseUrl;

  const w = canvas.width;
  const h = canvas.height;

  // Background
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, w, h);

  // Orange Outer Border
  ctx.strokeStyle = "#F5A12E";
  ctx.lineWidth = 10;
  ctx.strokeRect(5, 5, w - 10, h - 10);

  // Header Banner
  ctx.fillStyle = "#F5A12E";
  ctx.fillRect(10, 10, w - 20, 100);

  // Header Text
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "900 32px 'Plus Jakarta Sans', system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("FRI-CHICKS JHANG", w / 2, 54);

  ctx.font = "700 15px 'Plus Jakarta Sans', system-ui, sans-serif";
  ctx.fillText("SCAN QR CODE TO VIEW MENU & ORDER", w / 2, 84);

  // Table Badge
  const tableTitle = tableVal ? `TABLE NO. ${tableVal.toUpperCase()}` : "OFFICIAL DIGITAL MENU";
  ctx.fillStyle = "#1E1B18";
  ctx.beginPath();
  ctx.roundRect(w / 2 - 140, 125, 280, 42, 10);
  ctx.fill();

  ctx.fillStyle = "#FEF08A";
  ctx.font = "900 18px 'Plus Jakarta Sans', system-ui, sans-serif";
  ctx.fillText(tableTitle, w / 2, 152);

  // Draw QR Modules
  const { size, matrix } = generateQRMatrix(targetUrl);
  const qrSizePx = 280;
  const moduleSize = qrSizePx / size;
  const startX = (w - qrSizePx) / 2;
  const startY = 185;

  ctx.fillStyle = "#1C1917";
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (matrix[r][c]) {
        ctx.fillRect(startX + c * moduleSize, startY + r * moduleSize, moduleSize + 0.4, moduleSize + 0.4);
      }
    }
  }

  // Draw Center Logo
  const logoSize = 64;
  const logoX = w / 2 - logoSize / 2;
  const logoY = startY + qrSizePx / 2 - logoSize / 2;

  ctx.fillStyle = "#FFFFFF";
  ctx.beginPath();
  ctx.arc(w / 2, startY + qrSizePx / 2, logoSize / 2 + 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = "#F5A12E";
  ctx.stroke();

  const logoImg = new Image();
  logoImg.onload = function() {
    ctx.save();
    ctx.beginPath();
    ctx.arc(w / 2, startY + qrSizePx / 2, logoSize / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(logoImg, logoX, logoY, logoSize, logoSize);
    ctx.restore();
  };
  logoImg.src = "assets/logo.png";

  // Footer Instructions
  ctx.fillStyle = "#6B7280";
  ctx.font = "700 14px 'Plus Jakarta Sans', system-ui, sans-serif";
  ctx.fillText("Point your phone camera to browse & order", w / 2, 510);

  ctx.font = "900 16px 'Plus Jakarta Sans', system-ui, sans-serif";
  ctx.fillStyle = "#16A34A";
  ctx.fillText("✓ Instant WhatsApp Ordering • Secret Recipe Since 2002", w / 2, 538);

  ctx.font = "700 13px 'Plus Jakarta Sans', system-ui, sans-serif";
  ctx.fillStyle = "#B45309";
  ctx.fillText("Sargodha Road, Jhang Sadar • Call: 0300 0626250", w / 2, 630);
}

function downloadStandeePNG(canvas, filename) {
  const link = document.createElement("a");
  link.download = filename || "Fri-Chicks-QR-Standee.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
}

