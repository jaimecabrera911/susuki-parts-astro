/**
 * Normalizes and formats order date strings into a uniform, readable format.
 * Example output: "09 Ago 2026, 03:39 PM"
 */
export function formatOrderDate(rawDateStr: string | null | undefined): string {
  if (!rawDateStr) return 'Sin fecha';

  let str = String(rawDateStr).trim();

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

  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    const day = String(parsed.getDate()).padStart(2, '0');
    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const month = monthNames[parsed.getMonth()];
    const year = parsed.getFullYear();
    
    let hours = parsed.getHours();
    const minutes = String(parsed.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    const formattedHours = String(hours).padStart(2, '0');

    return `${day} ${month} ${year}, ${formattedHours}:${minutes} ${ampm}`;
  }

  return String(rawDateStr);
}
