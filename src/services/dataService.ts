import * as XLSX from 'xlsx';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import 'dayjs/locale/es';

dayjs.extend(isBetween);
dayjs.extend(weekOfYear);
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);
dayjs.extend(customParseFormat);
dayjs.locale('es');

export interface DashboardData {
  products: any[];
  productSales: any[];
  funnel: any[];
  metrics: Record<string, any>;
  timeSeries: any[];
  transactions: any[];
  adsTimeSeries: any[];
  adsTransactions: any[];
  stock: any[];
}

export const parseExcelFile = (file: File | Blob): Promise<Partial<DashboardData>> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        resolve(processExcelBuffer(arrayBuffer));
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
};

export const processDataFromWorkbook = (workbook: XLSX.WorkBook): Partial<DashboardData> => {
  const parseAmount = (val: any) => {
    if (typeof val === 'number') return val;
    if (!val) return 0;
    let s = String(val).trim();
    
    // Remove currency symbols and spaces but keep signs and separators
    s = s.replace(/[^0-9.,-]/g, "");

    if (s.includes(',') && s.includes('.')) {
      if (s.lastIndexOf(',') > s.lastIndexOf('.')) {
        // Format: 1.234,56 -> 1234.56
        s = s.replace(/\./g, '').replace(',', '.');
      } else {
        // Format: 1,234.56 -> 1234.56
        s = s.replace(/,/g, '');
      }
    } else if (s.includes(',')) {
      const parts = s.split(',');
      if (parts.length === 2 && parts[1].length !== 3) {
        // Likely decimal: 1,23 -> 1.23
        s = s.replace(',', '.');
      } else {
        // Likely thousands: 1,234 -> 1234
        s = s.replace(/,/g, '');
      }
    } else if (s.includes('.')) {
      const parts = s.split('.');
      // If it's something like 21.487 (exactly 3 digits after dot), 
      // in the context of these sales, it's almost certainly a thousands separator.
      if (parts.length === 2 && parts[1].length === 3) {
        s = s.replace(/\./g, '');
      }
    }
    
    const clean = s.replace(/[^-0-9.]/g, "");
    return parseFloat(clean) || 0;
  };

  const parseFlexibleDate = (val: any) => {
    if (!val) return dayjs(null);
    if (val instanceof Date) return dayjs(val);
    if (typeof val === 'number') {
      try {
        const dateObj = XLSX.SSF.parse_date_code(val);
        return dayjs(new Date(dateObj.y, dateObj.m - 1, dateObj.d));
      } catch (e) {
        return dayjs(null);
      }
    }
    const strInput = String(val).trim();
    if (!strInput) return dayjs(null);
    
    // Try to get only the date part if it contains a space (HH:mm:ss suffix)
    // but only if the first part looks like a date format (not "16 de abril")
    let str = strInput;
    if (strInput.includes(' ') && !strInput.includes(' de ')) {
      const part = strInput.split(' ')[0];
      if (/^\d+[\/\-\.]\d+[\/\-\.]\d+$/.test(part) || /^\d{4}-\d{2}-\d{2}$/.test(part)) {
        str = part;
      }
    }

    // Check if it's already in YYYY-MM-DD format (often comes from SQL-like sheets)
    if (/^\d{4}-\d{2}-\d{2}/.test(str)) return dayjs(str.substring(0, 10));

    // Common formats including those seen in Meli/Mexican reports
    const formats = [
      'YYYY-MM-DD', 'DD/MM/YYYY', 'D/M/YYYY', 'MM/DD/YYYY', 'YYYY/MM/DD', 
      'DD/MM/YY', 'D/M/YY',
      'DD-MM-YYYY', 'D-M-YYYY', 'DD.MM.YYYY', 'D.M.YYYY',
      'DD-MM-YY', 'D-M-YY', 'DD.MM.YY', 'D.M.YY',
      'DD-MMM-YY', 'DD-MMM-YYYY', 'DD [de] MMMM [de] YYYY',
      'DD/MM/YYYY HH:mm:ss', 'D/M/YYYY H:mm:ss'
    ];
    
    let d = dayjs(str, formats, 'es', true);
    if (!d.isValid()) d = dayjs(strInput); // Fallback to full string if date part extraction failed
    return d;
  };

  const getRowsWithHeaders = (sheet: XLSX.WorkSheet) => {
    const raw: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });
    if (raw.length === 0) return [];
    
    const headerKeywords = [
      'fecha', 'date', 'monto', 'amount', 'total', 'sku', 'producto', 'product', 
      'status', 'estado', 'transaction_amount', 'valor del producto', 'operación',
      'id', 'referencia', 'comisión', 'envío', 'cantidad'
    ];
    let headerIdx = 0;
    let maxMatches = -1;

    for (let i = 0; i < Math.min(raw.length, 50); i++) {
      const row = raw[i];
      if (!row) continue;
      
      const matchCount = row.filter(cell => 
        cell !== null && 
        headerKeywords.some(kw => String(cell).toLowerCase().includes(kw))
      ).length;

      const nonNullCount = row.filter(c => c !== null && c !== "").length;
      
      // We want the row with the most keyword matches, but it must have some breadth
      if (matchCount > maxMatches && nonNullCount >= 3) {
        maxMatches = matchCount;
        headerIdx = i;
      }
      
      // If we found a very likely header, we can stop early, but let's scan a bit more
      if (matchCount >= 6) {
        headerIdx = i;
        break;
      }
    }
    
    const headers = raw[headerIdx].map(h => String(h || "").trim());
    const dataRows = raw.slice(headerIdx + 1);
    
    return dataRows.map(row => {
      const obj: any = {};
      headers.forEach((h, i) => {
        if (h) obj[h] = row[i];
      });
      return obj;
    });
  };

  const findSheet = (names: string[]) => {
    const sheetNames = Object.keys(workbook.Sheets);
    for (const name of names) {
      const found = sheetNames.find(s => s.toLowerCase().trim() === name.toLowerCase().trim());
      if (found) return workbook.Sheets[found];
    }
    for (const name of names) {
      const found = sheetNames.find(s => s.toLowerCase().trim().includes(name.toLowerCase().trim()));
      if (found) return workbook.Sheets[found];
    }
    return null;
  };

  const timeSeriesMap: Record<string, any> = {};
  const adsTimeSeriesMap: Record<string, any> = {};
  const allTransactions: any[] = [];
  const adsTransactions: any[] = [];
  const productDataMap: Record<string, any> = {};

  const recordAdInvestment = (dateVal: any, amount: number, channel: string, sku?: string) => {
    if (!dateVal || amount === 0) return;
    const d = parseFlexibleDate(dateVal);
    if (!d.isValid()) return;
    const dateKey = d.format('YYYY-MM-DD');
    if (!adsTimeSeriesMap[dateKey]) {
      adsTimeSeriesMap[dateKey] = { date: dateKey, Amazon: 0, Meli: 0, Shopify: 0, Total: 0 };
    }
    adsTimeSeriesMap[dateKey][channel] += Math.abs(amount);
    adsTimeSeriesMap[dateKey].Total += Math.abs(amount);
    adsTransactions.push({ date: dateKey, channel, amount: Math.abs(amount), sku: sku ? String(sku).trim() : undefined });
  };

  const recordTransaction = (dateVal: any, amount: number, channel: string, id: string, sku: string, fallbackName: string, status: string = 'Approved', extraCosts: any = {}) => {
    if (!dateVal) return;
    const parsedDate = parseFlexibleDate(dateVal);
    if (!parsedDate.isValid()) return;
    const dateKey = parsedDate.format('YYYY-MM-DD');
    const cleanSku = String(sku || '').trim();
    const pData = productDataMap[cleanSku];
    const productName = pData?.name || fallbackName;
    const quantity = Math.max(1, extraCosts.quantity || 1);
    const unitPrice = amount / quantity;
    let productCost = Math.abs((pData?.landedCost || 0) * quantity);
    let marketplaceFee = Math.abs(extraCosts.marketplaceFee ?? 0);
    let shippingCost = Math.abs(extraCosts.shippingCost ?? 0);

    if (channel === 'Amazon' && pData) {
      marketplaceFee = Math.abs(pData.amazonFee * quantity);
      shippingCost = Math.abs(pData.amazonShipping * quantity);
    } else if (channel === 'Shopify' && pData) {
      marketplaceFee = Math.abs(pData.shopifyFee * quantity);
      shippingCost = Math.abs(pData.shopifyShipping * quantity);
    }

    if (!timeSeriesMap[dateKey]) {
      timeSeriesMap[dateKey] = { 
        date: dateKey, Amazon: 0, Meli: 0, Shopify: 0, Direct: 0, Total: 0,
        Amazon_productCost: 0, Amazon_marketplaceFee: 0, Amazon_shippingCost: 0,
        Meli_productCost: 0, Meli_marketplaceFee: 0, Meli_shippingCost: 0,
        Shopify_productCost: 0, Shopify_marketplaceFee: 0, Shopify_shippingCost: 0,
        Direct_productCost: 0, Direct_marketplaceFee: 0, Direct_shippingCost: 0,
        productCost: 0, marketplaceFee: 0, shippingCost: 0
      };
    }
    timeSeriesMap[dateKey][channel] += amount;
    timeSeriesMap[dateKey].Total += amount;
    const pCostKey = `${channel}_productCost`;
    const mFeeKey = `${channel}_marketplaceFee`;
    const sCostKey = `${channel}_shippingCost`;
    if (timeSeriesMap[dateKey][pCostKey] !== undefined) {
      timeSeriesMap[dateKey][pCostKey] += productCost;
      timeSeriesMap[dateKey][mFeeKey] += marketplaceFee;
      timeSeriesMap[dateKey][sCostKey] += shippingCost;
    }
    timeSeriesMap[dateKey].productCost += productCost;
    timeSeriesMap[dateKey].marketplaceFee += marketplaceFee;
    timeSeriesMap[dateKey].shippingCost += shippingCost;

    allTransactions.push({ id: id || '', date: dateKey, channel, product: productName, amount, unitPrice, quantity, status: status || 'Approved', productCost, marketplaceFee, shippingCost });
  };

  // Build Product Map
  const productSheet = findSheet(["Productos", "Unit Economics"]);
  if (productSheet) {
    const pRows = getRowsWithHeaders(productSheet);
    pRows.forEach(row => {
      const nameKey = Object.keys(row).find(k => k.toLowerCase().includes('nombre') || k.toLowerCase().includes('producto') || k.toLowerCase().includes('item'));
      const name = nameKey ? row[nameKey] : null;
      if (name) {
        const productInfo = {
          name: String(name).trim(),
          price: parseAmount(row["Precio Público de venta"] || row["Precio"] || row["Price"]),
          amazonFee: parseAmount(row["Fee Marketplace Amazon"] || row["Fee Amazon"]),
          amazonShipping: parseAmount(row["Costo de Envío Amazon"] || row["Envio Amazon"]),
          shopifyFee: parseAmount(row["Fee Marketplace Shopify"] || row["Fee Shopify"]),
          shopifyShipping: parseAmount(row["Costo de Envío Shopify"] || row["Envio Shopify"]),
          landedCost: parseAmount(row["Costo Producto (Landed Cost)"] || row["Costo"])
        };
        Object.keys(row).forEach(key => {
          if (key.toLowerCase().includes('sku')) {
            const val = String(row[key] || "").trim();
            if (val && val !== "undefined" && val !== "null") productDataMap[val] = productInfo;
          }
        });
        productDataMap[String(name).trim()] = productInfo;
      }
    });
  }

  // Amazon
  const amazonSheet = findSheet(["Ventas Amazon", "Amazon Sales", "Amazon"]);
  let totalAmazonSales = 0;
  if (amazonSheet) {
    const rows = getRowsWithHeaders(amazonSheet);
    rows.forEach(row => {
      const itemStatus = String(row["item-status"] || row["status"] || row["Estado"] || "").trim().toLowerCase();
      const isCancelled = itemStatus.includes("cancel") || itemStatus.includes("refund") || itemStatus.includes("devuel");
      if (!isCancelled && (itemStatus === "shipped" || itemStatus === "delivered" || !itemStatus || itemStatus === "enviado")) {
        const amount = (parseFloat(row["item-price"] || row["amount"] || row["total"] || row["Monto"]) || 0) + (parseFloat(row["item-tax"] || 0));
        const quantity = parseInt(row["quantity-purchased"] || row["quantity"] || row["Cantidad"] || "1") || 1;
        totalAmazonSales += amount;
        recordTransaction(row["purchase-date"] || row["date"] || row["Fecha"], amount, "Amazon", row["amazon-order-id"] || row["order-id"] || row["ID"], row["sku"] || row["SKU"], row["product-name"] || row["title"] || row["Producto"], "Approved", { quantity });
      }
    });
  }

  // Meli
  const meliSheet = findSheet(["Ventas ML", "Ventas Meli", "Meli", "Mercado Libre"]);
  let totalMeliSales = 0;
  if (meliSheet) {
    const raw: any[][] = XLSX.utils.sheet_to_json(meliSheet, { header: 1, defval: null });
    
    // Find header row for Meli
    let headerIdx = -1;
    for (let i = 0; i < Math.min(raw.length, 50); i++) {
      const row = raw[i];
      if (!row) continue;
      const rowStr = JSON.stringify(row).toLowerCase();
      if (rowStr.includes("estado") || rowStr.includes("transaction_amount") || rowStr.includes("operación")) {
        headerIdx = i;
        break;
      }
    }

    if (headerIdx !== -1) {
      const headers = raw[headerIdx].map(h => String(h || "").trim());
      const dataRows = raw.slice(headerIdx + 1);
      
      dataRows.forEach(rowArr => {
        if (!rowArr || rowArr.length < 5) return;
        
        // Map headers to row values for named access
        const row: any = {};
        headers.forEach((h, i) => { if (h) row[h] = rowArr[i]; });

        const getVal = (names: string[], colIdx?: number) => {
          for (const name of names) {
            if (row[name] !== undefined && row[name] !== null) return row[name];
            const foundKey = Object.keys(row).find(k => k.toLowerCase().includes(name.toLowerCase()));
            if (foundKey && row[foundKey] !== undefined && row[foundKey] !== null) return row[foundKey];
          }

          if (colIdx !== undefined && rowArr[colIdx] !== undefined && rowArr[colIdx] !== null) return rowArr[colIdx];
          return undefined;
        };

        const rawStatus = getVal(["Estado de la operación (status)", "status", "estado", "Estado"], 13);
        const opStatus = rawStatus ? String(rawStatus).trim().toLowerCase() : "";
        
        // Use exact check if possible, but stay slightly permissive for variation
        if (opStatus === "approved" || opStatus === "aprobado" || opStatus === "approves") {
          const amountVal = getVal(["Valor del producto (transaction_amount)", "transaction_amount", "monto", "total", "Monto"], 16);
          const amount = parseAmount(amountVal);
          totalMeliSales += amount;
          
          const dateVal = getVal(["date_created", "Fecha de compra", "fecha", "Fecha de operación", "Fecha"], 0);
          const id = getVal(["external_reference", "Código de referencia", "id", "Order ID"], 10);
          const sku = getVal(["SKU Producto", "seller_custom_field", "sku", "SKU", "Variación SKU"], 11);
          const title = getVal(["Descripción de la operación", "Título de la publicación", "reason", "title", "producto", "Item"], 9);
          
          const marketplaceFee = parseAmount(getVal(["marketplace_fee", "Comisión", "Cargo por venta"], 18));
          const shippingCost = parseAmount(getVal(["shipping_cost", "Costo de envío", "Envío"], 19));
          const quantity = parseInt(getVal(["quantity", "Cantidad", "Unidades"]) || "1") || 1;
          
          recordTransaction(dateVal, amount, "Meli", id, sku, title || "Meli Product", "Approved", { marketplaceFee, shippingCost, quantity });
        }
      });
    }
  }

  // Shopify
  const shopifySheet = findSheet(["Venta Shopify", "Shopify Sales", "Shopify"]);
  let totalShopifySales = 0;
  if (shopifySheet) {
    const rows = getRowsWithHeaders(shopifySheet);
    rows.forEach(row => {
      const amount = parseFloat(row["Net sales"] || row["Total Sales"] || row["total"] || row["amount"] || row["Ventas netas"]) || 0;
      const quantity = parseInt(row["Quantity"] || row["quantity"] || row["Cantidad"] || "1") || 1;
      totalShopifySales += amount;
      const sku = row["Product variant SKU"] || row["Variant SKU"] || row["SKU"] || row["sku"];
      recordTransaction(row["Day"] || row["Date"] || row["fecha"] || row["Día"], amount, "Shopify", row["Order name"] || row["Name"] || row["id"], sku, "Shopify Sale", "Approved", { quantity });
    });
  }

  // Direct
  const directSheet = findSheet(["Venta Directa", "Direct Sales", "Directa"]);
  let totalDirectSales = 0;
  if (directSheet) {
    const rows = getRowsWithHeaders(directSheet);
    rows.forEach(row => {
      const amount = parseFloat(row["Total"] || row["total"] || row["amount"] || row["monto"]) || 0;
      totalDirectSales += amount;
      recordTransaction(row["Fecha"] || row["Date"] || row["fecha"], amount, "Direct", "", row["SKU"] || row["sku"], row["Concepto"] || row["Product"] || "Venta Directa", "Approved");
    });
  }

  // Ads processing improvement
  const processAdsSheet = (sheet: XLSX.WorkSheet, channel: string, dateNames: string[], amountNames: string[]) => {
    if (!sheet) return 0;
    const rows = getRowsWithHeaders(sheet);
    let total = 0;
    
    rows.forEach(row => {
      const getVal = (names: string[]) => {
        for (const name of names) {
          if (row[name] !== undefined) return row[name];
          const foundKey = Object.keys(row).find(k => k.toLowerCase().trim() === name.toLowerCase().trim() || k.toLowerCase().includes(name.toLowerCase()));
          if (foundKey) return row[foundKey];
        }
        return undefined;
      };

      const dateVal = getVal(dateNames);
      const amountVal = getVal(amountNames);
      const amount = parseAmount(amountVal);
      
      if (dateVal && amount > 0) {
        const d = parseFlexibleDate(dateVal);
        if (d.isValid()) {
          total += amount;
          // Only split if it's clearly a monthly total (e.g. date is 1st of month and amount is large)
          // But for now, let's just record it on the date provided to avoid over-complication
          recordAdInvestment(d.toDate(), amount, channel);
        }
      }
    });
    return total;
  };

  const processAdsSheetByColumns = (sheet: XLSX.WorkSheet, channel: string, dateColumnIndex: number, amountColumnIndex: number) => {
    if (!sheet) return 0;
    const rawRows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });
    if (rawRows.length <= 1) return 0;

    let total = 0;

    rawRows.slice(1).forEach((row) => {
      if (!Array.isArray(row)) return;

      const dateVal = row[dateColumnIndex];
      const amountVal = row[amountColumnIndex];
      const amount = parseAmount(amountVal);

      if (!dateVal || amount <= 0) return;

      const d = parseFlexibleDate(dateVal);
      if (!d.isValid()) return;

      total += amount;
      recordAdInvestment(d.toDate(), amount, channel);
    });

    return total;
  };

  // Ads
  const amazonAdsSheet = findSheet(["Publicidad Amazon", "Amazon Ads", "Ads Amazon", "Amazon Advertising"]);
  let totalAmazonAds = 0;
  if (amazonAdsSheet) {
    const rows = getRowsWithHeaders(amazonAdsSheet);
    rows.forEach(row => {
      const spend = parseAmount(row["Spend"] || row["Gasto"] || row["Inversión"] || row["Cost"] || row["Costo"]);
      const sku = String(row["Advertised SKU"] || row["SKU"] || "").trim();
      const dateVal = row["Date"] || row["Fecha"] || row["Day"];
      if (spend > 0) {
        totalAmazonAds += spend;
        recordAdInvestment(dateVal, spend, "Amazon", sku);
      }
    });
  }
  
  const meliAdsSheet = findSheet(["Publicidad ML", "Publicidad Meli", "Meli Ads", "Ads ML", "Mercado Libre Publicidad", "Meli Advertising", "Ads Mercado Libre"]);
  let totalMeliAds = 0;
  if (meliAdsSheet) {
    const rows = getRowsWithHeaders(meliAdsSheet);
    rows.forEach(row => {
      const getVal = (names: string[]) => {
        for (const name of names) {
          if (row[name] !== undefined) return row[name];
          const foundKey = Object.keys(row).find(k => k.toLowerCase().trim() === name.toLowerCase().trim() || k.toLowerCase().includes(name.toLowerCase()));
          if (foundKey) return row[foundKey];
        }
        return undefined;
      };

      const dateVal = getVal(["Desde", "Fecha", "Date", "Inicio"]);
      const amountVal = getVal(["Inversión (Moneda local)", "Inversión", "Inversion", "Spend", "Gasto", "Monto"]);
      const amount = parseAmount(amountVal);

      if (dateVal && amount > 0) {
        const d = parseFlexibleDate(dateVal);
        if (d.isValid()) {
          totalMeliAds += amount;
          // Distribute monthly amount across the month to reflect daily/weekly views
          const daysInMonth = d.daysInMonth();
          const dailyAmount = amount / daysInMonth;
          for (let i = 0; i < daysInMonth; i++) {
            const currentDay = d.date(i + 1).toDate();
            recordAdInvestment(currentDay, dailyAmount, "Meli");
          }
        }
      }
    });
  }
  
  const shopifyAdsSheet = findSheet(["Publicidad Shopify", "Shopify Ads", "Ads Shopify", "Meta Ads", "Google Ads", "Shopify Advertising"]);
  const totalShopifyAds = processAdsSheetByColumns(shopifyAdsSheet, "Shopify", 2, 7);

  const totalSales = totalAmazonSales + totalMeliSales + totalShopifySales + totalDirectSales;
  const totalAdsInvestment = totalAmazonAds + totalMeliAds + totalShopifyAds;
  const totalProductCost = Object.values(timeSeriesMap).reduce((sum: number, item: any) => sum + (item.productCost || 0), 0);
  const totalMarketplaceFee = Object.values(timeSeriesMap).reduce((sum: number, item: any) => sum + (item.marketplaceFee || 0), 0);
  const totalShippingCost = Object.values(timeSeriesMap).reduce((sum: number, item: any) => sum + (item.shippingCost || 0), 0);
  const financialResult = totalSales - totalProductCost - totalMarketplaceFee - totalShippingCost - totalAdsInvestment;

  const productSalesMap: Record<string, { name: string, total: number, units: number, channels: Record<string, number> }> = {};
  allTransactions.forEach(tx => {
    const name = tx.product || "Producto Desconocido";
    if (!productSalesMap[name]) productSalesMap[name] = { name, total: 0, units: 0, channels: { Amazon: 0, Meli: 0, Shopify: 0, Direct: 0 } };
    productSalesMap[name].total += tx.amount;
    productSalesMap[name].units += (tx.quantity || 1);
    if (productSalesMap[name].channels[tx.channel] !== undefined) productSalesMap[name].channels[tx.channel] += tx.amount;
  });

  const getRowValue = (row: any, names: string[]) => {
    for (const name of names) {
      if (row[name] !== undefined && row[name] !== null) return row[name];
      const foundKey = Object.keys(row).find(k => k.toLowerCase().trim() === name.toLowerCase().trim() || k.toLowerCase().includes(name.toLowerCase()));
      if (foundKey && row[foundKey] !== undefined && row[foundKey] !== null) return row[foundKey];
    }
    return undefined;
  };

  const funnelSheet = findSheet(["Funnel", "Funnel Ventas", "Sales Funnel"]);
  const funnelRows = funnelSheet ? getRowsWithHeaders(funnelSheet) : [];
  const funnelData = funnelRows.map((row: any) => {
    const date = parseFlexibleDate(getRowValue(row, ["Fecha", "Date", "Dia", "Day"]));
    const channel = String(getRowValue(row, ["Canal", "Channel", "Marketplace"]) || "Total").trim();
    if (!date.isValid()) return null;

    return {
      date: date.format('YYYY-MM-DD'),
      channel,
      sessions: parseAmount(getRowValue(row, ["Sesiones", "Sessions", "Visits", "Visitas"])),
      productViews: parseAmount(getRowValue(row, ["Vistas Producto", "Product Views", "Page Views", "Views"])),
      addToCart: parseAmount(getRowValue(row, ["Agregado Carrito", "Add To Cart", "Add to Cart", "Cart"])),
      checkoutStarted: parseAmount(getRowValue(row, ["Checkout", "Checkout Started", "Inicio Checkout"])),
      orders: parseAmount(getRowValue(row, ["Ordenes", "Orders", "Pedidos"])),
      units: parseAmount(getRowValue(row, ["Unidades", "Units"])),
      sales: parseAmount(getRowValue(row, ["Ventas", "Sales", "Revenue", "Ingresos"])),
    };
  }).filter(Boolean);

  const getDailySalesByChannel = (channel: string) => {
    const dailySales: Record<string, { orders: number, units: number, sales: number }> = {};

    allTransactions
      .filter(tx => tx.channel === channel)
      .forEach(tx => {
        if (!dailySales[tx.date]) dailySales[tx.date] = { orders: 0, units: 0, sales: 0 };

        dailySales[tx.date].orders += 1;
        dailySales[tx.date].units += tx.quantity || 1;
        dailySales[tx.date].sales += tx.amount || 0;
      });

    return dailySales;
  };

  const processVisitsSheet = (sheet: XLSX.WorkSheet | null, channel: string, dateCol?: number, visitsCol?: number) => {
    if (!sheet) return [];
    const dailySales = getDailySalesByChannel(channel);
    const parseVisitDate = (value: any) => {
      const raw = String(value || "").trim();
      const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);

      if (channel === 'Meli' && isoMatch) {
        const [, year, day, month] = isoMatch;
        return dayjs(`${year}-${month}-${day}`, 'YYYY-MM-DD', true);
      }

      return parseFlexibleDate(value);
    };

    if (dateCol !== undefined && visitsCol !== undefined) {
      const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });
      const visitsByDate: Record<string, number> = {};

      rows.forEach(row => {
        const date = parseVisitDate(row?.[dateCol]);
        const visits = parseAmount(row?.[visitsCol]);
        if (!date.isValid() || visits <= 0) return;

        const dateKey = date.format('YYYY-MM-DD');
        visitsByDate[dateKey] = (visitsByDate[dateKey] || 0) + visits;
      });

      return Object.entries(visitsByDate).map(([date, visits]) => ({
        date,
        channel,
        sessions: visits,
        productViews: visits,
        addToCart: 0,
        checkoutStarted: 0,
        orders: dailySales[date]?.orders || 0,
        units: dailySales[date]?.units || 0,
        sales: dailySales[date]?.sales || 0,
      }));
    }

    const rows = getRowsWithHeaders(sheet);

    return rows.map((row: any) => {
      const date = parseFlexibleDate(getRowValue(row, ["date_from", "Fecha", "Date", "Dia", "Day"]));
      const visits = parseAmount(getRowValue(row, ["total_visits", "Visitas", "Visits", "Sessions", "Sesiones"]));
      if (!date.isValid() || visits <= 0) return null;

      return {
        date: date.format('YYYY-MM-DD'),
        channel,
        listingId: String(getRowValue(row, ["item_id", "Item ID", "Publication ID", "Publicacion"]) || "").trim(),
        title: String(getRowValue(row, ["title", "Titulo", "Título"]) || "").trim(),
        sessions: visits,
        productViews: visits,
        addToCart: 0,
        checkoutStarted: 0,
        orders: dailySales[date.format('YYYY-MM-DD')]?.orders || 0,
        units: dailySales[date.format('YYYY-MM-DD')]?.units || 0,
        sales: dailySales[date.format('YYYY-MM-DD')]?.sales || 0,
      };
    }).filter(Boolean);
  };

  const visitsData = [
    ...processVisitsSheet(findSheet(["Visitas Amazon", "Amazon Visits", "Amazon Traffic"]), "Amazon"),
    ...processVisitsSheet(findSheet(["Visitas ML", "Visitas Meli", "Mercado Libre Visits", "Meli Visits"]), "Meli", 10, 12),
    ...processVisitsSheet(findSheet(["Visitas Shopify", "Shopify Visits", "Shopify Traffic"]), "Shopify"),
  ];

  const unitSheet = findSheet(["Unit Economics", "Productos", "Costos", "Rentabilidad"]);
  let mappedProducts = [];
  if (unitSheet) {
    const unitRows: any[] = XLSX.utils.sheet_to_json(unitSheet);
    mappedProducts = unitRows.map((row: any) => {
      const nameKey = Object.keys(row).find(k => k.toLowerCase().includes('nombre') || k.toLowerCase().includes('producto'));
      const name = nameKey ? String(row[nameKey]).trim() : null;
      if (!name) return null;
      return {
        name,
        price: parseAmount(row['Precio Público de venta'] || row['Precio'] || row['Price']),
        cost: parseAmount(row['Costo Producto (Landed Cost)'] || row['Costo'] || row['Cost']),
        skuAmazon: String(row['SKU Amazon'] || row['SKU'] || "").trim(),
        fees: 0, shipping: 0, ads: 0, pl: 0, return: "0.0"
      };
    }).filter(p => p !== null).sort((a: any, b: any) => b.price - a.price);
  }

  const amazonStockSheet = findSheet(["Inventario Amazon", "Amazon Inventory", "Stock Amazon"]);
  const meliStockSheet = findSheet(["Inventario ML", "Inventario Meli", "Stock ML", "Stock Meli"]);
  const shopifyStockSheet = findSheet(["Inventario Shopify Bodega", "Shopify Inventory", "Stock Shopify"]);
  const stockMap: Record<string, { amazon: number, meli: number, shopify: number }> = {};

  const recordStock = (sheet: XLSX.WorkSheet | null, channel: 'amazon' | 'meli' | 'shopify', skuCol: number, quantityCol: number, dedupeSku = false) => {
    if (!sheet) return;
    const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });
    const seenSkus = new Set<string>();

    rows.forEach(row => {
      const sku = String(row?.[skuCol] || "").trim();
      const quantity = parseAmount(row?.[quantityCol]);

      if (!sku || sku.toLowerCase() === 'sku' || quantity <= 0) return;
      if (dedupeSku && seenSkus.has(sku)) return;

      seenSkus.add(sku);
      if (!stockMap[sku]) stockMap[sku] = { amazon: 0, meli: 0, shopify: 0 };
      stockMap[sku][channel] += quantity;
    });
  };

  recordStock(amazonStockSheet, 'amazon', 1, 6);
  recordStock(meliStockSheet, 'meli', 4, 7, true);
  recordStock(shopifyStockSheet, 'shopify', 2, 4);

  const finalStock: any[] = [];
  if (productSheet) {
    const pRows: any[] = XLSX.utils.sheet_to_json(productSheet);
    pRows.forEach(row => {
      const nameKey = Object.keys(row).find(k => k.toLowerCase().includes('nombre') || k.toLowerCase().includes('producto'));
      const name = nameKey ? String(row[nameKey]).trim() : null;
      if (!name) return;
      const skuAmazon = String(row["SKU Amazon"] || "").trim();
      const skuMeli = String(row["SKU ML"] || "").trim();
      const skuShopify = String(row["SKU Shopify"] || "").trim();
      const totalAmazon = skuAmazon && stockMap[skuAmazon] ? stockMap[skuAmazon].amazon : 0;
      const totalMeli = skuMeli && stockMap[skuMeli] ? stockMap[skuMeli].meli : 0;
      const totalShopify = skuShopify && stockMap[skuShopify] ? stockMap[skuShopify].shopify : 0;
      const stockByChannel = {
        Amazon: totalAmazon,
        Meli: totalMeli,
        Shopify: totalShopify,
        Total: totalAmazon + totalMeli + totalShopify,
      };
      const thirtyDaysAgo = dayjs().subtract(30, 'day');
      const recentSalesByChannel = {
        Amazon: allTransactions.filter(tx => tx.product === name && tx.channel === 'Amazon' && dayjs(tx.date).isAfter(thirtyDaysAgo)).reduce((sum, tx) => sum + (tx.quantity || 1), 0),
        Meli: allTransactions.filter(tx => tx.product === name && tx.channel === 'Meli' && dayjs(tx.date).isAfter(thirtyDaysAgo)).reduce((sum, tx) => sum + (tx.quantity || 1), 0),
        Shopify: allTransactions.filter(tx => tx.product === name && tx.channel === 'Shopify' && dayjs(tx.date).isAfter(thirtyDaysAgo)).reduce((sum, tx) => sum + (tx.quantity || 1), 0),
        Direct: allTransactions.filter(tx => tx.product === name && tx.channel === 'Direct' && dayjs(tx.date).isAfter(thirtyDaysAgo)).reduce((sum, tx) => sum + (tx.quantity || 1), 0),
      };
      const recentSales = Object.values(recentSalesByChannel).reduce((sum, value) => sum + value, 0);
      const totalStock = stockByChannel.Total;
      const dailyVelocity = recentSales / 30;
      const doh = dailyVelocity > 0 ? totalStock / dailyVelocity : (totalStock > 0 ? 999 : 0);
      finalStock.push({
        name,
        price: parseAmount(row["Precio Público de venta"] || row["Precio"] || row["Price"]),
        stock: totalStock,
        stockByChannel,
        recentSales,
        recentSalesByChannel: { ...recentSalesByChannel, Total: recentSales },
        status: doh < 20 ? 'Risk' : (doh <= 60 ? 'Low' : 'OK'),
        doh: doh === 999 ? '99+ Days' : `${Math.round(doh)} Days`
      });
    });
  }

  return {
    products: mappedProducts,
    productSales: Object.values(productSalesMap),
    funnel: [...funnelData, ...visitsData],
    timeSeries: Object.values(timeSeriesMap).sort((a, b) => dayjs(a.date).unix() - dayjs(b.date).unix()),
    adsTimeSeries: Object.values(adsTimeSeriesMap).sort((a, b) => dayjs(a.date).unix() - dayjs(b.date).unix()),
    transactions: allTransactions.sort((a, b) => dayjs(b.date).unix() - dayjs(a.date).unix()),
    adsTransactions: adsTransactions,
    stock: finalStock.sort((a, b) => b.price - a.price),
    metrics: {
      totalSales, Amazon: totalAmazonSales, Meli: totalMeliSales, Shopify: totalShopifySales, Direct: totalDirectSales,
      adsInvestment: totalAdsInvestment, AmazonAds: totalAmazonAds, MeliAds: totalMeliAds, ShopifyAds: totalShopifyAds,
      productCost: totalProductCost, marketplaceFee: totalMarketplaceFee, shippingCost: totalShippingCost, financialResult,
      roas: totalAdsInvestment > 0 ? totalSales / totalAdsInvestment : 0,
      acos: totalSales > 0 ? (totalAdsInvestment / totalSales) * 100 : 0
    }
  };
};

export const processExcelBuffer = (arrayBuffer: ArrayBuffer): Partial<DashboardData> => {
  const data = new Uint8Array(arrayBuffer);
  const workbook = XLSX.read(data, { type: 'array', cellDates: true, dateNF: 'yyyy-mm-dd' });
  return processDataFromWorkbook(workbook);
};

export const processSheetsData = (allSheets: Record<string, any[][]>): Partial<DashboardData> => {
  const workbook = XLSX.utils.book_new();
  for (const [name, aoa] of Object.entries(allSheets)) {
    const sheet = XLSX.utils.aoa_to_sheet(aoa);
    XLSX.utils.book_append_sheet(workbook, sheet, name);
  }
  return processDataFromWorkbook(workbook);
};
