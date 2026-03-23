/**
 * InfoModal – tooltip/popup for "More Info" on addon items.
 * Shows description, full image, and metadata.
 */

import { useEffect, useRef, useState } from '@wordpress/element';
import { formatPrice } from '../utils/price';

export default function InfoModal({ item, group, selection, onSelect, onQuantityChange, onClose }) {
  const overlayRef = useRef(null);

  // Local quantity state
  const isSelected = !!selection[item.id];
  const initialQty = isSelected && selection[item.id]?.quantity ? selection[item.id].quantity : 1;
  const [localQty, setLocalQty] = useState(initialQty);

  const price = parseFloat(item.price) || 0;
  const isIncluded = price === 0;
  const outOfStock = item.in_stock === false;
  const meta = item.meta_json || {};

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  // Sync qty if external selection changes
  useEffect(() => {
    if (isSelected && selection[item.id]?.quantity) setLocalQty(selection[item.id].quantity);
  }, [isSelected, selection, item.id]);

  // Close on overlay click
  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) onClose();
  };

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const handleQtyChange = (newQty, e) => {
    e.preventDefault();
    e.stopPropagation();
    const q = Math.max(1, newQty);
    setLocalQty(q);
    if (isSelected && onQuantityChange) onQuantityChange(q);
  };

  const handleAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (outOfStock) return;
    onSelect(localQty);
  };

  return (
    <div className="gvc-modal-overlay" ref={overlayRef} onClick={handleOverlayClick}>
      <div className="gvc-modal" role="dialog" aria-modal="true">
        <button className="gvc-modal__close" onClick={onClose} aria-label="Sluiten" style={{ background: 'rgba(0,0,0,0.55)', color: '#fff', WebkitTextFillColor: '#fff', border: 'none', fontSize: '18px', fontWeight: 700, lineHeight: 1 }}>✕</button>

        <div className="gvc-modal__content">
          {item.image_url && (
            <div className="gvc-modal__img-wrap">
              <img src={item.image_url} alt={item.title} className="gvc-modal__img" />
            </div>
          )}

          <div className="gvc-modal__details">
            <h3 className="gvc-modal__title">{item.title}</h3>

            {item.sku && <span className="gvc-modal__sku">SKU: {item.sku}</span>}

            <div className="gvc-modal__price">
              {isIncluded ? <span className="gvc-item__price--included">Inclusief</span> : <span className="gvc-item__price--amount">+ {formatPrice(price)}</span>}
            </div>

            {item.description && (
              <div className="gvc-modal__desc" dangerouslySetInnerHTML={{ __html: item.description }} />
            )}

            {meta && Object.keys(meta).length > 0 && (
              <div className="gvc-modal__meta">
                <h4>Specificaties</h4>
                <table className="gvc-modal__meta-table">
                  <tbody>
                    {Object.entries(meta).map(([key, value]) => (
                      <tr key={key}>
                        <td className="gvc-modal__meta-key">{key}</td>
                        <td className="gvc-modal__meta-val">{String(value)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {outOfStock && (
              <div className="gvc-modal__stock-warning">Dit product is momenteel niet op voorraad.</div>
            )}

            {/* Smart Action Row */}
            {!outOfStock && (
              <div className="gvc-modal__action-row">
                <div className="gvc-item__qty gvc-modal__qty">
                  <button type="button" className="gvc-qty-btn" onClick={(e) => handleQtyChange(localQty - 1, e)} disabled={localQty <= 1}>−</button>
                  <span className="gvc-qty-val">{localQty}</span>
                  <button type="button" className="gvc-qty-btn" onClick={(e) => handleQtyChange(localQty + 1, e)}>+</button>
                </div>
                <button
                  type="button"
                  className={`gvc-btn gvc-btn--add gvc-modal__add-btn ${isSelected ? 'gvc-btn--added' : ''}`}
                  onClick={handleAdd}
                  aria-label={isSelected ? 'Toegevoegd' : 'Toevoegen'}
                  title={isSelected ? 'Toegevoegd' : 'Toevoegen'}
                >
                  <span style={{ color: '#ffffff', WebkitTextFillColor: '#ffffff', fontSize: '18px', lineHeight: 1, display: 'block' }}>
                    {isSelected ? '✓' : '+'}
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
