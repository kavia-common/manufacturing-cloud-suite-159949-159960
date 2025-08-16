import { downloadFile } from './client';

// PUBLIC_INTERFACE
export async function downloadReport(
  reportKey: 'inventory' | 'purchase-orders' | 'suppliers' | 'work-orders' | 'quality' | string,
  format: 'csv' | 'xlsx' | 'pdf',
  filename: string,
): Promise<void> {
  /**
   * Download a report for the given key and format using common backend paths.
   * Falls back to a lightweight, client-generated CSV when backend paths are unavailable.
   */
  const candidates = [
    `/api/v1/reports/${encodeURIComponent(reportKey)}/export?format=${encodeURIComponent(format)}`,
    `/api/v1/reports/export/${encodeURIComponent(reportKey)}?format=${encodeURIComponent(format)}`,
    `/api/v1/${encodeURIComponent(reportKey)}/export?format=${encodeURIComponent(format)}`,
  ];

  for (const path of candidates) {
    try {
      await downloadFile(path, filename, 'GET');
      return;
    } catch {
      // try next
    }
  }

  // Fallback: provide a tiny CSV with timestamp
  if (format === 'csv') {
    const rows = [
      ['report', 'format', 'generated_at'],
      [reportKey, 'csv (fallback)', new Date().toISOString()],
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `${reportKey}.csv`;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    globalThis.setTimeout(() => {
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
    }, 100);
    return;
  }

  throw new Error('Report export not available');
}
