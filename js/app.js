/* ==========================================================================
   FRI-CHICKS DIGITAL QR MENU - MASTER APP CONTROLLER
   End-to-End Restaurant Workflow: Customer ➔ Cashier POS ➔ Kitchen KDS ➔ Super Admin
   Table Auto-Detection, Live Order Tracking & Real-Time Sync
   ========================================================================== */

// Global State
let lang = localStorage.getItem("fc_lang") || "en";
let activeCat = "all";
let orderType = "delivery";
let searchQuery = "";
let tableNumber = localStorage.getItem("fc_current_table") || "";
let curEnteredPin = "";
let curModalItem = null;
let curModalSizeIdx = 0;
let curModalQty = 1;
let currentAdminStation = "admin"; // 'admin' | 'cashier' | 'kitchen'
let selectedAuthRole = "admin";    // 'admin' | 'cashier' | 'kitchen'
let currentLoggedInRole = null;    // 'admin' | 'cashier' | 'kitchen' | null
let activeCustomerOrderId = localStorage.getItem("fc_customer_active_order") || "";

const selSizes = {};     // { itemId: sizeIndex }
const cart = {};         // { 'id|size': { id, si, q, notes } }

const $ = id => document.getElementById(id);
const tr = () => T[lang];
const fmt = n => Number(n).toLocaleString("en-US");
const sizeKeys = ["S", "M", "L"];

function priceOf(it, si) {
  if (!it) return 0;
  return it.sizes ? it.sizes[si] : it.price;
}
function keyOf(id, si) {
  return id + "|" + (si != null ? si : 0);
}

/* Toast Notification */
let toastTimer = null;
function showToast(msg, isWarn = false) {
  const el = $("toast");
  el.textContent = msg;
  el.className = "toast-msg show" + (isWarn ? " warn" : "");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    el.className = "toast-msg";
  }, 3200);
}

function showUndoToast(msg, orderId) {
  const el = $("toast");
  el.innerHTML = `<span>${msg}</span> <button class="toast-undo-btn" onclick="handleUndoOrderStatus('${orderId}')">Undo / واپس کریں</button>`;
  el.className = "toast-msg show";
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    el.className = "toast-msg";
  }, 5000);
}

/* ==========================================================================
   1. TABLE QR AUTO-DETECTION & INSTANT TABLE CHANGING
   ========================================================================== */
function checkTableUrlParam() {
  const params = new URLSearchParams(window.location.search);
  const tbl = params.get("table") || params.get("t");
  if (tbl) {
    tableNumber = tbl.trim();
    localStorage.setItem("fc_current_table", tableNumber);
    orderType = "dinein";
  }
  updateTableDisplay();
}

function updateTableDisplay() {
  const bar = $("tableDetectedBar");
  if (tableNumber) {
    bar.classList.remove("hidden");
    $("tableDetectedText").textContent = tr().tableAlert;
    $("tableBadgeNumber").textContent = `Table ${tableNumber}`;
  } else {
    bar.classList.add("hidden");
  }
}

// Open Table Quick Picker Modal
function openTablePicker() {
  const backdrop = $("modalBackdrop");
  const modal = $("tablePickerModal");
  backdrop.style.display = "block";
  modal.style.display = "block";
  setTimeout(() => {
    backdrop.style.opacity = "1";
    modal.classList.add("open");
  }, 10);
}

function closeTablePicker() {
  const backdrop = $("modalBackdrop");
  const modal = $("tablePickerModal");
  modal.classList.remove("open");
  backdrop.style.opacity = "0";
  setTimeout(() => {
    modal.style.display = "none";
    backdrop.style.display = "none";
  }, 200);
}

function selectCustomTable(tbl) {
  tableNumber = String(tbl).trim();
  localStorage.setItem("fc_current_table", tableNumber);
  orderType = "dinein";
  updateTableDisplay();
  closeTablePicker();
  showToast(`🍽️ Table ${tableNumber} selected`);
  render();
  if ($("cartSheet").style.display === "block") refreshCartSheet();
}

/* ====== SCROLL CONTROLLER: PINNED LOGO & SLIM OFFER BAR ====== */
function initScrollController() {
  const logoAnchor = $("heroLogoAnchor");
  const slimBar = $("slimOfferBar");

  window.addEventListener("scroll", () => {
    const scrollY = window.scrollY || document.documentElement.scrollTop;
    if (scrollY > 130) {
      logoAnchor.classList.add("is-pinned");
      slimBar.classList.add("visible");
    } else {
      logoAnchor.classList.remove("is-pinned");
      slimBar.classList.remove("visible");
    }
  }, { passive: true });
}

/* ====== HERO AUTO-SCROLLING CAROUSEL ====== */
let curSlide = 0;
const totalSlides = 5;
let carouselTimer = null;

function setSlide(idx) {
  curSlide = (idx + totalSlides) % totalSlides;
  const isRtl = lang === "ur";
  const translateVal = (isRtl ? 1 : -1) * (curSlide * 100);
  $("heroCarousel").style.transform = `translateX(${translateVal}%)`;
  document.querySelectorAll(".carousel-dot").forEach((dot, i) => {
    dot.classList.toggle("active", i === curSlide);
  });
}

function startCarousel() {
  stopCarousel();
  carouselTimer = setInterval(() => {
    setSlide(curSlide + 1);
  }, 3800);
}

function stopCarousel() {
  if (carouselTimer) clearInterval(carouselTimer);
}

function initCarouselTouch() {
  let startX = 0;
  const el = $("heroCarousel");
  el.addEventListener("touchstart", e => {
    startX = e.changedTouches[0].screenX;
    stopCarousel();
  }, { passive: true });

  el.addEventListener("touchend", e => {
    const endX = e.changedTouches[0].screenX;
    const diff = endX - startX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        setSlide(lang === "ur" ? curSlide + 1 : curSlide - 1);
      } else {
        setSlide(lang === "ur" ? curSlide - 1 : curSlide + 1);
      }
    }
    startCarousel();
  }, { passive: true });

  document.querySelectorAll(".carousel-dot").forEach(d => {
    d.addEventListener("click", () => {
      setSlide(Number(d.dataset.index));
      startCarousel();
    });
  });
}

/* ====== RENDER MAIN MENU ====== */
function render() {
  const t = tr();
  document.body.classList.toggle("ur", lang === "ur");
  document.documentElement.lang = lang;

  $("langBtnText").textContent = lang === "en" ? "اردو" : "English";
  $("demoBanner").classList.toggle("hidden", !CONFIG.samplePricesNotice);
  $("demoText").textContent = t.demo;

  $("l_open").textContent = t.open;
  $("v_open").textContent = t.openv;
  $("l_loc").textContent = t.loc;
  $("v_loc").textContent = t.locv;
  $("footerText").innerHTML = t.foot;

  $("slimOfferTicker").textContent = t.offerTicker;
  $("searchInput").placeholder = t.searchPlaceholder;

  $("t_cart").textContent = t.cart;
  $("t_subtotal").textContent = t.subtotal;
  $("t_delivery").textContent = t.delivery;
  $("t_grand").textContent = t.total;
  $("o_del").textContent = t.del;
  $("o_din").textContent = t.din;
  $("o_pick").textContent = t.pick;
  $("custName").placeholder = t.nm;
  $("custPhone").placeholder = t.ph;
  $("cartSpecialInstructions").placeholder = t.cartInstructions;
  $("sendBtnLabel").textContent = t.send;

  updateAddressFieldState();

  const allChips = [{ id: "all", en: t.all, ur: t.all }, ...CATS];
  $("chipsNav").innerHTML = allChips.map(c => `
    <button class="chip ${activeCat === c.id ? 'on' : ''}" data-cat="${c.id}">
      ${lang === "ur" ? (c.ur || c.en) : c.en}
    </button>
  `).join("");

  const q = searchQuery.trim().toLowerCase();
  let filtered = ITEMS.filter(it => {
    const matchCat = (activeCat === "all" || it.cat === activeCat);
    if (!matchCat) return false;
    if (!q) return true;
    const nameMatch = (it.n && it.n.toLowerCase().includes(q)) || (it.n_ur && it.n_ur.includes(q));
    const descMatch = (it.d && it.d.toLowerCase().includes(q)) || (it.d_ur && it.d_ur.includes(q));
    return nameMatch || descMatch;
  });

  if (filtered.length === 0) {
    $("menuContainer").innerHTML = `
      <div style="text-align:center;padding:45px 20px;color:var(--muted)">
        <span style="font-size:42px;display:block;margin-bottom:8px">🔍</span>
        <p>${t.noResults}</p>
      </div>
    `;
  } else {
    let html = "";
    CATS.forEach(c => {
      const catItems = filtered.filter(i => i.cat === c.id);
      if (catItems.length === 0) return;

      const catTitle = lang === "ur" ? c.ur : c.en;
      html += `
        <h2 class="cat-title">
          <span>${catTitle}</span>
          <span class="cat-badge">${catItems.length}</span>
        </h2>
      `;

      catItems.forEach(it => {
        if (selSizes[it.id] == null) selSizes[it.id] = 0;
        const si = selSizes[it.id];
        const k = keyOf(it.id, si);
        const q = cart[k] ? cart[k].q : 0;
        const itemTitle = (lang === "ur" && it.n_ur) ? it.n_ur : it.n;
        const itemDesc = (lang === "ur" && it.d_ur) ? it.d_ur : it.d;
        const curPrice = priceOf(it, si);
        const isOutOfStock = !!it.outOfStock;

        let ctrlHtml = "";
        if (isOutOfStock) {
          ctrlHtml = `<span style="font-size:12px;font-weight:700;color:var(--danger)">${t.soldOut}</span>`;
        } else if (q > 0) {
          ctrlHtml = `
            <div class="qty-ctrl">
              <button data-sub="${k}">−</button>
              <span>${q}</span>
              <button data-add="${it.id}|${si}">+</button>
            </div>
          `;
        } else {
          ctrlHtml = `
            <button class="add-btn" data-add="${it.id}|${si}">${t.add} +</button>
          `;
        }

        if (c.id === "deals") {
          html += `
            <div class="deal-card ${isOutOfStock ? 'out-of-stock' : ''}" data-item-id="${it.id}">
              <span class="deal-tag">${t.dealTag}</span>
              ${isOutOfStock ? `<span class="sold-out-badge">${t.soldOut}</span>` : ''}
              <div class="deal-img-wrap">
                <img src="${it.img}" alt="${itemTitle}" loading="lazy" onerror="this.src='assets/logo.png'">
              </div>
              <div class="deal-info">
                <h3>${itemTitle}</h3>
                <p>${itemDesc}</p>
                <div class="deal-price">${t.rs} ${fmt(curPrice)}</div>
                <div style="margin-top:8px;display:flex;justify-content:flex-end">
                  ${ctrlHtml}
                </div>
              </div>
            </div>
          `;
        } else {
          const sizesHtml = it.sizes ? `
            <div class="sizes-group">
              ${it.sizes.map((p, i) => `
                <button class="sz-btn ${i === si ? 'on' : ''}" data-sz="${it.id}|${i}">
                  ${t.sizes[sizeKeys[i]]}
                </button>
              `).join("")}
            </div>
          ` : `<div></div>`;

          html += `
            <div class="item-card ${isOutOfStock ? 'out-of-stock' : ''}" data-item-id="${it.id}">
              ${isOutOfStock ? `<span class="sold-out-badge">${t.soldOut}</span>` : ''}
              <div class="item-img-wrap">
                <img src="${it.img}" alt="${itemTitle}" loading="lazy" onerror="this.src='assets/logo.png'">
              </div>
              <div class="item-body">
                <div>
                  <h3>${itemTitle}</h3>
                  <p>${itemDesc}</p>
                </div>
                <div class="item-actions">
                  ${sizesHtml}
                  <span class="item-price">${t.rs} ${fmt(curPrice)}</span>
                </div>
                <div style="display:flex;justify-content:flex-end;margin-top:8px">
                  ${ctrlHtml}
                </div>
              </div>
            </div>
          `;
        }
      });
    });
    $("menuContainer").innerHTML = html;
  }

  updateFloatingBar();
}

/* ====== ITEM DETAIL POPUP ====== */
function openItemDetailModal(itemId) {
  const it = ITEMS.find(i => i.id === itemId);
  if (!it) return;
  curModalItem = it;
  curModalSizeIdx = selSizes[it.id] || 0;
  curModalQty = 1;

  const t = tr();
  const itemTitle = (lang === "ur" && it.n_ur) ? it.n_ur : it.n;
  const itemDesc = (lang === "ur" && it.d_ur) ? it.d_ur : it.d;
  const catObj = CATS.find(c => c.id === it.cat);

  $("modalHeroImg").src = it.img;
  $("modalCatTag").textContent = catObj ? (lang === "ur" ? catObj.ur : catObj.en) : "";
  $("modalItemTitle").textContent = itemTitle;
  $("modalItemDesc").textContent = itemDesc;
  $("modalSpecialNotes").value = "";

  const sizesContainer = $("modalSizesContainer");
  const sizesList = $("modalSizesList");
  if (it.sizes) {
    sizesContainer.style.display = "block";
    sizesList.innerHTML = it.sizes.map((p, i) => `
      <div class="modal-sz-btn ${i === curModalSizeIdx ? 'on' : ''}" data-msz="${i}">
        <b>${t.sizes[sizeKeys[i]]}</b>
        <small>${t.rs} ${fmt(p)}</small>
      </div>
    `).join("");
  } else {
    sizesContainer.style.display = "none";
  }

  updateModalPrice();

  const backdrop = $("modalBackdrop");
  const modal = $("itemDetailModal");
  backdrop.style.display = "block";
  modal.style.display = "block";
  setTimeout(() => {
    backdrop.style.opacity = "1";
    modal.classList.add("open");
  }, 10);
}

function updateModalPrice() {
  if (!curModalItem) return;
  const t = tr();
  const unitPrice = priceOf(curModalItem, curModalSizeIdx);
  const total = curModalQty * unitPrice;
  $("modalQtyVal").textContent = curModalQty;
  $("modalAddPrice").textContent = `${t.rs} ${fmt(total)}`;
  $("modalAddLabel").textContent = t.modalAdd;
}

function closeItemDetailModal() {
  const backdrop = $("modalBackdrop");
  const modal = $("itemDetailModal");
  backdrop.style.opacity = "0";
  modal.classList.remove("open");
  setTimeout(() => {
    backdrop.style.display = "none";
    modal.style.display = "none";
  }, 260);
}

$("modalQtyPlus").addEventListener("click", () => {
  curModalQty++;
  updateModalPrice();
});
$("modalQtyMinus").addEventListener("click", () => {
  if (curModalQty > 1) {
    curModalQty--;
    updateModalPrice();
  }
});

$("modalSizesList").addEventListener("click", e => {
  const btn = e.target.closest(".modal-sz-btn");
  if (!btn) return;
  curModalSizeIdx = Number(btn.dataset.msz);
  document.querySelectorAll(".modal-sz-btn").forEach(b => b.classList.toggle("on", b === btn));
  selSizes[curModalItem.id] = curModalSizeIdx;
  updateModalPrice();
});

$("modalAddToCartBtn").addEventListener("click", () => {
  if (!curModalItem) return;
  const k = keyOf(curModalItem.id, curModalSizeIdx);
  const notes = $("modalSpecialNotes").value.trim();

  cart[k] = cart[k] || { id: curModalItem.id, si: curModalSizeIdx, q: 0, notes: "" };
  cart[k].q += curModalQty;
  if (notes) cart[k].notes = notes;

  showToast(`✅ ${curModalItem.n} ${tr().added}`);
  closeItemDetailModal();
  render();
});

$("closeItemModal").addEventListener("click", closeItemDetailModal);

/* ====== CART & TOTALS ====== */
function getTotals() {
  let count = 0;
  let subtotal = 0;
  Object.values(cart).forEach(l => {
    const it = ITEMS.find(i => i.id === l.id);
    if (!it) return;
    count += l.q;
    subtotal += l.q * priceOf(it, l.si);
  });

  let delivery = 0;
  if (orderType === "delivery" && count > 0) {
    delivery = subtotal >= CONFIG.freeDeliveryThreshold ? 0 : CONFIG.deliveryFee;
  }
  const grandTotal = subtotal + delivery;
  return { count, subtotal, delivery, grandTotal };
}

function updateFloatingBar() {
  const { count, subtotal } = getTotals();
  const t = tr();
  const bar = $("bottomBar");
  const slimCount = $("slimCartCount");

  if (count > 0) {
    bar.style.display = "block";
    $("barCount").textContent = `🛒 ${count} ${t.view}`;
    $("barTotal").textContent = `${t.rs} ${fmt(subtotal)}`;
    slimCount.style.display = "block";
    slimCount.textContent = count;
  } else {
    bar.style.display = "none";
    slimCount.style.display = "none";
  }
  positionFloatingTrackerBar();
}

function addToCart(id, si) {
  const k = keyOf(id, si);
  cart[k] = cart[k] || { id, si: (si != null ? si : 0), q: 0, notes: "" };
  cart[k].q++;
  render();
  if ($("cartSheet").style.display === "block") refreshCartSheet();
}

function removeFromCart(k) {
  if (cart[k]) {
    cart[k].q--;
    if (cart[k].q <= 0) delete cart[k];
  }
  render();
  if ($("cartSheet").style.display === "block") refreshCartSheet();
}

/* Dedicated Table Controls in Cart */
function updateAddressFieldState() {
  const t = tr();
  const addr = $("custAddress");
  const tblContainer = $("cartTableContainer");

  if (orderType === "delivery") {
    addr.style.display = "block";
    addr.placeholder = t.ad;
    tblContainer.style.display = "none";
    $("deliveryRow").style.display = "flex";
  } else if (orderType === "dinein") {
    addr.style.display = "none";
    tblContainer.style.display = "block";
    $("cartTableInput").value = tableNumber || "";
    $("deliveryRow").style.display = "none";
  } else { // pickup
    addr.style.display = "none";
    tblContainer.style.display = "none";
    $("deliveryRow").style.display = "none";
  }
}

function refreshCartSheet() {
  const t = tr();
  const { count, subtotal, delivery, grandTotal } = getTotals();

  if (count === 0) {
    $("cartLines").innerHTML = `<div style="text-align:center;padding:24px 0;color:var(--muted)">🛒 ${t.empty}</div>`;
  } else {
    const lines = Object.entries(cart).map(([k, l]) => {
      const it = ITEMS.find(i => i.id === l.id);
      if (!it) return "";
      const itemTitle = (lang === "ur" && it.n_ur) ? it.n_ur : it.n;
      const szText = it.sizes ? ` (${t.sizes[sizeKeys[l.si]]})` : "";
      const noteText = l.notes ? `<small style="color:var(--orange-d)">Note: ${l.notes}</small>` : "";
      const lineCost = l.q * priceOf(it, l.si);

      return `
        <div class="cart-line">
          <div class="cart-line-info">
            <div class="title">${itemTitle}${szText}</div>
            <small>${t.rs} ${fmt(priceOf(it, l.si))} each</small>
            ${noteText}
          </div>
          <div class="qty-ctrl">
            <button data-sub="${k}">−</button>
            <span>${l.q}</span>
            <button data-add="${l.id}|${l.si}">+</button>
          </div>
          <div class="cart-line-price">${t.rs} ${fmt(lineCost)}</div>
        </div>
      `;
    }).join("");
    $("cartLines").innerHTML = lines;
  }

  $("cartSubtotal").textContent = `${t.rs} ${fmt(subtotal)}`;

  if (orderType === "delivery") {
    if (delivery === 0 && subtotal > 0) {
      $("cartDelivery").innerHTML = `<span class="badge-free">${t.free}</span>`;
    } else {
      $("cartDelivery").textContent = `${t.rs} ${fmt(delivery)}`;
    }
  }

  $("cartGrandTotal").textContent = `${t.rs} ${fmt(grandTotal)}`;
}

function openCartSheet() {
  const { count } = getTotals();
  if (count === 0) {
    showToast(tr().warnEmpty, true);
    return;
  }

  if (!$("custName").value) {
    $("custName").value = localStorage.getItem("fc_name") || "";
  }
  if (!$("custPhone").value) {
    $("custPhone").value = localStorage.getItem("fc_phone") || "";
  }

  refreshCartSheet();
  updateAddressFieldState();

  const backdrop = $("modalBackdrop");
  const modal = $("cartSheet");
  backdrop.style.display = "block";
  modal.style.display = "block";
  setTimeout(() => {
    backdrop.style.opacity = "1";
    modal.classList.add("open");
  }, 10);
}

function closeCartSheet() {
  const backdrop = $("modalBackdrop");
  const modal = $("cartSheet");
  backdrop.style.opacity = "0";
  modal.classList.remove("open");
  setTimeout(() => {
    backdrop.style.display = "none";
    modal.style.display = "none";
  }, 250);
}

/* ==========================================================================
   2. SUBMIT ORDER: CUSTOMER ➔ CASHIER/KITCHEN PIPELINE + WHATSAPP BRIDGE
   ========================================================================== */
function sendOrderToWhatsApp() {
  const t = tr();
  const { count, subtotal, delivery, grandTotal } = getTotals();

  if (count === 0) {
    showToast(t.warnEmpty, true);
    return;
  }

  const nameInput = $("custName");
  const phoneInput = $("custPhone");
  const addrInput = $("custAddress");
  const tblInput = $("cartTableInput");
  const cartInstructions = $("cartSpecialInstructions").value.trim();

  const name = nameInput.value.trim();
  const phone = phoneInput.value.trim();
  const addr = addrInput.value.trim();
  const selectedTbl = tblInput ? tblInput.value.trim() : tableNumber;

  if (!name) {
    nameInput.classList.add("error");
    nameInput.focus();
    showToast(t.warnName, true);
    return;
  }
  nameInput.classList.remove("error");

  const phoneDigits = phone.replace(/\D/g, "");
  if (!phone || phoneDigits.length < 10) {
    phoneInput.classList.add("error");
    phoneInput.focus();
    showToast(t.warnPhone, true);
    return;
  }
  phoneInput.classList.remove("error");

  if (orderType === "delivery" && !addr) {
    addrInput.classList.add("error");
    addrInput.focus();
    showToast(t.warnAddress, true);
    return;
  }
  if (orderType === "dinein" && !selectedTbl) {
    tblInput.classList.add("error");
    tblInput.focus();
    showToast(t.warnTable, true);
    return;
  }

  localStorage.setItem("fc_name", name);
  localStorage.setItem("fc_phone", phone);
  if (selectedTbl) {
    tableNumber = selectedTbl;
    localStorage.setItem("fc_current_table", tableNumber);
    updateTableDisplay();
  }

  const orderedItemsList = [];
  const lines = [];

  const orderTypeTitle = {
    delivery: "🛵 Home / Office Delivery",
    dinein: `🍽️ Dine-in (Table ${tableNumber})`,
    pickup: "🛍️ Takeaway / Pickup"
  }[orderType];

  lines.push("🍗 *NEW ORDER – FRI-CHICKS JHANG*");
  lines.push("━━━━━━━━━━━━━━━━━━");
  lines.push(`📋 *Order Type:* ${orderTypeTitle}`);
  lines.push(`👤 *Customer:* ${name}`);
  lines.push(`📞 *Phone:* ${phone}`);

  if (orderType === "delivery") {
    lines.push(`📍 *Delivery Address:* ${addr}`);
  } else if (orderType === "dinein") {
    lines.push(`🪑 *Table Number:* Table ${tableNumber}`);
  }

  if (cartInstructions) {
    lines.push(`📝 *Special Instructions:* ${cartInstructions}`);
  }

  lines.push("━━━━━━━━━━━━━━━━━━");
  lines.push("*Ordered Items:*");

  Object.values(cart).forEach(l => {
    const it = ITEMS.find(i => i.id === l.id);
    if (!it) return;
    const szText = it.sizes ? ` (${T.en.sizes[sizeKeys[l.si]]})` : "";
    const noteText = l.notes ? ` [Note: ${l.notes}]` : "";
    const itemTotal = l.q * priceOf(it, l.si);

    lines.push(`• ${l.q}x ${it.n}${szText}${noteText} = Rs ${fmt(itemTotal)}`);

    orderedItemsList.push({
      name: it.n,
      size: it.sizes ? T.en.sizes[sizeKeys[l.si]] : "",
      q: l.q,
      price: priceOf(it, l.si),
      total: itemTotal
    });
  });

  lines.push("━━━━━━━━━━━━━━━━━━");
  lines.push(`Subtotal: Rs ${fmt(subtotal)}`);
  if (orderType === "delivery") {
    if (delivery === 0) {
      lines.push(`Delivery: *FREE* (Above Rs 2,000)`);
    } else {
      lines.push(`Delivery Fee: Rs ${fmt(delivery)}`);
    }
  }
  lines.push(`*TOTAL BILL: Rs ${fmt(grandTotal)}*`);
  lines.push("━━━━━━━━━━━━━━━━━━");
  lines.push("Please confirm my order. Thank you!");

  // Create order in OMS
  const newOrder = OrderManager.createOrder({
    orderType,
    name,
    phone,
    address: orderType === "delivery" ? addr : "",
    table: orderType === "dinein" ? tableNumber : "",
    instructions: cartInstructions,
    items: orderedItemsList,
    subtotal,
    deliveryFee: delivery,
    total: grandTotal
  });

  // Save active order for Customer Live Tracker
  activeCustomerOrderId = newOrder.id;
  localStorage.setItem("fc_customer_active_order", activeCustomerOrderId);

  // Clear Cart
  Object.keys(cart).forEach(k => delete cart[k]);
  closeCartSheet();
  render();

  // Open Live Order Tracker for Customer
  openCustomerTracker(newOrder);

  // Trigger WhatsApp in background / new tab
  const encodedMsg = encodeURIComponent(lines.join("\n"));
  const waUrl = `https://wa.me/${CONFIG.whatsapp}?text=${encodedMsg}`;
  window.open(waUrl, "_blank");
}

/* ==========================================================================
   CUSTOMER LIVE ORDER STATUS TRACKER MODAL & FLOATING BAR
   ========================================================================== */
function openCustomerTracker(order) {
  if (!order && activeCustomerOrderId) {
    order = OrderManager.getOrderById(activeCustomerOrderId);
  }
  if (!order) return;
  const t = tr();

  $("trackerOrderId").textContent = order.id;
  $("trackerOrderType").textContent = {
    delivery: "🛵 Home / Office Delivery",
    dinein: `🍽️ Table ${order.customer.table}`,
    pickup: "🛍️ Pickup"
  }[order.orderType] || order.orderType;

  updateTrackerProgress(order.status);

  // Items List
  const itemsHtml = order.items.map(it => `
    <div style="display:flex;justify-content:space-between;padding:3px 0;font-size:13px">
      <span><b>${it.q}x</b> ${it.name} ${it.size ? `(${it.size})` : ''}</span>
      <span>Rs ${fmt(it.total)}</span>
    </div>
  `).join("");

  $("trackerItemsSummary").innerHTML = `
    ${itemsHtml}
    <div style="display:flex;justify-content:space-between;border-top:1px dashed #ccc;margin-top:8px;padding-top:6px;font-weight:900">
      <span>Total Bill:</span>
      <span>Rs ${fmt(order.total)}</span>
    </div>
  `;

  $("customerTrackerModal").classList.add("open");
  updateFloatingTrackerBar(order);
}

function updateTrackerProgress(status) {
  const stepMap = {
    pending: 1,
    preparing: 2,
    ready: 3,
    onway: 3,
    completed: 4
  };
  const curStep = stepMap[status] || 1;

  for (let i = 1; i <= 4; i++) {
    const row = $(`trackStepRow${i}`);
    if (!row) continue;
    row.classList.remove("active", "completed");
    if (i < curStep) row.classList.add("completed");
    else if (i === curStep) row.classList.add("active");
  }
}

function closeCustomerTracker() {
  const modal = $("customerTrackerModal");
  if (modal) modal.classList.remove("open");
  updateFloatingTrackerBar();
}

/* Floating Live Order Bar on Main Menu */
function updateFloatingTrackerBar(order) {
  const bar = $("floatingTrackerBar");
  if (!bar) return;

  if (!order && activeCustomerOrderId) {
    order = OrderManager.getOrderById(activeCustomerOrderId);
  }

  if (!order || order.status === "cancelled") {
    bar.classList.add("hidden");
    return;
  }

  $("floatingTrackOrderId").textContent = order.id;

  const statusTexts = {
    pending: (lang === "ur" ? "کاؤنٹر تصدیق کا انتظار..." : "Awaiting Cashier Approval..."),
    preparing: (lang === "ur" ? "👨‍🍳 کچن میں تیاری جاری ہے..." : "👨‍🍳 Kitchen Cooking Line..."),
    ready: (lang === "ur" ? "🍽️ کھانا تیار ہے! (سرو کے لیے تیار)" : "🍽️ Food Ready! (Collect / Served)"),
    completed: (lang === "ur" ? "✓ آرڈر مکمل ہو گیا!" : "✓ Order Delivered / Completed!"),
    cancelled: (lang === "ur" ? "منسوخ" : "Cancelled")
  };

  $("floatingTrackStatusText").textContent = statusTexts[order.status] || order.status;
  bar.classList.remove("hidden");
  positionFloatingTrackerBar();
}

function positionFloatingTrackerBar() {
  const bar = $("floatingTrackerBar");
  if (!bar || bar.classList.contains("hidden")) return;
  const bottomBar = $("bottomBar");
  const isCartVisible = bottomBar && bottomBar.style.display !== "none";
  bar.style.bottom = isCartVisible ? "76px" : "18px";
}

/* ==========================================================================
   PASSWORD / PIN & BIOMETRIC AUTH MODAL (CATEGORY-WISE ROLES)
   ========================================================================== */
function openAuthModal(defaultRole) {
  selectedAuthRole = defaultRole || "admin";
  curEnteredPin = "";
  updateAuthRoleTabs();
  updatePinDots();
  const backdrop = $("modalBackdrop");
  const modal = $("authModal");
  backdrop.style.display = "block";
  modal.style.display = "block";
  setTimeout(() => {
    backdrop.style.opacity = "1";
    modal.classList.add("open");
  }, 10);
}

function updateAuthRoleTabs() {
  document.querySelectorAll(".auth-role-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.authRole === selectedAuthRole);
  });
  const promptEl = $("authRolePrompt");
  if (!promptEl) return;
  const prompts = {
    admin: "Enter Super Admin PIN (Default: 1234)",
    cashier: "Enter Cashier POS PIN (Default: 2222)",
    kitchen: "Enter Kitchen KDS PIN (Default: 3333)"
  };
  promptEl.textContent = prompts[selectedAuthRole] || "Enter 4-Digit Security PIN";
}

function closeAuthModal() {
  const backdrop = $("modalBackdrop");
  const modal = $("authModal");
  modal.classList.remove("open");
  backdrop.style.opacity = "0";
  setTimeout(() => {
    modal.style.display = "none";
    backdrop.style.display = "none";
  }, 200);
}

function updatePinDots() {
  const dots = document.querySelectorAll(".pin-dot");
  dots.forEach((dot, i) => {
    dot.classList.toggle("filled", i < curEnteredPin.length);
  });
}

function handlePinKey(digit) {
  if (curEnteredPin.length < 4) {
    curEnteredPin += digit;
    updatePinDots();

    if (curEnteredPin.length === 4) {
      setTimeout(() => {
        const adminPin = CONFIG.adminPin || "1234";
        const cashierPin = CONFIG.cashierPin || "2222";
        const kitchenPin = CONFIG.kitchenPin || "3333";

        let matchedRole = null;
        if (selectedAuthRole === "admin" && curEnteredPin === adminPin) {
          matchedRole = "admin";
        } else if (selectedAuthRole === "cashier" && curEnteredPin === cashierPin) {
          matchedRole = "cashier";
        } else if (selectedAuthRole === "kitchen" && curEnteredPin === kitchenPin) {
          matchedRole = "kitchen";
        } else if (curEnteredPin === adminPin) {
          matchedRole = "admin";
        } else if (curEnteredPin === cashierPin) {
          matchedRole = "cashier";
        } else if (curEnteredPin === kitchenPin) {
          matchedRole = "kitchen";
        }

        if (matchedRole) {
          currentLoggedInRole = matchedRole;
          closeAuthModal();
          openAdminStudio(matchedRole);
          const welcomeMsg = {
            admin: "👑 Welcome, Super Admin (Full Control)!",
            cashier: "💵 Welcome, Cashier POS Station!",
            kitchen: "👨‍🍳 Welcome, Kitchen KDS Chef Line!"
          }[matchedRole];
          showToast(welcomeMsg);
        } else {
          showToast("❌ Incorrect PIN! Try again.", true);
          curEnteredPin = "";
          updatePinDots();
        }
      }, 200);
    }
  }
}

function handlePinDelete() {
  if (curEnteredPin.length > 0) {
    curEnteredPin = curEnteredPin.slice(0, -1);
    updatePinDots();
  }
}

async function handleBiometricLogin() {
  try {
    const success = await BiometricsAuth.authenticate();
    if (success) {
      currentLoggedInRole = "admin";
      closeAuthModal();
      openAdminStudio("admin");
      showToast("👆 Super Admin Verified via Biometrics!");
    }
  } catch (err) {
    showToast(`⚠️ ${err.message || 'Biometric failed'}`, true);
  }
}

/* ==========================================================================
   3. MULTI-STATION WORKFLOW: MASTER ADMIN vs CASHIER POS vs KITCHEN KDS
   ========================================================================== */
function openAdminStudio(station) {
  const modal = $("adminModal");
  if (localStorage.getItem("fc_admin_dark") === "true") {
    modal.classList.add("admin-dark");
    $("adminThemeBtn").textContent = "☀️ Light";
  } else {
    modal.classList.remove("admin-dark");
    $("adminThemeBtn").textContent = "🌙 Dark";
  }

  const targetStation = station || currentLoggedInRole || "admin";
  modal.classList.add("open");

  applyRoleStationPermissions();
  switchAdminStation(targetStation);
  renderAdminItems();
  populateAdminSettings();
  refreshQRStudio();
}

function applyRoleStationPermissions() {
  const adminBtn = document.querySelector('.station-btn[data-station="admin"]');
  const cashierBtn = document.querySelector('.station-btn[data-station="cashier"]');
  const kitchenBtn = document.querySelector('.station-btn[data-station="kitchen"]');

  if (currentLoggedInRole === "cashier") {
    if (adminBtn) adminBtn.style.opacity = "0.45";
    if (cashierBtn) cashierBtn.style.opacity = "1";
    if (kitchenBtn) kitchenBtn.style.opacity = "1";
  } else if (currentLoggedInRole === "kitchen") {
    if (adminBtn) adminBtn.style.opacity = "0.45";
    if (cashierBtn) cashierBtn.style.opacity = "0.45";
    if (kitchenBtn) kitchenBtn.style.opacity = "1";
  } else {
    if (adminBtn) adminBtn.style.opacity = "1";
    if (cashierBtn) cashierBtn.style.opacity = "1";
    if (kitchenBtn) kitchenBtn.style.opacity = "1";
  }
}

function closeAdminStudio() {
  $("adminModal").classList.remove("open");
}

// Dark Mode Toggle
$("adminThemeBtn").addEventListener("click", () => {
  const modal = $("adminModal");
  const isDark = modal.classList.toggle("admin-dark");
  localStorage.setItem("fc_admin_dark", isDark ? "true" : "false");
  $("adminThemeBtn").textContent = isDark ? "☀️ Light" : "🌙 Dark";
});

// Station Switcher (Master Admin / Cashier POS / Kitchen KDS)
function switchAdminStation(station) {
  // Role permission check
  if (station === "admin" && currentLoggedInRole !== "admin") {
    showToast("🔒 Super Admin PIN required to access owner settings!", true);
    openAuthModal("admin");
    return;
  }
  if (station === "cashier" && currentLoggedInRole === "kitchen") {
    showToast("🔒 Cashier PIN required!", true);
    openAuthModal("cashier");
    return;
  }

  currentAdminStation = station;
  document.querySelectorAll(".station-btn").forEach(b => {
    b.classList.toggle("active", b.dataset.station === station);
  });

  const statsRow = $("omsStatsRow");
  const filterChips = $("omsFilterChips");

  if (station === "cashier") {
    document.querySelectorAll(".admin-tab-pane").forEach(p => p.classList.remove("active"));
    $("paneOrders").classList.add("active");
    $("paneOrders").style.display = "block";
    $("adminTabsNav").style.display = "none";
    if (statsRow) statsRow.style.display = "flex";
    if (filterChips) filterChips.style.display = "none";
    renderCashierPOS();
  } else if (station === "kitchen") {
    document.querySelectorAll(".admin-tab-pane").forEach(p => p.classList.remove("active"));
    $("paneOrders").classList.add("active");
    $("paneOrders").style.display = "block";
    $("adminTabsNav").style.display = "none";
    if (statsRow) statsRow.style.display = "none";
    if (filterChips) filterChips.style.display = "none";
    renderKitchenKDS();
  } else {
    $("adminTabsNav").style.display = "flex";
    if (statsRow) statsRow.style.display = "flex";
    if (filterChips) filterChips.style.display = "flex";
    const activeTab = document.querySelector('.admin-tab.active') || document.querySelector('.admin-tab[data-atab="orders"]');
    if (activeTab) activeTab.click();
  }
}

document.querySelectorAll(".station-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    switchAdminStation(btn.dataset.station);
  });
});

// Admin Navigation Tabs
document.querySelectorAll(".admin-tab").forEach(tab => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".admin-tab").forEach(t => t.classList.remove("active"));
    document.querySelectorAll(".admin-tab-pane").forEach(p => p.classList.remove("active"));
    tab.classList.add("active");
    const target = tab.dataset.atab;
    if (target === "orders") {
      $("paneOrders").classList.add("active");
      renderLiveOrdersTab();
    }
    if (target === "menu") $("paneMenu").classList.add("active");
    if (target === "add") $("paneAdd").classList.add("active");
    if (target === "qr") {
      $("paneQR").classList.add("active");
      refreshQRStudio();
    }
    if (target === "settings") $("paneSettings").classList.add("active");
  });
});

/* ====== STATION 2: CASHIER POS VIEW ====== */
function renderCashierPOS() {
  const stats = OrderManager.getStats();
  $("omsTotalToday").textContent = stats.totalToday;
  $("omsActiveKitchen").textContent = stats.pendingCount;
  $("omsTodayRevenue").textContent = `Rs ${fmt(stats.todayRevenue)}`;

  const pendingOrders = OrderManager.getCashierQueue();
  const listEl = $("ordersListContainer");

  if (pendingOrders.length === 0) {
    listEl.innerHTML = `
      <div style="text-align:center;padding:40px 10px;color:var(--muted)">
        <span style="font-size:38px;display:block;margin-bottom:8px">💵</span>
        <b>Cashier Queue Clear!</b>
        <p style="font-size:12px;margin-top:4px">No pending orders awaiting approval.</p>
      </div>
    `;
    return;
  }

  listEl.innerHTML = pendingOrders.map(order => {
    const itemsHtml = order.items.map(it => `
      <div class="ticket-item-row">
        <span><b>${it.q}x</b> ${it.name} ${it.size ? `(${it.size})` : ''}</span>
        <span>Rs ${fmt(it.total)}</span>
      </div>
    `).join("");

    return `
      <div class="order-ticket status-pending" style="border-width:2px;box-shadow:0 4px 16px rgba(245,158,11,0.2)">
        <div class="ticket-top">
          <div>
            <span class="ticket-id">${order.id} • ${order.orderType.toUpperCase()} ${order.customer.table ? `(TABLE ${order.customer.table})` : ''}</span>
            <span class="ticket-time">${order.timeFormatted}</span>
          </div>
          <span class="status-pill pill-pending">Awaiting Cashier</span>
        </div>

        <div class="ticket-customer">
          <b>${order.customer.name}</b> (${order.customer.phone})
          ${order.customer.address ? `<small>📍 ${order.customer.address}</small>` : ''}
          ${order.instructions ? `<span class="ticket-instructions">⚠️ Instruction: ${order.instructions}</span>` : ''}
        </div>

        <div class="ticket-items">
          ${itemsHtml}
        </div>

        <div class="ticket-total">
          <span>Amount to Collect</span>
          <span>Rs ${fmt(order.total)}</span>
        </div>

        <div class="ticket-actions" style="margin-top:12px">
          <button class="ticket-btn" style="background:#10B981;color:#fff;font-size:13px;padding:12px" onclick="handleCashierAccept('${order.id}')">
            ✓ Accept & Send to Kitchen ➔
          </button>
          <button class="ticket-btn" style="background:#FEE2E2;color:#DC2626;padding:12px" onclick="handleCashierReject('${order.id}')">
            ✕ Reject
          </button>
        </div>
      </div>
    `;
  }).join("");
}

function handleCashierAccept(orderId) {
  OrderManager.updateStatus(orderId, "preparing");
  renderCashierPOS();
  showToast(`✓ Order #${orderId} sent to Kitchen Chef!`);
}

function handleCashierReject(orderId) {
  if (!confirm(`Reject order #${orderId}?`)) return;
  OrderManager.updateStatus(orderId, "cancelled");
  renderCashierPOS();
  showToast(`Order #${orderId} cancelled`);
}

/* ====== STATION 3: KITCHEN DISPLAY SYSTEM (KDS / CHEF DISPLAY) ====== */
function renderKitchenKDS() {
  const kitchenOrders = OrderManager.getKitchenQueue();
  const listEl = $("ordersListContainer");

  if (kitchenOrders.length === 0) {
    listEl.innerHTML = `
      <div style="text-align:center;padding:50px 10px;color:var(--muted)">
        <span style="font-size:42px;display:block;margin-bottom:8px">👨‍🍳</span>
        <b>Kitchen Cooking Queue is Empty!</b>
        <p style="font-size:12px;margin-top:4px">All items prepared and served.</p>
      </div>
    `;
    return;
  }

  listEl.innerHTML = kitchenOrders.map(order => {
    const itemsHtml = order.items.map(it => `
      <div class="kds-item-line">
        <span><b>${it.q}x</b> ${it.name} ${it.size ? `<span style="color:#D97706">(${it.size})</span>` : ''}</span>
      </div>
    `).join("");

    return `
      <div class="kds-card">
        <div class="kds-header">
          <span class="kds-table-badge">
            ${order.customer.table ? `TABLE ${order.customer.table}` : order.orderType.toUpperCase()}
          </span>
          <span class="kds-timer">⏱️ Order ${order.id} (${order.timeFormatted})</span>
        </div>

        ${order.instructions ? `
          <div class="kds-note-box">
            🔥 CHEF NOTE: ${order.instructions}
          </div>
        ` : ''}

        <div class="kds-items-list">
          ${itemsHtml}
        </div>

        <div style="display:flex;gap:8px;margin-top:14px">
          <button class="kds-action-btn" onclick="handleKitchenReady('${order.id}')">
            <span>🍽️</span>
            <span>Food Ready (Done) ➔</span>
          </button>
          <button class="ticket-btn btn-print-kot" style="flex:0 0 80px" onclick="OrderManager.printKOT('${order.id}')">
            🖨️ KOT
          </button>
        </div>
      </div>
    `;
  }).join("");
}

function handleKitchenReady(orderId) {
  OrderManager.updateStatus(orderId, "ready");
  renderKitchenKDS();
  showToast(`🍽️ Food for #${orderId} is Ready for Waiter / Delivery!`);
}

/* ====== MASTER SUPER ADMIN VIEW: FULL WORKFLOW WITH SAFE REVERT ====== */
let currentOrderFilter = "all";

function renderLiveOrdersTab() {
  if (currentAdminStation === "cashier") {
    renderCashierPOS();
    return;
  }
  if (currentAdminStation === "kitchen") {
    renderKitchenKDS();
    return;
  }

  const stats = OrderManager.getStats();
  $("omsTotalToday").textContent = stats.totalToday;
  $("omsActiveKitchen").textContent = stats.kitchenCount;
  $("omsTodayRevenue").textContent = `Rs ${fmt(stats.todayRevenue)}`;

  const orders = OrderManager.getOrders();
  const badge = $("tabOrdersBadge");
  const totalActive = stats.pendingCount + stats.kitchenCount + stats.readyCount;
  if (totalActive > 0) {
    badge.style.display = "inline-block";
    badge.textContent = totalActive;
  } else {
    badge.style.display = "none";
  }

  let filtered = orders;
  if (currentOrderFilter === "active") {
    filtered = orders.filter(o => o.status === "pending" || o.status === "preparing" || o.status === "ready" || o.status === "onway");
  } else if (currentOrderFilter === "completed") {
    filtered = orders.filter(o => o.status === "completed");
  }

  const listEl = $("ordersListContainer");
  if (filtered.length === 0) {
    listEl.innerHTML = `<div style="text-align:center;padding:30px;color:var(--muted)">No orders found in this view.</div>`;
    return;
  }

  const statusTitles = {
    pending: "🟡 Pending (نیا آرڈر)",
    preparing: "🔵 In Kitchen (تیار ہو رہا ہے)",
    ready: "🟣 Food Ready (کھانا تیار ہے)",
    onway: "🟣 On the Way (راستے میں ہے)",
    completed: "🟢 Completed (مکمل / ڈلیورڈ)",
    cancelled: "🔴 Cancelled (منسوخ)"
  };

  const nextStatusMap = {
    pending: "preparing",
    preparing: "ready",
    ready: "completed",
    onway: "completed"
  };

  listEl.innerHTML = filtered.map(order => {
    const nextStatus = nextStatusMap[order.status];
    const nextStatusLabel = nextStatus ? statusTitles[nextStatus] : "";
    const nextStatusBtnHtml = nextStatus ? `
      <button class="ticket-btn btn-status-next" onclick="handleAdvanceOrderStatus('${order.id}', '${nextStatus}', '${nextStatusLabel}')">
        Next Stage ➔
      </button>
    ` : '';

    const itemsSummaryHtml = order.items.map(it => `
      <div class="ticket-item-row">
        <span><b>${it.q}x</b> ${it.name} ${it.size ? `(${it.size})` : ''}</span>
        <span>Rs ${fmt(it.total)}</span>
      </div>
    `).join("");

    const orderTypeBadge = {
      delivery: "🛵 Home/Office Delivery",
      dinein: `🍽️ Table ${order.customer.table || ''}`,
      pickup: "🛍️ Pickup"
    }[order.orderType] || order.orderType;

    return `
      <div class="order-ticket status-${order.status}">
        <div class="ticket-top">
          <div>
            <span class="ticket-id">${order.id} • ${orderTypeBadge}</span>
            <span class="ticket-time">${order.timeFormatted}</span>
          </div>
          <span class="status-pill pill-${order.status}">${statusTitles[order.status] || order.status}</span>
        </div>

        <div class="ticket-customer">
          <b>${order.customer.name}</b> (${order.customer.phone})
          ${order.customer.address ? `<small>📍 ${order.customer.address}</small>` : ''}
          ${order.instructions ? `<span class="ticket-instructions">⚠️ Instruction: ${order.instructions}</span>` : ''}
        </div>

        <div class="ticket-items">
          ${itemsSummaryHtml}
        </div>

        <div class="ticket-total">
          <span>Total Bill</span>
          <span>Rs ${fmt(order.total)}</span>
        </div>

        <!-- Safe Status Control Dropdown -->
        <div class="ticket-status-control-box">
          <span class="ticket-status-label">Stage Control:</span>
          <select class="ticket-status-select" onchange="handleSelectOrderStatus('${order.id}', this.value)">
            <option value="pending" ${order.status==='pending'?'selected':''}>🟡 1. Cashier Approval (نیا آرڈر)</option>
            <option value="preparing" ${order.status==='preparing'?'selected':''}>🔵 2. In Kitchen Cooking (کچن تیاری)</option>
            <option value="ready" ${order.status==='ready'?'selected':''}>🟣 3. Food Ready to Serve (تیار ہے)</option>
            <option value="completed" ${order.status==='completed'?'selected':''}>🟢 4. Completed & Paid (مکمل)</option>
            <option value="cancelled" ${order.status==='cancelled'?'selected':''}>🔴 Cancelled (منسوخ)</option>
          </select>
        </div>

        <div class="ticket-actions">
          <a class="ticket-btn btn-whatsapp-cust" href="https://wa.me/92${order.customer.phone.replace(/^0/,'')}?text=Hello%20${encodeURIComponent(order.customer.name)},%20regarding%20your%20Fri-Chicks%20order%20${order.id}..." target="_blank">
            💬 WhatsApp
          </a>
          <a class="ticket-btn btn-call-cust" href="tel:${order.customer.phone}">
            📞 Call
          </a>
          <button class="ticket-btn btn-print-kot" onclick="OrderManager.printKOT('${order.id}')">
            🖨️ KOT Print
          </button>
          ${nextStatusBtnHtml}
        </div>
      </div>
    `;
  }).join("");
}

function handleAdvanceOrderStatus(id, newStatus, newStatusTitle) {
  const conf = confirm(`Are you sure you want to advance Order #${id} to:\n"${newStatusTitle}"?`);
  if (!conf) return;

  OrderManager.updateStatus(id, newStatus);
  renderLiveOrdersTab();
  showUndoToast(`Order #${id} advanced to ${newStatusTitle}`, id);
}

function handleSelectOrderStatus(id, newStatus) {
  OrderManager.updateStatus(id, newStatus);
  renderLiveOrdersTab();
  showUndoToast(`Order #${id} status changed to ${newStatus}`, id);
}

function handleUndoOrderStatus(id) {
  const revertedStatus = OrderManager.undoStatus(id);
  if (revertedStatus) {
    renderLiveOrdersTab();
    showToast(`↩️ Reverted Order #${id} back to ${revertedStatus}`);
  }
}

document.querySelectorAll(".oms-filter").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".oms-filter").forEach(b => b.classList.remove("on"));
    btn.classList.add("on");
    currentOrderFilter = btn.dataset.ofilter;
    renderLiveOrdersTab();
  });
});

/* ====== MENU ITEMS ADMIN TAB ====== */
function renderAdminItems() {
  $("adminTotalItems").textContent = ITEMS.length;
  const list = $("adminItemsList");
  list.innerHTML = ITEMS.map(it => {
    const isOut = !!it.outOfStock;
    const priceDisplay = it.sizes ? it.sizes.join(" / ") : it.price;
    return `
      <div class="admin-item-card">
        <img class="admin-item-thumb" src="${it.img}" onerror="this.src='assets/logo.png'">
        <div class="admin-item-info">
          <b>${it.n} ${it.n_ur ? `• ${it.n_ur}` : ''}</b>
          <span>${it.cat.toUpperCase()} • Rs ${priceDisplay}</span>
        </div>
        <div class="admin-item-actions">
          <button class="admin-btn ${isOut ? 'admin-btn-primary' : 'admin-btn-outline'}" onclick="toggleItemStock('${it.id}')">
            ${isOut ? 'Restock' : 'Sold Out'}
          </button>
          <button class="admin-btn admin-btn-outline" onclick="editItem('${it.id}')">✏️</button>
          <button class="admin-btn admin-btn-danger" onclick="deleteItem('${it.id}')">🗑️</button>
        </div>
      </div>
    `;
  }).join("");
}

function toggleItemStock(id) {
  const it = ITEMS.find(i => i.id === id);
  if (!it) return;
  it.outOfStock = !it.outOfStock;
  saveItems();
  renderAdminItems();
  render();
  showToast(`Updated: ${it.n} is ${it.outOfStock ? 'Sold Out' : 'Available'}`);
}

function deleteItem(id) {
  if (!confirm("Are you sure you want to delete this food item?")) return;
  ITEMS = ITEMS.filter(i => i.id !== id);
  saveItems();
  renderAdminItems();
  render();
  showToast("Item deleted");
}

function editItem(id) {
  const it = ITEMS.find(i => i.id === id);
  if (!it) return;
  $("editItemId").value = it.id;
  $("adminFormHeading").textContent = `Edit Food Item: ${it.n}`;
  $("inpItemName").value = it.n || "";
  $("inpItemNameUr").value = it.n_ur || "";
  $("inpItemCat").value = it.cat || "deals";
  $("inpItemDesc").value = it.d || "";
  $("inpItemDescUr").value = it.d_ur || "";

  if (it.sizes) {
    $("inpSizesPrices").value = it.sizes.join(",");
    $("inpPriceSingle").value = "";
  } else {
    $("inpPriceSingle").value = it.price || "";
    $("inpSizesPrices").value = "";
  }

  $("inpWebpData").value = it.img || "";
  $("webpPreviewStatus").innerHTML = `<div class="webp-badge">Current Photo Ready</div>`;

  document.querySelector('.admin-tab[data-atab="add"]').click();
}

function resetItemForm() {
  $("editItemId").value = "";
  $("adminFormHeading").textContent = "Add New Food Item";
  $("inpItemName").value = "";
  $("inpItemNameUr").value = "";
  $("inpItemCat").value = "deals";
  $("inpPriceSingle").value = "";
  $("inpSizesPrices").value = "";
  $("inpItemDesc").value = "";
  $("inpItemDescUr").value = "";
  $("inpWebpData").value = "";
  $("webpPreviewStatus").innerHTML = "";
}

$("btnAdminAddNew").addEventListener("click", () => {
  resetItemForm();
  document.querySelector('.admin-tab[data-atab="add"]').click();
});
$("btnCancelEdit").addEventListener("click", () => {
  resetItemForm();
  document.querySelector('.admin-tab[data-atab="menu"]').click();
});

/* ====== AUTOMATIC WEBP CONVERTER ====== */
$("inpWebpFile").addEventListener("change", function(e) {
  const file = e.target.files[0];
  if (!file) return;

  const originalSizeKb = (file.size / 1024).toFixed(1);
  const reader = new FileReader();

  reader.onload = function(event) {
    const img = new Image();
    img.onload = function() {
      const maxDim = 600;
      let w = img.width;
      let h = img.height;
      if (w > maxDim || h > maxDim) {
        if (w > h) {
          h = Math.round((h * maxDim) / w);
          w = maxDim;
        } else {
          w = Math.round((w * maxDim) / h);
          h = maxDim;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, w, h);

      const webpDataUrl = canvas.toDataURL("image/webp", 0.82);
      const webpSizeKb = (webpDataUrl.length * (3/4) / 1024).toFixed(1);

      $("inpWebpData").value = webpDataUrl;
      $("webpPreviewStatus").innerHTML = `
        <div class="webp-badge">
          ✨ WebP: ${originalSizeKb} KB ➔ ${webpSizeKb} KB (Auto-Optimized!)
        </div>
      `;
    };
    img.src = event.target.result;
  };
  reader.readAsDataURL(file);
});

// Save Item
$("btnSaveItem").addEventListener("click", () => {
  const name = $("inpItemName").value.trim();
  const nameUr = $("inpItemNameUr").value.trim();
  const cat = $("inpItemCat").value;
  const singlePrice = Number($("inpPriceSingle").value);
  const sizesInput = $("inpSizesPrices").value.trim();
  const desc = $("inpItemDesc").value.trim();
  const descUr = $("inpItemDescUr").value.trim();
  const img = $("inpWebpData").value.trim() || "assets/logo.png";
  const editId = $("editItemId").value;

  if (!name) {
    alert("Please enter English item name.");
    return;
  }

  let sizes = null;
  let price = 0;
  if (sizesInput) {
    sizes = sizesInput.split(",").map(n => Number(n.trim())).filter(n => !isNaN(n));
    if (sizes.length !== 3) {
      alert("Please enter exactly 3 comma-separated sizes for Small, Medium, Large (e.g. 600,1100,1650)");
      return;
    }
  } else if (!singlePrice || singlePrice <= 0) {
    alert("Please enter a valid price.");
    return;
  } else {
    price = singlePrice;
  }

  if (editId) {
    const item = ITEMS.find(i => i.id === editId);
    if (item) {
      item.n = name;
      item.n_ur = nameUr;
      item.cat = cat;
      item.d = desc;
      item.d_ur = descUr;
      item.img = img;
      if (sizes) {
        item.sizes = sizes;
        delete item.price;
      } else {
        item.price = price;
        delete item.sizes;
      }
    }
    showToast(`Updated item: ${name}`);
  } else {
    const newId = "it_" + Date.now();
    const newItem = {
      id: newId,
      cat,
      n: name,
      n_ur: nameUr,
      d: desc,
      d_ur: descUr,
      img
    };
    if (sizes) newItem.sizes = sizes;
    else newItem.price = price;
    ITEMS.unshift(newItem);
    showToast(`Added new item: ${name}`);
  }

  saveItems();
  resetItemForm();
  renderAdminItems();
  render();
  document.querySelector('.admin-tab[data-atab="menu"]').click();
});

// Restore Factory Default Menu
$("btnResetMenu").addEventListener("click", () => {
  if (!confirm("Are you sure you want to restore the default menu? Any added items will be reset.")) return;
  resetItemsToDefault();
  renderAdminItems();
  render();
  showToast("Menu restored to factory defaults");
});

// Admin Settings
function populateAdminSettings() {
  $("cfgWhatsApp").value = CONFIG.whatsapp;
  $("cfgDeliveryFee").value = CONFIG.deliveryFee;
  $("cfgFreeDelivery").value = CONFIG.freeDeliveryThreshold;
  $("cfgAdminPin").value = CONFIG.adminPin || "1234";
  if ($("cfgCashierPin")) $("cfgCashierPin").value = CONFIG.cashierPin || "2222";
  if ($("cfgKitchenPin")) $("cfgKitchenPin").value = CONFIG.kitchenPin || "3333";
  if ($("cfgWebsiteUrl")) $("cfgWebsiteUrl").value = CONFIG.websiteUrl || "";
}

$("btnSaveConfig").addEventListener("click", () => {
  const whatsapp = $("cfgWhatsApp").value.trim().replace(/\D/g, "") || DEFAULT_CONFIG.whatsapp;
  const deliveryFee = Number($("cfgDeliveryFee").value) || DEFAULT_CONFIG.deliveryFee;
  const freeDeliveryThreshold = Number($("cfgFreeDelivery").value) || DEFAULT_CONFIG.freeDeliveryThreshold;
  const adminPin = $("cfgAdminPin").value.trim() || DEFAULT_CONFIG.adminPin;
  const cashierPin = ($("cfgCashierPin") ? $("cfgCashierPin").value.trim() : "") || DEFAULT_CONFIG.cashierPin;
  const kitchenPin = ($("cfgKitchenPin") ? $("cfgKitchenPin").value.trim() : "") || DEFAULT_CONFIG.kitchenPin;
  const websiteUrl = ($("cfgWebsiteUrl") ? $("cfgWebsiteUrl").value.trim() : "");

  saveConfig({ whatsapp, deliveryFee, freeDeliveryThreshold, adminPin, cashierPin, kitchenPin, websiteUrl });
  if ($("qrSiteUrlInput")) $("qrSiteUrlInput").value = websiteUrl || getResolvedBaseUrl();
  refreshQRStudio();
  showToast("Settings & Category PINs saved successfully!");
  render();
});

/* ====== SMART QR STUDIO ENGINE ====== */
function refreshQRStudio() {
  const canvas = $("qrCanvas");
  if (!canvas) return;

  const siteInput = $("qrSiteUrlInput");
  if (siteInput && !siteInput.value) {
    siteInput.value = CONFIG.websiteUrl || getResolvedBaseUrl();
  }

  const siteUrl = siteInput ? siteInput.value.trim() : (CONFIG.websiteUrl || getResolvedBaseUrl());
  const tableVal = $("qrTableInput") ? $("qrTableInput").value.trim() : "";

  // Check if running on local file:// and show alert
  const warnEl = $("qrLocalWarning");
  if (warnEl) {
    const isLocalFile = window.location.protocol === "file:";
    const hasLiveLink = siteUrl && (siteUrl.startsWith("http://") || siteUrl.startsWith("https://")) && !siteUrl.includes("file://");
    warnEl.style.display = (isLocalFile && !hasLiveLink) ? "block" : "none";
  }

  drawTableStandee(canvas, tableVal, siteUrl);

  const fullUrl = buildQRTargetUrl(tableVal, siteUrl);
  const displayEl = $("qrTargetUrlDisplay");
  if (displayEl) {
    displayEl.textContent = fullUrl;
  }
  const testLink = $("qrTestLink");
  if (testLink) {
    testLink.href = fullUrl;
  }
}

$("btnDownloadQR").addEventListener("click", () => {
  const canvas = $("qrCanvas");
  const tableVal = $("qrTableInput").value.trim();
  const cleanTable = tableVal ? String(tableVal).replace(/^(table\s*)/i, "").trim() : "Main";
  downloadStandeePNG(canvas, `Fri-Chicks-QR-Standee-${cleanTable}.png`);
  showToast("Acrylic Standee QR Downloaded!");
});

if ($("btnDownloadSquareLogoQR")) {
  $("btnDownloadSquareLogoQR").addEventListener("click", () => {
    const tableVal = $("qrTableInput").value.trim();
    const siteUrl = $("qrSiteUrlInput") ? $("qrSiteUrlInput").value.trim() : "";
    const fullUrl = buildQRTargetUrl(tableVal, siteUrl);

    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = 400;
    tempCanvas.height = 400;
    const cleanTable = tableVal ? String(tableVal).replace(/^(table\s*)/i, "").trim() : "Main";

    drawSquareLogoQR(tempCanvas, fullUrl, () => {
      downloadStandeePNG(tempCanvas, `Fri-Chicks-Sticker-QR-${cleanTable}.png`);
      showToast("Sticker QR with Logo Downloaded!");
    });
  });
}

if ($("btnDownloadPureQR")) {
  $("btnDownloadPureQR").addEventListener("click", () => {
    const tableVal = $("qrTableInput").value.trim();
    const siteUrl = $("qrSiteUrlInput") ? $("qrSiteUrlInput").value.trim() : "";
    const fullUrl = buildQRTargetUrl(tableVal, siteUrl);

    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = 400;
    tempCanvas.height = 400;
    drawPureQR(tempCanvas, fullUrl);

    const cleanTable = tableVal ? String(tableVal).replace(/^(table\s*)/i, "").trim() : "Main";
    downloadStandeePNG(tempCanvas, `Fri-Chicks-Pure-QR-${cleanTable}.png`);
    showToast("Pure QR Code Downloaded!");
  });
}

$("qrTableInput").addEventListener("input", refreshQRStudio);
if ($("qrSiteUrlInput")) {
  $("qrSiteUrlInput").addEventListener("input", refreshQRStudio);
  $("qrSiteUrlInput").addEventListener("change", () => {
    saveConfig({ websiteUrl: $("qrSiteUrlInput").value.trim() });
    if ($("cfgWebsiteUrl")) $("cfgWebsiteUrl").value = $("qrSiteUrlInput").value.trim();
  });
}

/* ==========================================================================
   REAL-TIME CROSS-TAB SYNC (BROADCASTCHANNEL & STORAGE)
   ========================================================================== */
if (OrderBus) {
  OrderBus.onmessage = function(e) {
    const data = e.data;
    if (data.type === "NEW_ORDER") {
      OrderManager.playOrderChime();
      renderLiveOrdersTab();
      showToast(`🔔 New Order Alert: #${data.order.id}!`);
    } else if (data.type === "STATUS_UPDATE") {
      renderLiveOrdersTab();
      if (activeCustomerOrderId === data.orderId) {
        updateTrackerProgress(data.newStatus);
        updateFloatingTrackerBar();
        const stageMsgs = {
          preparing: "👨‍🍳 Kitchen has started cooking your order!",
          ready: "🍽️ Food is ready for pickup / table service!",
          completed: "🎉 Enjoy your meal! Order completed."
        };
        if (stageMsgs[data.newStatus]) {
          showToast(stageMsgs[data.newStatus]);
          OrderManager.playOrderChime();
        }
      }
    } else if (data.type === "ORDER_DELETED") {
      renderLiveOrdersTab();
    }
  };
}

// Storage Event Backup Listener for Cross-Tab Sync
window.addEventListener("storage", e => {
  if (e.key === "fc_orders") {
    renderLiveOrdersTab();
    if (activeCustomerOrderId) {
      const order = OrderManager.getOrderById(activeCustomerOrderId);
      if (order) {
        updateTrackerProgress(order.status);
        updateFloatingTrackerBar(order);
      }
    }
  }
});

/* ==========================================================================
   GLOBAL CLICK & EVENT HANDLERS
   ========================================================================== */
document.addEventListener("click", e => {
  // 1. Add (+) button on main menu
  const addBtn = e.target.closest("[data-add]");
  if (addBtn) {
    const [id, si] = addBtn.dataset.add.split("|");
    addToCart(id, Number(si));
    return;
  }

  // 2. Sub (−) button on main menu
  const subBtn = e.target.closest("[data-sub]");
  if (subBtn) {
    removeFromCart(subBtn.dataset.sub);
    return;
  }

  // 3. Inline Size selector click
  const szBtn = e.target.closest("[data-sz]");
  if (szBtn) {
    const [id, idx] = szBtn.dataset.sz.split("|");
    selSizes[id] = Number(idx);
    render();
    return;
  }

  // 4. Item Card click: Open Detail Modal
  const card = e.target.closest(".item-card, .deal-card");
  if (card) {
    openItemDetailModal(card.dataset.itemId);
    return;
  }

  // 5. Language toggle
  const langBtn = e.target.closest("#langBtn, #slimLangBtn");
  if (langBtn) {
    lang = lang === "en" ? "ur" : "en";
    localStorage.setItem("fc_lang", lang);
    render();
    setSlide(curSlide);
    if ($("cartSheet").style.display === "block") refreshCartSheet();
    return;
  }

  // 6. Scroll to top on center logo click
  if (e.target.closest("#heroLogoAnchor, #mainBrandLogo")) {
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }

  // 7. Open Cart
  if (e.target.closest("#bottomBarBtn, #slimCartBtn")) {
    openCartSheet();
    return;
  }

  // 8. Close Cart
  if (e.target.closest("#closeCartSheet")) {
    closeCartSheet();
    return;
  }

  // 9. Category chip click
  const chip = e.target.closest(".chip[data-cat]");
  if (chip) {
    activeCat = chip.dataset.cat;
    render();
    return;
  }

  // 10. Order Type Segment
  const segLabel = e.target.closest("#orderTypeSeg label");
  if (segLabel) {
    orderType = segLabel.dataset.type;
    document.querySelectorAll("#orderTypeSeg label").forEach(l => {
      l.classList.toggle("on", l.dataset.type === orderType);
    });
    updateAddressFieldState();
    refreshCartSheet();
    return;
  }

  // 11. Send Order Button
  if (e.target.closest("#sendOrderBtn")) {
    sendOrderToWhatsApp();
    return;
  }

  // 12. Open Table Picker (from top banner or cart)
  if (e.target.closest("#btnChangeTable, #cartBtnPickTable")) {
    openTablePicker();
    return;
  }

  // 13. Close Table Picker
  if (e.target.closest("#closeTablePicker")) {
    closeTablePicker();
    return;
  }

  // 14. Quick Table Selection (from Table Picker or Cart chips)
  const tblBtn = e.target.closest("[data-tbl-select]");
  if (tblBtn) {
    selectCustomTable(tblBtn.dataset.tblSelect);
    return;
  }

  // 14b. Set Custom Table Number
  if (e.target.closest("#btnApplyCustomTable")) {
    const val = $("customTableInput") ? $("customTableInput").value.trim() : "";
    if (val) selectCustomTable(val);
    return;
  }

  // 15. Close Customer Tracker Modal (From X or Continue button)
  if (e.target.closest("#closeCustomerTracker, #btnTrackerContinue")) {
    closeCustomerTracker();
    return;
  }

  // 15b. Open Customer Live Tracker from Sticky Floating Bar
  if (e.target.closest("#btnOpenFloatingTracker, #floatingTrackerBar")) {
    if (activeCustomerOrderId) {
      const order = OrderManager.getOrderById(activeCustomerOrderId);
      if (order) openCustomerTracker(order);
    }
    return;
  }

  // 15c. Auth Role Selector Tabs on Login Modal
  const roleBtn = e.target.closest(".auth-role-btn");
  if (roleBtn) {
    selectedAuthRole = roleBtn.dataset.authRole;
    curEnteredPin = "";
    updateAuthRoleTabs();
    updatePinDots();
    return;
  }

  // 15d. Station Switcher Buttons in Admin Studio
  const stBtn = e.target.closest(".station-btn");
  if (stBtn) {
    switchAdminStation(stBtn.dataset.station);
    return;
  }

  // 16. Open Admin Auth Modal
  if (e.target.closest("#openAdminBtn")) {
    openAuthModal("admin");
    return;
  }

  // 17. Close Admin Auth Modal
  if (e.target.closest("#closeAuthModal")) {
    closeAuthModal();
    return;
  }

  // 18. Close Admin Studio
  if (e.target.closest("#closeAdminBtn")) {
    closeAdminStudio();
    return;
  }

  // 19. Keypad numbers for PIN
  const numKey = e.target.closest(".key-btn[data-num]");
  if (numKey) {
    handlePinKey(numKey.dataset.num);
    return;
  }

  // 20. Keypad Del button
  if (e.target.closest("#keyDel")) {
    handlePinDelete();
    return;
  }

  // 21. Biometric Button
  if (e.target.closest("#btnBiometricAuth")) {
    handleBiometricLogin();
    return;
  }
});

// Close modals when backdrop is clicked
$("modalBackdrop").addEventListener("click", () => {
  closeItemDetailModal();
  closeCartSheet();
  closeAuthModal();
  closeTablePicker();
});

// Live Search Listeners
$("searchInput").addEventListener("input", e => {
  searchQuery = e.target.value;
  $("searchClear").style.display = searchQuery ? "flex" : "none";
  render();
});
$("searchClear").addEventListener("click", () => {
  $("searchInput").value = "";
  searchQuery = "";
  $("searchClear").style.display = "none";
  render();
});

/* ====== INITIALIZATION ====== */
document.addEventListener("DOMContentLoaded", () => {
  checkTableUrlParam();
  initScrollController();
  initCarouselTouch();
  render();
  startCarousel();

  // If customer has an active order, prepare tracker & floating bar
  if (activeCustomerOrderId) {
    const existingOrder = OrderManager.getOrderById(activeCustomerOrderId);
    if (existingOrder && existingOrder.status !== "cancelled") {
      updateTrackerProgress(existingOrder.status);
      updateFloatingTrackerBar(existingOrder);
    }
  }

  // Check biometric availability
  BiometricsAuth.checkAvailability().then(isAvail => {
    const btn = $("btnBiometricAuth");
    if (btn) btn.style.display = isAvail ? "flex" : "none";
  });
});
