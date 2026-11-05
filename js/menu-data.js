/* ==========================================================================
   FRI-CHICKS DIGITAL QR MENU - MENU DATA & ITEMS
   Actual Menu Items, Categories & Prices from Fri-Chicks Jhang
   ========================================================================== */

const CATS = [
  { id: "deals",  en: "Special Deals",          ur: "خصوصی ڈیلز" },
  { id: "pizza",  en: "Pizza Menu",             ur: "پیزا مینو" },
  { id: "burger", en: "Burgers",                ur: "کرسپی برگرز" },
  { id: "fried",  en: "Crispy Chicken & Fries", ur: "فرائیڈ چکن اور فرائز" },
  { id: "drinks", en: "Cold Drinks",            ur: "ٹھنڈے مشروبات" }
];

const DEFAULT_ITEMS = [
  // OFFICIAL DEALS (From official Facebook banners)
  {
    id: "d1", cat: "deals",
    n: "Special Delicious Deal", n_ur: "اسپیشل ڈلیشس ڈیل",
    d: "Crispy double cheese zinger burger, loaded french fries & cold drink",
    d_ur: "کرسپی ڈبل چیز زنگر برگر، گرما گرم فرائز اور ٹھنڈی بوتل",
    price: 850,
    img: "assets/banners/banner1.jpg"
  },
  {
    id: "d2", cat: "deals",
    n: "Chicken Sajji with Full Rice", n_ur: "سپر ڈلیشس چکن سجی فل رائس",
    d: "1 Full Sajji roasted on charcoal + aromatic Sajji rice + 2 tomato sauces",
    d_ur: "1 فل سجی کوئلوں پر تیار + خوشبودار سجی چاول + 2 ٹماٹر چٹنی",
    price: 1999,
    img: "assets/banners/banner2.jpg"
  },
  {
    id: "d3", cat: "deals",
    n: "Karizma Deal", n_ur: "کاریزما ڈیل",
    d: "2 Crispy Zinger Burgers + 1 Regular Fries + 500ml Cold Drink",
    d_ur: "2 کرسپی زنگر برگر + 1 ریگولر فرائز + 500 ملی لیٹر ٹھنڈی بوتل",
    price: 999,
    img: "assets/banners/banner4.jpg"
  },
  {
    id: "d4", cat: "deals",
    n: "Winters Special - 01", n_ur: "ونٹرز اسپیشل ڈیل",
    d: "1 Large Special Pizza + 5 Pcs Hot Buffalo Wings + 1L Cold Drink",
    d_ur: "1 لارج اسپیشل پیزا + 5 پیس ہاٹ ونگز + 1 لیٹر ٹھنڈی بوتل",
    price: 1850,
    img: "assets/banners/banner3.jpg"
  },
  {
    id: "d5", cat: "deals",
    n: "Royal Crown Crust Pizza Deal", n_ur: "رائل کراؤن پیزا ڈیل",
    d: "1 Royal Crown Crust Large Pizza loaded with kebabs and special cheese pockets",
    d_ur: "1 رائل کراؤن لارج پیزا، کباب اور چیز پاکٹس سے بھرپور",
    price: 1550,
    img: "assets/promo2.png"
  },

  // PIZZAS (S, M, L sizes)
  {
    id: "p1", cat: "pizza",
    n: "Chicken Tikka Pizza", n_ur: "چکن تکہ پیزا",
    d: "Spicy tikka chicken chunks, red onions, bell peppers & 100% mozzarella blend",
    d_ur: "روایتی تکہ چکن چنکس، لال پیاز، شملہ مرچ اور لذیذ موزریلا چیز",
    sizes: [650, 1150, 1750],
    img: "https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?w=500&h=400&fit=crop&q=80"
  },
  {
    id: "p2", cat: "pizza",
    n: "Chicken Fajita Pizza", n_ur: "چکن فجیتا پیزا",
    d: "Fajita seasoned chicken, black olives, jalapenos, mushrooms & double cheese",
    d_ur: "فجیتا مصالحہ چکن، زیتون، ہیلاپینیو، مشروم اور ڈبل چیز کا شاندار ملاپ",
    sizes: [680, 1200, 1800],
    img: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=500&h=400&fit=crop&q=80"
  },
  {
    id: "p3", cat: "pizza",
    n: "Cheese Lover Supreme", n_ur: "چیز لور پیزا",
    d: "Triple loaded cheddar & mozzarella with secret Italian herb sauce",
    d_ur: "چیڈر اور موزریلا چیز کا تڑکا، اطالوی ہربز اور خاص سیکرٹ ساس کے ساتھ",
    sizes: [600, 1050, 1650],
    img: "https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?w=500&h=400&fit=crop&q=80"
  },

  // BURGERS
  {
    id: "b1", cat: "burger",
    n: "Crispy Zinger Burger", n_ur: "کرسپی زنگر برگر",
    d: "Signature crispy fried chicken fillet, fresh iceberg lettuce, classic mayo",
    d_ur: "کرسپی چکن فلے، تازہ سلاد پتہ، اور خاص مایو کریم",
    price: 430,
    img: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&h=400&fit=crop&q=80"
  },
  {
    id: "b2", cat: "burger",
    n: "Cheese Zinger Melt", n_ur: "چیز زنگر برگر",
    d: "Golden zinger fillet topped with melted golden cheddar slice and chipotle sauce",
    d_ur: "زنگر فلے پر پگھلی ہوئی چیڈر چیز کی قاش اور چلی گارلک ساس",
    price: 520,
    img: "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=500&h=400&fit=crop&q=80"
  },
  {
    id: "b3", cat: "burger",
    n: "Double Patty Grand Burger", n_ur: "ڈبل پیٹی گرینڈ برگر",
    d: "Two juicy patties, double cheese slices, caramelized onion, signature burger sauce",
    d_ur: "دو جوسی پیٹیز، ڈبل چیز سلائس، پیاز اور کلاسک ریسپی ساس",
    price: 680,
    img: "https://images.unsplash.com/photo-1582196016295-f8c8bd4b3e99?w=500&h=400&fit=crop&q=80"
  },

  // FRIED CHICKEN, WINGS & FRIES
  {
    id: "f1", cat: "fried",
    n: "Crispy Fried Chicken (2 Pcs)", n_ur: "کرسپی فرائیڈ چکن (2 پیس)",
    d: "Secret recipe fried chicken, crunch outside, tender & juicy inside",
    d_ur: "سیکرٹ ریسپی، باہر سے انتہائی خستہ اور اندر سے جوسی چکن",
    price: 490,
    img: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=500&h=400&fit=crop&q=80"
  },
  {
    id: "f2", cat: "fried",
    n: "Crispy Fried Chicken (6 Pcs)", n_ur: "کرسپی فرائیڈ چکن (6 پیس)",
    d: "6 piece family bucket served with garlic mayo dipping sauce",
    d_ur: "6 پیس فیملی بکٹ، گارلک مایو ڈپ ساس کے ساتھ",
    price: 1390,
    img: "https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?w=500&h=400&fit=crop&q=80"
  },
  {
    id: "f3", cat: "fried",
    n: "Hot & Spicy Buffalo Wings (5 Pcs)", n_ur: "بفیلو ونگز (5 پیس)",
    d: "Crispy chicken wings glazed in signature hot & spicy sauce",
    d_ur: "کرسپی چکن ونگز، چٹپٹے تیکھے ساس کے ساتھ",
    price: 380,
    img: "https://images.unsplash.com/photo-1527477378408-1bc42387163c?w=500&h=400&fit=crop&q=80"
  },
  {
    id: "f4", cat: "fried",
    n: "Masala Crispy Fries", n_ur: "مصالحہ کرسپی فرائز",
    d: "Fresh golden cut potatoes dusted with Fri-Chicks hot chatpata masala",
    d_ur: "تازہ گولڈن کٹ آلو، چٹپٹے مصالحے اور مایو کے ساتھ",
    sizes: [190, 290, 390],
    img: "https://images.unsplash.com/photo-1576107232684-1279f3908594?w=500&h=400&fit=crop&q=80"
  },

  // DRINKS
  {
    id: "k1", cat: "drinks",
    n: "Soft Drink (345ml)", n_ur: "سافٹ ڈرنک (345 ملی لیٹر)",
    d: "Chilled cold drink bottle (Pepsi / 7Up / Mirinda / Dew)",
    d_ur: "ٹھنڈی بوتل (پیپسی / سیون اپ / مرنڈا / ڈیو)",
    price: 110,
    img: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&h=400&fit=crop&q=80"
  },
  {
    id: "k2", cat: "drinks",
    n: "Soft Drink Jumbo (1.5L)", n_ur: "سافٹ ڈرنک جمبو (1.5 لیٹر)",
    d: "Family chilled 1.5 Liter bottle",
    d_ur: "فیملی سائز 1.5 لیٹر ٹھنڈی بوتل",
    price: 280,
    img: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=500&h=400&fit=crop&q=80"
  }
];

let ITEMS = JSON.parse(localStorage.getItem("fc_custom_items") || "null") || DEFAULT_ITEMS;

function saveItems() {
  localStorage.setItem("fc_custom_items", JSON.stringify(ITEMS));
}

function resetItemsToDefault() {
  ITEMS = JSON.parse(JSON.stringify(DEFAULT_ITEMS));
  localStorage.removeItem("fc_custom_items");
}

