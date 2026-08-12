export interface ReturnMessage {
  id?: string;
  sender: 'customer' | 'admin';
  senderName: string;
  text: string;
  timestamp: string;
}

export function parseReturnNotes(notesVal: any, defaultCustomerName = 'Cliente'): ReturnMessage[] {
  if (!notesVal) return [];
  if (Array.isArray(notesVal)) return notesVal;
  if (typeof notesVal === 'string') {
    try {
      const parsed = JSON.parse(notesVal);
      if (Array.isArray(parsed)) return parsed;
    } catch {}
    if (notesVal.trim()) {
      return [
        {
          sender: 'customer',
          senderName: defaultCustomerName,
          text: notesVal.trim(),
          timestamp: new Date().toISOString()
        }
      ];
    }
  }
  return [];
}

export function formatMessageTime(ts?: string): string {
  if (!ts) return "";
  try {
    const d = new Date(ts);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleString("es-CO", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    });
  } catch {
    return "";
  }
}
