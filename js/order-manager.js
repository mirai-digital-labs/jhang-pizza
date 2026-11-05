/* ==========================================================================
   FRI-CHICKS DIGITAL QR MENU - ORDER MANAGEMENT & KDS ENGINE
   End-to-End Workflow: Customer ➔ Cashier POS ➔ Kitchen KDS ➔ Delivery/Served
   Real-Time Tab-to-Tab Synchronization via BroadcastChannel & LocalStorage
   ========================================================================== */

const OrderBus = ('BroadcastChannel' in window) ? new BroadcastChannel('fc_restaurant_bus') : null;

const OrderManager = {
  getOrders: function() {
    return JSON.parse(localStorage.getItem("fc_orders") || "[]");
  },

  saveOrders: function(orders) {
    localStorage.setItem("fc_orders", JSON.stringify(orders));
  },

  createOrder: function(data) {
    const orders = this.getOrders();
    const orderNum = Math.floor(1000 + Math.random() * 9000);
    const newOrder = {
      id: `FC-${orderNum}`,
      createdAt: new Date().toISOString(),
      timestamp: Date.now(),
      timeFormatted: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      dateFormatted: new Date().toLocaleDateString(),
      status: "pending", // Stage 1: pending (Cashier) ➔ Stage 2: preparing (Kitchen) ➔ Stage 3: ready (Waiter/Rider) ➔ Stage 4: completed
      previousStatus: "pending",
      orderType: data.orderType,
      customer: {
        name: data.name,
        phone: data.phone,
        address: data.address || "",
        table: data.table || ""
      },
      items: data.items,
      instructions: data.instructions || "",
      subtotal: data.subtotal,
      deliveryFee: data.deliveryFee,
      total: data.total
    };

    orders.unshift(newOrder);
    this.saveOrders(orders);
    this.playOrderChime();

    // Broadcast in real-time to Cashier & Kitchen screens
    if (OrderBus) {
      OrderBus.postMessage({ type: "NEW_ORDER", order: newOrder });
    }

    return newOrder;
  },

  updateStatus: function(orderId, newStatus) {
    const orders = this.getOrders();
    const order = orders.find(o => o.id === orderId);
    if (order) {
      order.previousStatus = order.status;
      order.status = newStatus;
      this.saveOrders(orders);

      // Broadcast status update to all connected stations & customer live tracker
      if (OrderBus) {
        OrderBus.postMessage({ type: "STATUS_UPDATE", orderId, newStatus });
      }
      return true;
    }
    return false;
  },

  undoStatus: function(orderId) {
    const orders = this.getOrders();
    const order = orders.find(o => o.id === orderId);
    if (order && order.previousStatus) {
      const prev = order.previousStatus;
      order.previousStatus = order.status;
      order.status = prev;
      this.saveOrders(orders);

      if (OrderBus) {
        OrderBus.postMessage({ type: "STATUS_UPDATE", orderId, newStatus: prev });
      }
      return prev;
    }
    return null;
  },

  deleteOrder: function(orderId) {
    let orders = this.getOrders();
    orders = orders.filter(o => o.id !== orderId);
    this.saveOrders(orders);
    if (OrderBus) {
      OrderBus.postMessage({ type: "ORDER_DELETED", orderId });
    }
  },

  getOrderById: function(orderId) {
    return this.getOrders().find(o => o.id === orderId);
  },

  // Filter queues for Cashier, Kitchen, Waiter/Rider
  getCashierQueue: function() {
    return this.getOrders().filter(o => o.status === "pending");
  },

  getKitchenQueue: function() {
    return this.getOrders().filter(o => o.status === "preparing");
  },

  getReadyQueue: function() {
    return this.getOrders().filter(o => o.status === "ready" || o.status === "onway");
  },

  getCompletedQueue: function() {
    return this.getOrders().filter(o => o.status === "completed");
  },

  getStats: function() {
    const orders = this.getOrders();
    const todayStr = new Date().toLocaleDateString();
    const todayOrders = orders.filter(o => o.dateFormatted === todayStr);

    let pendingCount = 0;
    let kitchenCount = 0;
    let readyCount = 0;
    let revenue = 0;

    todayOrders.forEach(o => {
      if (o.status !== "cancelled") {
        revenue += (o.total || 0);
      }
      if (o.status === "pending") pendingCount++;
      if (o.status === "preparing") kitchenCount++;
      if (o.status === "ready" || o.status === "onway") readyCount++;
    });

    return {
      totalToday: todayOrders.length,
      pendingCount,
      kitchenCount,
      readyCount,
      todayRevenue: revenue
    };
  },

  // Audio Notification Chime (Synthesized via Web Audio API)
  playOrderChime: function() {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.35, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.6);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.6);
    } catch (e) {
      // AudioContext fallback
    }
  },

  // Print Thermal KOT (Kitchen Order Ticket)
  printKOT: function(orderId) {
    const order = this.getOrderById(orderId);
    if (!order) return;

    const printWin = window.open("", "_blank", "width=380,height=600");
    const itemsHtml = order.items.map(it => `
      <div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px dashed #ccc;font-size:14px">
        <span><b>${it.q}x</b> ${it.name} ${it.size ? `(${it.size})` : ''}</span>
        <span>Rs ${it.total}</span>
      </div>
    `).join("");

    const orderTypeLabel = {
      delivery: "🛵 HOME / OFFICE DELIVERY",
      dinein: `🍽️ DINE-IN (TABLE ${order.customer.table})`,
      pickup: "🛍️ TAKEAWAY / PICKUP"
    }[order.orderType] || order.orderType;

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>KOT - ${order.id}</title>
        <style>
          body{font-family:monospace;padding:12px;font-size:13px;line-height:1.4}
          h2,h3{text-align:center;margin:4px 0}
          .divider{border-top:1px dashed #000;margin:8px 0}
        </style>
      </head>
      <body>
        <h2>FRI-CHICKS JHANG</h2>
        <h3 style="background:#eee;padding:4px">${orderTypeLabel}</h3>
        <p>Order ID: <b>${order.id}</b> | Time: ${order.timeFormatted}</p>
        <p>Customer: <b>${order.customer.name}</b> (${order.customer.phone})</p>
        ${order.customer.address ? `<p>Address: ${order.customer.address}</p>` : ''}
        ${order.customer.table ? `<p style="font-size:16px;background:#FEF08A;padding:4px">Table: <b>${order.customer.table}</b></p>` : ''}
        ${order.instructions ? `<p style="background:#fff3cd;padding:4px"><b>CHEF NOTE:</b><br>${order.instructions}</p>` : ''}
        <div class="divider"></div>
        <h4>ORDER ITEMS:</h4>
        ${itemsHtml}
        <div class="divider"></div>
        <p style="text-align:right;font-size:16px"><b>TOTAL: Rs ${order.total}</b></p>
        <p style="text-align:center;margin-top:16px;font-size:11px">--- Kitchen Display Ticket (KDS/KOT) ---</p>
        <script>
          window.onload = function(){ window.print(); window.close(); }
        </script>
      </body>
      </html>
    `);
    printWin.document.close();
  }
};
