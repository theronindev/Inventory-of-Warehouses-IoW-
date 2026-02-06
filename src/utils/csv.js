/**
 * CSV Utility Functions
 */

export const parseCSV = (csvContent) => {
  const lines = csvContent.trim().split('\n');
  if (lines.length < 2) return [];
  
  const headers = parseCSVLine(lines[0]);
  const data = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length >= headers.length) {
      const row = {};
      headers.forEach((header, index) => {
        row[header.trim().replace(/"/g, '')] = values[index] || '';
      });
      data.push(row);
    }
  }
  
  return data;
};

const parseCSVLine = (line) => {
  const values = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim().replace(/^"|"$/g, ''));
      current = '';
    } else {
      current += char;
    }
  }
  
  values.push(current.trim().replace(/^"|"$/g, ''));
  return values;
};

export const formatDate = (date) => {
  if (!date) return '';
  
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
  
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  
  return `${day}/${month}/${year}`;
};

const escapeCSV = (value) => {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

export const generateExportCSV = (items) => {
  const headers = [
    'Date',
    'Brand Name',
    'Level 2 Desc',
    'Item Code',
    'Item Description',
    'UOM',
    'Qty 1',
    'Exp 1 (dd/mm/yyyy)',
    'Qty 2',
    'Exp 2 (dd/mm/yyyy)',
    'Qty 3',
    'Exp 3 (dd/mm/yyyy)',
  ];
  
  let csv = '\uFEFF' + headers.join(',') + '\n';
  
  items.forEach(item => {
    const row = [
      escapeCSV(formatDate(item.scanDate) || ''),
      escapeCSV(item.brandName || ''),
      escapeCSV(item.level2Desc || ''),
      escapeCSV(item.itemCode || ''),
      escapeCSV(item.itemDescription || ''),
      escapeCSV(item.uom || ''),
    ];
    
    const quantities = item.quantities || [];
    for (let i = 0; i < Math.max(3, quantities.length); i++) {
      const qty = quantities[i];
      if (qty) {
        row.push(escapeCSV(qty.quantity?.toString() || ''));
        row.push(escapeCSV(formatDate(qty.expiry) || ''));
      } else {
        row.push('');
        row.push('');
      }
    }
    
    csv += row.join(',') + '\n';
  });
  
  return csv;
};

export const findItemInMasterData = (masterData, searchValue) => {
  if (!searchValue || !masterData) return null;
  
  const searchLower = searchValue.toLowerCase().trim();
  
  return masterData.find(item => {
    const itemCode = (
      item['Item Code'] || 
      item['ItemCode'] || 
      item['item_code'] || 
      item['ITEM CODE'] ||
      ''
    ).toString().toLowerCase().trim();
    
    const barcode = (
      item['Barcode'] || 
      item['barcode'] || 
      item['BARCODE'] ||
      ''
    ).toString().toLowerCase().trim();
    
    return itemCode === searchLower || barcode === searchLower;
  });
};

export const extractItemDetails = (item) => {
  if (!item) return null;
  
  return {
    brandName: item['Brand Name'] || item['BrandName'] || item['brand_name'] || item['Level 2 Desc'] || item['Level2Desc'] || '',
    itemCode: item['Item Code'] || item['ItemCode'] || item['item_code'] || item['ITEM CODE'] || '',
    itemDescription: item['Item Description'] || item['ItemDescription'] || item['item_description'] || item['ITEM DESCRIPTION'] || '',
    uom: item['UOM'] || item['Warehouse UOM'] || item['uom'] || item['WAREHOUSE UOM'] || '',
    level2Desc: item['Level 2 Desc'] || item['Level2Desc'] || item['level_2_desc'] || '',
  };
};
