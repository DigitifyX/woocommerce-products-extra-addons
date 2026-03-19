/**
 * AddonGroup – renders items for a configuration step.
 * Supports display_type: radio, checkbox, cards, dropdown.
 */

import { useState, useCallback } from '@wordpress/element';
import AddonItem from './AddonItem';

export default function AddonGroup({
  group,
  selection,
  onSelect,
  onClear,
  onQuantityChange,
  onInfo,
  lazyLoad,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const items = group.items || [];
  const displayType = group.display_type || 'radio';

  // Filter items
  const filtered = searchTerm
    ? items.filter((item) =>
      item.title.toLowerCase().includes(searchTerm.toLowerCase())
    )
    : items;
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

      {/* Search filter for large item lists */}
      {items.length > 8 && (
        <div className="gvc-group__search">
          <input
            type="text"
            placeholder="Zoek opties…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="gvc-search-input"
          />
        </div>
      )}

      {/* Dropdown display */}
      {displayType === 'dropdown' && (
        <select
          className="gvc-dropdown"
          value={Object.keys(selection)[0] || ''}
          onChange={(e) => {
            const id = parseInt(e.target.value, 10);
            if (!id) {
              onClear();
              return;
            }
            const item = items.find((i) => i.id == id);
            if (item) onSelect(item, 1);
          }}
        >
          {!group.is_required && <option value="">— Geen selectie —</option>}
          {filtered.map((item) => (
            <option key={item.id} value={item.id}>
              {item.title} — {parseFloat(item.price) > 0 ? `+€${parseFloat(item.price).toFixed(2)}` : 'Inclusief'}
            </option>
          ))}
        </select>
      )}

      {/* Card / Radio / Checkbox grid */}
      {displayType !== 'dropdown' && (
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

      {filtered.length === 0 && (
        <p className="gvc-empty">Geen opties gevonden.</p>
      )}
    </div>
  );
}
