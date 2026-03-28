/**
 * AddonItem – individual selectable addon card/radio/checkbox.
 * Each item has its own quantity picker and an "Add" button.
 */

import { useState, useRef, useEffect } from '@wordpress/element';
import { formatPrice } from '../utils/price';
import { t } from '../utils/i18n';

export default function AddonItem({
  item,
  isSelected,
  displayType,
  onSelect,
  onInfo,
  quantity: externalQty,
  onQuantityChange,
  lazyLoad,
}) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [localQty, setLocalQty] = useState(externalQty || 1);
  const imgRef = useRef(null);

  // Sync local qty when external changes (e.g. from another source)
  useEffect(() => {
    setLocalQty(externalQty || 1);
  }, [externalQty]);

  // Lazy load with IntersectionObserver
  useEffect(() => {
    if (!lazyLoad || !imgRef.current || !item.image_url) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          imgRef.current.src = item.image_url;
          observer.disconnect();
        }
      },
      { rootMargin: '200px' }
    );

    observer.observe(imgRef.current);
    return () => observer.disconnect();
  }, [item.image_url, lazyLoad]);

  const price = parseFloat(item.price) || 0;
  const isIncluded = price === 0;
  const outOfStock = item.in_stock === false;

  let className = 'gvc-item';
  if (isSelected) className += ' gvc-item--selected';
  if (outOfStock) className += ' gvc-item--disabled';

  // When user clicks "Add", we select the item with the current local qty
  const handleAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (outOfStock) return;
    onSelect(localQty);
  };

  const handleQtyChange = (newQty, e) => {
    e.preventDefault();
    e.stopPropagation();
    const q = Math.max(1, newQty);
    setLocalQty(q);
    // If already selected, also update the parent immediately
    if (isSelected && onQuantityChange) {
      onQuantityChange(q);
    }
  };

  if (item.item_type === 'guarantee') {
    const guaranteeData = item.guarantee_data || {};
    const features = guaranteeData.features || [];
    const originalPrice = parseFloat(guaranteeData.original_price) || 0;

    return (
      <div
        className={`gvc-guarantee ${isSelected ? 'gvc-guarantee--selected' : ''}`}
        onClick={() => onSelect(isSelected ? null : 1)}
        style={{ cursor: 'pointer' }}
      >
        <div className="gvc-guarantee__header">
          <div className="gvc-guarantee__check">
            <span
              className={
                displayType === 'radio'
                  ? `gvc-radio ${isSelected ? 'gvc-radio--on' : ''}`
                  : `gvc-checkbox ${isSelected ? 'gvc-checkbox--on' : ''}`
              }
            />
          </div>

          <div className="gvc-guarantee__info">
            <div className="gvc-guarantee__title-row">
              <h4 className="gvc-guarantee__title">{item.title}</h4>
              <div className="gvc-guarantee__pricing">
                {originalPrice > 0 && (
                  <span className="gvc-guarantee__original-price">
                    {formatPrice(originalPrice)}
                  </span>
                )}
                <span className="gvc-guarantee__sale-price">
                  {price > 0 ? formatPrice(price) : t('free')}
                </span>
              </div>
            </div>

            {guaranteeData.subtitle && (
              <p className="gvc-guarantee__subtitle">
                ({guaranteeData.subtitle})
              </p>
            )}
          </div>
        </div>

        {features.length > 0 && (
          <ul className="gvc-guarantee__features">
            {features.map((feature, index) => (
              <li key={index} className="gvc-guarantee__feature">
                <span className="gvc-guarantee__feature-icon">✓</span>
                <div className="gvc-guarantee__feature-body">
                  {feature.heading && (
                    <p className="gvc-guarantee__feature-heading">
                      {feature.heading}
                    </p>
                  )}
                  {feature.text && (
                    <p className="gvc-guarantee__feature-text">
                      {feature.text}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Image */}
      {item.image_url && (
        <div className="gvc-item__img-wrap">
          <img
            ref={imgRef}
            src={lazyLoad ? '' : item.image_url}
            alt={item.title}
            className={`gvc-item__img ${imgLoaded ? 'gvc-item__img--loaded' : ''}`}
            onLoad={() => setImgLoaded(true)}
            width="120"
            height="120"
          />
          {!imgLoaded && <div className="gvc-item__img-placeholder" />}
        </div>
      )}

      {/* Content */}
      <div className="gvc-item__body">
        <div className="gvc-item__content-col">
          <div className="gvc-item__title-row">
            <h4 className="gvc-item__title">{item.title}</h4>
            {item.description && (
              <button
                type="button"
                className="gvc-info-btn gvc-info-btn--card"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onInfo();
                }}
                title={t('more_info')}
              >
                i
              </button>
            )}
          </div>

          {item.sku && (
            <span className="gvc-item__sku">SKU: {item.sku}</span>
          )}

          <div className="gvc-item__price">
            {isIncluded ? (
              <span className="gvc-item__price--included">{t('included')}</span>
            ) : (
              <span className="gvc-item__price--amount">(+ {formatPrice(price)})</span>
            )}
          </div>

          {outOfStock && (
            <span className="gvc-item__stock gvc-item__stock--out">{t('out_of_stock')}</span>
          )}
        </div>
      </div>

      {/* Quantity + Add button row */}
      {!outOfStock && (
        <div className="gvc-item__action-row" onClick={(e) => e.stopPropagation()}>
          <div className="gvc-item__qty">
            <button
              type="button"
              className="gvc-qty-btn"
              onClick={(e) => handleQtyChange(localQty - 1, e)}
              disabled={localQty <= 1}
            >
              −
            </button>
            <span className="gvc-qty-val">{localQty}</span>
            <button
              type="button"
              className="gvc-qty-btn"
              onClick={(e) => handleQtyChange(localQty + 1, e)}
            >
              +
            </button>
          </div>
          <button
            type="button"
            className={`gvc-btn gvc-btn--add ${isSelected ? 'gvc-btn--added' : ''}`}
            onClick={handleAdd}
            aria-label={isSelected ? t('added') : t('add')}
            title={isSelected ? t('added') : t('add')}
          >
            <span style={{ color: '#ffffff', WebkitTextFillColor: '#ffffff', fontSize: '18px', lineHeight: 1, display: 'block' }}>
              {isSelected ? '✓' : '+'}
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
