/* ==========================================================================
   FRI-CHICKS DIGITAL QR MENU - CONFIGURATION MODULE
   ========================================================================== */

const DEFAULT_CONFIG = {
  whatsapp: "923000626250",
  deliveryFee: 120,
  freeDeliveryThreshold: 2000,
  samplePricesNotice: true,
  adminPin: "1234",      // 1. Super Admin / Owner PIN
  cashierPin: "2222",    // 2. Cashier POS PIN
  kitchenPin: "3333",    // 3. Kitchen KDS PIN
  websiteUrl: "https://jhang-pizza.miraidigitallabs.workers.dev", // Live Cloudflare Workers Link
  currency: "Rs",
  currencyUr: "روپے"
};

let CONFIG = Object.assign({}, DEFAULT_CONFIG, JSON.parse(localStorage.getItem("fc_config") || "{}"));
if (!CONFIG.websiteUrl || CONFIG.websiteUrl.trim().length === 0 || CONFIG.websiteUrl.includes("vercel.app")) {
  CONFIG.websiteUrl = DEFAULT_CONFIG.websiteUrl;
  try {
    saveConfig({ websiteUrl: DEFAULT_CONFIG.websiteUrl });
  } catch (e) {}
}

function saveConfig(newCfg) {
  CONFIG = Object.assign(CONFIG, newCfg);
  localStorage.setItem("fc_config", JSON.stringify(CONFIG));
}

function resetConfig() {
  CONFIG = Object.assign({}, DEFAULT_CONFIG);
  localStorage.removeItem("fc_config");
}
