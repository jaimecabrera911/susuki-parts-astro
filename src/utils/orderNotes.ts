import type { OrderMessage } from '../types';

export function parseOrderNotes(notesVal: any, defaultCustomerName = 'Cliente'): OrderMessage[] {
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
          id: 'msg-legacy',
          sender: 'customer',
          senderName: defaultCustomerName,
          text: notesVal.trim(),
          isPrivate: false,
          timestamp: new Date().toISOString()
        }
      ];
    }
  }
  return [];
}

export function formatOrderNotes(messages: OrderMessage[]): string {
  return JSON.stringify(messages);
}

export function formatOrderMessageTime(ts?: string): string {
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
