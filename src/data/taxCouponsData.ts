import type { TaxConfig, Coupon } from '../types';

export const DEFAULT_TAX_CONFIG: TaxConfig = {
  taxName: 'IVA Colombia',
  taxRate: 19,
  active: true,
};

export const INITIAL_COUPONS: Coupon[] = [
  {
    id: 'coup-01',
    code: 'SUZUKI10',
    type: 'percentage',
    value: 10,
    minPurchase: 50000,
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'coup-02',
    code: 'BIENVENIDA',
    type: 'fixed',
    value: 20000,
    minPurchase: 100000,
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'coup-03',
    code: 'TALLER2026',
    type: 'percentage',
    value: 15,
    minPurchase: 200000,
    active: true,
    createdAt: new Date().toISOString(),
  },
];
