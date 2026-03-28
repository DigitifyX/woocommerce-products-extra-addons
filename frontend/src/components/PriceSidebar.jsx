/**
 * PriceSidebar – sticky/floating price breakdown.
 * Shows base price + each selected addon + VAT + total.
 */

import { formatPrice } from '../utils/price';
import { t } from '../utils/i18n';

export default function PriceSidebar({
  config,
  totals,
  selections,
  groups,
  showVat,
  isMobile = false,
}) {
  if (!config) return null;

  const containerClass = isMobile ? 'gvc-sidebar gvc-sidebar--mobile' : 'gvc-sidebar';

  return (
    <div className={containerClass}>
      <div className="gvc-sidebar__inner">
        <h3 className="gvc-sidebar__title">{t('price_overview')}</h3>

        {/* Base price */}
        <div className="gvc-sidebar__row gvc-sidebar__row--base">
          <span className="gvc-sidebar__label">{config.product_name}</span>
          <span className="gvc-sidebar__value">{formatPrice(totals.base)}</span>
        </div>

        {/* Selected addons */}
        <div className="gvc-sidebar__addons">
          {totals.breakdown.map((line, idx) => {
            const group = groups.find((g) => g.id == line.groupId);
            return (
              <div key={idx} className="gvc-sidebar__addon-block">
                <div className="gvc-sidebar__row gvc-sidebar__row--addon">
                  <span className="gvc-sidebar__label">
                    <span className="gvc-sidebar__group-label">{group?.title || ''}</span>
                    {line.title}
                    {line.quantity > 1 && (
                      <span className="gvc-sidebar__qty"> ×{line.quantity}</span>
                    )}
                  </span>
                  <span className="gvc-sidebar__value">
                    {line.total > 0 ? `+ ${formatPrice(line.total)}` : t('included')}
                  </span>
                </div>

                {/* Custom field values (e.g. Width: 2500mm, Depth: 3000mm) */}
                {line.customFields && line.customFields.length > 0 && (
                  <div className="gvc-sidebar__custom-fields">
                    {line.customFields.map((cf, i) => (
                      <div key={i} className="gvc-sidebar__custom-field">
                        <span className="gvc-sidebar__custom-field-label">{cf.label}:</span>
                        <span className="gvc-sidebar__custom-field-value">
                          {cf.value}{cf.unit ? ` ${cf.unit}` : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {totals.breakdown.length === 0 && (
            <p className="gvc-sidebar__empty">{t('no_options_selected')}</p>
          )}
        </div>

        {/* Divider */}
        <div className="gvc-sidebar__divider" />

        {/* Subtotal */}
        {showVat && totals.taxRate > 0 && (
          <>
            <div className="gvc-sidebar__row gvc-sidebar__row--subtotal">
              <span className="gvc-sidebar__label">{t('subtotal')}</span>
              <span className="gvc-sidebar__value">
                {formatPrice(config.prices_include_tax ? totals.subtotal - totals.tax : totals.subtotal)}
              </span>
            </div>

            <div className="gvc-sidebar__row gvc-sidebar__row--tax">
              <span className="gvc-sidebar__label">
                {t('vat', { rate: totals.taxRate })}
              </span>
              <span className="gvc-sidebar__value">{formatPrice(totals.tax)}</span>
            </div>

            <div className="gvc-sidebar__divider" />
          </>
        )}

        {/* Total */}
        <div className="gvc-sidebar__row gvc-sidebar__row--total">
          <span className="gvc-sidebar__label">{t('total')}</span>
          <span className="gvc-sidebar__value">{formatPrice(totals.total)}</span>
        </div>

        {showVat && totals.taxRate > 0 && (
          <p className="gvc-sidebar__vat-note">
            {config.prices_include_tax ? t('incl_vat') : t('excl_vat')}
          </p>
        )}

        {/* Unselected required groups warning */}
        {groups.some((g) => g.is_required == 1 && Object.keys(selections[g.id] || {}).length === 0) && (
          <div className="gvc-sidebar__warning">
            <span>⚠</span>
            <span>{t('required_options_missing')}</span>
          </div>
        )}
      </div>
    </div>
  );
}
