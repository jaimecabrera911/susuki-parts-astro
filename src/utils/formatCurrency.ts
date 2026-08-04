/**
 * Formats a numeric value into Colombian Pesos (COP).
 * Example: 154000 -> "$ 154.000 COP"
 */
export function formatCurrency(amount: number): string {
  const formattedNumber = Math.round(amount).toLocaleString('es-CO');
  return `$ ${formattedNumber} COP`;
}
