import { PACKAGES, ADDONS, COUPONS, RUSH_MULTIPLIER } from './constants';

export function formatCurrency(amount: number): string {
  return `$${amount}`;
}

export interface PriceBreakdown {
  pkgPrice: number;
  addonTotal: number;
  rushFee: number;
  hasRush: boolean;
  subtotal: number;
  beforeDiscount: number;
  discount: number;
  total: number;
  rate: number;
}

export function calculatePrice(
  packageId: string,
  addonIds: string[],
  couponCode: string | null
): PriceBreakdown | null {
  const pkg = PACKAGES.find((p) => p.id === packageId);
  if (!pkg) return null;

  const pkgPrice = pkg.nowPrice;
  let addonTotal = 0;
  let hasRush = false;

  addonIds.forEach((id) => {
    if (id === 'rush') {
      hasRush = true;
    } else {
      const addon = ADDONS.find((a) => a.id === id);
      if (addon && addon.price > 0) addonTotal += addon.price;
    }
  });

  const subtotal = pkgPrice + addonTotal;
  const rushFee = hasRush ? Math.round(subtotal * RUSH_MULTIPLIER) : 0;
  const beforeDiscount = subtotal + rushFee;

  const coupon = couponCode ? COUPONS[couponCode.toUpperCase()] : null;
  const rate = coupon ? coupon.discount : 0;
  const discount = Math.round(beforeDiscount * rate);
  const total = beforeDiscount - discount;

  return { pkgPrice, addonTotal, rushFee, hasRush, subtotal, beforeDiscount, discount, total, rate };
}

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function generateOrderId(): string {
  return '#' + Math.floor(Math.random() * 9000 + 1000);
}

export function lookupCoupon(code: string): { valid: boolean; discount: number; label: string } {
  const coupon = COUPONS[code.toUpperCase().trim()];
  if (coupon) return { valid: true, discount: coupon.discount, label: coupon.label };
  return { valid: false, discount: 0, label: '' };
}
