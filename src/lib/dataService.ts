import { Capacitor } from '@capacitor/core';

async function shareFileNative(data: string, fileName: string) {
  const { Filesystem, Directory } = await import('@capacitor/filesystem');
  const { Share } = await import('@capacitor/share');
  const result = await Filesystem.writeFile({
    path: fileName,
    data,
    directory: Directory.Cache,
  });
  await Share.share({
    title: 'Kredy - Veri Yedeği',
    text: `${fileName} (JSON formatı)`,
    url: result.uri,
    dialogTitle: 'Yedeği kaydet veya paylaş',
  });
}

const ALL_STORAGE_KEYS = [
  'kredi-pusula-cards',
  'kredi-pusula-loans',
  'kredi-pusula-loan-payments',
  'kredi-pusula-purchases',
  'kredi-pusula-properties',
  'kredi-pusula-vehicles',
  'kredi-pusula-businesses',
  'kredi-pusula-user-profile',
  'kredi-pusula-notification-settings',
  'kredi-pusula-onboarding-completed',
  'kredi-pusula-trial-end',
  'kredi-pusula-trial-started',
  'kredi-pusula-pin-hash',
  // Family finance keys
  'kredi-pusula-accounts',
  'kredi-pusula-family-transactions',
  'kredi-pusula-subscriptions',
  'kredi-pusula-recurring-expenses',
  'kredi-pusula-budgets',
  'kredi-pusula-goals',
  'kredi-pusula-shared-wallets',
  'kredi-pusula-networth-history',
  'kredi-pusula-privacy-mode',
  'kredi-pusula-currency-rates',
  'kredi-pusula-category-limits',
  // Investment keys
  'kredi-pusula-investments',
  'kredi-pusula-investment-prices',
  // Transaction history
  'kredi-pusula-transaction-history',
] as const;

interface BackupData {
  version: string;
  exportDate: string;
  data: Record<string, string | null>;
}

export function getExportFileName(): string {
  const date = new Date().toISOString().split('T')[0];
  return `FinansAtlasPro-Yedek-${date}.json`;
}

export async function exportAllData(): Promise<{ fileName: string; format: string }> {
  const data: Record<string, string | null> = {};

  ALL_STORAGE_KEYS.forEach((key) => {
    const value = localStorage.getItem(key);
    if (value !== null) {
      data[key] = value;
    }
  });

  const backup: BackupData = {
    version: '1.0.0',
    exportDate: new Date().toISOString(),
    data,
  };

  const fileName = getExportFileName();
  const jsonStr = JSON.stringify(backup, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });

  // On native: use Share API to let user choose destination
  if (Capacitor.isNativePlatform()) {
    try {
      await shareFileNative(jsonStr, fileName);
    } catch {
      // Fallback to download
      downloadBlob(blob, fileName);
    }
  } else {
    downloadBlob(blob, fileName);
  }

  return { fileName, format: 'JSON' };
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function importData(file: File): Promise<{ success: boolean; message: string }> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const backup = JSON.parse(content) as BackupData;

        if (!backup.data || typeof backup.data !== 'object') {
          resolve({ success: false, message: 'Geçersiz yedek dosyası.' });
          return;
        }

        Object.entries(backup.data).forEach(([key, value]) => {
          if (value !== null) {
            localStorage.setItem(key, value);
          }
        });

        resolve({ success: true, message: 'Veriler başarıyla geri yüklendi.' });
      } catch {
        resolve({ success: false, message: 'Dosya okunamadı.' });
      }
    };
    reader.onerror = () => {
      resolve({ success: false, message: 'Dosya okunamadı.' });
    };
    reader.readAsText(file);
  });
}

export function clearAllData(): void {
  ALL_STORAGE_KEYS.forEach((key) => {
    localStorage.removeItem(key);
  });
}

// CSV Export
interface CSVRow {
  [key: string]: string | number | boolean | undefined;
}

export function exportToCSV(rows: CSVRow[], filename: string): void {
  if (rows.length === 0) return;

  const headers = Object.keys(rows[0]);
  const csvLines = [
    headers.join(','),
    ...rows.map((row) =>
      headers.map((h) => {
        const val = row[h];
        if (val === undefined || val === null) return '';
        const str = String(val);
        // Escape commas and quotes
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      }).join(',')
    ),
  ];

  const bom = '\uFEFF'; // UTF-8 BOM for Turkish chars in Excel
  const blob = new Blob([bom + csvLines.join('\n')], { type: 'text/csv;charset=utf-8' });
  downloadBlob(blob, `${filename}-${new Date().toISOString().split('T')[0]}.csv`);
}

// PDF Export (simple HTML table approach)
export function exportToPDF(title: string, headers: string[], rows: string[][]): void {
  const tableRows = rows.map(
    (row) => `<tr>${row.map((cell) => `<td style="padding:6px 10px;border:1px solid #ddd;">${cell}</td>`).join('')}</tr>`
  ).join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${title}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        h1 { font-size: 18px; margin-bottom: 4px; }
        p { color: #666; font-size: 12px; margin-bottom: 16px; }
        table { border-collapse: collapse; width: 100%; font-size: 12px; }
        th { background: #f5f5f5; padding: 8px 10px; border: 1px solid #ddd; text-align: left; font-weight: 600; }
        td { padding: 6px 10px; border: 1px solid #ddd; }
        @media print { body { padding: 0; } }
      </style>
    </head>
    <body>
      <h1>${title}</h1>
      <p>Oluşturulma: ${new Date().toLocaleDateString('tr-TR')} - Kredy</p>
      <table>
        <thead>
          <tr>${headers.map((h) => `<th>${h}</th>`).join('')}</tr>
        </thead>
        <tbody>${tableRows}</tbody>
      </table>
    </body>
    </html>
  `;

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 500);
  }
}

export function getStorageUsage(): { used: number; formatted: string } {
  let total = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      const value = localStorage.getItem(key);
      if (value) {
        total += key.length + value.length;
      }
    }
  }
  const bytes = total * 2; // UTF-16
  if (bytes < 1024) return { used: bytes, formatted: `${bytes} B` };
  if (bytes < 1024 * 1024) return { used: bytes, formatted: `${(bytes / 1024).toFixed(1)} KB` };
  return { used: bytes, formatted: `${(bytes / (1024 * 1024)).toFixed(1)} MB` };
}
