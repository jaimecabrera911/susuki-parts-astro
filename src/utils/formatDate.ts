/**
 * Resolves the default store timezone.
 * Priority: PUBLIC_DEFAULT_TIMEZONE or DEFAULT_TIMEZONE env variable -> 'America/Bogota' (default).
 */
export const getTimezone = (): string => {
  const envTz =
    (typeof import.meta !== 'undefined' && ((import.meta as any).env?.PUBLIC_DEFAULT_TIMEZONE || (import.meta as any).env?.DEFAULT_TIMEZONE)) ||
    (typeof process !== 'undefined' && (process.env?.PUBLIC_DEFAULT_TIMEZONE || process.env?.DEFAULT_TIMEZONE));
  return envTz && typeof envTz === 'string' && envTz.trim() ? envTz.trim() : 'America/Bogota';
};

/**
 * Normalizes and formats order date strings into a uniform, readable format with hour and timezone.
 * Example output: "23 Ago 2026, 04:15 PM" (in America/Bogota timezone)
 */
export function formatOrderDate(rawDateStr: string | number | Date | null | undefined): string {
  if (!rawDateStr) return 'Sin fecha';

  let dateObj: Date;

  if (rawDateStr instanceof Date) {
    dateObj = rawDateStr;
  } else if (typeof rawDateStr === 'number') {
    dateObj = new Date(rawDateStr);
  } else {
    let str = String(rawDateStr).trim();
    if (!str) return 'Sin fecha';

    // Normalize Spanish month names if present (e.g., "05 de Agosto, 2026 14:30")
    const spanishMonths: Record<string, string> = {
      'enero': '01', 'febrero': '02', 'marzo': '03', 'abril': '04',
      'mayo': '05', 'junio': '06', 'julio': '07', 'agosto': '08',
      'septiembre': '09', 'octubre': '10', 'noviembre': '11', 'diciembre': '12'
    };

    for (const [monthName, monthNum] of Object.entries(spanishMonths)) {
      if (str.toLowerCase().includes(monthName)) {
        const match = str.match(/(\d{1,2})\s+de\s+\w+,\s+(\d{4})\s+(\d{1,2}:\d{2})/i);
        if (match) {
          const day = match[1].padStart(2, '0');
          const year = match[2];
          const time = match[3];
          str = `${year}-${monthNum}-${day}T${time}:00`;
          break;
        }
      }
    }

    // Handle "9/08/26, 3:39 p. m." or "09/08/2026, 15:39"
    if (str.includes('/')) {
      const parts = str.split(',');
      const datePart = parts[0].trim();
      const timePart = parts[1] ? parts[1].trim() : '';

      const dParts = datePart.split('/');
      if (dParts.length === 3) {
        let day = dParts[0].padStart(2, '0');
        let month = dParts[1].padStart(2, '0');
        let year = dParts[2];
        if (year.length === 2) year = `20${year}`;
        str = `${year}-${month}-${day} ${timePart}`.trim();
      }
    }

    // Clean "p. m." / "a. m."
    str = str.replace(/p\.\s*m\./gi, 'PM').replace(/a\.\s*m\./gi, 'AM');

    // If string is YYYY-MM-DD HH:mm:ss without timezone, treat as UTC
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(str)) {
      str = str.replace(' ', 'T') + 'Z';
    }

    dateObj = new Date(str);
  }

  if (isNaN(dateObj.getTime())) {
    return String(rawDateStr);
  }

  const timeZone = getTimezone();

  try {
    const formatter = new Intl.DateTimeFormat('es-CO', {
      timeZone,
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    const parts = formatter.formatToParts(dateObj);
    let day = '', month = '', year = '', hour = '', minute = '', dayPeriod = '';
    for (const p of parts) {
      if (p.type === 'day') day = p.value;
      if (p.type === 'month') month = p.value.replace('.', '');
      if (p.type === 'year') year = p.value;
      if (p.type === 'hour') hour = p.value;
      if (p.type === 'minute') minute = p.value;
      if (p.type === 'dayPeriod') dayPeriod = p.value.toUpperCase().replace(/\./g, '').replace(/\s+/g, '');
    }

    if (month) {
      month = month.charAt(0).toUpperCase() + month.slice(1);
    }
    if (!dayPeriod) {
      dayPeriod = dateObj.getHours() >= 12 ? 'PM' : 'AM';
    }

    return `${day} ${month} ${year}, ${hour}:${minute} ${dayPeriod}`;
  } catch {
    return dateObj.toLocaleString('es-CO', { timeZone });
  }
}
