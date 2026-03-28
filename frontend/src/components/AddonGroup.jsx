/**
 * AddonGroup – renders items for a configuration step.
 * Supports display_type: radio, checkbox, cards, dropdown.
 * Items with item_type 'select_dropdown' render as individually labeled dropdowns.
 */

import { useState, useCallback } from '@wordpress/element';
import AddonItem from './AddonItem';
import { t } from '../utils/i18n';

export default function AddonGroup({
  group,
  selection,
  onSelect,
  onClear,
  onDeselectItem,
  onQuantityChange,
  onInfo,
  lazyLoad,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const items = group.items || [];
  const displayType = group.display_type || 'radio';

  // Separate select_dropdown items from regular items
  const selectDropdownItems = items.filter((item) => item.item_type === 'select_dropdown');
  const nonDropdownItems = items.filter((item) => item.item_type !== 'select_dropdown');

  // Filter non-dropdown items
  const filtered = searchTerm
    ? nonDropdownItems.filter((item) =>
      item.title.toLowerCase().includes(searchTerm.toLowerCase())
    )
    : nonDropdownItems;
  const regularItems = filtered.filter((item) => item.item_type !== 'guarantee');
  const guaranteeItems = filtered.filter((item) => item.item_type === 'guarantee');

  const handleSelect = useCallback(
    (item, qty = 1) => {
      onSelect(item, qty);
    },
    [onSelect]
  );

  return (
    <div className="gvc-group">
      <div className="gvc-group__header">
        {/* Title has been moved to accordion panel header */}
        {group.description && (
          <div
            className="gvc-group__desc"
            dangerouslySetInnerHTML={{ __html: group.description }}
          />
        )}
      </div>

      {/* Select Dropdown items – each rendered as its own labeled dropdown, 1 per row */}
      {selectDropdownItems.length > 0 && (
        <div className="gvc-select-dropdowns">
          {selectDropdownItems.map((item) => {
            const meta = item.meta_json || {};
            const options = meta.dropdown_options || [];
            const currentSel = selection[item.id];
            const selectedIdx = currentSel?.selectedOptionIndex ?? '';
            const selectedOption = selectedIdx !== '' ? options[selectedIdx] : null;

            return (
              <div key={item.id} className="gvc-select-dropdown-item">
                <label className="gvc-select-dropdown-item__label">
                  {item.title}
                </label>
                <div className="gvc-select-dropdown-item__control">
                  {selectedOption?.image_url && (
                    <img
                      className="gvc-select-dropdown-item__image"
                      src={selectedOption.image_url}
                      alt={selectedOption.label}
                    />
                  )}
                  <select
                    className="gvc-dropdown"
                    style={{ minHeight: '48px', height: 'auto', lineHeight: '1.4', padding: '10px 14px', fontSize: '14px', overflow: 'visible', whiteSpace: 'normal', boxSizing: 'border-box' }}
                    value={selectedIdx}
                    onChange={(e) => {
                      const idx = e.target.value;
                      if (idx === '') {
                        if (onDeselectItem) onDeselectItem(item.id);
                        return;
                      }
                      const opt = options[parseInt(idx, 10)];
                      if (!opt) return;
                      const optPrice = parseFloat(opt.price) || 0;
                      onSelect(
                        {
                          ...item,
                          price: optPrice,
                          _optionLabel: opt.label,
                          _optionImage: opt.image_url || '',
                        },
                        1,
                        parseInt(idx, 10)
                      );
                    }}
                  >
                    <option value="">{t('select_placeholder', { title: item.title })}</option>
                    {options.map((opt, idx) => {
                      const optPrice = parseFloat(opt.price) || 0;
                      return (
                        <option key={idx} value={idx}>
                          {opt.label}
                          {optPrice > 0 ? ` — +€${optPrice.toFixed(2)}` : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Search filter for large item lists (non-dropdown items only) */}
      {nonDropdownItems.length > 8 && (
        <div className="gvc-group__search">
          <input
            type="text"
            placeholder={t('search_options')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="gvc-search-input"
          />
        </div>
      )}

      {/* Dropdown display (for group-level dropdown, not select_dropdown items) */}
      {displayType === 'dropdown' && nonDropdownItems.length > 0 && (
        <select
          className="gvc-dropdown"
          style={{ minHeight: '48px', height: 'auto', lineHeight: '1.4', padding: '10px 14px', fontSize: '14px', overflow: 'visible', whiteSpace: 'normal', boxSizing: 'border-box' }}
          value={
            Object.keys(selection).find(
              (k) => !items.find((i) => i.id == k && i.item_type === 'select_dropdown')
            ) || ''
          }
          onChange={(e) => {
            const id = parseInt(e.target.value, 10);
            if (!id) {
              onClear();
              return;
            }
            const item = nonDropdownItems.find((i) => i.id == id);
            if (item) onSelect(item, 1);
          }}
        >
          {!group.is_required && <option value="">{t('no_selection')}</option>}
          {filtered.map((item) => (
            <option key={item.id} value={item.id}>
              {item.title} — {parseFloat(item.price) > 0 ? `+€${parseFloat(item.price).toFixed(2)}` : t('included')}
            </option>
          ))}
        </select>
      )}

      {/* Card / Radio / Checkbox grid */}
      {displayType !== 'dropdown' && nonDropdownItems.length > 0 && (
        <>
          {regularItems.length > 0 && (
            <div className={`gvc-items gvc-items--${displayType}`}>
              {regularItems.map((item) => {
                const isSel = !!selection[item.id];
                const selQty = isSel ? selection[item.id].quantity : 1;
                return (
                  <AddonItem
                    key={item.id}
                    item={item}
                    isSelected={isSel}
                    displayType={displayType}
                    onSelect={(qty) => handleSelect(item, qty)}
                    onInfo={() => onInfo(item)}
                    quantity={selQty}
                    onQuantityChange={
                      isSel ? (qty) => onQuantityChange(item.id, qty) : null
                    }
                    lazyLoad={lazyLoad}
                  />
                );
              })}
            </div>
          )}

          {guaranteeItems.length > 0 && (
            <div className="gvc-items__guarantees">
              {guaranteeItems.map((item) => {
                const isSel = !!selection[item.id];
                const selQty = isSel ? selection[item.id].quantity : 1;
                return (
                  <div key={item.id} className="gvc-items__full-row">
                    <AddonItem
                      item={item}
                      isSelected={isSel}
                      displayType={displayType}
                      onSelect={(qty) => handleSelect(item, qty)}
                      onInfo={() => onInfo(item)}
                      quantity={selQty}
                      onQuantityChange={
                        isSel ? (qty) => onQuantityChange(item.id, qty) : null
                      }
                      lazyLoad={lazyLoad}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {items.length === 0 && (
        <p className="gvc-empty">{t('no_options_found')}</p>
      )}
    </div>
  );
}
