import type { SuzukiPart, CartItem, ActiveMotorcycle } from '../types';
import { formatCurrency } from './formatCurrency';

export const SUZUKI_WHATSAPP_NUMBER = '573009128888';

/**
 * Builds a direct WhatsApp link for general expert inquiry
 */
export function getGeneralWhatsAppUrl(activeMotorcycle?: ActiveMotorcycle | null): string {
  let message = `Hola Suzuki Parts Expert 👋, necesito asesoría técnica sobre repuestos genuinos Suzuki.`;
  
  if (activeMotorcycle) {
    message += `\n\n🏍️ *Mi Motocicleta Activa:* ${activeMotorcycle.brand} ${activeMotorcycle.modelName} (${activeMotorcycle.year})`;
    if (activeMotorcycle.vin) {
      message += `\n🔑 *VIN / Chasis:* ${activeMotorcycle.vin}`;
    }
  } else {
    message += `\n\n(Aún no he seleccionado mi modelo de motocicleta en el sistema)`;
  }
  
  message += `\n\n¿Me pueden colaborar con disponibilidad e información de repuestos?`;

  return `https://wa.me/${SUZUKI_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

/**
 * Builds a WhatsApp URL for inquiring about a specific product
 */
export function getProductWhatsAppUrl(part: SuzukiPart, activeMotorcycle?: ActiveMotorcycle | null): string {
  let message = `Hola Suzuki Parts Expert 👋, quiero consultar disponibilidad y precio para este repuesto genuino:\n\n`;
  message += `📦 *Producto:* ${part.name}\n`;
  message += `🏷️ *Ref. OEM:* ${part.oemNumber}\n`;
  message += `📁 *Categoría:* ${part.category}\n`;
  message += `💰 *Precio:* ${formatCurrency(part.price)}\n`;
  message += `⚡ *Estado:* ${part.stock > 0 ? `En Stock (${part.stock} disp.)` : 'Bajo Pedido Especial'}\n`;

  if (activeMotorcycle) {
    message += `\n🏍️ *Mi Motocicleta:* ${activeMotorcycle.brand} ${activeMotorcycle.modelName} (${activeMotorcycle.year})`;
  }

  message += `\n\n¿Tienen disponibilidad e información de despacho nacional?`;

  return `https://wa.me/${SUZUKI_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

/**
 * Builds a WhatsApp URL for consulting or placing an order for all items in the cart
 */
export function getCartWhatsAppUrl(cartItems: CartItem[], activeMotorcycle?: ActiveMotorcycle | null): string {
  const total = cartItems.reduce((acc, item) => acc + (item.part.price * item.quantity), 0);

  let message = `Hola Suzuki Parts Expert 👋, me gustaría cotizar / realizar el pedido de los siguientes repuestos de mi carrito:\n\n`;

  cartItems.forEach((item, index) => {
    const subtotal = item.part.price * item.quantity;
    const motoInfo = item.motorcycle ? ` [Vehículo: ${item.motorcycle.modelName} (${item.motorcycle.year})]` : '';
    message += `${index + 1}. *${item.part.name}*${motoInfo}\n`;
    message += `   • Ref. OEM: ${item.part.oemNumber}\n`;
    message += `   • Cantidad: ${item.quantity}\n`;
    message += `   • Subtotal: ${formatCurrency(subtotal)}\n\n`;
  });

  message += `-----------------------------------\n`;
  message += `💵 *TOTAL ESTIMADO:* ${formatCurrency(total)}\n`;

  if (activeMotorcycle) {
    message += `\n🏍️ *Motocicleta Confirmada:* ${activeMotorcycle.brand} ${activeMotorcycle.modelName} (${activeMotorcycle.year})`;
    if (activeMotorcycle.vin) {
      message += `\n🔑 *VIN / Chasis:* ${activeMotorcycle.vin}`;
    }
  }

  message += `\n\nPor favor confirmen inventario, costo de envío y opciones de pago. ¡Gracias!`;

  return `https://wa.me/${SUZUKI_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
