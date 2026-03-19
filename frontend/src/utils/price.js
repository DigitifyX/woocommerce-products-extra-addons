/**
 * Price formatting utility using WooCommerce settings.
 */

const cfg = window.gvcFrontend || {};

export function formatPrice(amount) {
  const decimals = cfg.decimals ?? 2;
  const decSep = cfg.decimalSep || ',';
  const thousandSep = cfg.thousandSep || '.';
  const symbol = cfg.currencySymbol || '€';
  const pos = cfg.currencyPos || 'left';

  const fixed = parseFloat(amount).toFixed(decimals);
  const [intPart, decPart] = fixed.split('.');
  const intFormatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, thousandSep);
  const formatted = decimals > 0 ? `${intFormatted}${decSep}${decPart}` : intFormatted;

  switch (pos) {
    case 'left':
      return `${symbol}${formatted}`;
    case 'left_space':
      return `${symbol} ${formatted}`;
    case 'right':
      return `${formatted}${symbol}`;
    case 'right_space':
      return `${formatted} ${symbol}`;
    default:
      return `${symbol}${formatted}`;
  }
}

export function calculateTax(subtotal, taxRate, pricesIncludeTax) {
  if (taxRate <= 0) return 0;
  if (pricesIncludeTax) {
    return subtotal - subtotal / (1 + taxRate / 100);
  }
  return subtotal * (taxRate / 100);
}
