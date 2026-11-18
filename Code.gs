/**
 * ==============================================================================
 * FOOD BURGER - GOOGLE APPS SCRIPT (Code.gs)
 * تحويل منيو المطعم والكوبونات من Google Sheets إلى JSON API
 * وتسجيل كل الأوردرات تلقائياً في شيت "الطلبات"
 * ==============================================================================
 */

// 1. قراءة المنيو والكوبونات وتمريرها للموقع عبر GET Request
function doGet(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // أ) قراءة الأصناف من شيت "المنيو" أو "المنتجات"
    let menuSheet = ss.getSheetByName("المنيو") || ss.getSheetByName("المنتجات") || ss.getActiveSheet();
    const menuData = menuSheet.getDataRange().getValues();
    const products = [];

    if (menuData.length > 1) {
      const headers = menuData[0].map(h => normalizeHeader(String(h)));

      for (let i = 1; i < menuData.length; i++) {
        const row = menuData[i];
        if (!row || row.every(cell => cell === "" || cell === null)) continue;

        let item = {};
        headers.forEach((key, colIndex) => {
          if (key) item[key] = row[colIndex];
        });

        const name = String(item.name || "").trim();
        if (!name) continue;

        const price = parseFloat(item.price) || 0;
        const oldPrice = item.oldPrice ? parseFloat(item.oldPrice) : null;

        let sizes = [];
        if (item.sizes) {
          sizes = String(item.sizes).split(/[,،\/\-]/).map(s => s.trim()).filter(Boolean);
        }
        if (sizes.length === 0) sizes = ["ساندوتش", "كومبو (فرايز+بيبسي)", "إكسترا تشيز"];

        const bestSellerVal = String(item.isBestSeller || "").toLowerCase().trim();
        const isBestSeller = (bestSellerVal === "true" || bestSellerVal === "yes" || bestSellerVal === "نعم" || bestSellerVal === "1" || item.isBestSeller === true);

        const ordersCount = parseInt(item.ordersCount) || 0;
        const image = String(item.image || "").trim() || "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=800";
        const category = String(item.category || "بيف برجر كلاسيك 🍔").trim();

        products.push({
          id: item.id ? String(item.id).trim() : "fb-" + i,
          name: name,
          category: category,
          price: price,
          oldPrice: (oldPrice && oldPrice > price) ? oldPrice : null,
          image: image,
          sizes: sizes,
          selectedSize: sizes[0],
          isBestSeller: isBestSeller,
          ordersCount: ordersCount,
          rating: item.rating ? String(item.rating).trim() : "★★★★★ (45 تقييم)",
          description: item.description ? String(item.description).trim() : "بيف طازج مشوي على الجريل، صوص FOOD BURGER، جبنة سايحة، خضار، كيزر."
        });
      }
    }

    // ب) قراءة الكوبونات من شيت "الكوبونات"
    let couponSheet = ss.getSheetByName("الكوبونات");
    if (!couponSheet) {
      const allSheets = ss.getSheets();
      for (let s = 0; s < allSheets.length; s++) {
        const sName = allSheets[s].getName().trim().toLowerCase();
        if (sName.includes("كوبون") || sName.includes("coupon") || sName.includes("خصم")) {
          couponSheet = allSheets[s];
          break;
        }
      }
    }

    if (!couponSheet) {
      try {
        couponSheet = ss.insertSheet("الكوبونات");
        couponSheet.appendRow(["كود الكوبون", "نسبة الخصم %", "الحالة (مفعل / معطل)", "وصف الكوبون", "الحد الأدنى للطلب (ج.م)"]);
        couponSheet.appendRow(["BURGER15", 15, "مفعل", "خصم 15% من FOOD BURGER", 0]);
        couponSheet.appendRow(["FOOD10", 10, "مفعل", "خصم 10% إضافي", 0]);
        couponSheet.appendRow(["FAMOUS20", 20, "مفعل", "خصم 20% للأوردرات فوق 250 ج.م", 250]);
        couponSheet.getRange(1, 1, 1, 5).setFontWeight("bold").setBackground("#ff6a00").setFontColor("#ffffff");
      } catch (err) {
        Logger.log("تعذر إنشاء شيت الكوبونات: " + err);
      }
    }

    const coupons = [];
    if (couponSheet) {
      const couponData = couponSheet.getDataRange().getValues();
      if (couponData.length > 1) {
        const cHeaders = couponData[0].map(h => normalizeCouponHeader(String(h)));

        for (let j = 1; j < couponData.length; j++) {
          const cRow = couponData[j];
          if (!cRow || cRow.every(c => c === "" || c === null)) continue;

          let cItem = {};
          cHeaders.forEach((key, colIdx) => {
            if (key) cItem[key] = cRow[colIdx];
          });

          let code = String(cItem.code || cRow[0] || "").trim().toUpperCase();
          if (!code || code === "الكود" || code === "كود الكوبون" || code === "CODE") continue;

          let rawPercent = cItem.percent !== undefined && cItem.percent !== "" ? cItem.percent : cRow[1];
          let percent = 0;
          if (typeof rawPercent === "number") {
            percent = (rawPercent > 0 && rawPercent <= 1) ? Math.round(rawPercent * 100) : Math.round(rawPercent);
          } else {
            const parsed = parseFloat(String(rawPercent || "").replace(/[%٪]/g, "").trim()) || 0;
            percent = (parsed > 0 && parsed <= 1) ? Math.round(parsed * 100) : Math.round(parsed);
          }

          let statusRaw = String(cItem.status !== undefined && cItem.status !== "" ? cItem.status : (cRow[2] || "مفعل")).trim().toLowerCase();
          const active = !["معطل", "ملغي", "غير مفعل", "متوقف", "لا", "false", "0", "disabled", "inactive"].includes(statusRaw);

          const minOrder = parseFloat(cItem.minOrder !== undefined && cItem.minOrder !== "" ? cItem.minOrder : (cRow[4] || 0)) || 0;
          const desc = String(cItem.desc || cRow[3] || `خصم ${percent}%`).trim();

          coupons.push({ code, percent, active, status: active ? "مفعل" : "معطل", desc, minOrder });
        }
      }
    }

    return createJsonResponse({
      status: "success",
      count: products.length,
      data: products,
      coupons: coupons
    });

  } catch (err) {
    return createJsonResponse({ status: "error", message: err.toString() });
  }
}

// 2. استقبال الأوردرات وتسجيلها في شيت "الطلبات" تلقائياً
function doPost(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let orderSheet = ss.getSheetByName("الطلبات");

    if (!orderSheet) {
      orderSheet = ss.insertSheet("الطلبات");
      orderSheet.appendRow([
        "التاريخ والوقت",
        "اسم العميل",
        "رقم الموبايل",
        "المنطقة / نوع الاستلام",
        "العنوان بالتفصيل",
        "طريقة الدفع",
        "الأصناف المطلوبة",
        "الكوبون",
        "الإجمالي (ج.م)",
        "ملاحظات المطبخ"
      ]);
      orderSheet.getRange(1, 1, 1, 10).setFontWeight("bold").setBackground("#ff6a00").setFontColor("#ffffff");
    }

    let payload = {};
    if (e && e.postData && e.postData.contents) {
      try {
        payload = JSON.parse(e.postData.contents);
      } catch (ex) {
        payload = e.parameter || {};
      }
    } else if (e && e.parameter) {
      payload = e.parameter;
    }

    orderSheet.appendRow([
      new Date().toLocaleString("ar-EG", { timeZone: "Africa/Cairo" }),
      payload.name || "عميل واتساب",
      payload.phone || "-",
      payload.city || "-",
      payload.address || "-",
      payload.payment || "كاش عند الاستلام",
      payload.itemsText || "-",
      payload.coupon || "لا يوجد",
      payload.total || "-",
      payload.notes || ""
    ]);

    if (payload.productId) {
      incrementProductOrdersCount(ss, payload.productId);
    }

    return createJsonResponse({ status: "success", message: "تم تسجيل الأوردر بنجاح" });
  } catch (err) {
    return createJsonResponse({ status: "error", message: err.toString() });
  }
}

function incrementProductOrdersCount(ss, productId) {
  try {
    const sheet = ss.getSheetByName("المنيو") || ss.getSheetByName("المنتجات") || ss.getActiveSheet();
    const data = sheet.getDataRange().getValues();
    const headers = data[0].map(h => normalizeHeader(String(h)));
    const idCol = headers.indexOf("id");
    const nameCol = headers.indexOf("name");
    const ordersCol = headers.indexOf("ordersCount");

    if (ordersCol === -1) return;

    for (let r = 1; r < data.length; r++) {
      const rowId = idCol !== -1 ? String(data[r][idCol]) : "";
      const rowName = nameCol !== -1 ? String(data[r][nameCol]) : "";
      if (rowId === String(productId) || rowName === String(productId)) {
        const currentCount = parseInt(data[r][ordersCol]) || 0;
        sheet.getRange(r + 1, ordersCol + 1).setValue(currentCount + 1);
        break;
      }
    }
  } catch (e) {
    Logger.log("خطأ في تحديث عداد الأوردر: " + e);
  }
}

function normalizeHeader(header) {
  const h = header.trim().toLowerCase();
  if (h === "id" || h === "كود" || h === "معرف") return "id";
  if (h === "name" || h === "اسم الصنف" || h === "اسم المنتج" || h === "الاسم" || h === "الصنف") return "name";
  if (h === "category" || h === "القسم" || h === "الفئة" || h === "التصنيف") return "category";
  if (h === "price" || h === "السعر" || h === "السعر الحالي") return "price";
  if (h === "oldprice" || h === "السعر القديم" || h === "السعر قبل الخصم") return "oldPrice";
  if (h === "image" || h === "الصورة" || h === "رابط الصورة") return "image";
  if (h === "sizes" || h === "الخيارات" || h === "الأنواع" || h === "المقاسات") return "sizes";
  if (h === "isbestseller" || h === "الأكثر مبيعاً" || h === "الاكثر مبيعا" || h === "الأكثر طلباً") return "isBestSeller";
  if (h === "orderscount" || h === "عدد الطلبات" || h === "مرات الطلب") return "ordersCount";
  if (h === "rating" || h === "التقييم") return "rating";
  if (h === "description" || h === "المكونات" || h === "الوصف" || h === "تفاصيل") return "description";
  return h;
}

function normalizeCouponHeader(header) {
  const h = String(header || "").trim().toLowerCase();
  if (h.includes("كود") || h.includes("رمز") || h.includes("code") || h.includes("coupon")) return "code";
  if (h.includes("نسب") || h.includes("خصم") || h.includes("percent") || h.includes("discount") || h.includes("%") || h.includes("٪")) return "percent";
  if (h.includes("حال") || h.includes("status") || h.includes("مفعل") || h.includes("نشط")) return "status";
  if (h.includes("وصف") || h.includes("desc") || h.includes("ملاحظ") || h.includes("تفاصيل")) return "desc";
  if (h.includes("ادن") || h.includes("أدن") || h.includes("اقل") || h.includes("أقل") || h.includes("min") || h.includes("حد")) return "minOrder";
  return h;
}

function createJsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
