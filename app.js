/**
 * ==============================================================================
 * FOOD BURGER - Fast Food & Beef Burger Ordering Website (JavaScript)
 * نظام تفاعلي متكامل ومُحسّن للمطاعم:
 * 1. منيو كامل يضم أصناف BEEF BURGER الأصلية + مقبلات وصوصات
 * 2. دعم اختيار نوع الوجبة (ساندوتش / كومبو +35 ج.م / إكسترا تشيز +20 ج.م) مع تحديث السعر لحظياً
 * 3. دعم جلب المنيو والكوبونات ديناميكياً من Google Sheets (Code.gs) عند إضافة الرابط
 * 4. قائمة موبايل منبثقة (Hamburger Drawer) + زر واتساب عائم
 * 5. حفظ واسترجاع سلة الطلبات والكوبونات تلقائياً عبر localStorage
 * 6. نظام كوبونات خصم حقيقي (BURGER15, FOOD10, FAMOUS20, VIP25)
 * 7. دعم التوصيل للمنزل (دليفري) أو الاستلام من الفرع (تيك أواي بدون رسوم توصيل)
 * 8. إرسال الأوردر كاملاً ومنسقاً مباشرة لواتساب المطبخ مع التحقق من الرقم المصري
 * ==============================================================================
 */

// -----------------------------------------------------------------------------
// 1. إعدادات المطعم ورقم الواتساب
// -----------------------------------------------------------------------------
// ضع رابط Web App الخاص بشيت جوجل هنا عند الرغبة في إدارة المنيو من Google Sheets
// إذا تُرك فارغاً، يعمل الموقع تلقائياً بالمنيو الافتراضي الكامل لـ FOOD BURGER
const GOOGLE_SHEET_API_URL = "";

// رقم الواتساب المعتمد لاستقبال الأوردرات بصيغته الدولية
const WHATSAPP_PHONE = "201200297370";

// العملة وإعدادات التوصيل
const CURRENCY_LABEL = "ج.م";
const FREE_SHIPPING_THRESHOLD = 250; // توصيل مجاني للأوردرات فوق 250 ج.م
const DEFAULT_SHIPPING_FEE = 25;     // رسوم التوصيل الافتراضية

// فروق الأسعار حسب نوع الخيار المختار
const OPTION_PRICE_DELTAS = {
    "ساندوتش": 0,
    "كومبو (فرايز+بيبسي)": 35,
    "إكسترا تشيز": 20,
    "عادي": 0,
    "لارج": 15,
    "قياسي": 0
};

// -----------------------------------------------------------------------------
// أكواد الخصم الافتراضية
// -----------------------------------------------------------------------------
const DEFAULT_COUPONS = {
    "BURGER15": { code: "BURGER15", percent: 15, active: true, status: "مفعل", desc: "خصم 15% من FOOD BURGER", minOrder: 0 },
    "FOOD10":   { code: "FOOD10",   percent: 10, active: true, status: "مفعل", desc: "خصم 10% على أوردرك", minOrder: 0 },
    "FAMOUS20": { code: "FAMOUS20", percent: 20, active: true, status: "مفعل", desc: "خصم 20% للأوردرات فوق 250 ج.م", minOrder: 250 },
    "VIP25":    { code: "VIP25",    percent: 25, active: true, status: "مفعل", desc: "خصم كبار الشخصيات 25%", minOrder: 400 }
};

let storeCoupons = { ...DEFAULT_COUPONS };

// -----------------------------------------------------------------------------
// 2. المنيو الكامل لمطعم FOOD BURGER (مطابق لصورة المنيو + مقبلات ومشروبات)
// -----------------------------------------------------------------------------
const DEFAULT_PRODUCTS = [
    // === قسم: بيف برجر سبيشيال (Special & Monster Beef Burgers) ===
    {
        id: "fb-1",
        name: "دكتور فيمس",
        category: "بيف برجر سبيشيال 🔥",
        price: 130,
        oldPrice: 150,
        sizes: ["ساندوتش", "كومبو (فرايز+بيبسي)", "إكسترا تشيز"],
        isBestSeller: true,
        ordersCount: 94,
        rating: "★★★★★ (86 تقييم)",
        description: "200 جرام بيف محشية ميكس جبن، بيكون، موتزاريلا ستيكس، صوصات، خضار، كيزر طازج.",
        image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=800&auto=format&fit=crop"
    },
    {
        id: "fb-2",
        name: "سماش كرامالايز",
        category: "بيف برجر سبيشيال 🔥",
        price: 130,
        oldPrice: 145,
        sizes: ["ساندوتش", "كومبو (فرايز+بيبسي)", "إكسترا تشيز"],
        isBestSeller: true,
        ordersCount: 88,
        rating: "★★★★★ (79 تقييم)",
        description: "300 جرام برجر، 3 سلايز، كرامالايز، صوصات، بيكون، كيزر طازج.",
        image: "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?q=80&w=800&auto=format&fit=crop"
    },
    {
        id: "fb-3",
        name: "شوب هاوس",
        category: "بيف برجر سبيشيال 🔥",
        price: 125,
        oldPrice: null,
        sizes: ["ساندوتش", "كومبو (فرايز+بيبسي)", "إكسترا تشيز"],
        isBestSeller: true,
        ordersCount: 76,
        rating: "★★★★★ (64 تقييم)",
        description: "بيف، تشيكن، صوصات، تركي، بيكون، جبنه، هالبينو، كيزر.",
        image: "https://images.unsplash.com/photo-1553979459-d2229ba7433b?q=80&w=800&auto=format&fit=crop"
    },
    {
        id: "fb-4",
        name: "تربل شيش",
        category: "بيف برجر سبيشيال 🔥",
        price: 120,
        oldPrice: null,
        sizes: ["ساندوتش", "كومبو (فرايز+بيبسي)", "إكسترا تشيز"],
        isBestSeller: true,
        ordersCount: 68,
        rating: "★★★★★ (58 تقييم)",
        description: "بيف، شيش طاووق، تركي، صوصات، بيكون، جبنه، كيزر.",
        image: "https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?q=80&w=800&auto=format&fit=crop"
    },
    {
        id: "fb-5",
        name: "مايسترو برجر",
        category: "بيف برجر سبيشيال 🔥",
        price: 100,
        oldPrice: 115,
        sizes: ["ساندوتش", "كومبو (فرايز+بيبسي)", "إكسترا تشيز"],
        isBestSeller: true,
        ordersCount: 72,
        rating: "★★★★★ (61 تقييم)",
        description: "بيف، هوت دوج، سموك تركي، صوصات، موتزاريلا سايحة، كيزر.",
        image: "https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=800&auto=format&fit=crop"
    },
    {
        id: "fb-6",
        name: "فيمس برجر",
        category: "بيف برجر سبيشيال 🔥",
        price: 100,
        oldPrice: null,
        sizes: ["ساندوتش", "كومبو (فرايز+بيبسي)", "إكسترا تشيز"],
        isBestSeller: false,
        ordersCount: 49,
        rating: "★★★★★ (44 تقييم)",
        description: "بيف، مشروم، كرامالايز، بيكون، جبنه، صوصات، كيزر.",
        image: "https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?q=80&w=800&auto=format&fit=crop"
    },
    {
        id: "fb-7",
        name: "بيف ستار",
        category: "بيف برجر سبيشيال 🔥",
        price: 100,
        oldPrice: null,
        sizes: ["ساندوتش", "كومبو (فرايز+بيبسي)", "إكسترا تشيز"],
        isBestSeller: false,
        ordersCount: 46,
        rating: "★★★★★ (41 تقييم)",
        description: "بيف، موتزاريلا ستيكس، صوصات، بيكون، كيزر.",
        image: "https://images.unsplash.com/photo-1565299507177-b0ac66763828?q=80&w=800&auto=format&fit=crop"
    },
    {
        id: "fb-8",
        name: "دبل برجر",
        category: "بيف برجر سبيشيال 🔥",
        price: 100,
        oldPrice: null,
        sizes: ["ساندوتش", "كومبو (فرايز+بيبسي)", "إكسترا تشيز"],
        isBestSeller: false,
        ordersCount: 54,
        rating: "★★★★★ (52 تقييم)",
        description: "2 ق بيف، صوصات، جبنه، كيزر.",
        image: "https://images.unsplash.com/photo-1551782450-a2132b4ba21d?q=80&w=800&auto=format&fit=crop"
    },
    {
        id: "fb-9",
        name: "جولدن برجر",
        category: "بيف برجر سبيشيال 🔥",
        price: 95,
        oldPrice: null,
        sizes: ["ساندوتش", "كومبو (فرايز+بيبسي)", "إكسترا تشيز"],
        isBestSeller: false,
        ordersCount: 43,
        rating: "★★★★★ (37 تقييم)",
        description: "بيف، كرامالايز، بيكون، موتزاريلا ستيكس، صوصات، كيزر.",
        image: "https://images.unsplash.com/photo-1571091718767-18b5b1457add?q=80&w=800&auto=format&fit=crop"
    },

    // === قسم: بيف برجر كلاسيك (Classic Beef Burgers) ===
    {
        id: "fb-10",
        name: "بيكون برجر",
        category: "بيف برجر كلاسيك 🍔",
        price: 90,
        oldPrice: null,
        sizes: ["ساندوتش", "كومبو (فرايز+بيبسي)", "إكسترا تشيز"],
        isBestSeller: true,
        ordersCount: 70,
        rating: "★★★★★ (63 تقييم)",
        description: "بيف، صوص، بيكون، جبنه، خضار، كيزر.",
        image: "https://images.unsplash.com/photo-1553979459-d2229ba7433b?q=80&w=800&auto=format&fit=crop"
    },
    {
        id: "fb-11",
        name: "بيض . جبنه . بيكون",
        category: "بيف برجر كلاسيك 🍔",
        price: 90,
        oldPrice: null,
        sizes: ["ساندوتش", "كومبو (فرايز+بيبسي)", "إكسترا تشيز"],
        isBestSeller: false,
        ordersCount: 41,
        rating: "★★★★★ (38 تقييم)",
        description: "بيف، صوص، بيض، جبنه، بيكون، موتزاريلا، كيزر.",
        image: "https://images.unsplash.com/photo-1520072959219-c595dc870360?q=80&w=800&auto=format&fit=crop"
    },
    {
        id: "fb-12",
        name: "كرامالايز برجر",
        category: "بيف برجر كلاسيك 🍔",
        price: 85,
        oldPrice: null,
        sizes: ["ساندوتش", "كومبو (فرايز+بيبسي)", "إكسترا تشيز"],
        isBestSeller: false,
        ordersCount: 39,
        rating: "★★★★★ (33 تقييم)",
        description: "بيف، كرامالايز، صوص، جبنه، خضار، كيزر.",
        image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=800&auto=format&fit=crop"
    },
    {
        id: "fb-13",
        name: "برجر بيض جبنه",
        category: "بيف برجر كلاسيك 🍔",
        price: 80,
        oldPrice: null,
        sizes: ["ساندوتش", "كومبو (فرايز+بيبسي)", "إكسترا تشيز"],
        isBestSeller: false,
        ordersCount: 34,
        rating: "★★★★★ (29 تقييم)",
        description: "بيف، بيض، صوص، جبنه، خضار، كيزر.",
        image: "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?q=80&w=800&auto=format&fit=crop"
    },
    {
        id: "fb-14",
        name: "برجر جبنه",
        category: "بيف برجر كلاسيك 🍔",
        price: 75,
        oldPrice: null,
        sizes: ["ساندوتش", "كومبو (فرايز+بيبسي)", "إكسترا تشيز"],
        isBestSeller: false,
        ordersCount: 51,
        rating: "★★★★★ (47 تقييم)",
        description: "بيف، جبنه، صوص، خضار، كيزر.",
        image: "https://images.unsplash.com/photo-1571091718767-18b5b1457add?q=80&w=800&auto=format&fit=crop"
    },
    {
        id: "fb-15",
        name: "برجر بيض",
        category: "بيف برجر كلاسيك 🍔",
        price: 70,
        oldPrice: null,
        sizes: ["ساندوتش", "كومبو (فرايز+بيبسي)", "إكسترا تشيز"],
        isBestSeller: false,
        ordersCount: 28,
        rating: "★★★★★ (24 تقييم)",
        description: "بيف، بيض، صوص، خضار، كيزر.",
        image: "https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=800&auto=format&fit=crop"
    },
    {
        id: "fb-16",
        name: "برجر ساده",
        category: "بيف برجر كلاسيك 🍔",
        price: 65,
        oldPrice: null,
        sizes: ["ساندوتش", "كومبو (فرايز+بيبسي)", "إكسترا تشيز"],
        isBestSeller: false,
        ordersCount: 44,
        rating: "★★★★★ (39 تقييم)",
        description: "بيف، خضار، صوص، كيزر.",
        image: "https://images.unsplash.com/photo-1565299507177-b0ac66763828?q=80&w=800&auto=format&fit=crop"
    },

    // === قسم: مقبلات وفرايز (Sides & Fries) ===
    {
        id: "fb-17",
        name: "تشيزي بيكون فرايز",
        category: "مقبلات وفرايز 🍟",
        price: 55,
        oldPrice: 65,
        sizes: ["عادي", "لارج"],
        isBestSeller: false,
        ordersCount: 50,
        rating: "★★★★★ (46 تقييم)",
        description: "بطاطس مقرمشة مغطاة بصوص شيدر سايح، قطع بيكون مقرمش وهالبينو.",
        image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?q=80&w=800&auto=format&fit=crop"
    },
    {
        id: "fb-18",
        name: "موتزاريلا ستيكس (4 قطع)",
        category: "مقبلات وفرايز 🍟",
        price: 45,
        oldPrice: null,
        sizes: ["قياسي"],
        isBestSeller: false,
        ordersCount: 36,
        rating: "★★★★★ (31 تقييم)",
        description: "4 أصابع موتزاريلا ذهبية مقرمشة من برة وجبنة بتمط من جوه مع صوص رانش.",
        image: "https://images.unsplash.com/photo-1531749668029-2db88e4276c7?q=80&w=800&auto=format&fit=crop"
    },

    // === قسم: صوصات ومشروبات (Sauces & Drinks) ===
    {
        id: "fb-19",
        name: "كب صوص شيدر سايح",
        category: "صوصات ومشروبات 🥤",
        price: 20,
        oldPrice: null,
        sizes: ["قياسي"],
        isBestSeller: false,
        ordersCount: 60,
        rating: "★★★★★ (54 تقييم)",
        description: "صوص جبنة شيدر ساخن وغني لتغميس البرجر والفرايز.",
        image: "https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?q=80&w=800&auto=format&fit=crop"
    },
    {
        id: "fb-20",
        name: "مشروب غازي مثلج (كان)",
        category: "صوصات ومشروبات 🥤",
        price: 20,
        oldPrice: null,
        sizes: ["قياسي"],
        isBestSeller: false,
        ordersCount: 55,
        rating: "★★★★★ (42 تقييم)",
        description: "مشروب غازي بارد ومنعش بجانب وجبتك الساخنة.",
        image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?q=80&w=800&auto=format&fit=crop"
    }
];

// حالة التطبيق العامة
let productsData = [];
let activeCategory = "الكل";
let cart = [];
let activeCoupon = null;

// -----------------------------------------------------------------------------
// 3. إدارة التخزين المحلي (localStorage)
// -----------------------------------------------------------------------------
function loadCartFromStorage() {
    try {
        const storedCart = localStorage.getItem("foodburger_cart");
        cart = storedCart ? JSON.parse(storedCart) : [];

        const storedCoupon = localStorage.getItem("foodburger_coupon");
        if (storedCoupon) {
            activeCoupon = JSON.parse(storedCoupon);
            if (activeCoupon && activeCoupon.percent > 0 && activeCoupon.percent <= 1) {
                activeCoupon.percent = Math.round(activeCoupon.percent * 100);
            }
        }

        const customCoupons = localStorage.getItem("foodburger_store_coupons");
        if (customCoupons) {
            storeCoupons = { ...DEFAULT_COUPONS, ...JSON.parse(customCoupons) };
        }
    } catch (e) {
        console.warn("خطأ في استرجاع السلة من localStorage:", e);
        cart = [];
        activeCoupon = null;
    }
}

function saveCartToStorage() {
    try {
        localStorage.setItem("foodburger_cart", JSON.stringify(cart));
        if (activeCoupon) {
            localStorage.setItem("foodburger_coupon", JSON.stringify(activeCoupon));
        } else {
            localStorage.removeItem("foodburger_coupon");
        }
    } catch (e) {
        console.warn("خطأ في حفظ السلة في localStorage:", e);
    }
}

// -----------------------------------------------------------------------------
// 4. دوال مساعدة (الأسعار، حساب فروق الكومبو، والهروب الآمن)
// -----------------------------------------------------------------------------
function formatPrice(amount) {
    const num = parseFloat(amount) || 0;
    return `${num.toLocaleString("ar-EG")} ${CURRENCY_LABEL}`;
}

function getOptionDelta(optionLabel) {
    if (!optionLabel) return 0;
    return OPTION_PRICE_DELTAS[optionLabel.trim()] || 0;
}

function getEffectivePrice(basePrice, optionLabel) {
    return (parseFloat(basePrice) || 0) + getOptionDelta(optionLabel);
}

function escapeHtml(str) {
    if (!str) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// -----------------------------------------------------------------------------
// 5. مزامنة روابط وأرقام الواتساب ديناميكياً في كامل الصفحة
// -----------------------------------------------------------------------------
function syncWhatsAppLinks() {
    const egyptLocalPhone = WHATSAPP_PHONE.startsWith("20")
        ? "0" + WHATSAPP_PHONE.slice(2)
        : (WHATSAPP_PHONE.startsWith("2") ? "0" + WHATSAPP_PHONE.slice(1) : WHATSAPP_PHONE);

    const whatsappLinks = document.querySelectorAll('a[data-whatsapp-link], a[href*="wa.me"]');
    whatsappLinks.forEach(link => {
        link.href = `https://wa.me/${WHATSAPP_PHONE}`;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
    });

    const phoneDisplays = document.querySelectorAll('[data-whatsapp-display]');
    phoneDisplays.forEach(el => {
        el.innerText = egyptLocalPhone;
    });
}

// -----------------------------------------------------------------------------
// 6. سجل الأكثر طلباً محلياً
// -----------------------------------------------------------------------------
function getLocalOrdersTally() {
    try {
        const stored = localStorage.getItem("foodburger_orders_tally");
        return stored ? JSON.parse(stored) : {};
    } catch (e) {
        return {};
    }
}

function incrementProductOrderTally(productId) {
    try {
        const tally = getLocalOrdersTally();
        tally[productId] = (tally[productId] || 0) + 1;
        localStorage.setItem("foodburger_orders_tally", JSON.stringify(tally));
    } catch (e) {
        console.warn("تعذر حفظ سجل الطلبات:", e);
    }
}

function isProductBestSeller(product) {
    if (product.isBestSeller) return true;
    const tally = getLocalOrdersTally();
    const localCount = tally[product.id] || 0;
    const totalOrders = (product.ordersCount || 0) + localCount;
    return totalOrders >= 65;
}

// -----------------------------------------------------------------------------
// 7. جلب المنيو (من Google Sheets لو مربوط أو من المنيو الافتراضي مباشرة)
// -----------------------------------------------------------------------------
async function fetchProductsFromGoogleSheet() {
    if (!GOOGLE_SHEET_API_URL || GOOGLE_SHEET_API_URL.trim() === "") {
        initProducts(DEFAULT_PRODUCTS);
        return;
    }

    try {
        const response = await fetch(GOOGLE_SHEET_API_URL, {
            method: "GET",
            headers: { "Accept": "application/json" }
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const result = await response.json();
        const items = Array.isArray(result) ? result : (result.data || []);

        if (result.coupons && Array.isArray(result.coupons) && result.coupons.length > 0) {
            storeCoupons = {};
            result.coupons.forEach(c => {
                const code = String(c.code || "").trim().toUpperCase();
                if (code) {
                    let percent = parseFloat(c.percent) || 0;
                    if (percent > 0 && percent <= 1) percent = Math.round(percent * 100);
                    storeCoupons[code] = {
                        code,
                        percent,
                        active: Boolean(c.active !== false && c.status !== "معطل" && c.status !== "ملغي"),
                        status: c.status || (c.active ? "مفعل" : "معطل"),
                        desc: c.desc || `خصم ${percent}%`,
                        minOrder: parseFloat(c.minOrder) || 0
                    };
                }
            });
            localStorage.setItem("foodburger_store_coupons", JSON.stringify(storeCoupons));
        }

        if (items && items.length > 0) {
            initProducts(items);
        } else {
            initProducts(DEFAULT_PRODUCTS);
        }
    } catch (error) {
        console.warn("تم التحويل للمنيو المحلي:", error);
        initProducts(DEFAULT_PRODUCTS);
    }
}

function initProducts(items) {
    productsData = items.map((item, index) => {
        const price = parseFloat(item.price) || 0;
        const oldPrice = item.oldPrice ? parseFloat(item.oldPrice) : null;

        let sizes = item.sizes;
        if (typeof sizes === "string") {
            sizes = sizes.split(/[,،\/\-]/).map(s => s.trim()).filter(Boolean);
        }
        if (!Array.isArray(sizes) || sizes.length === 0) {
            sizes = ["ساندوتش", "كومبو (فرايز+بيبسي)"];
        }

        return {
            id: item.id ? String(item.id) : `fb-${index + 1}`,
            name: item.name || "بيف برجر",
            category: (item.category || "بيف برجر كلاسيك 🍔").trim(),
            price: price,
            oldPrice: (oldPrice && oldPrice > price) ? oldPrice : null,
            image: item.image || "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=800&auto=format&fit=crop",
            sizes: sizes,
            selectedSize: sizes[0],
            isBestSeller: Boolean(item.isBestSeller === true || String(item.isBestSeller).toLowerCase() === "true" || String(item.isBestSeller) === "نعم"),
            ordersCount: parseInt(item.ordersCount) || 0,
            rating: item.rating || "★★★★★ (45 تقييم)",
            description: item.description || "بيف طازج مشوي على الجريل، صوص FOOD BURGER، جبنة سايحة، خضار، كيزر."
        };
    });

    renderCategoryFilters();
    distributeProducts();
}

// -----------------------------------------------------------------------------
// 8. توليد كرت الصنف (HTML Card Generator)
// -----------------------------------------------------------------------------
function createProductCardHTML(product) {
    let discountBadgeHTML = "";
    if (product.oldPrice && product.oldPrice > product.price) {
        const discountPct = Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100);
        discountBadgeHTML = `<span class="product-badge badge-discount">عرض -${discountPct}%</span>`;
    }

    const isBest = isProductBestSeller(product);
    const bestSellerBadgeHTML = isBest
        ? `<span class="product-badge badge-bestseller">الأكثر طلباً 🔥</span>`
        : "";

    const sizesHTML = product.sizes.map((s, idx) => {
        const delta = getOptionDelta(s);
        const deltaText = delta > 0 ? ` (+${delta})` : "";
        return `<button type="button" class="size-btn ${idx === 0 ? "active" : ""}" data-option="${escapeHtml(s)}" data-delta="${delta}" onclick="chooseSize(this)">${escapeHtml(s)}${deltaText}</button>`;
    }).join("");

    const priceBlockHTML = `
        <div class="price-wrap">
            <span class="current-price">${formatPrice(product.price)}</span>
            ${product.oldPrice ? `<span class="old-price">${formatPrice(product.oldPrice)}</span>` : ""}
        </div>
    `;

    return `
        <article class="product-card" data-id="${escapeHtml(product.id)}" data-name="${escapeHtml(product.name)}" data-base-price="${product.price}" data-price="${product.price}">
            <div class="product-image-wrap" onclick="openProductModal('${escapeHtml(product.id)}')" title="انقر لتفاصيل ${escapeHtml(product.name)}">
                ${bestSellerBadgeHTML}
                ${discountBadgeHTML}
                <img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}" class="product-img" loading="lazy">
                <div class="product-overlay">
                    <button type="button" class="quick-view-btn">
                        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                        المكونات والتفاصيل
                    </button>
                </div>
            </div>
            <div class="product-info">
                <span class="product-category">${escapeHtml(product.category)}</span>
                <h3 class="product-title" onclick="openProductModal('${escapeHtml(product.id)}')">${escapeHtml(product.name)}</h3>
                <p class="product-ingredients">${escapeHtml(product.description)}</p>
                <div class="product-rating">
                    <span class="stars">★★★★★</span>
                    <span class="rating-count">${escapeHtml(product.rating)}</span>
                </div>

                <div class="product-sizes">
                    <span class="size-label">اختر نوع الطلب:</span>
                    <div class="size-options">
                        ${sizesHTML}
                    </div>
                </div>

                <div class="product-card-footer product-bottom">
                    ${priceBlockHTML}
                    <div class="product-actions-group">
                        <button type="button" class="add-to-cart-btn" onclick="addProductToCart(this)" title="أضف إلى السلة">
                            <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
                            أضف للأوردر
                        </button>
                        <button type="button" class="whatsapp-btn" onclick="orderViaWhatsApp(this)" title="طلب سريع عبر واتساب">
                            <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                            اطلب واتساب
                        </button>
                    </div>
                </div>
            </div>
        </article>
    `;
}

// -----------------------------------------------------------------------------
// 9. توزيع الأصناف (وحوش المنيو + المنيو الكامل)
// -----------------------------------------------------------------------------
function distributeProducts() {
    renderBestSellers();
    renderFilteredProducts();
}

function renderBestSellers() {
    const container = document.getElementById("bestsellers-grid");
    if (!container) return;

    let bestItems = productsData.filter(p => isProductBestSeller(p));

    if (bestItems.length === 0) {
        bestItems = [...productsData].sort((a, b) => (b.ordersCount || 0) - (a.ordersCount || 0)).slice(0, 6);
    }

    container.innerHTML = bestItems.slice(0, 6).map(p => createProductCardHTML(p)).join("");
}

function renderCategoryFilters() {
    const filterContainer = document.getElementById("category-filters");
    if (!filterContainer) return;

    const uniqueCategories = ["الكل", ...new Set(productsData.map(p => p.category.trim()).filter(Boolean))];

    filterContainer.innerHTML = uniqueCategories.map(cat => {
        const safeAttr = cat.replace(/"/g, "&quot;");
        return `<button type="button" class="filter-btn ${cat === activeCategory ? "active" : ""}" data-category="${safeAttr}">${escapeHtml(cat)}</button>`;
    }).join("");
}

function setCategoryFilter(categoryName) {
    activeCategory = categoryName;

    const buttons = document.querySelectorAll("#category-filters .filter-btn");
    buttons.forEach(btn => {
        btn.classList.toggle("active", btn.dataset.category === categoryName);
    });

    renderFilteredProducts();
}

function renderFilteredProducts() {
    const container = document.getElementById("products-grid");
    if (!container) return;

    let filtered = productsData;
    if (activeCategory !== "الكل") {
        filtered = productsData.filter(p => p.category === activeCategory);
    }

    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="empty-products-msg">
                <p>لا توجد أصناف في قسم "${escapeHtml(activeCategory)}" حالياً.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = filtered.map(p => createProductCardHTML(p)).join("");
}

// -----------------------------------------------------------------------------
// 10. تفاعل اختيار نوع الوجبة وتحديث السعر لحظياً
// -----------------------------------------------------------------------------
window.chooseSize = function (sizeBtn) {
    const optionsContainer = sizeBtn.closest(".size-options");
    if (optionsContainer) {
        optionsContainer.querySelectorAll(".size-btn").forEach(btn => btn.classList.remove("active"));
        sizeBtn.classList.add("active");
    }

    const delta = parseFloat(sizeBtn.dataset.delta) || 0;

    // تحديث السعر لو داخل كرت منتج
    const card = sizeBtn.closest(".product-card");
    if (card) {
        const basePrice = parseFloat(card.dataset.basePrice) || 0;
        const newPrice = basePrice + delta;
        card.dataset.price = newPrice;
        const priceEl = card.querySelector(".current-price");
        if (priceEl) priceEl.innerText = formatPrice(newPrice);
    }

    // تحديث السعر لو داخل نافذة التفاصيل (Modal)
    const modal = sizeBtn.closest(".product-modal");
    if (modal) {
        const modalPriceEl = modal.querySelector(".modal-price");
        if (modalPriceEl && modalPriceEl.dataset.basePrice) {
            const basePrice = parseFloat(modalPriceEl.dataset.basePrice) || 0;
            modalPriceEl.innerText = formatPrice(basePrice + delta);
        }
    }
};

// -----------------------------------------------------------------------------
// 11. طلب الصنف عبر واتساب فوراً
// -----------------------------------------------------------------------------
window.orderViaWhatsApp = function (btnElement) {
    const card = btnElement.closest(".product-card");
    if (!card) return;

    const productId = card.dataset.id;
    const product = productsData.find(p => p.id === productId);
    const productName = product ? product.name : card.dataset.name;

    const activeSizeBtn = card.querySelector(".size-btn.active");
    const optionName = activeSizeBtn ? (activeSizeBtn.dataset.option || activeSizeBtn.innerText.trim()) : "ساندوتش";
    const price = getEffectivePrice(product ? product.price : card.dataset.basePrice, optionName);

    incrementProductOrderTally(productId);
    sendOrderLogToGoogleSheet({
        productId,
        productName,
        size: optionName,
        price,
        type: "whatsapp_direct"
    });

    const message =
`مرحباً FOOD BURGER 🍔🔥، أريد طلب هذا الصنف:
━━━━━━━━━━━━━━━━━━━━
🍔 *الصنف:* ${productName}
🍟 *الاختيار:* ${optionName}
💵 *السعر:* ${formatPrice(price)}
━━━━━━━━━━━━━━━━━━━━
ممكن تأكيد الأوردر ووقت التوصيل؟`;

    const whatsappUrl = `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(message)}`;
    const newWindow = window.open(whatsappUrl, "_blank");
    if (!newWindow || newWindow.closed || typeof newWindow.closed === "undefined") {
        window.location.href = whatsappUrl;
    }

    setTimeout(() => renderBestSellers(), 1000);
};

// -----------------------------------------------------------------------------
// 12. نافذة تفاصيل الساندوتش (Quick View Modal)
// -----------------------------------------------------------------------------
window.openProductModal = function (productId) {
    const product = productsData.find(p => p.id === productId);
    if (!product) return;

    const modalBackdrop = document.getElementById("product-modal-backdrop");
    const modalContent = document.getElementById("product-modal-content");
    if (!modalBackdrop || !modalContent) return;

    const discountBadge = (product.oldPrice && product.oldPrice > product.price)
        ? `<span class="product-badge badge-discount" style="position:static; display:inline-block; margin-right:8px;">عرض -${Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)}%</span>`
        : "";

    modalContent.innerHTML = `
        <button type="button" class="modal-close-btn" onclick="closeProductModal()" aria-label="إغلاق">✕</button>
        <div class="modal-grid">
            <div class="modal-img-wrap">
                <img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}" class="modal-img">
            </div>
            <div class="modal-details">
                <span class="product-category">${escapeHtml(product.category)}</span>
                <h2 class="modal-title">${escapeHtml(product.name)}</h2>
                <div class="product-rating">
                    <span class="stars">★★★★★</span>
                    <span class="rating-count">${escapeHtml(product.rating)}</span>
                </div>
                <div class="modal-price-wrap">
                    <span class="modal-price" data-base-price="${product.price}">${formatPrice(product.price)}</span>
                    ${product.oldPrice ? `<span class="old-price">${formatPrice(product.oldPrice)}</span>` : ""}
                    ${discountBadge}
                </div>
                <p class="modal-desc"><strong>المكونات:</strong> ${escapeHtml(product.description)}</p>

                <div class="product-sizes" style="margin: 12px 0;">
                    <span class="size-label">اختر نوع الوجبة:</span>
                    <div class="size-options" id="modal-size-options">
                        ${product.sizes.map((s, idx) => {
                            const delta = getOptionDelta(s);
                            const deltaText = delta > 0 ? ` (+${delta})` : "";
                            return `<button type="button" class="size-btn ${idx === 0 ? "active" : ""}" data-option="${escapeHtml(s)}" data-delta="${delta}" onclick="chooseSize(this)">${escapeHtml(s)}${deltaText}</button>`;
                        }).join("")}
                    </div>
                </div>

                <div class="modal-actions">
                    <button type="button" class="btn btn-primary" onclick="addModalProductToCart('${escapeHtml(product.id)}')">
                        🍔 أضف للأوردر
                    </button>
                    <button type="button" class="whatsapp-btn" onclick="orderModalProductViaWhatsApp('${escapeHtml(product.id)}')">
                        <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                        اطلب واتساب
                    </button>
                </div>
            </div>
        </div>
    `;

    modalBackdrop.classList.add("open");
};

window.closeProductModal = function () {
    const modalBackdrop = document.getElementById("product-modal-backdrop");
    if (modalBackdrop) modalBackdrop.classList.remove("open");
};

window.orderModalProductViaWhatsApp = function (productId) {
    const product = productsData.find(p => p.id === productId);
    if (!product) return;

    const activeSizeBtn = document.querySelector("#modal-size-options .size-btn.active");
    const optionName = activeSizeBtn ? (activeSizeBtn.dataset.option || activeSizeBtn.innerText.trim()) : product.sizes[0];
    const finalPrice = getEffectivePrice(product.price, optionName);

    incrementProductOrderTally(product.id);
    sendOrderLogToGoogleSheet({
        productId: product.id,
        productName: product.name,
        size: optionName,
        price: finalPrice,
        type: "whatsapp_modal"
    });

    const message =
`مرحباً FOOD BURGER 🍔🔥، أريد طلب هذا الصنف:
━━━━━━━━━━━━━━━━━━━━
🍔 *الصنف:* ${product.name}
🍟 *الاختيار:* ${optionName}
💵 *السعر:* ${formatPrice(finalPrice)}
━━━━━━━━━━━━━━━━━━━━
ممكن تأكيد الأوردر ووقت التوصيل؟`;

    const whatsappUrl = `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(message)}`;
    const newWindow = window.open(whatsappUrl, "_blank");
    if (!newWindow || newWindow.closed || typeof newWindow.closed === "undefined") {
        window.location.href = whatsappUrl;
    }

    setTimeout(() => renderBestSellers(), 1000);
};

// -----------------------------------------------------------------------------
// 13. إضافة الأصناف لسلة الطلبات
// -----------------------------------------------------------------------------
window.addProductToCart = function (btnElement) {
    const card = btnElement.closest(".product-card");
    if (!card) return;

    const productId = card.dataset.id;
    const product = productsData.find(p => p.id === productId);

    const activeSizeBtn = card.querySelector(".size-btn.active");
    const optionName = activeSizeBtn ? (activeSizeBtn.dataset.option || activeSizeBtn.innerText.trim()) : (product ? product.sizes[0] : "ساندوتش");
    const name = product ? product.name : card.dataset.name;
    const price = getEffectivePrice(product ? product.price : card.dataset.basePrice, optionName);
    const image = product ? product.image : "";

    const existing = cart.find(item => item.name === name && item.size === optionName);
    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({ id: productId, name, price, size: optionName, quantity: 1, image });
    }

    saveCartToStorage();
    renderCart();
    animateCartBadge();
    showToast(`تمت إضافة "${name}" (${optionName}) لأوردرك 🍔`);
};

window.addModalProductToCart = function (productId) {
    const product = productsData.find(p => p.id === productId);
    if (!product) return;

    const activeSizeBtn = document.querySelector("#modal-size-options .size-btn.active");
    const optionName = activeSizeBtn ? (activeSizeBtn.dataset.option || activeSizeBtn.innerText.trim()) : product.sizes[0];
    const finalPrice = getEffectivePrice(product.price, optionName);

    const existing = cart.find(item => item.name === product.name && item.size === optionName);
    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: finalPrice,
            size: optionName,
            quantity: 1,
            image: product.image
        });
    }

    saveCartToStorage();
    renderCart();
    animateCartBadge();
    showToast(`تمت إضافة "${product.name}" (${optionName}) لأوردرك 🍔`);
    closeProductModal();
};

function animateCartBadge() {
    const badge = document.getElementById("cart-badge-count");
    if (badge) {
        badge.classList.add("bump");
        setTimeout(() => badge.classList.remove("bump"), 300);
    }
}

// -----------------------------------------------------------------------------
// 14. إدارة عناصر السلة، الكوبونات، الدليفري / التيك أواي، والحسابات
// -----------------------------------------------------------------------------
window.changeCartQty = function (index, delta) {
    if (cart[index]) {
        cart[index].quantity += delta;
        if (cart[index].quantity <= 0) {
            cart.splice(index, 1);
            showToast("تم حذف الصنف من الأوردر");
        }
        saveCartToStorage();
        renderCart();
    }
};

window.removeCartProduct = function (index) {
    if (cart[index]) {
        const removed = cart[index].name;
        cart.splice(index, 1);
        saveCartToStorage();
        renderCart();
        showToast(`تم حذف "${removed}" من الأوردر`);
    }
};

window.applyCouponCode = function () {
    const input = document.getElementById("coupon-code-input");
    if (!input) return;

    const code = input.value.trim().toUpperCase();
    if (!code) {
        showToast("اكتب كود الخصم أولاً (مثال: BURGER15)", "error");
        return;
    }

    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const coupon = storeCoupons[code];

    if (!coupon) {
        showToast("كود الخصم غير صحيح! جرب BURGER15 أو FOOD10", "error");
        return;
    }

    if (!coupon.active) {
        showToast(`عذراً، كود الخصم (${code}) غير مفعل حالياً 🚫`, "error");
        return;
    }

    if (coupon.minOrder > 0 && subtotal < coupon.minOrder) {
        showToast(`هذا الكوبون يتطلب أوردر بحد أدنى ${formatPrice(coupon.minOrder)}`, "error");
        return;
    }

    let percent = coupon.percent;
    if (percent > 0 && percent <= 1) percent = Math.round(percent * 100);

    activeCoupon = { ...coupon, percent };
    saveCartToStorage();
    renderCart();
    showToast(`تم تفعيل كود (${code}) وخصم ${percent}% على أوردرك 🔥`);
    input.value = "";
};

window.removeCoupon = function () {
    activeCoupon = null;
    saveCartToStorage();
    renderCart();
    showToast("تمت إزالة كود الخصم");
};

function isPickupSelected() {
    const checked = document.querySelector('input[name="delivery_type"]:checked');
    return checked && checked.value === "pickup";
}

function updateDeliveryFieldsVisibility() {
    const pickup = isPickupSelected();
    const cityEl = document.getElementById("city");
    const districtEl = document.getElementById("district");
    const addressEl = document.getElementById("address");

    [cityEl, districtEl, addressEl].forEach(input => {
        if (!input) return;
        const fieldWrap = input.closest(".input-field");
        if (pickup) {
            input.required = false;
            if (fieldWrap) fieldWrap.style.display = "none";
        } else {
            input.required = true;
            if (fieldWrap) fieldWrap.style.display = "flex";
        }
    });
}

window.renderCart = function () {
    updateDeliveryFieldsVisibility();

    const container = document.getElementById("cart-items-container");
    const badge = document.getElementById("cart-badge-count");
    const subtotalEl = document.getElementById("cart-subtotal");
    const shippingEl = document.getElementById("cart-shipping");
    const totalEl = document.getElementById("cart-total");
    const recapList = document.getElementById("checkout-recap-items");
    const recapTotal = document.getElementById("checkout-recap-total");
    const submitBtn = document.querySelector(".btn-submit");
    const discountRow = document.getElementById("cart-discount-row");
    const discountLabel = document.getElementById("cart-discount-label");
    const discountVal = document.getElementById("cart-discount-val");
    const couponTagContainer = document.getElementById("applied-coupon-tag-container");

    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    if (badge) badge.innerText = count;

    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    let discountAmount = 0;
    if (activeCoupon && subtotal > 0) {
        if (activeCoupon.minOrder > 0 && subtotal < activeCoupon.minOrder) {
            activeCoupon = null;
            saveCartToStorage();
            showToast("تم إلغاء الكوبون لأن مجموع الأوردر أقل من الحد الأدنى", "error");
        } else {
            discountAmount = Math.round((subtotal * activeCoupon.percent) / 100);
        }
    }

    const discountedSubtotal = Math.max(0, subtotal - discountAmount);
    const pickup = isPickupSelected();
    const shipping = (pickup || subtotal >= FREE_SHIPPING_THRESHOLD || subtotal === 0) ? 0 : DEFAULT_SHIPPING_FEE;
    const total = discountedSubtotal + shipping;

    if (subtotalEl) subtotalEl.innerText = formatPrice(subtotal);

    if (discountRow) {
        if (discountAmount > 0 && activeCoupon) {
            discountRow.style.display = "flex";
            if (discountLabel) discountLabel.innerText = `خصم الكوبون (${activeCoupon.code} - ${activeCoupon.percent}%)`;
            if (discountVal) discountVal.innerText = `-${formatPrice(discountAmount)}`;
        } else {
            discountRow.style.display = "none";
        }
    }

    if (couponTagContainer) {
        if (activeCoupon && subtotal > 0) {
            couponTagContainer.innerHTML = `
                <div class="applied-coupon-tag">
                    <span>🏷️ الكوبون مفعل: <strong>${activeCoupon.code}</strong> (خصم ${activeCoupon.percent}%)</span>
                    <button type="button" class="remove-coupon-btn" onclick="removeCoupon()" title="إزالة الكوبون">✕</button>
                </div>
            `;
        } else {
            couponTagContainer.innerHTML = "";
        }
    }

    if (shippingEl) {
        if (pickup) {
            shippingEl.innerText = "استلام من الفرع (مجاناً)";
            shippingEl.className = "text-free";
        } else if (shipping === 0 && subtotal > 0) {
            shippingEl.innerText = "مجاناً 🔥";
            shippingEl.className = "text-free";
        } else if (subtotal === 0) {
            shippingEl.innerText = `0 ${CURRENCY_LABEL}`;
            shippingEl.className = "";
        } else {
            shippingEl.innerText = formatPrice(shipping);
            shippingEl.className = "";
        }
    }

    if (totalEl) totalEl.innerText = formatPrice(total);
    if (recapTotal) recapTotal.innerText = formatPrice(total);

    if (submitBtn) {
        submitBtn.innerHTML = `
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            تأكيد وإرسال الأوردر عبر واتساب (${formatPrice(total)})
        `;
    }

    if (container) {
        if (cart.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px 20px; color: var(--text-muted);">
                    <p style="font-size: 1.1rem; color: var(--text-primary); margin-bottom: 8px;">صينية الأوردر فاضية حالياً 🍔</p>
                    <a href="#products" class="btn btn-primary btn-sm" style="margin-top: 14px;">اختار ساندوتشك من المنيو</a>
                </div>
            `;
        } else {
            container.innerHTML = cart.map((item, index) => `
                <div class="cart-item">
                    <div class="cart-item-product">
                        <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}" class="cart-thumb">
                        <div class="cart-item-details">
                            <h4 class="cart-item-name">${escapeHtml(item.name)}</h4>
                            <span class="cart-item-meta">النوع: ${escapeHtml(item.size)}</span>
                            <span class="cart-item-price-single">سعر الواحدة: ${formatPrice(item.price)}</span>
                        </div>
                    </div>
                    <div class="cart-quantity-control">
                        <button type="button" class="qty-btn" onclick="changeCartQty(${index}, -1)" aria-label="تقليل">-</button>
                        <span class="qty-value">${item.quantity}</span>
                        <button type="button" class="qty-btn" onclick="changeCartQty(${index}, 1)" aria-label="زيادة">+</button>
                    </div>
                    <div class="cart-item-total">${formatPrice(item.price * item.quantity)}</div>
                    <button type="button" class="remove-btn" onclick="removeCartProduct(${index})" title="حذف">
                        <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                </div>
            `).join("");
        }
    }

    if (recapList) {
        let recapHTML = cart.length === 0
            ? `<div class="recap-item"><span>لم يتم إضافة أصناف بعد</span><strong>0 ${CURRENCY_LABEL}</strong></div>`
            : cart.map(item => `
                <div class="recap-item">
                    <span>${escapeHtml(item.name)} (${escapeHtml(item.size)}) × ${item.quantity}</span>
                    <strong>${formatPrice(item.price * item.quantity)}</strong>
                </div>
            `).join("");

        if (discountAmount > 0 && activeCoupon) {
            recapHTML += `
                <div class="recap-item discount-row">
                    <span>خصم الكوبون (${activeCoupon.code})</span>
                    <strong class="text-discount">-${formatPrice(discountAmount)}</strong>
                </div>
            `;
        }

        if (cart.length > 0) {
            recapHTML += `
                <div class="recap-item">
                    <span>${pickup ? "الاستلام" : "التوصيل"}</span>
                    <strong>${pickup ? "من الفرع (مجاناً)" : (shipping === 0 ? "مجاني 🔥" : formatPrice(shipping))}</strong>
                </div>
            `;
        }

        recapList.innerHTML = recapHTML;
    }
};

// -----------------------------------------------------------------------------
// 15. نموذج تأكيد الأوردر وإرساله عبر واتساب + Google Sheets
// -----------------------------------------------------------------------------
function setupOrderForm() {
    const orderForm = document.getElementById("order-form");
    if (!orderForm) return;

    orderForm.addEventListener("submit", (e) => {
        e.preventDefault();

        if (cart.length === 0) {
            showToast("سلة الطلبات فاضية! اختار ساندوتشاتك من المنيو الأول 🍔", "error");
            window.location.hash = "#products";
            return;
        }

        const name = document.getElementById("full-name").value.trim();
        const phone = document.getElementById("phone").value.trim();
        const pickup = isPickupSelected();
        const city = pickup ? "استلام من الفرع (تيك أواي)" : document.getElementById("city").value.trim();
        const district = pickup ? "-" : document.getElementById("district").value.trim();
        const address = pickup ? "استلام مباشر من الفرع" : document.getElementById("address").value.trim();
        const notes = document.getElementById("notes").value.trim();

        const egyptianPhonePattern = /^01[0125][0-9]{8}$/;
        if (!egyptianPhonePattern.test(phone)) {
            showToast("اكتب رقم موبايل مصري صحيح (11 رقم يبدأ بـ 01)", "error");
            document.getElementById("phone").focus();
            return;
        }

        const selectedPayment = document.querySelector('input[name="payment_method"]:checked');
        const paymentText = (selectedPayment && selectedPayment.value === "wallet")
            ? "إنستاباي / محفظة إلكترونية"
            : "الدفع كاش عند الاستلام";

        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        let discountAmount = 0;
        if (activeCoupon && subtotal > 0) {
            discountAmount = Math.round((subtotal * activeCoupon.percent) / 100);
        }
        const discountedSubtotal = Math.max(0, subtotal - discountAmount);
        const shipping = (pickup || subtotal >= FREE_SHIPPING_THRESHOLD) ? 0 : DEFAULT_SHIPPING_FEE;
        const total = discountedSubtotal + shipping;

        const itemsText = cart.map((item, idx) =>
            `${idx + 1}) *${item.name}*\n   ▫️ النوع: ${item.size}\n   ▫️ الكمية: ${item.quantity}\n   ▫️ السعر: ${formatPrice(item.price * item.quantity)}`
        ).join("\n\n");

        cart.forEach(item => incrementProductOrderTally(item.id));

        sendOrderLogToGoogleSheet({
            name,
            phone,
            city,
            address: pickup ? "تيك أواي - استلام من الفرع" : `${district} - ${address}`,
            payment: paymentText,
            itemsText: cart.map(i => `${i.name} [${i.size}] x${i.quantity}`).join(" | "),
            coupon: activeCoupon ? `${activeCoupon.code} (-${activeCoupon.percent}%)` : "لا يوجد",
            total: formatPrice(total),
            notes
        });

        const fullMessage =
`🍔🔥 *أوردر جديد من موقع FOOD BURGER*
━━━━━━━━━━━━━━━━━━━━
👤 *بيانات العميل:*
• الاسم: ${name}
• الموبايل: ${phone}
• نوع الاستلام: ${pickup ? "🏪 تيك أواي (من الفرع)" : "🛵 دليفري"}
${pickup ? "" : `• المنطقة: ${city}\n• علامة مميزة: ${district}\n• العنوان: ${address}\n`}• الدفع: ${paymentText}
${notes ? `• ملاحظات المطبخ: ${notes}\n` : ""}
🍟 *تفاصيل الأوردر:*
${itemsText}

━━━━━━━━━━━━━━━━━━━━
💵 *مجموع الأصناف:* ${formatPrice(subtotal)}
${discountAmount > 0 ? `🏷️ *خصم الكوبون (${activeCoupon.code}):* -${formatPrice(discountAmount)}\n` : ""}🛵 *التوصيل:* ${pickup ? "استلام من الفرع (مجاناً)" : (shipping === 0 ? "مجاني 🔥" : formatPrice(shipping))}
💰 *الإجمالي المطلوب:* ${formatPrice(total)}
━━━━━━━━━━━━━━━━━━━━
يرجى تأكيد الأوردر والبدء في التجهيز 🔥`;

        const url = `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(fullMessage)}`;
        const newWin = window.open(url, "_blank");
        if (!newWin || newWin.closed || typeof newWin.closed === "undefined") {
            window.location.href = url;
        }

        cart = [];
        activeCoupon = null;
        saveCartToStorage();
        renderCart();
        orderForm.reset();

        showToast("تم تجهيز الأوردر بنجاح! جاري تحويلك لواتساب المطبخ... 🔥");
        setTimeout(() => renderBestSellers(), 1000);
    });
}

// -----------------------------------------------------------------------------
// 16. إرسال سجل الطلبات لشيت Google بالخلفية (اختياري)
// -----------------------------------------------------------------------------
function sendOrderLogToGoogleSheet(orderData) {
    if (!GOOGLE_SHEET_API_URL || GOOGLE_SHEET_API_URL.trim() === "") return;

    try {
        fetch(GOOGLE_SHEET_API_URL, {
            method: "POST",
            mode: "no-cors",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(orderData)
        }).catch(() => {});
    } catch (e) {}
}

// -----------------------------------------------------------------------------
// 17. قائمة الموبايل الجانبية
// -----------------------------------------------------------------------------
function setupMobileMenu() {
    const toggleBtn = document.getElementById("mobile-menu-toggle");
    const closeBtn = document.getElementById("mobile-menu-close");
    const drawer = document.getElementById("mobile-nav-drawer");
    const backdrop = document.getElementById("mobile-nav-backdrop");

    if (!toggleBtn || !drawer || !backdrop) return;

    function openMobileMenu() {
        drawer.classList.add("open");
        backdrop.classList.add("open");
        document.body.style.overflow = "hidden";
    }

    function closeMobileMenu() {
        drawer.classList.remove("open");
        backdrop.classList.remove("open");
        document.body.style.overflow = "";
    }

    toggleBtn.addEventListener("click", openMobileMenu);
    if (closeBtn) closeBtn.addEventListener("click", closeMobileMenu);
    backdrop.addEventListener("click", closeMobileMenu);

    drawer.querySelectorAll(".mobile-link").forEach(link => {
        link.addEventListener("click", closeMobileMenu);
    });

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && drawer.classList.contains("open")) {
            closeMobileMenu();
        }
    });
}

// -----------------------------------------------------------------------------
// 18. Event Delegation لأزرار تصنيفات المنيو
// -----------------------------------------------------------------------------
function setupCategoryFilterEvents() {
    const filterContainer = document.getElementById("category-filters");
    if (!filterContainer) return;

    filterContainer.addEventListener("click", (e) => {
        const btn = e.target.closest(".filter-btn");
        if (btn && btn.dataset.category) {
            setCategoryFilter(btn.dataset.category);
        }
    });
}

// -----------------------------------------------------------------------------
// 19. نظام التنبيهات المرئية السريعة (Toast)
// -----------------------------------------------------------------------------
function showToast(message, type = "success") {
    let container = document.getElementById("toast-container");
    if (!container) {
        container = document.createElement("div");
        container.id = "toast-container";
        container.className = "toast-container";
        document.body.appendChild(container);
    }

    const toast = document.createElement("div");
    toast.className = `toast-item toast-${type}`;
    toast.innerHTML = `
        <span class="toast-icon">${type === "success" ? "🔥" : "!"}</span>
        <span class="toast-message">${escapeHtml(message)}</span>
    `;

    container.appendChild(toast);
    setTimeout(() => toast.classList.add("show"), 10);
    setTimeout(() => {
        toast.classList.remove("show");
        setTimeout(() => toast.remove(), 250);
    }, 2800);
}

// -----------------------------------------------------------------------------
// 20. التشغيل عند اكتمال تحميل الصفحة
// -----------------------------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
    loadCartFromStorage();
    syncWhatsAppLinks();
    setupMobileMenu();
    setupCategoryFilterEvents();
    fetchProductsFromGoogleSheet();
    renderCart();
    setupOrderForm();

    const modalBackdrop = document.getElementById("product-modal-backdrop");
    if (modalBackdrop) {
        modalBackdrop.addEventListener("click", (e) => {
            if (e.target === modalBackdrop) closeProductModal();
        });
    }

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") closeProductModal();
    });
});
