/**
 * Formats a numeric value into Colombian Pesos (COP).
 * Example: 154000 -> "$ 154.000 COP"
 */
export function formatCurrency(amount: number): string {
  const formattedNumber = Math.round(amount).toLocaleString('es-CO');
  return `$ ${formattedNumber} COP`;
}

/**
 * Formats a numeric value with es-CO thousands separators (dot).
 * Example: 200000 -> "200.000"
 */
export function formatThousands(n: number): string {
  return Math.round(n).toLocaleString('es-CO');
}
