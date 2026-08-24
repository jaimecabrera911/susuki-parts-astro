import type { SuzukiPart, CartItem, ActiveMotorcycle, PartVariant } from '../types';
import { getPrimaryOem, formatVariantAttributes } from '../types';
import { formatCurrency } from './formatCurrency';
import { getWhatsAppNumber, getStoreName } from './config';

const storeGreeting = (): string => {
  const name = getStoreName().trim();
  return name ? `Hola ${name} 👋, ` : 'Hola 👋, ';
};

/**
 * Builds a direct WhatsApp link for general expert inquiry
 */
export function getGeneralWhatsAppUrl(activeMotorcycle?: ActiveMotorcycle | null): string {
  let message = `${storeGreeting()}necesito asesoría técnica sobre repuestos genuinos Suzuki.`;
  
  if (activeMotorcycle) {
    message += `\n\n🏍️ *Mi Motocicleta Activa:* ${activeMotorcycle.brand} ${activeMotorcycle.modelName} (${activeMotorcycle.year})`;
    if (activeMotorcycle.vin) {
      message += `\n🔑 *VIN / Chasis:* ${activeMotorcycle.vin}`;
    }
  } else {
    message += `\n\n(Aún no he seleccionado mi modelo de motocicleta en el sistema)`;
  }
  
  message += `\n\n¿Me pueden colaborar con disponibilidad e información de repuestos?`;

  return `https://wa.me/${getWhatsAppNumber()}?text=${encodeURIComponent(message)}`;
}

/**
 * Builds a WhatsApp URL for inquiring about a specific product
 */
export function getProductWhatsAppUrl(
  part: SuzukiPart,
  activeMotorcycle?: ActiveMotorcycle | null,
  selectedVariant?: PartVariant | null
): string {
  const price = selectedVariant?.price != null ? selectedVariant.price : part.price;
  const stock = selectedVariant ? selectedVariant.stock : part.stock;
  const oem = selectedVariant?.sku || getPrimaryOem(part);

  let message = `${storeGreeting()}quiero consultar disponibilidad y precio para este repuesto genuino:\n\n`;
  message += `📦 *Producto:* ${part.name}\n`;
  if (selectedVariant) {
    message += `🔹 *Opción:* ${formatVariantAttributes(selectedVariant)}\n`;
  }
  message += `🏷️ *Ref. OEM:* ${oem}\n`;
  message += `📁 *Categoría:* ${part.category}\n`;
  message += `💰 *Precio:* ${formatCurrency(price)}\n`;
  message += `⚡ *Estado:* ${stock > 0 ? `En Stock (${stock} disp.)` : 'Bajo Pedido Especial'}\n`;

  if (activeMotorcycle) {
    message += `\n🏍️ *Mi Motocicleta:* ${activeMotorcycle.brand} ${activeMotorcycle.modelName} (${activeMotorcycle.year})`;
  }

  message += `\n\n¿Tienen disponibilidad e información de despacho nacional?`;

  return `https://wa.me/${getWhatsAppNumber()}?text=${encodeURIComponent(message)}`;
}

/**
 * Builds a WhatsApp URL for consulting or placing an order for all items in the cart
 */
export function getCartWhatsAppUrl(cartItems: CartItem[], activeMotorcycle?: ActiveMotorcycle | null): string {
  const total = cartItems.reduce((acc, item) => {
    const itemPrice = item.selectedVariant?.price != null ? item.selectedVariant.price : item.part.price;
    return acc + (itemPrice * item.quantity);
  }, 0);

  let message = `${storeGreeting()}me gustaría cotizar / realizar el pedido de los siguientes repuestos de mi carrito:\n\n`;

  cartItems.forEach((item, index) => {
    const itemPrice = item.selectedVariant?.price != null ? item.selectedVariant.price : item.part.price;
    const subtotal = itemPrice * item.quantity;
    const motoInfo = item.motorcycle ? ` [Vehículo: ${item.motorcycle.modelName} (${item.motorcycle.year})]` : '';
    const variantInfo = item.selectedVariant
      ? ` • Opción: ${formatVariantAttributes(item.selectedVariant)}\n`
      : '';
    const oemRef = item.selectedVariant?.sku || getPrimaryOem(item.part);

    message += `${index + 1}. *${item.part.name}*${motoInfo}\n`;
    if (variantInfo) {
      message += `   ${variantInfo}`;
    }
    message += `   • Ref. OEM: ${oemRef}\n`;
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

  return `https://wa.me/${getWhatsAppNumber()}?text=${encodeURIComponent(message)}`;
}
