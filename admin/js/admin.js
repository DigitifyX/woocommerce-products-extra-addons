/**
 * GartenVista Configurator – Admin
 * Unified interface: group form includes category/tag/product assignment.
 */
(function () {
  var el = wp.element.createElement;
  var useState = wp.element.useState;
  var useEffect = wp.element.useEffect;
  var useCallback = wp.element.useCallback;
  var Fragment = wp.element.Fragment;
  var render = wp.element.render;
  var cfg = window.gvcAdmin || {};

  function api(path, opts) {
    opts = opts || {};
    var method = opts.method || 'GET';
    var fetchOpts = { method: method, headers: { 'Content-Type': 'application/json', 'X-WP-Nonce': cfg.nonce } };
    if (opts.body) fetchOpts.body = JSON.stringify(opts.body);
    return fetch(cfg.restUrl + path, fetchOpts).then(function (r) { if (!r.ok) throw new Error('API ' + r.status); return r.json(); });
  }

  function h() { return el.apply(null, arguments); }

  // ═══════════════════ MAIN APP ═══════════════════
  function App() {
    var s = useState('list'); var view = s[0]; var setView = s[1];
    var s2 = useState(null); var editGroup = s2[0]; var setEditGroup = s2[1];
    var s3 = useState(null); var itemsGroup = s3[0]; var setItemsGroup = s3[1];

    if (itemsGroup) return h(ItemsPanel, { group: itemsGroup, onBack: function () { setItemsGroup(null); } });
    if (view === 'form') return h(GroupForm, { initial: editGroup, onDone: function () { setView('list'); setEditGroup(null); }, onCancel: function () { setView('list'); setEditGroup(null); } });
    return h(GroupsList, { onNew: function () { setEditGroup(null); setView('form'); }, onEdit: function (g) { setEditGroup(g); setView('form'); }, onItems: function (g) { setItemsGroup(g); } });
  }

  // ═══════════════════ GROUPS LIST ═══════════════════
  function GroupsList(props) {
    var s = useState([]); var groups = s[0]; var setGroups = s[1];
    var s2 = useState(true); var loading = s2[0]; var setLoading = s2[1];

    var load = function () { setLoading(true); api('/admin/groups').then(function (d) { setGroups(d); setLoading(false); }); };
    useEffect(load, []);

    var del = function (id) { if (!confirm('Delete this group and all its items?')) return; api('/admin/groups/' + id, { method: 'DELETE' }).then(load); };

    if (loading) return h('p', null, 'Loading…');

    return h('div', { className: 'gvc-admin' },
      h('div', { className: 'gvc-admin-panel' },
        h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
          h('h2', null, 'Addon Groups'),
          h('button', { className: 'gvc-admin-btn', onClick: props.onNew }, '+ Add Group')
        ),

        h('table', { className: 'gvc-admin-table' },
          h('thead', null, h('tr', null,
            h('th', null, '#'), h('th', null, 'Title'), h('th', null, 'Type'), h('th', null, 'Req'), h('th', null, 'Applies To'), h('th', null, 'Items'), h('th', null, 'Actions')
          )),
          h('tbody', null,
            groups.map(function (g) {
              var summary = g.assigned_summary || {};
              var badges = [];
              (summary.categories || []).forEach(function (c) { badges.push({ label: c, color: '#e0f2fe', text: '#0369a1' }); });
              (summary.tags || []).forEach(function (t) { badges.push({ label: t, color: '#fef3c7', text: '#92400e' }); });
              if (summary.products > 0) badges.push({ label: summary.products + ' product(s)', color: '#ede9fe', text: '#5b21b6' });

              return h('tr', { key: g.id },
                h('td', null, g.sort_order),
                h('td', null, h('strong', null, g.title)),
                h('td', null, g.display_type),
                h('td', null, g.is_required == 1 ? '✓' : '—'),
                h('td', null,
                  badges.length > 0
                    ? h('div', { style: { display: 'flex', flexWrap: 'wrap', gap: 4 } },
                        badges.map(function (b, i) {
                          return h('span', { key: i, style: { display: 'inline-block', padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 500, background: b.color, color: b.text } }, b.label);
                        })
                      )
                    : h('span', { style: { color: '#bbb', fontSize: 12, fontStyle: 'italic' } }, 'Not assigned')
                ),
                h('td', null, h('a', { href: '#', onClick: function (e) { e.preventDefault(); props.onItems(g); } }, 'Manage')),
                h('td', null,
                  h('button', { className: 'gvc-admin-btn gvc-admin-btn--secondary', style: { marginRight: 6 }, onClick: function () { props.onEdit(g); } }, 'Edit'),
                  h('button', { className: 'gvc-admin-btn gvc-admin-btn--danger', onClick: function () { del(g.id); } }, 'Delete')
                )
              );
            }),
            groups.length === 0 && h('tr', null, h('td', { colSpan: 7, style: { textAlign: 'center', padding: 20 } }, 'No groups yet. Click "+ Add Group" to start.'))
          )
        )
      )
    );
  }

  // ═══════════════════ GROUP FORM (with assignments) ═══════════════════
  function GroupForm(props) {
    var initial = props.initial;
    var isEdit = !!initial;

    var s = useState({
      title: '', slug: '', description: '', sort_order: 0, display_type: 'radio', is_required: 0, icon_url: '',
      assigned_categories: [], assigned_tags: [], assigned_products: []
    });
    var form = s[0]; var setForm = s[1];

    var s2 = useState({ categories: [], tags: [] }); var taxonomies = s2[0]; var setTaxonomies = s2[1];
    var s3 = useState(true); var loading = s3[0]; var setLoading = s3[1];
    var s4 = useState(false); var saving = s4[0]; var setSaving = s4[1];
    var s5 = useState(''); var prodSearch = s5[0]; var setProdSearch = s5[1];
    var s6 = useState([]); var prodResults = s6[0]; var setProdResults = s6[1];
    var s7 = useState([]); var pickedProducts = s7[0]; var setPickedProducts = s7[1];

    var set = function (k, v) { setForm(function (p) { var n = {}; for (var x in p) n[x] = p[x]; n[k] = v; return n; }); };

    useEffect(function () {
      var promises = [api('/admin/taxonomies')];
      if (isEdit) promises.push(api('/admin/groups/' + initial.id));

      Promise.all(promises).then(function (res) {
        setTaxonomies(res[0]);
        if (isEdit && res[1]) {
          var g = res[1];
          setForm({
            title: g.title || '', slug: g.slug || '', description: g.description || '', sort_order: g.sort_order || 0,
            display_type: g.display_type || 'radio', is_required: g.is_required || 0, icon_url: g.icon_url || '',
            assigned_categories: g.assigned_categories || [], assigned_tags: g.assigned_tags || [],
            assigned_products: (g.assigned_products || []).map(function (p) { return p.id; })
          });
          setPickedProducts(g.assigned_products || []);
        }
        setLoading(false);
      });
    }, []);

    var toggleCat = function (id) {
      set('assigned_categories', form.assigned_categories.indexOf(id) > -1
        ? form.assigned_categories.filter(function (x) { return x !== id; })
        : form.assigned_categories.concat([id])
      );
    };
    var toggleTag = function (id) {
      set('assigned_tags', form.assigned_tags.indexOf(id) > -1
        ? form.assigned_tags.filter(function (x) { return x !== id; })
        : form.assigned_tags.concat([id])
      );
    };

    var searchProducts = function (term) {
      setProdSearch(term);
      if (term.length < 2) { setProdResults([]); return; }
      api('/admin/wc-products?search=' + encodeURIComponent(term)).then(setProdResults);
    };

    var addProduct = function (p) {
      if (form.assigned_products.indexOf(p.id) > -1) return;
      set('assigned_products', form.assigned_products.concat([p.id]));
      setPickedProducts(function (prev) { return prev.concat([{ id: p.id, name: p.name }]); });
      setProdResults([]); setProdSearch('');
    };

    var removeProduct = function (id) {
      set('assigned_products', form.assigned_products.filter(function (x) { return x !== id; }));
      setPickedProducts(function (prev) { return prev.filter(function (p) { return p.id !== id; }); });
    };

    var save = function () {
      setSaving(true);
      var url = isEdit ? '/admin/groups/' + initial.id : '/admin/groups';
      var method = isEdit ? 'PUT' : 'POST';
      api(url, { method: method, body: form }).then(function () { setSaving(false); props.onDone(); }).catch(function (e) { alert(e.message); setSaving(false); });
    };

    if (loading) return h('p', null, 'Loading…');

    var sectionStyle = { marginBottom: 20, padding: 16, background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 6 };
    var sectionTitle = function (txt) { return h('h4', { style: { margin: '0 0 12px', fontSize: 14, fontWeight: 600, color: '#374151' } }, txt); };

    return h('div', { className: 'gvc-admin' },
      h('div', { className: 'gvc-admin-panel' },
        h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 } },
          h('h2', { style: { margin: 0 } }, isEdit ? 'Edit Group: ' + (initial.title || '') : 'New Addon Group'),
          h('button', { className: 'gvc-admin-btn gvc-admin-btn--secondary', onClick: props.onCancel }, '← Back to List')
        ),

        // ─── Basic info ───
        h('div', { style: sectionStyle },
          sectionTitle('Basic Info'),
          h('div', { className: 'gvc-admin-form', style: { maxWidth: 600 } },
            h('div', { className: 'gvc-admin-field' }, h('label', null, 'Title'), h('input', { type: 'text', value: form.title, onChange: function (e) { set('title', e.target.value); } })),
            h('div', { className: 'gvc-admin-field' }, h('label', null, 'Slug'), h('input', { type: 'text', value: form.slug, onChange: function (e) { set('slug', e.target.value); }, placeholder: 'auto-generated' })),
            h('div', { className: 'gvc-admin-field' }, h('label', null, 'Description'), h('textarea', { rows: 2, value: form.description, onChange: function (e) { set('description', e.target.value); } })),
            h('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12 } },
              h('div', { className: 'gvc-admin-field' }, h('label', null, 'Order'), h('input', { type: 'number', value: form.sort_order, onChange: function (e) { set('sort_order', parseInt(e.target.value) || 0); } })),
              h('div', { className: 'gvc-admin-field' }, h('label', null, 'Display'), h('select', { value: form.display_type, onChange: function (e) { set('display_type', e.target.value); } }, h('option', { value: 'radio' }, 'Radio'), h('option', { value: 'checkbox' }, 'Checkbox'), h('option', { value: 'cards' }, 'Cards'), h('option', { value: 'dropdown' }, 'Dropdown'))),
              h('div', { className: 'gvc-admin-field' }, h('label', null, 'Required'), h('select', { value: form.is_required, onChange: function (e) { set('is_required', parseInt(e.target.value)); } }, h('option', { value: 0 }, 'No'), h('option', { value: 1 }, 'Yes'))),
              h('div', { className: 'gvc-admin-field' }, h('label', null, 'Icon URL'), h('input', { type: 'url', value: form.icon_url, onChange: function (e) { set('icon_url', e.target.value); } }))
            )
          )
        ),

        // ─── Applies to: Categories ───
        h('div', { style: sectionStyle },
          sectionTitle('📁 Applies to Categories'),
          h('p', { style: { fontSize: 12, color: '#6b7280', margin: '0 0 12px' } }, 'Select which product categories this group appears on. Products in selected categories will show this configurator step.'),
          taxonomies.categories.length === 0
            ? h('p', { style: { color: '#999', fontStyle: 'italic' } }, 'No product categories found.')
            : h(CatPicker, { cats: taxonomies.categories, selected: form.assigned_categories, onToggle: toggleCat, depth: 0 })
        ),

        // ─── Applies to: Tags ───
        h('div', { style: sectionStyle },
          sectionTitle('🏷️ Applies to Tags'),
          taxonomies.tags.length === 0
            ? h('p', { style: { color: '#999', fontStyle: 'italic' } }, 'No product tags found.')
            : h('div', { style: { display: 'flex', flexWrap: 'wrap', gap: 6 } },
                taxonomies.tags.map(function (tag) {
                  var checked = form.assigned_tags.indexOf(tag.id) > -1;
                  return h('label', { key: tag.id, style: {
                    display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 20, cursor: 'pointer',
                    background: checked ? '#fef3c7' : '#fff', border: '1px solid ' + (checked ? '#f59e0b' : '#e5e7eb'), fontSize: 13, transition: 'all 0.15s',
                  } },
                    h('input', { type: 'checkbox', checked: checked, onChange: function () { toggleTag(tag.id); }, style: { display: 'none' } }),
                    h('span', null, (checked ? '✓ ' : '') + tag.name),
                    h('span', { style: { fontSize: 11, color: '#9ca3af' } }, '(' + tag.count + ')')
                  );
                })
              )
        ),

        // ─── Applies to: Specific Products ───
        h('div', { style: sectionStyle },
          sectionTitle('📦 Applies to Specific Products'),
          h('p', { style: { fontSize: 12, color: '#6b7280', margin: '0 0 12px' } }, 'Optionally assign this group to individual products (in addition to categories/tags above).'),
          h('input', { type: 'text', value: prodSearch, placeholder: 'Search products by name…', onChange: function (e) { searchProducts(e.target.value); },
            style: { width: '100%', maxWidth: 400, padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13 } }),
          prodResults.length > 0 && h('div', { style: { border: '1px solid #e5e7eb', borderRadius: 6, maxHeight: 200, overflowY: 'auto', background: '#fff', marginTop: 4, maxWidth: 400 } },
            prodResults.map(function (p) {
              var already = form.assigned_products.indexOf(p.id) > -1;
              return h('div', { key: p.id, style: { padding: '8px 12px', cursor: already ? 'default' : 'pointer', borderBottom: '1px solid #f3f4f6', fontSize: 13, opacity: already ? 0.5 : 1 }, onClick: function () { if (!already) addProduct(p); } },
                h('strong', null, p.name), p.sku ? h('span', { style: { color: '#999', marginLeft: 8 } }, 'SKU: ' + p.sku) : null,
                h('span', { style: { float: 'right', color: '#6b7280' } }, '€' + p.price),
                already ? h('span', { style: { color: '#22c55e', marginLeft: 8 } }, '✓ added') : null
              );
            })
          ),
          pickedProducts.length > 0 && h('div', { style: { marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 6 } },
            pickedProducts.map(function (p) {
              return h('span', { key: p.id, style: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: '#ede9fe', color: '#5b21b6', borderRadius: 16, fontSize: 12, fontWeight: 500 } },
                p.name,
                h('button', { onClick: function () { removeProduct(p.id); }, style: { background: 'none', border: 'none', cursor: 'pointer', color: '#7c3aed', fontWeight: 700, fontSize: 14, padding: 0, marginLeft: 2 } }, '×')
              );
            })
          )
        ),

        // ─── Save ───
        h('div', { style: { display: 'flex', gap: 8, paddingTop: 12 } },
          h('button', { className: 'gvc-admin-btn', onClick: save, disabled: saving }, saving ? 'Saving…' : (isEdit ? 'Update Group' : 'Create Group')),
          h('button', { className: 'gvc-admin-btn gvc-admin-btn--secondary', onClick: props.onCancel }, 'Cancel')
        )
      )
    );
  }

  // ─── Category Picker (recursive tree with checkboxes) ───
  function CatPicker(props) {
    var cats = props.cats; var selected = props.selected; var onToggle = props.onToggle; var depth = props.depth;
    return h('div', { style: { marginLeft: depth > 0 ? 20 : 0 } },
      cats.map(function (cat) {
        var checked = selected.indexOf(cat.id) > -1;
        return h('div', { key: cat.id },
          h('label', { style: {
            display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', marginBottom: 2, cursor: 'pointer', borderRadius: 6,
            background: checked ? '#e0f2fe' : 'transparent', transition: 'background 0.15s',
          } },
            h('input', { type: 'checkbox', checked: checked, onChange: function () { onToggle(cat.id); }, style: { width: 16, height: 16 } }),
            depth > 0 ? h('span', { style: { color: '#d1d5db', fontSize: 11 } }, '└') : null,
            h('span', { style: { fontSize: 13, fontWeight: checked ? 600 : 400 } }, cat.name),
            h('span', { style: { fontSize: 11, color: '#9ca3af', marginLeft: 4 } }, '(' + cat.count + ' products)')
          ),
          cat.children && cat.children.length > 0 ? h(CatPicker, { cats: cat.children, selected: selected, onToggle: onToggle, depth: depth + 1 }) : null
        );
      })
    );
  }

  // ═══════════════════ ITEMS PANEL ═══════════════════
  function ItemsPanel(props) {
    var group = props.group;
    var s = useState([]); var items = s[0]; var setItems = s[1];
    var s2 = useState(true); var loading = s2[0]; var setLoading = s2[1];
    var s3 = useState(false); var showForm = s3[0]; var setShowForm = s3[1];
    var s4 = useState(null); var editing = s4[0]; var setEditing = s4[1];

    var load = function () { setLoading(true); api('/admin/groups/' + group.id + '/items').then(function (d) { setItems(d); setLoading(false); }); };
    useEffect(load, []);

    var del = function (id) { if (!confirm('Delete?')) return; api('/admin/items/' + id, { method: 'DELETE' }).then(load); };
    var save = function (data) {
      var url = editing ? '/admin/items/' + editing.id : '/admin/groups/' + group.id + '/items';
      var method = editing ? 'PUT' : 'POST';
      api(url, { method: method, body: data }).then(function () { setEditing(null); setShowForm(false); load(); });
    };

    return h('div', { className: 'gvc-admin' },
      h('div', { className: 'gvc-admin-panel' },
        h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
          h('h2', null, 'Items: ' + group.title),
          h('div', { style: { display: 'flex', gap: 8 } },
            h('button', { className: 'gvc-admin-btn', onClick: function () { setEditing(null); setShowForm(true); } }, '+ Add Item'),
            h('button', { className: 'gvc-admin-btn gvc-admin-btn--secondary', onClick: props.onBack }, '← Back')
          )
        ),
        (showForm || editing) && h(ItemForm, { initial: editing, onSave: save, onCancel: function () { setEditing(null); setShowForm(false); } }),
        loading ? h('p', null, 'Loading…') :
        h('table', { className: 'gvc-admin-table' },
          h('thead', null, h('tr', null, h('th', null, '#'), h('th', null, 'Image'), h('th', null, 'Title'), h('th', null, 'Type'), h('th', null, 'Price'), h('th', null, 'SKU'), h('th', null, 'Default'), h('th', null, 'Actions'))),
          h('tbody', null,
            items.map(function (it) {
              var meta = it.meta_json ? (typeof it.meta_json === 'string' ? JSON.parse(it.meta_json) : it.meta_json) : {};
              var condCount = (meta.conditions || []).length;
              var typeLabel = it.item_type === 'guarantee' ? '🛡️ Guarantee' : (it.item_type === 'select_dropdown' ? '📋 Dropdown' : it.item_type);
              return h('tr', { key: it.id },
                h('td', null, it.sort_order),
                h('td', null, it.image_url ? h('img', { src: it.image_url, style: { width: 40, height: 40, objectFit: 'cover', borderRadius: 4 } }) : '—'),
                h('td', null, h('strong', null, it.title),
                  condCount > 0 && h('span', { style: { display: 'inline-block', marginLeft: 6, padding: '1px 6px', background: '#fef3c7', color: '#92400e', borderRadius: 10, fontSize: 10, fontWeight: 600 } }, condCount + ' condition' + (condCount > 1 ? 's' : ''))
                ),
                h('td', null, typeLabel),
                h('td', null, it.item_type === 'guarantee' ? (meta.original_price > 0 ? h('span', null, h('s', { style: { color: '#999' } }, '€' + parseFloat(meta.original_price).toFixed(2)), ' ', it.price > 0 ? '€' + parseFloat(it.price).toFixed(2) : h('span', { style: { color: '#38a169' } }, 'Free')) : (it.price > 0 ? '€' + parseFloat(it.price).toFixed(2) : 'Free')) : (it.price > 0 ? '€' + parseFloat(it.price).toFixed(2) : 'Included')),
                h('td', null, it.sku || '—'),
                h('td', null, it.is_default == 1 ? '✓' : '—'),
                h('td', null,
                  h('button', { className: 'gvc-admin-btn gvc-admin-btn--secondary', style: { marginRight: 6 }, onClick: function () { setEditing(it); setShowForm(true); } }, 'Edit'),
                  h('button', { className: 'gvc-admin-btn gvc-admin-btn--danger', onClick: function () { del(it.id); } }, 'Delete')
                )
              );
            }),
            items.length === 0 && h('tr', null, h('td', { colSpan: 8, style: { textAlign: 'center', padding: 20 } }, 'No items. Click "+ Add Item".'))
          )
        )
      )
    );
  }

  // ═══════════════════ ITEM FORM ═══════════════════
  function ItemForm(props) {
    var initial = props.initial;
    var initialMeta = initial?.meta_json ? (typeof initial.meta_json === 'string' ? JSON.parse(initial.meta_json) : initial.meta_json) : {};

    var s = useState({
      title: initial?.title || '', item_type: initial?.item_type || 'virtual', wc_product_id: initial?.wc_product_id || '',
      description: initial?.description || '', price: initial?.price || 0, image_url: initial?.image_url || '',
      sku: initial?.sku || '', sort_order: initial?.sort_order || 0, is_default: initial?.is_default || 0,
      // Guarantee fields
      subtitle: initialMeta.subtitle || '',
      original_price: initialMeta.original_price || 0,
      features: initialMeta.features || [],
      // Conditions
      conditions: initialMeta.conditions || [],
      conditions_match: initialMeta.conditions_match || 'all',
      // Select Dropdown options
      dropdown_options: initialMeta.dropdown_options || [],
      // Custom Input Fields
      custom_fields: initialMeta.custom_fields || []
    });
    var form = s[0]; var setForm = s[1];
    var s2 = useState(''); var wcS = s2[0]; var setWcS = s2[1];
    var s3 = useState([]); var wcR = s3[0]; var setWcR = s3[1];
    var s8 = useState([]); var wcAttrs = s8[0]; var setWcAttrs = s8[1];

    var set = function (k, v) { setForm(function (p) { var n = {}; for (var x in p) n[x] = p[x]; n[k] = v; return n; }); };
    var searchWc = function (t) { setWcS(t); if (t.length < 2) { setWcR([]); return; } api('/admin/wc-products?search=' + encodeURIComponent(t)).then(setWcR); };
    var pickWc = function (p) { set('wc_product_id', p.id); set('title', p.name); set('price', p.price); set('sku', p.sku || ''); set('image_url', p.image_url || ''); setWcR([]); setWcS(p.name); };
    var openMedia = function () { if (wp && wp.media) { var fr = wp.media({ title: 'Select Image', multiple: false, library: { type: 'image' } }); fr.on('select', function () { set('image_url', fr.state().get('selection').first().toJSON().url); }); fr.open(); } };

    // Load WC attributes for conditions
    useEffect(function () { api('/admin/wc-attributes').then(setWcAttrs).catch(function () {}); }, []);

    // ── Guarantee feature list helpers ──
    var addFeature = function () {
      set('features', form.features.concat([{ heading: '', text: '' }]));
    };
    var updateFeature = function (idx, field, val) {
      var updated = form.features.map(function (f, i) { if (i === idx) { var nf = {}; for (var k in f) nf[k] = f[k]; nf[field] = val; return nf; } return f; });
      set('features', updated);
    };
    var removeFeature = function (idx) {
      set('features', form.features.filter(function (_, i) { return i !== idx; }));
    };

    // ── Conditions helpers (use functional updaters to avoid stale closures) ──
    var addCondition = function () {
      setForm(function (prev) {
        var n = {}; for (var x in prev) n[x] = prev[x];
        n.conditions = prev.conditions.concat([{ source: 'attribute', attribute: '', operator: 'is', value: '' }]);
        return n;
      });
    };
    var updateCondition = function (idx, field, val) {
      setForm(function (prev) {
        var newConds = prev.conditions.map(function (c, i) {
          if (i !== idx) return c;
          var nc = {}; for (var k in c) nc[k] = c[k];
          nc[field] = val;
          return nc;
        });
        var n = {}; for (var x in prev) n[x] = prev[x];
        n.conditions = newConds;
        return n;
      });
    };
    var updateConditionFields = function (idx, fields) {
      setForm(function (prev) {
        var newConds = prev.conditions.map(function (c, i) {
          if (i !== idx) return c;
          var nc = {}; for (var k in c) nc[k] = c[k];
          for (var f in fields) nc[f] = fields[f];
          return nc;
        });
        var n = {}; for (var x in prev) n[x] = prev[x];
        n.conditions = newConds;
        return n;
      });
    };
    var removeCondition = function (idx) {
      setForm(function (prev) {
        var n = {}; for (var x in prev) n[x] = prev[x];
        n.conditions = prev.conditions.filter(function (_, i) { return i !== idx; });
        return n;
      });
    };

    // ── Select Dropdown option helpers ──
    var addDropdownOption = function () {
      set('dropdown_options', form.dropdown_options.concat([{ label: '', image_url: '', price: 0 }]));
    };
    var updateDropdownOption = function (idx, field, val) {
      var updated = form.dropdown_options.map(function (o, i) { if (i === idx) { var no = {}; for (var k in o) no[k] = o[k]; no[field] = val; return no; } return o; });
      set('dropdown_options', updated);
    };
    var removeDropdownOption = function (idx) {
      set('dropdown_options', form.dropdown_options.filter(function (_, i) { return i !== idx; }));
    };
    var openMediaForDropdown = function (idx) {
      if (wp && wp.media) {
        var fr = wp.media({ title: 'Select Image', multiple: false, library: { type: 'image' } });
        fr.on('select', function () { updateDropdownOption(idx, 'image_url', fr.state().get('selection').first().toJSON().url); });
        fr.open();
      }
    };

    // ── Custom Input Fields helpers ──
    var addCustomField = function () {
      set('custom_fields', form.custom_fields.concat([{ key: '', label: '', type: 'number', unit: 'mm', required: true, placeholder: '' }]));
    };
    var updateCustomFieldFn = function (idx, field, val) {
      var updated = form.custom_fields.map(function (f, i) { if (i === idx) { var nf = {}; for (var k in f) nf[k] = f[k]; nf[field] = val; return nf; } return f; });
      set('custom_fields', updated);
    };
    var removeCustomField = function (idx) {
      set('custom_fields', form.custom_fields.filter(function (_, i) { return i !== idx; }));
    };

    // ── Build save payload ──
    var handleSave = function () {
      var payload = {
        title: form.title, item_type: form.item_type, wc_product_id: form.wc_product_id,
        description: form.description, price: form.price, image_url: form.image_url,
        sku: form.sku, sort_order: form.sort_order, is_default: form.is_default,
        meta: {}
      };
      // Guarantee meta
      if (form.item_type === 'guarantee') {
        payload.meta.subtitle = form.subtitle;
        payload.meta.original_price = form.original_price;
        payload.meta.features = form.features;
      }
      // Select Dropdown meta
      if (form.item_type === 'select_dropdown') {
        payload.meta.dropdown_options = form.dropdown_options;
        payload.price = 0; // no price for dropdown type
      }
      // Conditions meta (applies to ALL item types)
      if (form.conditions.length > 0) {
        payload.meta.conditions = form.conditions;
        payload.meta.conditions_match = form.conditions_match;
      }
      // Custom input fields meta
      if (form.custom_fields.length > 0) {
        payload.meta.custom_fields = form.custom_fields;
      }
      props.onSave(payload);
    };

    var sectionStyle = { marginTop: 16, padding: 16, background: '#f0f7ff', border: '1px solid #c3dafe', borderRadius: 6 };
    var condSectionStyle = { marginTop: 16, padding: 16, background: '#fef9f0', border: '1px solid #fde6b0', borderRadius: 6 };

    return h('div', { className: 'gvc-admin-panel', style: { marginTop: 16, background: '#fffef5', border: '1px solid #e2e0c8' } },
      h('h3', { style: { margin: '0 0 16px' } }, initial ? 'Edit Item' : 'New Item'),
      h('div', { className: 'gvc-admin-form', style: { maxWidth: 650 } },

        // ─── Item Type ───
        h('div', { className: 'gvc-admin-field' }, h('label', null, 'Item Type'),
          h('select', { value: form.item_type, onChange: function (e) { set('item_type', e.target.value); } },
            h('option', { value: 'virtual' }, 'Virtual Add-on'),
            h('option', { value: 'wc_product' }, 'WooCommerce Product'),
            h('option', { value: 'guarantee' }, 'Guarantee Package'),
            h('option', { value: 'select_dropdown' }, 'Select Dropdown (no price)')
          )
        ),

        // ─── WC Product search ───
        form.item_type === 'wc_product' && h(Fragment, null,
          h('div', { className: 'gvc-admin-field' }, h('label', null, 'Search WC Product'),
            h('input', { type: 'text', value: wcS, placeholder: 'Type to search…', onChange: function (e) { searchWc(e.target.value); } }),
            wcR.length > 0 && h('div', { style: { border: '1px solid #ddd', borderRadius: 4, maxHeight: 200, overflowY: 'auto', background: '#fff', marginTop: 4 } },
              wcR.map(function (p) { return h('div', { key: p.id, style: { padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid #f0f0f0', fontSize: 13 }, onClick: function () { pickWc(p); } }, h('strong', null, p.name), h('span', { style: { float: 'right' } }, '€' + p.price)); })
            )
          ),
          form.wc_product_id && h('p', { style: { fontSize: 12, color: '#666' } }, 'Linked: Product #' + form.wc_product_id)
        ),

        // ─── Common fields ───
        h('div', { className: 'gvc-admin-field' }, h('label', null, 'Title'), h('input', { type: 'text', value: form.title, onChange: function (e) { set('title', e.target.value); } })),
        h('div', { className: 'gvc-admin-field' }, h('label', null, 'Description'), h('textarea', { rows: 2, value: form.description, onChange: function (e) { set('description', e.target.value); } })),

        // ─── Guarantee-specific fields ───
        form.item_type === 'guarantee' && h('div', { style: sectionStyle },
          h('h4', { style: { margin: '0 0 12px', fontSize: 14, fontWeight: 600, color: '#1e40af' } }, '🛡️ Guarantee Package Settings'),
          h('div', { className: 'gvc-admin-field' }, h('label', null, 'Subtitle'), h('input', { type: 'text', value: form.subtitle, placeholder: 'e.g. Jetzt kostenlos enthalten – für einen sorgenfreien Aufbau', onChange: function (e) { set('subtitle', e.target.value); } })),
          h('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 } },
            h('div', { className: 'gvc-admin-field' }, h('label', null, 'Original Price (€) — shown as strikethrough'), h('input', { type: 'number', step: '0.01', value: form.original_price, onChange: function (e) { set('original_price', parseFloat(e.target.value) || 0); } })),
            h('div', { className: 'gvc-admin-field' }, h('label', null, 'Sale Price (€) — 0 for free/included'), h('input', { type: 'number', step: '0.01', value: form.price, onChange: function (e) { set('price', parseFloat(e.target.value) || 0); } }))
          ),
          h('div', { style: { marginTop: 12 } },
            h('label', { style: { fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 8 } }, 'Feature List'),
            form.features.map(function (feat, idx) {
              return h('div', { key: idx, style: { display: 'flex', gap: 8, marginBottom: 8, alignItems: 'flex-start' } },
                h('div', { style: { flex: 1 } },
                  h('input', { type: 'text', value: feat.heading, placeholder: 'Feature heading (bold)', style: { width: '100%', marginBottom: 4, padding: '6px 8px', border: '1px solid #c3dafe', borderRadius: 4, fontSize: 13, fontWeight: 600 }, onChange: function (e) { updateFeature(idx, 'heading', e.target.value); } }),
                  h('textarea', { rows: 2, value: feat.text, placeholder: 'Feature description text…', style: { width: '100%', padding: '6px 8px', border: '1px solid #c3dafe', borderRadius: 4, fontSize: 13 }, onChange: function (e) { updateFeature(idx, 'text', e.target.value); } })
                ),
                h('button', { type: 'button', style: { background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 4, padding: '4px 8px', cursor: 'pointer', color: '#dc2626', fontSize: 16, lineHeight: 1 }, onClick: function () { removeFeature(idx); } }, '×')
              );
            }),
            h('button', { type: 'button', className: 'gvc-admin-btn gvc-admin-btn--secondary', style: { fontSize: 12, padding: '4px 12px' }, onClick: addFeature }, '+ Add Feature')
          )
        ),

        // ─── Select Dropdown options section ───
        form.item_type === 'select_dropdown' && h('div', { style: { marginTop: 16, padding: 16, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 6 } },
          h('h4', { style: { margin: '0 0 4px', fontSize: 14, fontWeight: 600, color: '#166534' } }, '📋 Dropdown Options'),
          h('p', { style: { fontSize: 12, margin: '0 0 12px', color: '#15803d' } }, 'Add selectable options for this dropdown. Each option can have a label, image, and price.'),
          form.dropdown_options.map(function (opt, idx) {
            return h('div', { key: idx, style: { display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center', padding: 10, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 6 } },
              opt.image_url ? h('img', { src: opt.image_url, style: { width: 40, height: 40, objectFit: 'cover', borderRadius: 4, flexShrink: 0 } }) : h('div', { style: { width: 40, height: 40, background: '#f3f4f6', borderRadius: 4, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: '#9ca3af' } }, '📷'),
              h('input', { type: 'text', value: opt.label, placeholder: 'Option label (e.g. Opal Polycarbonat)', style: { flex: 1, padding: '6px 8px', border: '1px solid #d1d5db', borderRadius: 4, fontSize: 13 }, onChange: function (e) { updateDropdownOption(idx, 'label', e.target.value); } }),
              h('input', { type: 'number', step: '0.01', value: opt.price || 0, placeholder: 'Price (€)', style: { width: 90, padding: '6px 8px', border: '1px solid #d1d5db', borderRadius: 4, fontSize: 13 }, onChange: function (e) { updateDropdownOption(idx, 'price', parseFloat(e.target.value) || 0); } }),
              h('button', { type: 'button', className: 'gvc-admin-btn gvc-admin-btn--secondary', style: { fontSize: 11, padding: '4px 8px' }, onClick: function () { openMediaForDropdown(idx); } }, '📷'),
              h('button', { type: 'button', style: { background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 4, padding: '4px 8px', cursor: 'pointer', color: '#dc2626', fontSize: 14, lineHeight: 1.2 }, onClick: function () { removeDropdownOption(idx); } }, '×')
            );
          }),
          h('button', { type: 'button', className: 'gvc-admin-btn gvc-admin-btn--secondary', style: { fontSize: 12, padding: '4px 12px' }, onClick: addDropdownOption }, '+ Add Option')
        ),

        // ─── Price / SKU / Sort (for virtual and wc_product types only) ───
        (form.item_type !== 'guarantee' && form.item_type !== 'select_dropdown') && h('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 } },
          h('div', { className: 'gvc-admin-field' }, h('label', null, 'Price (€)'), h('input', { type: 'number', step: '0.01', value: form.price, onChange: function (e) { set('price', parseFloat(e.target.value) || 0); } })),
          h('div', { className: 'gvc-admin-field' }, h('label', null, 'SKU'), h('input', { type: 'text', value: form.sku, onChange: function (e) { set('sku', e.target.value); } })),
          h('div', { className: 'gvc-admin-field' }, h('label', null, 'Sort Order'), h('input', { type: 'number', value: form.sort_order, onChange: function (e) { set('sort_order', parseInt(e.target.value) || 0); } }))
        ),
        (form.item_type === 'guarantee' || form.item_type === 'select_dropdown') && h('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 } },
          h('div', { className: 'gvc-admin-field' }, h('label', null, 'SKU'), h('input', { type: 'text', value: form.sku, onChange: function (e) { set('sku', e.target.value); } })),
          h('div', { className: 'gvc-admin-field' }, h('label', null, 'Sort Order'), h('input', { type: 'number', value: form.sort_order, onChange: function (e) { set('sort_order', parseInt(e.target.value) || 0); } }))
        ),

        // ─── Image ───
        h('div', { className: 'gvc-admin-field' }, h('label', null, 'Image URL'),
          h('div', { style: { display: 'flex', gap: 8 } },
            h('input', { type: 'url', value: form.image_url, onChange: function (e) { set('image_url', e.target.value); }, style: { flex: 1 } }),
            h('button', { type: 'button', className: 'gvc-admin-btn gvc-admin-btn--secondary', onClick: openMedia }, 'Media')
          ),
          form.image_url && h('img', { src: form.image_url, style: { width: 60, height: 60, objectFit: 'cover', marginTop: 8, borderRadius: 4 } })
        ),
        h('div', { className: 'gvc-admin-field' }, h('label', null, h('input', { type: 'checkbox', checked: form.is_default == 1, onChange: function (e) { set('is_default', e.target.checked ? 1 : 0); } }), ' Default selection')),

        // ═══════════ CUSTOM INPUT FIELDS SECTION ═══════════
        (form.item_type === 'virtual' || form.item_type === 'wc_product') && h('div', { style: { marginTop: 16, padding: 16, background: '#f0fdf9', border: '1px solid #99f6e4', borderRadius: 6 } },
          h('h4', { style: { margin: '0 0 4px', fontSize: 14, fontWeight: 600, color: '#0f766e' } }, '📐 Custom Input Fields'),
          h('p', { style: { fontSize: 12, color: '#0d9488', margin: '0 0 12px' } }, 'Add custom input fields that customers must fill in when selecting this addon (e.g. Width, Depth for cut-to-size). Values appear in cart & order.'),
          form.custom_fields.map(function (cf, idx) {
            return h('div', { key: idx, style: { display: 'flex', gap: 6, marginBottom: 8, alignItems: 'center', padding: 10, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 6, flexWrap: 'wrap' } },
              h('input', { type: 'text', value: cf.key, placeholder: 'Key (e.g. custom_width)', style: { width: 140, padding: '6px 8px', border: '1px solid #d1d5db', borderRadius: 4, fontSize: 12 }, onChange: function (e) { updateCustomFieldFn(idx, 'key', e.target.value); } }),
              h('input', { type: 'text', value: cf.label, placeholder: 'Label (e.g. Ihre Wunschbreite)', style: { flex: 1, minWidth: 160, padding: '6px 8px', border: '1px solid #d1d5db', borderRadius: 4, fontSize: 12 }, onChange: function (e) { updateCustomFieldFn(idx, 'label', e.target.value); } }),
              h('input', { type: 'text', value: cf.placeholder || '', placeholder: 'Placeholder (e.g. z.B. 2500)', style: { width: 150, padding: '6px 8px', border: '1px solid #d1d5db', borderRadius: 4, fontSize: 12 }, onChange: function (e) { updateCustomFieldFn(idx, 'placeholder', e.target.value); } }),
              h('select', { value: cf.type || 'number', style: { width: 80, padding: '6px 4px', border: '1px solid #d1d5db', borderRadius: 4, fontSize: 12 }, onChange: function (e) { updateCustomFieldFn(idx, 'type', e.target.value); } },
                h('option', { value: 'number' }, 'Number'),
                h('option', { value: 'text' }, 'Text')
              ),
              h('input', { type: 'text', value: cf.unit || '', placeholder: 'Unit (mm)', style: { width: 60, padding: '6px 8px', border: '1px solid #d1d5db', borderRadius: 4, fontSize: 12 }, onChange: function (e) { updateCustomFieldFn(idx, 'unit', e.target.value); } }),
              h('label', { style: { display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, whiteSpace: 'nowrap' } },
                h('input', { type: 'checkbox', checked: cf.required !== false, onChange: function (e) { updateCustomFieldFn(idx, 'required', e.target.checked); } }),
                'Req'
              ),
              h('button', { type: 'button', style: { background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 4, padding: '2px 8px', cursor: 'pointer', color: '#dc2626', fontSize: 14, lineHeight: 1.4 }, onClick: function () { removeCustomField(idx); } }, '×')
            );
          }),
          h('button', { type: 'button', className: 'gvc-admin-btn gvc-admin-btn--secondary', style: { fontSize: 12, padding: '4px 12px' }, onClick: addCustomField }, '+ Add Field')
        ),

        // ═══════════ CONDITIONS SECTION ═══════════
        h('div', { style: condSectionStyle },
          h('h4', { style: { margin: '0 0 4px', fontSize: 14, fontWeight: 600, color: '#92400e' } }, '⚙️ Visibility Conditions'),
          h('p', { style: { fontSize: 12, color: '#78716c', margin: '0 0 12px' } }, 'Show this item only when the viewed product matches these conditions. If no conditions are set, the item is always visible.'),
          form.conditions.length > 0 && h('div', { style: { marginBottom: 12 } },
            h('label', { style: { fontSize: 12, fontWeight: 600 } }, 'Match: '),
            h('select', { value: form.conditions_match, onChange: function (e) { set('conditions_match', e.target.value); }, style: { fontSize: 12, padding: '2px 6px' } },
              h('option', { value: 'all' }, 'ALL conditions (AND)'),
              h('option', { value: 'any' }, 'ANY condition (OR)')
            )
          ),
          form.conditions.map(function (cond, idx) {
            return h('div', { key: idx, className: 'gvc-condition-row', style: { display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap', alignItems: 'center', padding: 10, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 6 } },
              h('select', { value: cond.source, style: { fontSize: 12, padding: '4px 6px', minWidth: 130 }, onChange: function (e) { updateConditionFields(idx, { source: e.target.value, attribute: '', value: '' }); } },
                h('option', { value: 'attribute' }, 'Product Attribute'),
                h('option', { value: 'category' }, 'Product Category'),
                h('option', { value: 'tag' }, 'Product Tag')
              ),
              cond.source === 'attribute' && h(Fragment, null,
                h('select', { value: cond.attribute || '', style: { fontSize: 12, padding: '4px 6px', minWidth: 150 }, onChange: function (e) { updateConditionFields(idx, { attribute: e.target.value, value: '' }); } },
                  h('option', { value: '' }, '— Select Attribute —'),
                  wcAttrs.map(function (a) { return h('option', { key: a.slug, value: a.slug }, a.name); })
                ),
                h('select', { value: cond.operator, style: { fontSize: 12, padding: '4px 6px' }, onChange: function (e) { updateCondition(idx, 'operator', e.target.value); } },
                  h('option', { value: 'is' }, 'Is'),
                  h('option', { value: 'is_not' }, 'Is Not'),
                  h('option', { value: 'contains' }, 'Contains'),
                  h('option', { value: 'greater_than' }, 'Greater Than'),
                  h('option', { value: 'less_than' }, 'Less Than')
                ),
                (function () {
                  var selectedAttr = wcAttrs.find(function (a) { return a.slug === cond.attribute; });
                  var terms = selectedAttr ? selectedAttr.terms : [];
                  if (terms.length > 0) {
                    return h('select', { value: cond.value || '', style: { fontSize: 12, padding: '4px 6px', flex: 1, minWidth: 140 }, onChange: function (e) { updateCondition(idx, 'value', e.target.value); } },
                      h('option', { value: '' }, '— Select Value —'),
                      terms.map(function (t) { return h('option', { key: t.slug, value: t.name }, t.name); })
                    );
                  }
                  return h('input', { type: 'text', value: cond.value || '', placeholder: 'Value…', style: { fontSize: 12, padding: '4px 8px', flex: 1, minWidth: 100, border: '1px solid #d1d5db', borderRadius: 4 }, onChange: function (e) { updateCondition(idx, 'value', e.target.value); } });
                })()
              ),
              cond.source === 'category' && h(Fragment, null,
                h('select', { value: cond.operator || 'is', style: { fontSize: 12, padding: '4px 6px' }, onChange: function (e) { updateCondition(idx, 'operator', e.target.value); } },
                  h('option', { value: 'is' }, 'Is In'),
                  h('option', { value: 'is_not' }, 'Is Not In')
                ),
                h('input', { type: 'text', value: cond.value || '', placeholder: 'Category slug or ID…', style: { fontSize: 12, padding: '4px 8px', flex: 1, minWidth: 140, border: '1px solid #d1d5db', borderRadius: 4 }, onChange: function (e) { updateCondition(idx, 'value', e.target.value); } })
              ),
              cond.source === 'tag' && h(Fragment, null,
                h('select', { value: cond.operator || 'is', style: { fontSize: 12, padding: '4px 6px' }, onChange: function (e) { updateCondition(idx, 'operator', e.target.value); } },
                  h('option', { value: 'is' }, 'Has Tag'),
                  h('option', { value: 'is_not' }, 'Does Not Have Tag')
                ),
                h('input', { type: 'text', value: cond.value || '', placeholder: 'Tag slug or ID…', style: { fontSize: 12, padding: '4px 8px', flex: 1, minWidth: 140, border: '1px solid #d1d5db', borderRadius: 4 }, onChange: function (e) { updateCondition(idx, 'value', e.target.value); } })
              ),
              h('button', { type: 'button', style: { background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 4, padding: '2px 8px', cursor: 'pointer', color: '#dc2626', fontSize: 14, lineHeight: 1.4 }, onClick: function () { removeCondition(idx); } }, '×')
            );
          }),
          h('button', { type: 'button', className: 'gvc-admin-btn gvc-admin-btn--secondary', style: { fontSize: 12, padding: '4px 12px' }, onClick: addCondition }, '+ Add Condition')
        ),

        // ─── Save ───
        h('div', { style: { display: 'flex', gap: 8, marginTop: 12 } },
          h('button', { className: 'gvc-admin-btn', onClick: handleSave }, initial ? 'Update Item' : 'Create Item'),
          h('button', { className: 'gvc-admin-btn gvc-admin-btn--secondary', onClick: props.onCancel }, 'Cancel')
        )
      )
    );
  }

  // ═══════════════════ SETTINGS ═══════════════════
  function SettingsPage() {
    var s = useState({}); var st = s[0]; var setSt = s[1];
    var s2 = useState(true); var loading = s2[0]; var setLoading = s2[1];
    var s3 = useState(false); var saving = s3[0]; var setSaving = s3[1];
    useEffect(function () { api('/admin/settings').then(function (d) { setSt(d); setLoading(false); }); }, []);
    var set = function (k, v) { setSt(function (p) { var n = {}; for (var x in p) n[x] = p[x]; n[k] = v; return n; }); };
    var save = function () { setSaving(true); api('/admin/settings', { method: 'POST', body: st }).then(function (r) { setSt(r.settings); setSaving(false); alert('Saved!'); }).catch(function (e) { alert(e.message); setSaving(false); }); };
    if (loading) return h('p', null, 'Loading…');
    return h('div', { className: 'gvc-admin' },
      h('div', { className: 'gvc-admin-panel' },
        h('h2', null, 'Configurator Settings'),
        h('div', { className: 'gvc-admin-form', style: { maxWidth: 500 } },
          h('div', { className: 'gvc-admin-field' }, h('label', null, h('input', { type: 'checkbox', checked: !!st.enable_cache, onChange: function (e) { set('enable_cache', e.target.checked); } }), ' Enable caching (Redis/Memcached)')),
          h('div', { className: 'gvc-admin-field' }, h('label', null, 'Cache TTL (seconds)'), h('input', { type: 'number', value: st.cache_ttl || 3600, onChange: function (e) { set('cache_ttl', parseInt(e.target.value) || 3600); } })),
          h('div', { className: 'gvc-admin-field' }, h('label', null, h('input', { type: 'checkbox', checked: !!st.lazy_load_images, onChange: function (e) { set('lazy_load_images', e.target.checked); } }), ' Lazy load addon images')),
          h('div', { className: 'gvc-admin-field' }, h('label', null, h('input', { type: 'checkbox', checked: !!st.show_vat_breakdown, onChange: function (e) { set('show_vat_breakdown', e.target.checked); } }), ' Show VAT breakdown')),
          h('div', { className: 'gvc-admin-field' }, h('label', null, 'Primary Color'), h('input', { type: 'color', value: st.primary_color || '#2D6A4F', onChange: function (e) { set('primary_color', e.target.value); }, style: { width: 60, height: 36 } })),
          h('div', { className: 'gvc-admin-field' }, h('label', null, 'Accent Color'), h('input', { type: 'color', value: st.accent_color || '#40916C', onChange: function (e) { set('accent_color', e.target.value); }, style: { width: 60, height: 36 } })),
          h('button', { className: 'gvc-admin-btn', style: { marginTop: 16 }, onClick: save, disabled: saving }, saving ? 'Saving…' : 'Save Settings')
        )
      )
    );
  }

  // ═══════════════════ MOUNT ═══════════════════
  var root = document.getElementById('gvc-admin-root');
  if (root) {
    var page = new URLSearchParams(window.location.search).get('page');
    if (page === 'gvc-settings') render(h(SettingsPage), root);
    else render(h(App), root);
  }
})();
