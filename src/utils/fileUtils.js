/**
 * File Utility Functions
 * Handles XLSX/CSV reading and PDF/XLSX export
 */

import * as FileSystem from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Buffer } from 'buffer';
import * as XLSX from 'xlsx';

// Make Buffer available globally for xlsx
global.Buffer = Buffer;

/**
 * Month names for date formatting
 */
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Parse Excel or CSV file
 */
export const parseExcelFile = async (fileUri, fileName) => {
  try {
    const fileContent = await FileSystem.readAsStringAsync(fileUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const buffer = Buffer.from(fileContent, 'base64');
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { defval: '' });
    
    return data;
  } catch (error) {
    console.error('Error parsing Excel file:', error);
    throw new Error('Failed to parse file. Make sure it is a valid Excel or CSV file.');
  }
};

/**
 * Format date to dd/Mon/yyyy (e.g., 20/Jan/2026)
 */
export const formatDate = (date) => {
  if (!date) return '';
  
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
  
  const day = String(d.getDate()).padStart(2, '0');
  const month = MONTH_NAMES[d.getMonth()];
  const year = d.getFullYear();
  
  return `${day}/${month}/${year}`;
};

/**
 * Search for item by BARCODE ONLY
 * Used when scanning barcode
 */
export const findItemByBarcode = (masterData, barcodeValue) => {
  if (!barcodeValue || !masterData) return null;
  
  const searchValue = barcodeValue.toString().toLowerCase().trim();
  
  return masterData.find(item => {
    const barcode = (
      item['Item Barcode'] ||
      item['Barcode'] || 
      item['barcode'] || 
      item['ITEM BARCODE'] ||
      ''
    ).toString().toLowerCase().trim();
    
    return barcode === searchValue;
  });
};

/**
 * Search for item by ITEM CODE ONLY
 * Used when entering item code manually
 */
export const findItemByCode = (masterData, itemCodeValue) => {
  if (!itemCodeValue || !masterData) return null;
  
  const searchValue = itemCodeValue.toString().toLowerCase().trim();
  
  return masterData.find(item => {
    const itemCode = (
      item['Item Code'] || 
      item['ItemCode'] || 
      item['item_code'] || 
      item['ITEM CODE'] ||
      ''
    ).toString().toLowerCase().trim();
    
    return itemCode === searchValue;
  });
};

/**
 * Extract item details from master data row
 */
export const extractItemDetails = (item) => {
  if (!item) return null;
  
  return {
    brandName: item['Brand Name'] || item['BrandName'] || item['brand_name'] || item['BRAND NAME'] || '',
    itemCode: item['Item Code'] || item['ItemCode'] || item['item_code'] || item['ITEM CODE'] || '',
    itemDescription: item['Item Description'] || item['ItemDescription'] || item['item_description'] || item['ITEM DESCRIPTION'] || '',
    uom: item['Warehouse UOM'] || item['UOM'] || item['uom'] || item['WAREHOUSE UOM'] || '',
    barcode: item['Item Barcode'] || item['Barcode'] || item['barcode'] || item['ITEM BARCODE'] || '',
  };
};

// Logo base64 for exports
const LOGO_BASE64 = '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BBIAACAFACCASAkgJAQgSEggJAQBAKiEJhABCEhAKBAiBJBBIAQgBkAggCIEQCAECCRAkAiBCCAlApABJABISAAJRIEAJKZAAAQgBBAGxkCAgIUABAYIEgCAgIQCAECABQoAYCIKQghACAAECIEgISCBIEIEEQRACAECCJCABCAQBIBIBBCCFIAQBQgBJCBAEYIQIBIAgAARIKAJCSAhIBIhAghDyXBAKFCFCBIQBIoAMgIMIAQkhhQApQgIhBIYAJBAJIQCAIAgBBIISIgChAgJIIQBBEAJIgBAhBIgQEgMQCoAACCAIhJAAIQkIhCEEKCQEJFRIBIgACAIgRBBAAQCBhBAEEJAIESAhJAIhKYQgAIEIpECIAaAQQBIIKQQAAAABQAAECUAQAkABgQAAASIQQiIEkQCBACEAQBACAgoBCIABIAQEKBAgAABIQhKIEIIACYJEAAIhCAIoBIAEIBEBAwAIBKgEJAEIAISgQACBlAABCQhIkCAJQBIBgCAQCAlAAIFCIJRCEIJEQCkhBSAhBQgIEoAAJBISAAkFAAIACQQgiKAQQIIECBAJIEQQBBABIECgCIAgQCAQQBAAgIQECAJCAgACCQJBIBACJYQEJCQgEgIQIoAAEFIABAEJJBIACQRISCIBIBQAQIJEQkASIIACBIkAIgAIAkAKAAAASgQgIRABEkAAAAKB0CCEA4CAAAIAEuAISIAAAAJJIBIhCQUCAiQEBIJCKCABCAABCAQhFAJAgJBCISQAQoREkgIEAhFAIoCSJBKCBEASCIQQgICQIEEISCBIRAoBSAISCAEJIhABCQAhIQSQCCGBQhJICAABgCAIAARCCABICAQCECIAAoEAgYCQIAIIQIAQSACBkAQiACEJJKFAIoFECAmBIBBICCGkBIQEAAAkAgAQICSEBAkBCBCgEBABIQRIIBJCiEhIIBABCACQBEgAIaQA0EAIBUIEQBDABACF0AYgggABBCEISRIICYIAAQEQIASQIhAChAAhCYCECIKECISQECBCgAQJQAghQCAEAQRCCAQgEBAKBCIIBCAJQkAoEkAI0EJChJBCJBBKChBCCIkQQAGkBAABhJCCkIRYCIECQBBCSAAEAQQBCYAQKCAIECAIAQIgCAIQghACABIICBKESAgECIhAAAABKAYABCAQBJCCACgBIAgIERAIBCACCAGEJBACAgghAEkCAElCAEoIgQCIAEACAYCIECAhACQQSEgJESQQAIBACCCABAKBIAgQCUgKIIAgQAIJQokASBIAhIBBIJRCAAEBAAIBCIUQEkICgQCJIIIECAAkgQkAJRQCkAIgkIQAIAQKoAACAAiEFCCQBAgASGIQIIBCKIAmAIQgCIRCISGBBAiQEEAIQBIQCiAABEIADAhCAICSQggAAYAQAIAgBAAQAgkQYigAEAiQCIBIAQAAISkJBIkQgCBCKBBCAUIIAQkhAYGECIEgAFQIAAQEAhIIUhAQCoASoACBBIREQgogFAQiEBBCBKQQQAghCIgIBAgEBAJChIgEJJCQIBBCgAAJABISIIQYQAGEAABCgIQQQCBAAiUFECSEJBBCAIGQCAJCCAIohASIQJAAIAiEFCQAAICgAACEQAISCAChAEIIIAgkQCFkABIAAQiBIEgCQCIBBJAEAAkkIQgQAgiEUCIIQEIIEIIQBBAhJBCAAIKQEAghRCAICKQSBACEBAEICEAEJACQEAgBCCEIAQgBIRQChJRAQAACCUJACCAEIYQAAAQJBEAGJABCEBSABEAIJAKBECSACCRAEBIJoRAKCAFIQSFBAEIJQhBC0AQIIYECAQghCUBKBCCEIBBCgBAKCURCQAhCSEJIACISKICGEIKESCIhQCikAAkhBCQQhIIQEACQEAJICCBJCAmBACACAAKBEBIQEAEQCYgDAkCSQAqAABCSCCQBISSBEAQCIRKCAALAREASCQRCEAIJBAEJAkkIIAmEQhAAICGBQEogCESCCIGEBEAqIUFAAEBJAIiQEEJICBACCAAJQgjCGIAIQEJECAhAKAhCCAEABEIICCFAAIBQQBACQEgCAEmBQCghICEQAkISQhJQCAGBBCCQECAJhIQQIoAQAiAIISQgASGBIICQBCAACAIkEEIhEAqAEEIBIBQECAJBCCEQSggICAkBQQAohEBACCEBQAIFCCEJJAIQQkkAQAmIAIBCACQQCAmEJJFAIEgCAIkAKCAIoCQEABKQAEgBAgAJkEAIggREAAghAISAJEJCSIgIBCGQAhACAEhJQCAkIRQACBIAgCCEIAghEBKBAAQIJCSEQIiQECABIEJCCCCQEAIQQiAAISFACAEAIQRBJAAhFIBCgEQihCBACASAIhCCEEhIhIQQCoISBIiEEAQBIACQSAIIIYEQISAkRAoIBQgBJCEIAAAgAQABIIEEAKEQKAIhEBIICCGEAgggBEgBYoQACAIJCaFAIoGEBAJJAEIIoJCAkAIJQAAQQigAQaGSAAggASIgSIAEEoQASKYABKAACBAAAoQCCJEESAoAICAJBCUgIQJJCIBEQAgCCBIAIAgkEiSBEAQhRACEAAIJASASCIFAIOQTkgBCAIRQQACQQAIBCSEAIYQAQAmEJAEBJAACQUoiCAhhEgAICBBACAISAoQQCkCAJBCCBCCAlAQECKBAgiAAIIgAQAhCKAAhICEBIYBECAABIYQkEEISCCEQJIGESBCAIIAACQQgJAFCEgCEhEQAoiQQBAJCAAAAQiBIIIiQEIIQSCIIBCCEgBAACCAkBCQBACkAhBAhIaQgQAiQJBEAAACGCIAEIIQQgRASIgGRAEJCCAIFEARIAKAkAAGBQChCIKQAhCAIICEQgBCCQECEIEJCKJAAAQgRIRQKQCAEkgAhACEJCEIIQgIhCQVCKQQJBIREIoIEUkIiIIBQIIhAgJJCEEAgJIJChBAS4AghBIEAQEESEAqBkAAEQBKqDYCEEAhAAAIhIIEgAEIIERAiIYQAgBAQQAiEFAQIEhKCEIEQCIGEKIQgJACEAkIIACAlJAhBCIAIIAFIQAAIIUJCCCUEGQAIBYAJAAOAACQAUAhBAkABBIKAACQkIAkgQSGEIAIAQoAghIQQIQAkAACEBBJCACBAIIAQCCQICCEJIJEAQCIkSEIACIGIEIQAJCAAIRKCABICBCFEIBBCiAASIoFAISGABIgQAIQgiCAECAIggIQQgghIIYGEEAhJAIRCKIJQIAQQAAgIpIQAAoCQBIAAgQQhISEJBCRBCJBAIIGEBEIgIIAASAgIggASABAQQEhICIESCARAApCAJJQAKEkACgJCJBARCoAQIAIIBISESBAQAgFCIgQKBAIQCBBCSJICEpAAAJBIJCCEIIhAEIRQAARCACAIACSEJEBKICFQCqUQIAghCAQAoAAQCkIIiQAhIRBCCCCEICEkIQAgoRAQCCUABCCJABACJAAIBAJCACElkAAJACCQBEESCJJAIIBCEJIAEkICIQEJASIQBAAKCAISEAQAAEQCJEKIEAKAIARIIBGAhAAJJIEgAABCSCCQBiQkAAAIIJSQAAIkAAglBAAhAIIQhISQSIAgQAhJSIRAQghICAKEJICQEAoJBCQEQhCQBEoJIQAACCUkQApAhABIQCABQIAQAgBBKASEAAEJSCABABJCASAShBAEQCFBCAIIAQkIIQQICAAAkggRBAABCKSEEAJCAIYAAKAAAiFAAEJIIBQCIQggAAiBAIkQJAECIJFAQhIQQCiBAIAQIQgAFIIAJIgYCCAAABIJCaQASIISAAkIIIEQICGIIAgBhEAQiQRCAAhJAIGEIIAEBAEJIRKQBEJJJARECKQAQgACQhJhAkIAJAACoCQBIAQkhASKEBBAAQJBIYAgQQAJISSAABIAIREQISEBIYSQBCkhQISAAABJAkACEAkBCQEEIIBIQAhBAIgIAAKAhECABIIQCISEgCASIgEKIAkIoQACIIAAAkEACACEkAIiAgkAIAkBCAIJSUIKpYAAQIIAQAJIAAiAACAREkJCEAhIIBBCgBABCCEhFIRAIFAoQSFAEAAAIAEkISAEAoEQgBAChIQQFAQCQAoAJISAAEEECkAAAUAhhAIhICEJCAAQQQEEQAhFQAAJASAASEIIAYiSQEgCIYgQIAAgAAglSIIQQAgEAglSCEgICSEJpBBCCAkEIJQAhAQIJIRQQAAJJIJAgCABIAiJBAIBJIhASEJCIIQABIlQCoAEAgIBCCQhJIQCQgoKAYFACCCREAgCSAIAIBQCJBIhBIFQQCKUSIIQCAJCAIAgBIGQAgFCKAlhIEIIAIRAQIAJASAghBAhBIEQCgkhAAghBEIIQagQAEgISCQBIBQSBAJCSCAAhEBAIoQgBCQQIIQkCIEgECAAgkJICCCEIBAKQaGQkBBCKIgAIIGAEBAQBISCkBQkBCCEhASBBAQIIAJBAIJICCIhEJAEAiBIAYQQIoQCEEIAKIAAICASIiQQBiUJICgggAAIBCABEIJKIACCQCCEEAKRABBCgISEEEIBAAJAKCQRCIIAACAJJIGEhBBCCYQShAIkAIgABAEAAA==';

/**
 * Generate PDF HTML content with signatures
 * If cvCode is provided (user edited), show Arabic signatures
 */
const generatePDFHTML = (items, warehouseName = 'Inventory Report', cvCode = '') => {
  const today = formatDate(new Date());
  const isEdited = cvCode && cvCode.trim() !== '';
  
  const rows = items.map((item, index) => {
    const quantities = item.quantities || [];
    
    let qtyCells = '';
    for (let i = 0; i < 3; i++) {
      const qty = quantities[i];
      qtyCells += `
        <td style="border: 1px solid #000; padding: 4px; text-align: center;">${qty?.quantity || ''}</td>
        <td style="border: 1px solid #000; padding: 4px; text-align: center;">${qty?.expiry ? formatDate(qty.expiry) : ''}</td>
      `;
    }
    
    return `
      <tr>
        <td style="border: 1px solid #000; padding: 4px; text-align: center;">${index + 1}</td>
        <td style="border: 1px solid #000; padding: 4px;">${item.brandName || ''}</td>
        <td style="border: 1px solid #000; padding: 4px;">${item.itemCode || ''}</td>
        <td style="border: 1px solid #000; padding: 4px; direction: rtl;">${item.itemDescription || ''}</td>
        <td style="border: 1px solid #000; padding: 4px; text-align: center;">${item.uom || ''}</td>
        ${qtyCells}
      </tr>
    `;
  }).join('');

  // Signature section based on whether user edited
  const signatureSection = isEdited ? `
    <div class="declaration" style="direction: rtl; text-align: right; margin-top: 30px; padding: 15px; border: 1px solid #ccc; background: #f9f9f9; font-size: 11px; line-height: 1.8;">
      اني الموقع ادناه (..................................................)  اقر بان البضائع الدرجة تفاصيلها في قوائم هذا الجرد استلمتها من شركة الميسرللتجارة العامة المحدودة المسؤولية واتعهد بتسديد قيمتها الى قسم الحسابات وحسب سعر البيع المعتمد في الشركة
    </div>
    <div class="signatures-arabic" style="display: flex; justify-content: space-between; margin-top: 40px; padding: 0 20px; direction: rtl;">
      <div class="signature-box" style="text-align: center; width: 45%;">
        <div class="signature-title" style="font-weight: bold; font-size: 12px; color: #112d47; margin-bottom: 30px;">اسم وتوقيع صاحب الاقرار</div>
        <div class="signature-line" style="border-top: 1px solid #000; margin-top: 40px; padding-top: 5px;"></div>
      </div>
      <div class="signature-box" style="text-align: center; width: 45%;">
        <div class="signature-title" style="font-weight: bold; font-size: 12px; color: #112d47; margin-bottom: 30px;">اسم وتوقيع القائم بالجرد</div>
        <div class="signature-line" style="border-top: 1px solid #000; margin-top: 40px; padding-top: 5px;"></div>
      </div>
    </div>
  ` : `
    <div class="signatures">
      <div class="signature-box">
        <div class="signature-title">Warehouse Team</div>
        <div class="signature-line">Signature</div>
      </div>
      <div class="signature-box">
        <div class="signature-title">Sales Team</div>
        <div class="signature-line">Signature</div>
      </div>
      <div class="signature-box">
        <div class="signature-title">Control Team</div>
        <div class="signature-line">Signature</div>
      </div>
    </div>
  `;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        @page {
          size: A4 landscape;
          margin: 10mm;
        }
        body {
          font-family: Arial, sans-serif;
          font-size: 10px;
          margin: 0;
          padding: 10px;
        }
        .logo-container {
          text-align: center;
          margin-bottom: 10px;
        }
        .logo {
          max-width: 180px;
          max-height: 60px;
        }
        h1 {
          text-align: center;
          font-size: 18px;
          margin-bottom: 5px;
          color: #112d47;
          font-weight: bold;
        }
        .date {
          text-align: center;
          font-size: 11px;
          margin-bottom: 10px;
          color: #666;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 9px;
        }
        th {
          background-color: #4b7c70;
          color: white;
          padding: 6px 4px;
          border: 1px solid #000;
          text-align: center;
          font-weight: bold;
        }
        td {
          padding: 4px;
          vertical-align: middle;
        }
        tr:nth-child(even) {
          background-color: #f5f5f5;
        }
        .signatures {
          display: flex;
          justify-content: space-between;
          margin-top: 40px;
          padding: 0 20px;
        }
        .signature-box {
          text-align: center;
          width: 30%;
        }
        .signature-title {
          font-weight: bold;
          font-size: 12px;
          color: #112d47;
          margin-bottom: 30px;
        }
        .signature-line {
          border-top: 1px solid #000;
          margin-top: 40px;
          padding-top: 5px;
          font-size: 10px;
          color: #666;
        }
      </style>
    </head>
    <body>
      <div class="logo-container">
        <img src="data:image/png;base64,${LOGO_BASE64}" class="logo" alt="Logo" />
      </div>
      <h1>${warehouseName}</h1>
      <div class="date">Date: ${today} | Total Items: ${items.length}</div>
      
      <table>
        <thead>
          <tr>
            <th style="width: 3%;">#</th>
            <th style="width: 10%;">Brand Name</th>
            <th style="width: 8%;">Item Code</th>
            <th style="width: 25%;">Item Description</th>
            <th style="width: 5%;">UOM</th>
            <th style="width: 6%;">Qty 1</th>
            <th style="width: 10%;">Exp 1</th>
            <th style="width: 6%;">Qty 2</th>
            <th style="width: 10%;">Exp 2</th>
            <th style="width: 6%;">Qty 3</th>
            <th style="width: 10%;">Exp 3</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
      
      ${signatureSection}
    </body>
    </html>
  `;
};

/**
 * Export items to PDF
 */
export const exportToPDF = async (items, filename = 'inventory_report', warehouseName = 'Inventory Report', cvCode = '') => {
  try {
    const html = generatePDFHTML(items, warehouseName, cvCode);
    
    const { uri } = await Print.printToFileAsync({
      html,
      base64: false,
    });
    
    const date = new Date();
    const timestamp = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}_${String(date.getHours()).padStart(2, '0')}${String(date.getMinutes()).padStart(2, '0')}`;
    const newFilename = `${filename}_${timestamp}.pdf`;
    
    const newUri = FileSystem.documentDirectory + newFilename;
    await FileSystem.moveAsync({
      from: uri,
      to: newUri,
    });
    
    return newUri;
  } catch (error) {
    console.error('Error exporting to PDF:', error);
    throw new Error('Failed to create PDF');
  }
};

/**
 * Export items to XLSX
 */
export const exportToXLSX = async (items, filename = 'inventory_report', warehouseName = 'Inventory Report', cvCode = '') => {
  try {
    const isEdited = cvCode && cvCode.trim() !== '';
    
    // Create title row
    const titleRow = { '#': warehouseName };
    
    // Create header row
    const headerRow = {
      '#': '#',
      'Brand Name': 'Brand Name',
      'Item Code': 'Item Code',
      'Item Description': 'Item Description',
      'UOM': 'UOM',
      'Qty 1': 'Qty 1',
      'Exp 1': 'Exp 1',
      'Qty 2': 'Qty 2',
      'Exp 2': 'Exp 2',
      'Qty 3': 'Qty 3',
      'Exp 3': 'Exp 3',
    };
    
    // Prepare data for Excel
    const data = items.map((item, index) => {
      const quantities = item.quantities || [];
      const row = {
        '#': index + 1,
        'Brand Name': item.brandName || '',
        'Item Code': item.itemCode || '',
        'Item Description': item.itemDescription || '',
        'UOM': item.uom || '',
      };
      
      // Add quantity/expiry columns
      for (let i = 0; i < 3; i++) {
        const qty = quantities[i];
        row[`Qty ${i + 1}`] = qty?.quantity || '';
        row[`Exp ${i + 1}`] = qty?.expiry ? formatDate(qty.expiry) : '';
      }
      
      return row;
    });
    
    // Add empty rows and signature rows at the bottom
    const emptyRow = { '#': '' };
    
    let signatureRows;
    if (isEdited) {
      // Arabic declaration and signatures
      const declarationRow = {
        '#': 'اني الموقع ادناه (..................................................)  اقر بان البضائع الدرجة تفاصيلها في قوائم هذا الجرد استلمتها من شركة الميسرللتجارة العامة المحدودة المسؤولية واتعهد بتسديد قيمتها الى قسم الحسابات وحسب سعر البيع المعتمد في الشركة',
      };
      const signatureHeaderRow = {
        '#': 'اسم وتوقيع القائم بالجرد',
        'Brand Name': '',
        'Item Code': '',
        'Item Description': '',
        'UOM': '',
        'Qty 1': '',
        'Exp 1': 'اسم وتوقيع صاحب الاقرار',
      };
      const signatureLineRow = {
        '#': '_______________',
        'Brand Name': '',
        'Item Code': '',
        'Item Description': '',
        'UOM': '',
        'Qty 1': '',
        'Exp 1': '_______________',
      };
      signatureRows = [declarationRow, emptyRow, signatureHeaderRow, signatureLineRow];
    } else {
      // English signatures
      const signatureHeaderRow = {
        '#': '',
        'Brand Name': 'Warehouse Team',
        'Item Code': '',
        'Item Description': 'Sales Team',
        'UOM': '',
        'Qty 1': '',
        'Exp 1': 'Control Team',
      };
      const signatureLineRow = {
        '#': '',
        'Brand Name': 'Signature: _______________',
        'Item Code': '',
        'Item Description': 'Signature: _______________',
        'UOM': '',
        'Qty 1': '',
        'Exp 1': 'Signature: _______________',
      };
      signatureRows = [signatureHeaderRow, signatureLineRow];
    }
    
    // Combine all rows
    const allData = [
      titleRow,
      emptyRow,
      ...data,
      emptyRow,
      emptyRow,
      ...signatureRows,
    ];
    
    // Create workbook
    const ws = XLSX.utils.json_to_sheet(allData, { skipHeader: true });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Inventory');
    
    // Set column widths
    ws['!cols'] = [
      { wch: 4 },   // #
      { wch: 15 },  // Brand Name
      { wch: 12 },  // Item Code
      { wch: 35 },  // Item Description
      { wch: 8 },   // UOM
      { wch: 8 },   // Qty 1
      { wch: 14 },  // Exp 1
      { wch: 8 },   // Qty 2
      { wch: 14 },  // Exp 2
      { wch: 8 },   // Qty 3
      { wch: 14 },  // Exp 3
    ];
    
    // Generate Excel file
    const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
    
    // Save to file
    const date = new Date();
    const timestamp = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}_${String(date.getHours()).padStart(2, '0')}${String(date.getMinutes()).padStart(2, '0')}`;
    const newFilename = `${filename}_${timestamp}.xlsx`;
    
    const fileUri = FileSystem.documentDirectory + newFilename;
    await FileSystem.writeAsStringAsync(fileUri, wbout, {
      encoding: FileSystem.EncodingType.Base64,
    });
    
    return fileUri;
  } catch (error) {
    console.error('Error exporting to XLSX:', error);
    throw new Error('Failed to create Excel file');
  }
};

/**
 * Share file (PDF or XLSX)
 */
export const shareFile = async (fileUri, mimeType = 'application/pdf') => {
  try {
    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(fileUri, {
        mimeType,
        dialogTitle: 'Export Inventory Report',
      });
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error sharing file:', error);
    throw error;
  }
};
