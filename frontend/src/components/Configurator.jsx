/**
 * Main Configurator Component
 * Multi-step tabbed interface with live price sidebar.
 */

import { useState, useRef, useEffect } from '@wordpress/element';
import useConfigurator from '../hooks/useConfigurator';
import AddonGroup from './AddonGroup';
import PriceSidebar from './PriceSidebar';
import InfoModal from './InfoModal';
import { formatPrice } from '../utils/price';
import { t } from '../utils/i18n';

const cfg = window.gvcFrontend || {};

export default function Configurator({ productId }) {
  const {
    config,
    loading,
    error,
    selections,
    activeStep,
    setActiveStep,
    selectItem,
    clearSelection,
    deselectItem,
    updateQuantity,
    totals,
    validation,
  } = useConfigurator(productId);

  const [modalItem, setModalItem] = useState(null);
  const [isMobileSummaryOpen, setMobileSummaryOpen] = useState(false);
  const containerRef = useRef(null);

  // CSS custom properties from settings
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.style.setProperty('--gvc-primary', cfg.primaryColor || '#2D6A4F');
      containerRef.current.style.setProperty('--gvc-accent', cfg.accentColor || '#40916C');
    }
  }, []);

  if (loading) {
    return (
      <div className="gvc-loading" ref={containerRef}>
        <div className="gvc-loading__spinner" />
        <p className="gvc-loading__text">{t('loading')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="gvc-error" ref={containerRef}>
        <p>⚠️ {error}</p>
      </div>
    );
  }

  if (!config || !config.groups?.length) {
    return null;
  }

  const groups = config.groups;

  return (
    <div className="gvc-configurator" ref={containerRef}>
      {/* ── Main Layout ───────────────────────────────────── */}
      <div className="gvc-layout">
        {/* Left: Accordion Layout */}
        <div className="gvc-main">
          {groups.map((group, stepIndex) => {
            const isActive = activeStep === stepIndex;
            const groupSels = selections[group.id] || {};
            const hasSelections = Object.keys(groupSels).length > 0;
            const isCompleted = stepIndex < activeStep || (hasSelections && !isActive);

            // Get summary of selected items for this group
            const groupBreakdown = totals.breakdown.filter((line) => line.groupId == group.id);

            return (
              <div
                key={group.id}
                className={`gvc-step-panel ${isActive ? 'gvc-step-panel--active' : ''} ${isCompleted ? 'gvc-step-panel--completed' : ''}`}
              >
                {/* Accordion Header */}
                <div
                  className="gvc-step-panel__header"
                  onClick={() => setActiveStep(stepIndex)}
                  role="button"
                  tabIndex={0}
                >
                  <h3 className="gvc-step-panel__title">
                    {group.title}
                    {group.is_required == 1 && <span className="gvc-required">*</span>}
                  </h3>

                  {/* Summary when panel is collapsed */}
                  {!isActive && groupBreakdown.length > 0 && (
                    <div className="gvc-step-panel__summary">
                      {groupBreakdown.map((line, idx) => (
                        <div key={idx} className="gvc-step-panel__summary-item">
                          {line.title}
                          {line.quantity > 1 ? ` × ${line.quantity} ` : ''}
                          <span className="gvc-step-panel__summary-price">
                            {line.total > 0 ? ` (+${formatPrice(line.total)})` : ''}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  {/* Summary if nothing is selected yet */}
                  {!isActive && groupBreakdown.length === 0 && (
                    <div className="gvc-step-panel__summary">
                      {t('no_options_selected')}
                    </div>
                  )}
                </div>

                {/* Accordion Body */}
                {isActive && (
                  <div className="gvc-step-panel__body">
                    <AddonGroup
                      group={group}
                      selection={groupSels}
                      onSelect={(item, qty, optIdx) => selectItem(group.id, item, qty, optIdx)}
                      onClear={() => clearSelection(group.id)}
                      onDeselectItem={(itemId) => deselectItem(group.id, itemId)}
                      onQuantityChange={(itemId, qty) => updateQuantity(group.id, itemId, qty)}
                      onInfo={(item) => setModalItem({ item, group })}
                      lazyLoad={cfg.lazyLoad}
                    />

                    {/* Step Navigation inside active panel (Smart Buttons) */}
                    <div className="gvc-step-nav" style={{ marginTop: '24px', display: 'flex', justifyContent: 'space-between' }}>
                      {/* Left side: Previous (Hidden on first step) */}
                      {activeStep > 0 && groups.length > 1 ? (
                        <button
                          type="button"
                          className="gvc-btn gvc-btn--outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveStep((s) => Math.max(0, s - 1));
                          }}
                        >
                          {t('previous')}
                        </button>
                      ) : (
                        <div /> /* Empty div to maintain flex space-between */
                      )}

                      {/* Right side: Next (Hidden on last step if only 1 group, else shown) */}
                      {activeStep < groups.length - 1 && groups.length > 1 && (
                        <button
                          type="button"
                          className="gvc-btn gvc-btn--primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveStep((s) => Math.min(groups.length - 1, s + 1));
                          }}
                        >
                          {t('next')}
                        </button>
                      )}

                      {/* Show validation errors on the last step if needed */}
                      {activeStep === groups.length - 1 && !validation.valid && (
                        <div className="gvc-validation-msg" style={{ alignSelf: 'center', color: 'var(--gvc-error)' }}>
                          {t('select_required')} {validation.missing.map(g => g.title).join(', ')}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Right: Sticky Price Sidebar (desktop) */}
        <PriceSidebar
          config={config}
          totals={totals}
          selections={selections}
          groups={groups}
          showVat={cfg.showVat}
        />
      </div>

      {/* ── Mobile Floating Summary ───────────────────────── */}
      <div className="gvc-mobile-bar" onClick={() => setMobileSummaryOpen(!isMobileSummaryOpen)}>
        <span className="gvc-mobile-bar__label">{t('total_label')}</span>
        <span className="gvc-mobile-bar__price">{formatPrice(totals.total)}</span>
        <span className="gvc-mobile-bar__toggle">{isMobileSummaryOpen ? '▼' : '▲'}</span>
      </div>

      {isMobileSummaryOpen && (
        <div className="gvc-mobile-summary">
          <PriceSidebar
            config={config}
            totals={totals}
            selections={selections}
            groups={groups}
            showVat={cfg.showVat}
            isMobile
          />
        </div>
      )}

      {/* ── Info Modal ────────────────────────────────────── */}
      {modalItem && (
        <InfoModal
          item={modalItem.item}
          group={modalItem.group}
          selection={selections[modalItem.group.id] || {}}
          onSelect={(qty) => selectItem(modalItem.group.id, modalItem.item, qty)}
          onQuantityChange={(qty) => updateQuantity(modalItem.group.id, modalItem.item.id, qty)}
          onClose={() => setModalItem(null)}
        />
      )}
    </div>
  );
}
