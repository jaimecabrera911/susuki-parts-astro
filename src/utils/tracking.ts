/**
 * Utility to get or generate the carrier tracking URL.
 */
export function getCarrierTrackingUrl(order: {
  shippingCarrier?: string;
  trackingNumber?: string;
  trackingUrl?: string;
}): string {
  if (order.trackingUrl && order.trackingUrl.trim()) {
    return order.trackingUrl.trim();
  }

  const carrier = (order.shippingCarrier || "").toLowerCase();
  const num = (order.trackingNumber || "").trim();
  if (!num) return "";

  // If trackingNumber itself was pasted as a full URL
  if (num.startsWith("http://") || num.startsWith("https://")) {
    return num;
  }

  if (carrier.includes("servientrega")) {
    return `https://www.servientrega.com/wps/portal/rastreo-de-envios?guia=${num}`;
  }
  if (
    carrier.includes("inter") ||
    carrier.includes("rapidisimo") ||
    carrier.includes("rapidísimo")
  ) {
    return `https://www.interrapidisimo.com/sigue-tu-envio/?guia=${num}`;
  }
  if (carrier.includes("coordinadora")) {
    return `https://coordinadora.com/rastreo/rastrear-guias/?guia=${num}`;
  }
  if (carrier.includes("envía") || carrier.includes("envia")) {
    return `https://envia.co/seguimiento?guia=${num}`;
  }
  if (carrier.includes("tcc")) {
    return `https://tcc.com.co/rastreo/?guia=${num}`;
  }
  if (carrier.includes("dhl")) {
    return `https://www.dhl.com/co-es/home/rastreo.html?tracking-id=${num}`;
  }
  if (carrier.includes("fedex")) {
    return `https://www.fedex.com/fedextrack/?trknbr=${num}`;
  }
  if (carrier.includes("deprisa")) {
    return `https://www.deprisa.com/rastreo?guia=${num}`;
  }
  if (carrier.includes("encoexpress")) {
    return `https://encoexpress.co/rastreo/${num}`;
  }

  return "";
}
