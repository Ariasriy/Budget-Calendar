/**
 * Indonesian Formatters for Currency and Dates
 */

export const INDONESIAN_MONTHS = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

export const INDONESIAN_DAYS_SHORT = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
export const INDONESIAN_DAYS_FULL = [
  'Minggu',
  'Senin',
  'Selasa',
  'Rabu',
  'Kamis',
  'Jumat',
  'Sabtu',
];

/**
 * Formats a number to Indonesian Rupiah standard format (e.g. Rp 1.500.000)
 */
export function formatRupiah(amount: number | null | undefined, withSymbol: boolean = true): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return withSymbol ? 'Rp 0' : '0';
  }
  
  const rounded = Math.round(amount);
  const formatted = new Intl.NumberFormat('id-ID', {
    maximumFractionDigits: 0,
  }).format(Math.abs(rounded));

  const prefix = rounded < 0 ? '- ' : '';
  const symbol = withSymbol ? 'Rp ' : '';
  return `${prefix}${symbol}${formatted}`;
}

/**
 * Formats compact Rupiah for mobile KPI tags (e.g. Rp 1,5 Jt, Rp 250 Rb)
 */
export function formatRupiahCompact(amount: number): string {
  if (amount === null || amount === undefined || isNaN(amount)) return 'Rp 0';
  const abs = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';

  if (abs >= 1_000_000_000) {
    return `${sign}Rp ${(abs / 1_000_000_000).toFixed(1).replace('.', ',')} M`;
  }
  if (abs >= 1_000_000) {
    return `${sign}Rp ${(abs / 1_000_000).toFixed(1).replace('.', ',')} Jt`;
  }
  if (abs >= 1_000) {
    return `${sign}Rp ${(abs / 1_000).toFixed(0)} Rb`;
  }
  return formatRupiah(amount, true);
}

/**
 * Parse Indonesian Rupiah or string to clean number
 */
export function parseRupiahInput(value: string | number): number {
  if (typeof value === 'number') return isNaN(value) ? 0 : Math.max(0, value);
  if (!value) return 0;
  // Strip non-digit characters
  const clean = value.replace(/[^0-9]/g, '');
  const parsed = parseInt(clean, 10);
  return isNaN(parsed) ? 0 : Math.max(0, parsed);
}

/**
 * Format date YYYY-MM-DD into Indonesian full format: "6 Oktober 2026"
 */
export function formatDateIndo(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);
  if (month < 1 || month > 12) return dateStr;
  return `${day} ${INDONESIAN_MONTHS[month - 1]} ${year}`;
}

/**
 * Format date into "Selasa, 6 Okt 2026"
 */
export function formatDateWithDay(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  if (isNaN(d.getTime())) return dateStr;
  const dayName = INDONESIAN_DAYS_FULL[d.getDay()];
  const parts = dateStr.split('-');
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);
  const year = parts[0];
  const monthShort = INDONESIAN_MONTHS[month - 1]?.slice(0, 3) || '';
  return `${dayName}, ${day} ${monthShort} ${year}`;
}

/**
 * Format percentage: 0.85 -> "85%"
 */
export function formatPercentage(val: number): string {
  if (val === null || val === undefined || isNaN(val) || !isFinite(val)) return '0%';
  return `${(val * 100).toFixed(1).replace('.', ',')}%`;
}
