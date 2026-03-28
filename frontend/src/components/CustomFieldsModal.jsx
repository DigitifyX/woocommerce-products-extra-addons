/**
 * CustomFieldsModal – popup for collecting custom input values (e.g. width/depth)
 * when an addon item has meta_json.custom_fields configured.
 */

import { useState, useEffect, useRef } from '@wordpress/element';
import { t } from '../utils/i18n';

export default function CustomFieldsModal({ item, onConfirm, onClose, existingValues }) {
  const overlayRef = useRef(null);
  const meta = typeof item.meta_json === 'string' ? JSON.parse(item.meta_json) : (item.meta_json || {});
  const fields = meta.custom_fields || [];

  // Initialize values from existing selection data or empty
  const [values, setValues] = useState(() => {
    const init = {};
    fields.forEach((f) => {
      init[f.key] = existingValues?.[f.key] || '';
    });
    return init;
  });

  const [errors, setErrors] = useState({});

  // Close on Escape
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  // Close on overlay click
  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) onClose();
  };

  const handleChange = (key, value) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    // Clear error on change
    if (errors[key]) {
      setErrors((prev) => { const n = { ...prev }; delete n[key]; return n; });
    }
  };

  const handleConfirm = (e) => {
    e.preventDefault();
    e.stopPropagation();

    // Validate required fields
    const newErrors = {};
    fields.forEach((f) => {
      if (f.required && !values[f.key]?.toString().trim()) {
        newErrors[f.key] = true;
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onConfirm(values);
  };

  return (
    <div className="gvc-modal-overlay" ref={overlayRef} onClick={handleOverlayClick}>
      <div className="gvc-modal gvc-custom-fields-modal" role="dialog" aria-modal="true">
        <button
          className="gvc-modal__close"
          onClick={onClose}
          aria-label={t('close')}
          style={{ background: 'rgba(0,0,0,0.55)', color: '#fff', WebkitTextFillColor: '#fff', border: 'none', fontSize: '18px', fontWeight: 700, lineHeight: 1 }}
        >
          ✕
        </button>

        <div className="gvc-custom-fields-modal__content">
          {/* Header with item info */}
          <div className="gvc-custom-fields-modal__header">
            {item.image_url && (
              <img
                src={item.image_url}
                alt={item.title}
                className="gvc-custom-fields-modal__img"
              />
            )}
            <div>
              <h3 className="gvc-custom-fields-modal__title">
                {t('custom_fields_title', { title: item.title })}
              </h3>
              {item.description && (
                <p className="gvc-custom-fields-modal__desc">{item.description.replace(/<[^>]*>/g, '').substring(0, 120)}</p>
              )}
            </div>
          </div>

          {/* Fields */}
          <form className="gvc-custom-fields-modal__fields" onSubmit={handleConfirm}>
            {fields.map((field) => (
              <div key={field.key} className="gvc-custom-fields-modal__field">
                <label className="gvc-custom-fields-modal__label">
                  {field.label}
                  {field.required && <span className="gvc-required">*</span>}
                </label>
                <div className="gvc-custom-fields-modal__input-wrap">
                  <input
                    type={field.type || 'text'}
                    className={`gvc-custom-fields-modal__input ${errors[field.key] ? 'gvc-custom-fields-modal__input--error' : ''}`}
                    value={values[field.key] || ''}
                    placeholder={field.placeholder || ''}
                    onChange={(e) => handleChange(field.key, e.target.value)}
                    min={field.type === 'number' ? '0' : undefined}
                    step={field.type === 'number' ? 'any' : undefined}
                    autoFocus={fields.indexOf(field) === 0}
                  />
                  {field.unit && (
                    <span className="gvc-custom-fields-modal__unit">{field.unit}</span>
                  )}
                </div>
                {errors[field.key] && (
                  <span className="gvc-custom-fields-modal__error">{t('field_required')}</span>
                )}
              </div>
            ))}

            {/* Actions */}
            <div className="gvc-custom-fields-modal__actions">
              <button
                type="button"
                className="gvc-btn gvc-btn--outline"
                onClick={onClose}
              >
                {t('cancel')}
              </button>
              <button
                type="submit"
                className="gvc-btn gvc-btn--primary"
              >
                {t('confirm')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
