/* ==========================================================================
   FRI-CHICKS DIGITAL QR MENU - ISO/IEC 18004 STANDARD QR GENERATOR
   Powered by industry-standard QRCode engine (qrcode.min.js)
   100% compliant, instant scan on iPhone iOS, Android, Samsung & Google Lens
   Untainted Canvas export supporting both online hosting and local file:// mode
   ========================================================================== */

(function(global) {
  "use strict";

  /**
   * Resolves the true website base URL:
   * - If running on web server (http:// or https://), uses current origin & path.
   * - If running locally (file://), checks CONFIG.websiteUrl or defaults to live link.
   */
  function getResolvedBaseUrl() {
    if (typeof CONFIG !== "undefined" && CONFIG.websiteUrl && CONFIG.websiteUrl.trim().length > 3) {
      return CONFIG.websiteUrl.trim();
    }
    if (window.location.protocol === "http:" || window.location.protocol === "https:") {
      return window.location.origin + window.location.pathname;
    }
    return "https://jhang-pizza.miraidigitallabs.workers.dev";
  }

  /**
   * Builds the final full target URL for the QR code:
   * E.g. https://jhang-pizza.miraidigitallabs.workers.dev/?table=5
   */
  function buildQRTargetUrl(tableVal, customBaseUrl) {
    let base = (customBaseUrl && customBaseUrl.trim()) ? customBaseUrl.trim() : getResolvedBaseUrl();
    if (!base.startsWith("http://") && !base.startsWith("https://")) {
      base = "https://" + base;
    }
    const cleanTable = tableVal ? String(tableVal).replace(/^(table\s*)/i, "").trim() : "";
    if (!cleanTable) {
      return base.endsWith("/") ? base : base + "/";
    }
    const cleanBase = base.replace(/\/+$/, "");
    const separator = cleanBase.includes("?") ? "&" : "?";
    return `${cleanBase}/?table=${encodeURIComponent(cleanTable)}`;
  }

  /**
   * Helper to generate a QR Canvas element using QRCode library
   * @param {string} text - URL or text to encode
   * @param {number} size - pixel width & height
   * @param {number} correctLevel - QRCode.CorrectLevel (H=2, Q=3, M=0, L=1)
   * @returns {HTMLCanvasElement|null}
   */
  function createQRCanvas(text, size, correctLevel) {
    if (typeof QRCode === "undefined") {
      console.error("QRCode library not loaded! Please include js/qrcode.min.js");
      return null;
    }
    const container = document.createElement("div");

    const level = (correctLevel !== undefined) ? correctLevel : QRCode.CorrectLevel.H;
    const qr = new QRCode(container, {
      text: text,
      width: size,
      height: size,
      colorDark: "#1C1917",
      colorLight: "#FFFFFF",
      correctLevel: level
    });

    let qrCanvas = container.querySelector("canvas");
    if (!qrCanvas) {
      const img = container.querySelector("img");
      if (img && img.src) {
        qrCanvas = document.createElement("canvas");
        qrCanvas.width = size;
        qrCanvas.height = size;
        const c2d = qrCanvas.getContext("2d");
        c2d.drawImage(img, 0, 0, size, size);
      }
    }
    return qrCanvas;
  }

  /**
   * Native vector drawing of Fri-Chicks badge (Never taints canvas, 100% reliable)
   */
  function drawVectorLogoBadge(ctx, centerX, centerY, logoSize) {
    ctx.save();
    // Inner Orange Badge
    ctx.fillStyle = "#F5A12E";
    ctx.beginPath();
    ctx.arc(centerX, centerY, logoSize / 2 - 1, 0, Math.PI * 2);
    ctx.fill();

    // White Inner Ring
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Center "FC" Text
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "900 " + Math.round(logoSize * 0.40) + "px 'Plus Jakarta Sans', system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("FC", centerX, centerY);
    ctx.restore();
  }

  /**
   * Helper to draw centered logo with protective white buffer ring
   * Uses untainted base64 logo data if available to allow local file:// PNG export
   */
  function drawLogoOnCanvas(ctx, centerX, centerY, logoSize, callback) {
    let finished = false;
    const notifyDone = function() {
      if (!finished) {
        finished = true;
        if (typeof callback === "function") callback();
      }
    };

    const logoImg = new Image();
    const renderImage = function() {
      ctx.save();
      ctx.beginPath();
      ctx.arc(centerX, centerY, logoSize / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      try {
        ctx.drawImage(logoImg, centerX - logoSize / 2, centerY - logoSize / 2, logoSize, logoSize);
      } catch (e) {
        drawVectorLogoBadge(ctx, centerX, centerY, logoSize);
      }
      ctx.restore();
      notifyDone();
    };

    logoImg.onload = renderImage;
    logoImg.onerror = function() {
      drawVectorLogoBadge(ctx, centerX, centerY, logoSize);
      notifyDone();
    };

    // Prefer untainted inline base64 if present
    if (typeof FC_LOGO_BASE64 !== "undefined" && FC_LOGO_BASE64.length > 100) {
      logoImg.src = FC_LOGO_BASE64;
    } else {
      logoImg.src = "assets/logo.png";
    }

    if (logoImg.complete && logoImg.naturalWidth > 0) {
      renderImage();
    }
  }

  /**
   * Renders the High-Resolution Table Acrylic Standee (500x660 px)
   * Conforming to real ISO/IEC 18004 QR standards with centered Fri-Chicks logo
   */
  function drawTableStandee(canvas, tableVal, customBaseUrl, callback) {
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const targetUrl = buildQRTargetUrl(tableVal, customBaseUrl);

    const w = canvas.width;
    const h = canvas.height;

    // 1. Background (Clean White Canvas)
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, w, h);

    // 2. Outer Decorative Rounded Border
    ctx.strokeStyle = "#F5A12E";
    ctx.lineWidth = 10;
    ctx.strokeRect(5, 5, w - 10, h - 10);

    // 3. Header Banner
    ctx.fillStyle = "#F5A12E";
    ctx.fillRect(10, 10, w - 20, 104);

    // 4. Header Restaurant Brand
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "900 32px 'Plus Jakarta Sans', system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("FRI-CHICKS JHANG", w / 2, 54);

    ctx.font = "800 14px 'Plus Jakarta Sans', system-ui, sans-serif";
    ctx.fillText("SMART QR MENU & DIRECT WHATSAPP ORDERING", w / 2, 84);

    // 5. Table Badge
    const cleanTable = tableVal ? String(tableVal).replace(/^(table\s*)/i, "").trim() : "";
    const tableTitle = cleanTable ? `TABLE NO. ${cleanTable.toUpperCase()}` : "MAIN RESTAURANT MENU";
    ctx.fillStyle = "#1E1B18";
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(w / 2 - 145, 128, 290, 42, 10);
    } else {
      ctx.rect(w / 2 - 145, 128, 290, 42);
    }
    ctx.fill();

    ctx.fillStyle = "#FEF08A";
    ctx.font = "900 18px 'Plus Jakarta Sans', system-ui, sans-serif";
    ctx.fillText(tableTitle, w / 2, 155);

    // 6. Draw Standard Genuine ISO QR Code (Level H = 30% error correction)
    const qrSizePx = 280;
    const startX = (w - qrSizePx) / 2;
    const startY = 190;

    const qrCanvas = createQRCanvas(targetUrl, qrSizePx, QRCode.CorrectLevel.H);
    if (qrCanvas) {
      ctx.drawImage(qrCanvas, startX, startY, qrSizePx, qrSizePx);
    } else {
      ctx.fillStyle = "#EF4444";
      ctx.font = "700 14px sans-serif";
      ctx.fillText("QR Generator Library Initializing...", w / 2, startY + 140);
    }

    // 7. Draw Centered Logo with White Protective Buffer Ring
    const logoSize = 52;
    const centerX = w / 2;
    const centerY = startY + qrSizePx / 2;

    // Solid White Buffer Circle
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.arc(centerX, centerY, logoSize / 2 + 5, 0, Math.PI * 2);
    ctx.fill();

    // Orange Outer Ring
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#F5A12E";
    ctx.stroke();

    // Draw Logo Image
    drawLogoOnCanvas(ctx, centerX, centerY, logoSize, callback);

    // 8. Footer Instructions
    ctx.textAlign = "center";
    ctx.fillStyle = "#4B5563";
    ctx.font = "800 13.5px 'Plus Jakarta Sans', system-ui, sans-serif";
    ctx.fillText("Scan with your mobile camera to browse & order", w / 2, 505);

    ctx.font = "900 15px 'Plus Jakarta Sans', system-ui, sans-serif";
    ctx.fillStyle = "#16A34A";
    ctx.fillText("✓ Instant Kitchen & WhatsApp Service • Since 2002", w / 2, 532);

    // Target Scanned URL printed in footer for staff verification
    ctx.font = "700 11px monospace";
    ctx.fillStyle = "#6B7280";
    const displayUrl = targetUrl.length > 52 ? targetUrl.substring(0, 50) + "..." : targetUrl;
    ctx.fillText(displayUrl, w / 2, 560);

    ctx.font = "700 13px 'Plus Jakarta Sans', system-ui, sans-serif";
    ctx.fillStyle = "#B45309";
    ctx.fillText("Sargodha Road, near Punjab Battery Plaza, Jhang Sadar", w / 2, 615);
    ctx.fillText("Call: 0300 0626250", w / 2, 636);
  }

  /**
   * Renders a Branded Square QR Code (400x400 px) with centered Fri-Chicks logo
   * Perfect for stickers, flyer inserts & table cards.
   * Uses Level H (30% error correction) for guaranteed instant phone camera scanning.
   */
  function drawSquareLogoQR(canvas, targetUrl, callback) {
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const w = canvas.width;
    const h = canvas.height;

    // 1. Clean white background
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, w, h);

    // 2. Quiet zone & QR generation
    const pad = 24;
    const qrSize = Math.min(w, h) - pad * 2;
    const startX = (w - qrSize) / 2;
    const startY = (h - qrSize) / 2;

    const qrCanvas = createQRCanvas(targetUrl, qrSize, QRCode.CorrectLevel.H);
    if (qrCanvas) {
      ctx.drawImage(qrCanvas, startX, startY, qrSize, qrSize);
    } else {
      ctx.fillStyle = "#EF4444";
      ctx.font = "700 14px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Error generating QR", w / 2, h / 2);
      if (typeof callback === "function") callback();
      return;
    }

    // 3. Centered logo with protective white buffer
    const logoSize = 64;
    const centerX = w / 2;
    const centerY = h / 2;

    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.arc(centerX, centerY, logoSize / 2 + 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.lineWidth = 3.5;
    ctx.strokeStyle = "#F5A12E";
    ctx.stroke();

    // Draw logo
    drawLogoOnCanvas(ctx, centerX, centerY, logoSize, callback);
  }

  /**
   * Renders pure standard QR Code only (for stickers/receipts/thermal printers)
   * 100% clean, un-obscured black & white modules for instant scan under any light.
   */
  function drawPureQR(canvas, targetUrl) {
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const w = canvas.width;
    const h = canvas.height;

    // White Background
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, w, h);

    const pad = 24;
    const qrSize = Math.min(w, h) - pad * 2;
    const startX = (w - qrSize) / 2;
    const startY = (h - qrSize) / 2;

    const qrCanvas = createQRCanvas(targetUrl, qrSize, QRCode.CorrectLevel.M);
    if (qrCanvas) {
      ctx.drawImage(qrCanvas, startX, startY, qrSize, qrSize);
    } else {
      ctx.fillStyle = "#EF4444";
      ctx.font = "700 14px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Error generating QR", w / 2, h / 2);
    }
  }

  /**
   * Downloads the Canvas as PNG file reliably across all browsers and file:// protocol
   */
  function downloadStandeePNG(canvas, filename) {
    if (!canvas) return;
    const cleanName = filename || "Fri-Chicks-QR-Standee.png";

    // Attempt 1: Modern canvas.toBlob (Highest performance, doesn't lock UI thread)
    if (canvas.toBlob) {
      try {
        canvas.toBlob(function(blob) {
          if (blob) {
            const blobUrl = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.style.display = "none";
            link.href = blobUrl;
            link.download = cleanName;
            document.body.appendChild(link);
            link.click();
            setTimeout(function() {
              try { document.body.removeChild(link); } catch (e) {}
              URL.revokeObjectURL(blobUrl);
            }, 500);
            return;
          }
          fallbackToDataUrl(canvas, cleanName);
        }, "image/png");
        return;
      } catch (err) {
        console.warn("toBlob attempt warning:", err);
      }
    }

    // Attempt 2: canvas.toDataURL fallback
    fallbackToDataUrl(canvas, cleanName);
  }

  function fallbackToDataUrl(canvas, cleanName) {
    try {
      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.style.display = "none";
      link.href = dataUrl;
      link.download = cleanName;
      document.body.appendChild(link);
      link.click();
      setTimeout(function() {
        try { document.body.removeChild(link); } catch (e) {}
      }, 500);
    } catch (err) {
      console.error("Direct download blocked by browser security:", err);
      // Fallback 3: Open in popup window for manual Right Click -> Save Image As
      try {
        const w = window.open("");
        if (w) {
          w.document.write("<html><head><title>Fri-Chicks QR</title></head><body style='margin:0;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;background:#111;color:#fff;font-family:sans-serif;'>");
          w.document.write("<img src='" + canvas.toDataURL("image/png") + "' style='max-width:90%;border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,0.5);'>");
          w.document.write("<p style='margin-top:16px;font-weight:700;'>Right-click or Long-press the QR image and tap 'Save image as...'</p>");
          w.document.write("</body></html>");
        }
      } catch (e2) {}
    }
  }

  // Export functions to window
  global.getResolvedBaseUrl = getResolvedBaseUrl;
  global.buildQRTargetUrl = buildQRTargetUrl;
  global.drawTableStandee = drawTableStandee;
  global.drawSquareLogoQR = drawSquareLogoQR;
  global.drawPureQR = drawPureQR;
  global.downloadStandeePNG = downloadStandeePNG;

})(window);
