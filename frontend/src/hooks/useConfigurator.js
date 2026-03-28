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
  // optionIndex is used for select_dropdown items to track which dropdown option was chosen
  const selectItem = useCallback((groupId, item, quantity = 1, optionIndex, customFieldsValues) => {
    setSelections((prev) => {
      const g = config?.groups?.find(g => g.id == groupId);
      const displayType = g?.display_type || 'radio';

      const groupSels = { ...(prev[groupId] || {}) };

      // Select Dropdown items: always set independently (multiple can coexist in a group)
      if (item.item_type === 'select_dropdown') {
        groupSels[item.id] = {
          item_id: item.id,
          quantity,
          item,
          selectedOptionIndex: optionIndex,
        };
        return { ...prev, [groupId]: groupSels };
      }

      if (displayType === 'dropdown') {
        // Single select behavior only for dropdown formats (exclude existing select_dropdown selections)
        const keepDropdowns = {};
        Object.entries(groupSels).forEach(([k, v]) => {
          if (v.item?.item_type === 'select_dropdown') keepDropdowns[k] = v;
        });
        return {
          ...prev,
          [groupId]: { ...keepDropdowns, [item.id]: { item_id: item.id, quantity, item, customFieldsValues } },
        };
      } else {
        // Multi select behavior for everything else (cards, radio, checkbox)
        if (groupSels[item.id]) {
          // Toggle off if they click the selected item again
          delete groupSels[item.id];
        } else {
          // Toggle on
          groupSels[item.id] = { item_id: item.id, quantity, item, customFieldsValues };
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

  // Deselect a specific item from a group (used for select_dropdown deselection)
  const deselectItem = useCallback((groupId, itemId) => {
    setSelections((prev) => {
      const groupSels = { ...(prev[groupId] || {}) };
      delete groupSels[itemId];
      return { ...prev, [groupId]: groupSels };
    });
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

        // For select_dropdown items, show "ItemTitle: OptionLabel"
        let displayTitle = sel.item.title;
        if (sel.item.item_type === 'select_dropdown' && sel.item._optionLabel) {
          displayTitle = sel.item.title + ': ' + sel.item._optionLabel;
        }

        // Build custom fields display data
        const cfValues = sel.customFieldsValues;
        const cfConfig = sel.item?.meta_json?.custom_fields || [];
        let customFields = null;
        if (cfValues && Object.keys(cfValues).length > 0) {
          customFields = Object.entries(cfValues).map(([key, value]) => {
            const fieldCfg = cfConfig.find((f) => f.key === key);
            return {
              label: fieldCfg?.label || key,
              value,
              unit: fieldCfg?.unit || '',
            };
          });
        }

        breakdown.push({
          title: displayTitle,
          price,
          quantity: qty,
          total: lineTotal,
          groupId: sel.item.group_id,
          customFields,
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
        const entry = {
          item_id: sel.item_id,
          quantity: sel.quantity,
        };
        // Include selected option data for select_dropdown items
        if (sel.selectedOptionIndex !== undefined && sel.selectedOptionIndex !== null) {
          entry.selected_option = sel.selectedOptionIndex;
          entry.selected_option_label = sel.item?._optionLabel || '';
          entry.selected_option_price = parseFloat(sel.item?.price) || 0;
        }
        // Include custom fields values
        if (sel.customFieldsValues && Object.keys(sel.customFieldsValues).length > 0) {
          const cfConfig = sel.item?.meta_json?.custom_fields || [];
          entry.custom_fields = {};
          Object.entries(sel.customFieldsValues).forEach(([key, value]) => {
            const fieldCfg = cfConfig.find((f) => f.key === key);
            entry.custom_fields[key] = {
              label: fieldCfg?.label || key,
              value,
              unit: fieldCfg?.unit || '',
            };
          });
        }
        payload.push(entry);
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
    deselectItem,
    updateQuantity,
    totals,
    validation,
  };
}
