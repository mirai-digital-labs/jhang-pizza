/* ==========================================================================
   FRI-CHICKS DIGITAL QR MENU - REAL ISO/IEC 18004 QR CODE GENERATOR
   100% Genuine, Self-Contained Reed-Solomon QR Code Generator Engine
   Scannable by all iPhone, Android, Google Lens & Barcode Scanners
   ========================================================================== */

(function(global) {

  // 1. Galois Field GF(256) Arithmetic
  const QRMath = {
    glog: function(n) {
      if (n < 1) throw new Error("glog(" + n + ")");
      return QRMath.LOG_TABLE[n];
    },
    gexp: function(n) {
      while (n < 0) n += 255;
      while (n >= 255) n -= 255;
      return QRMath.EXP_TABLE[n];
    },
    EXP_TABLE: new Array(256),
    LOG_TABLE: new Array(256)
  };

  for (let i = 0; i < 8; i++) QRMath.EXP_TABLE[i] = 1 << i;
  for (let i = 8; i < 256; i++) {
    QRMath.EXP_TABLE[i] = QRMath.EXP_TABLE[i - 4] ^ QRMath.EXP_TABLE[i - 5] ^ QRMath.EXP_TABLE[i - 6] ^ QRMath.EXP_TABLE[i - 8];
  }
  for (let i = 0; i < 255; i++) {
    QRMath.LOG_TABLE[QRMath.EXP_TABLE[i]] = i;
  }

  // 2. Polynomial Arithmetic for Reed-Solomon Code
  function QRPolynomial(num, shift) {
    if (num.length === undefined) throw new Error(num.length + "/" + shift);
    let offset = 0;
    while (offset < num.length && num[offset] === 0) offset++;
    this.num = new Array(num.length - offset + shift);
    for (let i = 0; i < num.length - offset; i++) this.num[i] = num[i + offset];
  }

  QRPolynomial.prototype = {
    get: function(index) { return this.num[index]; },
    getLength: function() { return this.num.length; },
    multiply: function(e) {
      const num = new Array(this.getLength() + e.getLength() - 1).fill(0);
      for (let i = 0; i < this.getLength(); i++) {
        for (let j = 0; j < e.getLength(); j++) {
          num[i + j] ^= QRMath.gexp(QRMath.glog(this.get(i)) + QRMath.glog(e.get(j)));
        }
      }
      return new QRPolynomial(num, 0);
    },
    mod: function(e) {
      if (this.getLength() - e.getLength() < 0) return this;
      const ratio = QRMath.glog(this.get(0)) - QRMath.glog(e.get(0));
      const num = new Array(this.getLength());
      for (let i = 0; i < this.getLength(); i++) num[i] = this.get(i);
      for (let i = 0; i < e.getLength(); i++) {
        num[i] ^= QRMath.gexp(QRMath.glog(e.get(i)) + ratio);
      }
      return new QRPolynomial(num, 0).mod(e);
    }
  };

  // 3. Error Correction Levels (L=1: 7%, M=0: 15%, Q=3: 25%, H=2: 30%)
  const QRECL = { L: 1, M: 0, Q: 3, H: 2 };

  // 4. RS Block Table for Versions 1 through 10
  const QRRSBlock = {
    RS_BLOCK_TABLE: [
      // V1
      [1, 26, 19], [1, 26, 16], [1, 26, 13], [1, 26, 9],
      // V2
      [1, 44, 34], [1, 44, 28], [1, 44, 22], [1, 44, 16],
      // V3
      [1, 70, 55], [1, 70, 44], [2, 35, 17], [2, 35, 13],
      // V4
      [1, 100, 80], [2, 50, 32], [2, 50, 24], [4, 25, 9],
      // V5
      [1, 134, 108], [2, 67, 43], [2, 33, 15, 2, 34, 16], [2, 33, 11, 2, 34, 12],
      // V6
      [2, 86, 68], [4, 43, 27], [4, 43, 19], [4, 43, 15],
      // V7
      [2, 98, 78], [4, 49, 31], [2, 32, 14, 4, 33, 15], [4, 39, 13, 1, 40, 14],
      // V8
      [2, 121, 97], [2, 60, 38, 2, 61, 39], [4, 40, 18, 2, 41, 19], [4, 40, 14, 2, 41, 15],
      // V9
      [2, 146, 116], [3, 58, 36, 2, 59, 37], [4, 36, 16, 4, 37, 17], [4, 36, 12, 4, 37, 13],
      // V10
      [2, 86, 68, 2, 87, 69], [4, 69, 43, 1, 70, 44], [6, 43, 19, 2, 44, 20], [6, 43, 15, 2, 44, 16]
    ],
    getRSBlocks: function(version, ecl) {
      const idx = (version - 1) * 4 + (ecl === QRECL.L ? 0 : ecl === QRECL.M ? 1 : ecl === QRECL.Q ? 2 : 3);
      const raw = QRRSBlock.RS_BLOCK_TABLE[idx];
      const blocks = [];
      for (let i = 0; i < raw.length; i += 3) {
        const count = raw[i];
        const totalCount = raw[i + 1];
        const dataCount = raw[i + 2];
        for (let j = 0; j < count; j++) {
          blocks.push({ totalCount, dataCount });
        }
      }
      return blocks;
    }
  };

  // 5. Utility & Format Info Functions
  const QRUtil = {
    PATTERN_POSITION_TABLE: [
      [],
      [6, 18],
      [6, 22],
      [6, 26],
      [6, 30],
      [6, 34],
      [6, 22, 38],
      [6, 24, 42],
      [6, 26, 46],
      [6, 28, 50]
    ],
    G15: (1 << 10) | (1 << 8) | (1 << 5) | (1 << 4) | (1 << 2) | (1 << 1) | (1 << 0),
    G15_MASK: (1 << 14) | (1 << 12) | (1 << 10) | (1 << 4) | (1 << 1),

    getBCHTypeInfo: function(data) {
      let d = data << 10;
      while (QRUtil.getBCHDigit(d) - QRUtil.getBCHDigit(QRUtil.G15) >= 0) {
        d ^= (QRUtil.G15 << (QRUtil.getBCHDigit(d) - QRUtil.getBCHDigit(QRUtil.G15)));
      }
      return ((data << 10) | d) ^ QRUtil.G15_MASK;
    },

    getBCHDigit: function(data) {
      let digit = 0;
      while (data !== 0) {
        digit++;
        data >>>= 1;
      }
      return digit;
    },

    getPatternPosition: function(version) {
      return QRUtil.PATTERN_POSITION_TABLE[version - 1] || [];
    },

    getMask: function(maskPattern, i, j) {
      switch (maskPattern) {
        case 0: return (i + j) % 2 === 0;
        case 1: return i % 2 === 0;
        case 2: return j % 3 === 0;
        case 3: return (i + j) % 3 === 0;
        case 4: return (Math.floor(i / 2) + Math.floor(j / 3)) % 2 === 0;
        case 5: return (i * j) % 2 + (i * j) % 3 === 0;
        case 6: return ((i * j) % 2 + (i * j) % 3) % 2 === 0;
        case 7: return ((i * j) % 3 + (i + j) % 2) % 2 === 0;
        default: throw new Error("bad maskPattern:" + maskPattern);
      }
    },

    getErrorCorrectPolynomial: function(errorCorrectLength) {
      let a = new QRPolynomial([1], 0);
      for (let i = 0; i < errorCorrectLength; i++) {
        a = a.multiply(new QRPolynomial([1, QRMath.gexp(i)], 0));
      }
      return a;
    },

    getLengthInBits: function(version) {
      return version < 10 ? 8 : 16;
    },

    getLostPoint: function(qrCode) {
      const moduleCount = qrCode.getModuleCount();
      let lostPoint = 0;

      // Condition 1: 5 or more same color in row/col
      for (let row = 0; row < moduleCount; row++) {
        for (let col = 0; col < moduleCount; col++) {
          let sameCount = 0;
          const dark = qrCode.isDark(row, col);
          for (let r = -1; r <= 1; r++) {
            if (row + r < 0 || moduleCount <= row + r) continue;
            for (let c = -1; c <= 1; c++) {
              if (col + c < 0 || moduleCount <= col + c) continue;
              if (r === 0 && c === 0) continue;
              if (dark === qrCode.isDark(row + r, col + c)) sameCount++;
            }
          }
          if (sameCount > 5) lostPoint += (3 + sameCount - 5);
        }
      }

      // Condition 2: 2x2 same color blocks
      for (let row = 0; row < moduleCount - 1; row++) {
        for (let col = 0; col < moduleCount - 1; col++) {
          let count = 0;
          if (qrCode.isDark(row, col)) count++;
          if (qrCode.isDark(row + 1, col)) count++;
          if (qrCode.isDark(row, col + 1)) count++;
          if (qrCode.isDark(row + 1, col + 1)) count++;
          if (count === 0 || count === 4) lostPoint += 3;
        }
      }

      // Condition 3: Finder-like pattern
      for (let row = 0; row < moduleCount; row++) {
        for (let col = 0; col < moduleCount - 6; col++) {
          if (qrCode.isDark(row, col) &&
              !qrCode.isDark(row, col + 1) &&
              qrCode.isDark(row, col + 2) &&
              qrCode.isDark(row, col + 3) &&
              qrCode.isDark(row, col + 4) &&
              !qrCode.isDark(row, col + 5) &&
              qrCode.isDark(row, col + 6)) {
            lostPoint += 40;
          }
        }
      }

      for (let col = 0; col < moduleCount; col++) {
        for (let row = 0; row < moduleCount - 6; row++) {
          if (qrCode.isDark(row, col) &&
              !qrCode.isDark(row + 1, col) &&
              qrCode.isDark(row + 2, col) &&
              qrCode.isDark(row + 3, col) &&
              qrCode.isDark(row + 4, col) &&
              !qrCode.isDark(row + 5, col) &&
              qrCode.isDark(row + 6, col)) {
            lostPoint += 40;
          }
        }
      }

      // Condition 4: Dark / Light ratio
      let darkCount = 0;
      for (let col = 0; col < moduleCount; col++) {
        for (let row = 0; row < moduleCount; row++) {
          if (qrCode.isDark(row, col)) darkCount++;
        }
      }
      const ratio = Math.abs(100 * darkCount / moduleCount / moduleCount - 50) / 5;
      lostPoint += ratio * 10;
      return lostPoint;
    }
  };

  // 6. BitBuffer Class
  function QRBitBuffer() {
    this.buffer = [];
    this.length = 0;
  }
  QRBitBuffer.prototype = {
    get: function(index) {
      const bufIndex = Math.floor(index / 8);
      return ((this.buffer[bufIndex] >>> (7 - index % 8)) & 1) === 1;
    },
    put: function(num, length) {
      for (let i = 0; i < length; i++) {
        this.putBit(((num >>> (length - i - 1)) & 1) === 1);
      }
    },
    getLengthInBits: function() {
      return this.length;
    },
    putBit: function(bit) {
      const bufIndex = Math.floor(this.length / 8);
      if (this.buffer.length <= bufIndex) this.buffer.push(0);
      if (bit) this.buffer[bufIndex] |= (0x80 >>> (this.length % 8));
      this.length++;
    }
  };

  // 7. QR Model Engine
  function QRCodeModel(version, ecl) {
    this.version = version;
    this.ecl = ecl;
    this.modules = null;
    this.moduleCount = 0;
    this.dataList = [];
  }

  QRCodeModel.prototype = {
    addData: function(data) {
      this.dataList.push(data);
    },
    isDark: function(row, col) {
      if (row < 0 || this.moduleCount <= row || col < 0 || this.moduleCount <= col) {
        throw new Error(row + "," + col);
      }
      return this.modules[row][col];
    },
    getModuleCount: function() {
      return this.moduleCount;
    },
    make: function() {
      let minLostPoint = Infinity;
      let pattern = 0;
      let bestModules = null;

      for (let i = 0; i < 8; i++) {
        this.makeImpl(false, i);
        const lostPoint = QRUtil.getLostPoint(this);
        if (lostPoint < minLostPoint) {
          minLostPoint = lostPoint;
          pattern = i;
          bestModules = this.modules;
        }
      }
      this.modules = bestModules;
      this.makeImpl(false, pattern);
    },
    makeImpl: function(test, maskPattern) {
      this.moduleCount = this.version * 4 + 17;
      this.modules = new Array(this.moduleCount);
      for (let row = 0; row < this.moduleCount; row++) {
        this.modules[row] = new Array(this.moduleCount).fill(null);
      }

      this.setupPositionProbePattern(0, 0);
      this.setupPositionProbePattern(this.moduleCount - 7, 0);
      this.setupPositionProbePattern(0, this.moduleCount - 7);
      this.setupPositionAdjustPattern();
      this.setupTimingPattern();
      this.setupTypeInfo(test, maskPattern);

      const data = QRCodeModel.createData(this.version, this.ecl, this.dataList);
      this.mapData(data, maskPattern);
    },
    setupPositionProbePattern: function(row, col) {
      for (let r = -1; r <= 7; r++) {
        if (row + r <= -1 || this.moduleCount <= row + r) continue;
        for (let c = -1; c <= 7; c++) {
          if (col + c <= -1 || this.moduleCount <= col + c) continue;
          if ((0 <= r && r <= 6 && (c === 0 || c === 6)) ||
              (0 <= c && c <= 6 && (r === 0 || r === 6)) ||
              (2 <= r && r <= 4 && 2 <= c && c <= 4)) {
            this.modules[row + r][col + c] = true;
          } else {
            this.modules[row + r][col + c] = false;
          }
        }
      }
    },
    setupTimingPattern: function() {
      for (let r = 8; r < this.moduleCount - 8; r++) {
        if (this.modules[r][6] !== null) continue;
        this.modules[r][6] = (r % 2 === 0);
      }
      for (let c = 8; c < this.moduleCount - 8; c++) {
        if (this.modules[6][c] !== null) continue;
        this.modules[6][c] = (c % 2 === 0);
      }
    },
    setupPositionAdjustPattern: function() {
      const pos = QRUtil.getPatternPosition(this.version);
      for (let i = 0; i < pos.length; i++) {
        for (let j = 0; j < pos.length; j++) {
          const row = pos[i];
          const col = pos[j];
          if (this.modules[row][col] !== null) continue;
          for (let r = -2; r <= 2; r++) {
            for (let c = -2; c <= 2; c++) {
              if (r === -2 || r === 2 || c === -2 || c === 2 || (r === 0 && c === 0)) {
                this.modules[row + r][col + c] = true;
              } else {
                this.modules[row + r][col + c] = false;
              }
            }
          }
        }
      }
    },
    setupTypeInfo: function(test, maskPattern) {
      const data = (this.ecl << 3) | maskPattern;
      const bits = QRUtil.getBCHTypeInfo(data);

      for (let i = 0; i < 15; i++) {
        const mod = (!test && ((bits >> i) & 1) === 1);
        if (i < 6) this.modules[i][8] = mod;
        else if (i < 8) this.modules[i + 1][8] = mod;
        else this.modules[this.moduleCount - 15 + i][8] = mod;
      }

      for (let i = 0; i < 15; i++) {
        const mod = (!test && ((bits >> i) & 1) === 1);
        if (i < 8) this.modules[8][this.moduleCount - i - 1] = mod;
        else if (i < 9) this.modules[8][15 - i - 1 + 1] = mod;
        else this.modules[8][15 - i - 1] = mod;
      }

      // Fixed Dark Module
      this.modules[this.moduleCount - 8][8] = !test;
    },
    mapData: function(data, maskPattern) {
      let inc = -1;
      let row = this.moduleCount - 1;
      let bitIndex = 7;
      let byteIndex = 0;

      for (let col = this.moduleCount - 1; col > 0; col -= 2) {
        if (col === 6) col--;
        while (true) {
          for (let c = 0; c < 2; c++) {
            if (this.modules[row][col - c] === null) {
              let dark = false;
              if (byteIndex < data.length) {
                dark = (((data[byteIndex] >>> bitIndex) & 1) === 1);
              }
              const mask = QRUtil.getMask(maskPattern, row, col - c);
              if (mask) dark = !dark;
              this.modules[row][col - c] = dark;
              bitIndex--;
              if (bitIndex === -1) {
                byteIndex++;
                bitIndex = 7;
              }
            }
          }
          row += inc;
          if (row < 0 || this.moduleCount <= row) {
            row -= inc;
            inc = -inc;
            break;
          }
        }
      }
    }
  };

  QRCodeModel.createData = function(version, ecl, dataList) {
    const rsBlocks = QRRSBlock.getRSBlocks(version, ecl);
    const buffer = new QRBitBuffer();

    for (let i = 0; i < dataList.length; i++) {
      const data = dataList[i];
      buffer.put(4, 4); // 8-bit byte mode indicator (0100)
      buffer.put(data.length, QRUtil.getLengthInBits(version));
      for (let j = 0; j < data.length; j++) {
        buffer.put(data.charCodeAt(j), 8);
      }
    }

    let totalDataCount = 0;
    for (let i = 0; i < rsBlocks.length; i++) {
      totalDataCount += rsBlocks[i].dataCount;
    }

    if (buffer.getLengthInBits() > totalDataCount * 8) {
      throw new Error("Data overflow: " + buffer.getLengthInBits() + " bits > " + (totalDataCount * 8) + " capacity");
    }

    // Terminator (up to 4 zeroes)
    if (buffer.getLengthInBits() + 4 <= totalDataCount * 8) {
      buffer.put(0, 4);
    } else {
      buffer.put(0, totalDataCount * 8 - buffer.getLengthInBits());
    }

    // Padding to byte boundary
    while (buffer.getLengthInBits() % 8 !== 0) {
      buffer.putBit(false);
    }

    // Pad bytes 0xEC and 0x11
    while (buffer.getLengthInBits() < totalDataCount * 8) {
      buffer.put(0xEC, 8);
      if (buffer.getLengthInBits() < totalDataCount * 8) {
        buffer.put(0x11, 8);
      }
    }

    return QRCodeModel.createBytes(buffer, rsBlocks);
  };

  QRCodeModel.createBytes = function(buffer, rsBlocks) {
    let offset = 0;
    let maxDcCount = 0;
    let maxEcCount = 0;
    const dcdata = new Array(rsBlocks.length);
    const ecdata = new Array(rsBlocks.length);

    for (let r = 0; r < rsBlocks.length; r++) {
      const dcCount = rsBlocks[r].dataCount;
      const ecCount = rsBlocks[r].totalCount - dcCount;
      maxDcCount = Math.max(maxDcCount, dcCount);
      maxEcCount = Math.max(maxEcCount, ecCount);

      dcdata[r] = new Array(dcCount);
      for (let i = 0; i < dcdata[r].length; i++) {
        dcdata[r][i] = 0xFF & buffer.buffer[i + offset];
      }
      offset += dcCount;

      const rsPoly = QRUtil.getErrorCorrectPolynomial(ecCount);
      const rawPoly = new QRPolynomial(dcdata[r], rsPoly.getLength() - 1);
      const modPoly = rawPoly.mod(rsPoly);

      ecdata[r] = new Array(rsPoly.getLength() - 1);
      for (let i = 0; i < ecdata[r].length; i++) {
        const modIndex = i + modPoly.getLength() - ecdata[r].length;
        ecdata[r][i] = (modIndex >= 0) ? modPoly.get(modIndex) : 0;
      }
    }

    let totalCodeCount = 0;
    for (let i = 0; i < rsBlocks.length; i++) totalCodeCount += rsBlocks[i].totalCount;
    const data = new Array(totalCodeCount);
    let index = 0;

    for (let i = 0; i < maxDcCount; i++) {
      for (let r = 0; r < rsBlocks.length; r++) {
        if (i < dcdata[r].length) data[index++] = dcdata[r][i];
      }
    }

    for (let i = 0; i < maxEcCount; i++) {
      for (let r = 0; r < rsBlocks.length; r++) {
        if (i < ecdata[r].length) data[index++] = ecdata[r][i];
      }
    }

    return data;
  };

  // 8. Auto Version Selection & Public Generation Function
  function generateRealQR(text, preferredEcl) {
    const ecl = (preferredEcl !== undefined) ? preferredEcl : QRECL.M;
    // Iterate from Version 1 up to 10 to find smallest fitting version
    for (let ver = 1; ver <= 10; ver++) {
      try {
        const qr = new QRCodeModel(ver, ecl);
        qr.addData(text);
        qr.make();
        return qr;
      } catch (e) {
        // Continue to larger version if data overflow
      }
    }
    // Fallback: If still doesn't fit with preferred ECL, try with ECL Level L
    for (let ver = 1; ver <= 10; ver++) {
      try {
        const qr = new QRCodeModel(ver, QRECL.L);
        qr.addData(text);
        qr.make();
        return qr;
      } catch (e) {}
    }
    throw new Error("Text is too long to encode in QR code (max ~200 characters)");
  }

  // Export internal engine
  global.QRCodeEngine = {
    generate: generateRealQR,
    ECL: QRECL
  };

})(window);

/* ==========================================================================
   CANVAS STAND-PRINT & PURE QR RENDERER
   ========================================================================== */

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
  return "https://fri-chicks-menu.vercel.app";
}

/**
 * Builds the final full target URL for the QR code:
 * E.g. https://fri-chicks.vercel.app/?table=5
 */
function buildQRTargetUrl(tableVal, customBaseUrl) {
  let base = (customBaseUrl && customBaseUrl.trim()) ? customBaseUrl.trim() : getResolvedBaseUrl();
  // Ensure protocol exists
  if (!base.startsWith("http://") && !base.startsWith("https://")) {
    base = "https://" + base;
  }
  const cleanTable = tableVal ? String(tableVal).replace(/^(table\s*)/i, "").trim() : "";
  if (!cleanTable) return base;
  const separator = base.includes("?") ? "&" : "?";
  return `${base}${separator}table=${encodeURIComponent(cleanTable)}`;
}

/**
 * Renders the High-Resolution Acrylic Standee (500x660 px)
 * Conforming to real ISO/IEC 18004 QR standards with centered Fri-Chicks logo
 */
function drawTableStandee(canvas, tableVal, customBaseUrl) {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const targetUrl = buildQRTargetUrl(tableVal, customBaseUrl);

  const w = canvas.width;
  const h = canvas.height;

  // Background
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, w, h);

  // Outer Decorative Rounded Border
  ctx.strokeStyle = "#F5A12E";
  ctx.lineWidth = 10;
  ctx.strokeRect(5, 5, w - 10, h - 10);

  // Header Banner
  ctx.fillStyle = "#F5A12E";
  ctx.fillRect(10, 10, w - 20, 104);

  // Header Restaurant Brand
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "900 32px 'Plus Jakarta Sans', system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("FRI-CHICKS JHANG", w / 2, 54);

  ctx.font = "800 14px 'Plus Jakarta Sans', system-ui, sans-serif";
  ctx.fillText("SMART QR MENU & DIRECT WHATSAPP ORDERING", w / 2, 84);

  // Table Badge
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

  // Generate REAL Standard QR Code (Level Q: 25% error correction allows centered logo safely)
  const qr = QRCodeEngine.generate(targetUrl, QRCodeEngine.ECL.Q);
  const count = qr.getModuleCount();
  const qrSizePx = 280;
  const moduleSize = qrSizePx / count;
  const startX = (w - qrSizePx) / 2;
  const startY = 190;

  // Draw QR Modules
  ctx.fillStyle = "#1C1917";
  for (let r = 0; r < count; r++) {
    for (let c = 0; c < count; c++) {
      if (qr.isDark(r, c)) {
        ctx.fillRect(
          Math.round(startX + c * moduleSize),
          Math.round(startY + r * moduleSize),
          Math.ceil(moduleSize),
          Math.ceil(moduleSize)
        );
      }
    }
  }

  // Draw Centered Logo with White Protective Buffer Ring
  const logoSize = 60;
  const centerX = w / 2;
  const centerY = startY + qrSizePx / 2;

  // Solid White Buffer Circle to protect QR modules from edge overlap
  ctx.fillStyle = "#FFFFFF";
  ctx.beginPath();
  ctx.arc(centerX, centerY, logoSize / 2 + 5, 0, Math.PI * 2);
  ctx.fill();

  // Orange Outer Ring
  ctx.lineWidth = 3;
  ctx.strokeStyle = "#F5A12E";
  ctx.stroke();

  // Draw Logo Image (or fallback text)
  const logoImg = new Image();
  logoImg.onload = function() {
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, logoSize / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(logoImg, centerX - logoSize / 2, centerY - logoSize / 2, logoSize, logoSize);
    ctx.restore();
  };
  logoImg.onerror = function() {
    ctx.fillStyle = "#F5A12E";
    ctx.font = "900 20px 'Plus Jakarta Sans', sans-serif";
    ctx.fillText("FC", centerX, centerY + 7);
  };
  logoImg.src = "assets/logo.png";

  // Footer Instructions
  ctx.fillStyle = "#4B5563";
  ctx.font = "800 13.5px 'Plus Jakarta Sans', system-ui, sans-serif";
  ctx.fillText("Scan with your mobile camera to browse & order", w / 2, 505);

  ctx.font = "900 15px 'Plus Jakarta Sans', system-ui, sans-serif";
  ctx.fillStyle = "#16A34A";
  ctx.fillText("✓ Instant Kitchen & WhatsApp Service • Since 2002", w / 2, 532);

  // Target Scanned URL printed in footer for staff verification
  ctx.font = "700 11px monospace";
  ctx.fillStyle = "#6B7280";
  const displayUrl = targetUrl.length > 50 ? targetUrl.substring(0, 48) + "..." : targetUrl;
  ctx.fillText(displayUrl, w / 2, 560);

  ctx.font = "700 13px 'Plus Jakarta Sans', system-ui, sans-serif";
  ctx.fillStyle = "#B45309";
  ctx.fillText("Sargodha Road, near Punjab Battery Plaza, Jhang Sadar", w / 2, 615);
  ctx.fillText("Call: 0300 0626250", w / 2, 636);
}

/**
 * Downloads the Standee as PNG
 */
function downloadStandeePNG(canvas, filename) {
  if (!canvas) return;
  const link = document.createElement("a");
  link.download = filename || "Fri-Chicks-QR-Standee.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
}

/**
 * Renders pure QR Code only (for stickers/receipts)
 */
function drawPureQR(canvas, targetUrl) {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const w = canvas.width;
  const h = canvas.height;

  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, w, h);

  const qr = QRCodeEngine.generate(targetUrl, QRCodeEngine.ECL.M);
  const count = qr.getModuleCount();
  const pad = 24;
  const qrSize = w - pad * 2;
  const modSize = qrSize / count;

  ctx.fillStyle = "#000000";
  for (let r = 0; r < count; r++) {
    for (let c = 0; c < count; c++) {
      if (qr.isDark(r, c)) {
        ctx.fillRect(
          Math.round(pad + c * modSize),
          Math.round(pad + r * modSize),
          Math.ceil(modSize),
          Math.ceil(modSize)
        );
      }
    }
  }
}
