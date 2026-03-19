/**
 * useConfigurator – fetches product config data and manages selections.
 */

import { useState, useEffect, useCallback, useMemo } from '@wordpress/element';
import { formatPrice, calculateTax } from '../utils/price';

const cfg = window.gvcFrontend || {};

export default function useConfigurator(productId) {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // selections: { [groupId]: { [itemId]: { item_id, quantity, item } } }
  const [selections, setSelections] = useState({});
  const [activeStep, setActiveStep] = useState(0);

  // Fetch configurator data
  useEffect(() => {
    let cancelled = false;

    async function fetchConfig() {
      try {
        setLoading(true);
        const res = await fetch(`${cfg.restUrl}/product/${productId}/config`, {
          headers: { 'X-WP-Nonce': cfg.nonce },
        });

        if (!res.ok) throw new Error('Failed to load configurator data');

        const data = await res.json();
        if (!cancelled) {
          setConfig(data);

          // Set defaults
          const defaults = {};
          (data.groups || []).forEach((group) => {
            defaults[group.id] = {};
            const defaultItem = group.items?.find((i) => i.is_default == 1);
            if (defaultItem) {
              defaults[group.id][defaultItem.id] = {
                item_id: defaultItem.id,
                quantity: 1,
                item: defaultItem,
              };
            }
          });
          setSelections(defaults);
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchConfig();
    return () => { cancelled = true; };
  }, [productId]);

  // Select an item in a group
  const selectItem = useCallback((groupId, item, quantity = 1) => {
    setSelections((prev) => {
      const g = config?.groups?.find(g => g.id == groupId);
      const displayType = g?.display_type || 'radio';

      const groupSels = { ...(prev[groupId] || {}) };

      if (displayType === 'dropdown') {
        // Single select behavior only for dropdown formats
        return {
          ...prev,
          [groupId]: { [item.id]: { item_id: item.id, quantity, item } },
        };
      } else {
        // Multi select behavior for everything else (cards, radio, checkbox)
        if (groupSels[item.id]) {
          // Toggle off if they click the selected item again
          delete groupSels[item.id];
        } else {
          // Toggle on
          groupSels[item.id] = { item_id: item.id, quantity, item };
        }
        return {
          ...prev,
          [groupId]: groupSels,
        };
      }
    });
  }, [config]);

  // Clear selection for a group
  const clearSelection = useCallback((groupId) => {
    setSelections((prev) => ({
      ...prev,
      [groupId]: {},
    }));
  }, []);

  // Update quantity for a specific selection
  const updateQuantity = useCallback((groupId, itemId, quantity) => {
    setSelections((prev) => {
      const groupSels = prev[groupId];
      if (!groupSels || !groupSels[itemId]) return prev;
      return {
        ...prev,
        [groupId]: {
          ...groupSels,
          [itemId]: { ...groupSels[itemId], quantity: Math.max(1, quantity) },
        },
      };
    });
  }, []);

  // Calculate totals
  const totals = useMemo(() => {
    if (!config) return { base: 0, addons: 0, subtotal: 0, tax: 0, total: 0, breakdown: [] };

    const base = config.base_price || 0;
    let addonsTotal = 0;
    const breakdown = [];

    Object.values(selections).forEach((groupSels) => {
      Object.values(groupSels).forEach((sel) => {
        if (!sel.item) return;
        const price = parseFloat(sel.item.price) || 0;
        const qty = sel.quantity || 1;
        const lineTotal = price * qty;
        addonsTotal += lineTotal;
        breakdown.push({
          title: sel.item.title,
          price,
          quantity: qty,
          total: lineTotal,
          groupId: sel.item.group_id,
        });
      });
    });

    const subtotal = base + addonsTotal;
    const taxRate = config.tax_rate || 0;
    const taxAmount = calculateTax(subtotal, taxRate, config.prices_include_tax);

    const total = config.prices_include_tax ? subtotal : subtotal + taxAmount;

    return {
      base,
      addons: addonsTotal,
      subtotal,
      tax: taxAmount,
      taxRate,
      total,
      breakdown,
    };
  }, [config, selections]);

  // Sync selections to hidden input for WC form submission
  useEffect(() => {
    const input = document.getElementById('gvc-selections-input');
    if (!input) return;

    const payload = [];
    Object.values(selections).forEach((groupSels) => {
      Object.values(groupSels).forEach((sel) => {
        payload.push({
          item_id: sel.item_id,
          quantity: sel.quantity,
        });
      });
    });

    input.value = JSON.stringify(payload);
  }, [selections]);

  // Validate required groups
  const validation = useMemo(() => {
    if (!config) return { valid: true, missing: [] };

    const missing = [];
    (config.groups || []).forEach((group) => {
      const gSels = selections[group.id] || {};
      if (group.is_required == 1 && Object.keys(gSels).length === 0) {
        missing.push(group);
      }
    });

    return { valid: missing.length === 0, missing };
  }, [config, selections]);

  return {
    config,
    loading,
    error,
    selections,
    activeStep,
    setActiveStep,
    selectItem,
    clearSelection,
    updateQuantity,
    totals,
    validation,
  };
}
