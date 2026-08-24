import type { SuzukiPart, CartItem, Coupon, PartVariant } from '../types';

export interface ItemFinancials {
  unitPrice: number;
  quantity: number;
  /** Base price for the line (excluding tax) */
  lineBase: number;
  /** Tax amount for the line */
  lineTax: number;
  /** Total price for the line (including tax) */
  lineTotal: number;
  /** Whether tax was calculated for this item */
  isTaxable: boolean;
  /** Whether the unit price already included tax */
  priceIncludesTax: boolean;
}

export interface CartTotals {
  /** Sum of base prices before tax and discounts */
  subtotal: number;
  /** Total discount amount applied from coupon */
  discount: number;
  /** Discount code applied */
  discountCode?: string;
  /** Effective tax rate applied (%) */
  taxRate: number;
  /** Total tax amount calculated across all items */
  taxAmount: number;
  /** Shipping fee */
  shippingCost: number;
  /** Final grand total to be paid by customer */
  totalPrice: number;
}

/**
 * Calculates financials for a single item line.
 * Handles the 3 cases:
 * 1. Non-taxable or Tax inactive: Base = P * Q, Tax = 0, Total = P * Q.
 * 2. Taxable & Price includes tax: Total = P * Q, Base = Math.round((P * Q) / (1 + rate/100)), Tax = Total - Base.
 * 3. Taxable & Price excludes tax: Base = P * Q, Tax = Math.round(Base * rate / 100), Total = Base + Tax.
 */
export function calculateItemFinancials(
  part: SuzukiPart,
  quantity: number,
  taxRate: number = 19,
  taxActive: boolean = true,
  selectedVariant?: PartVariant | null
): ItemFinancials {
  const unitPrice = selectedVariant?.price != null ? selectedVariant.price : part.price;
  const isTaxable = taxActive && (part.taxable !== false);
  const priceIncludesTax = part.priceIncludesTax === true;

  if (!isTaxable) {
    const total = unitPrice * quantity;
    return {
      unitPrice,
      quantity,
      lineBase: total,
      lineTax: 0,
      lineTotal: total,
      isTaxable: false,
      priceIncludesTax: false,
    };
  }

  if (priceIncludesTax) {
    const lineTotal = unitPrice * quantity;
    const rateFactor = 1 + taxRate / 100;
    const lineBase = Math.round(lineTotal / rateFactor);
    const lineTax = lineTotal - lineBase;
    return {
      unitPrice,
      quantity,
      lineBase,
      lineTax,
      lineTotal,
      isTaxable: true,
      priceIncludesTax: true,
    };
  } else {
    const lineBase = unitPrice * quantity;
    const lineTax = Math.round((lineBase * taxRate) / 100);
    const lineTotal = lineBase + lineTax;
    return {
      unitPrice,
      quantity,
      lineBase,
      lineTax,
      lineTotal,
      isTaxable: true,
      priceIncludesTax: false,
    };
  }
}

/**
 * Calculates comprehensive cart totals for an array of CartItems.
 */
export function calculateCartTotals(
  cartItems: CartItem[],
  taxRate: number = 19,
  taxActive: boolean = true,
  appliedCoupon: Coupon | null = null,
  shippingCost: number = 0
): CartTotals {
  let grossBaseSum = 0;
  let grossTaxSum = 0;
  let grossTotalSum = 0;

  for (const item of cartItems) {
    const fin = calculateItemFinancials(item.part, item.quantity, taxRate, taxActive, item.selectedVariant);
    grossBaseSum += fin.lineBase;
    grossTaxSum += fin.lineTax;
    grossTotalSum += fin.lineTotal;
  }

  // Calculate Coupon Discount against gross items total
  let discountAmount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.type === 'percentage') {
      discountAmount = Math.round((grossTotalSum * appliedCoupon.value) / 100);
    } else {
      discountAmount = Math.min(grossTotalSum, appliedCoupon.value);
    }
  }

  const finalItemsTotal = Math.max(0, grossTotalSum - discountAmount);
  const grandTotal = finalItemsTotal + shippingCost;

  return {
    subtotal: grossBaseSum,
    discount: discountAmount,
    discountCode: appliedCoupon ? appliedCoupon.code : undefined,
    taxRate: taxActive ? taxRate : 0,
    taxAmount: grossTaxSum,
    shippingCost,
    totalPrice: grandTotal,
  };
}
