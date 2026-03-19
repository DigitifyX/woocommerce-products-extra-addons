/**
 * Product Meta Box – overrides UI for WC product edit page.
 */

(function ($) {
  'use strict';

  const cfg = window.gvcProductMeta || {};
  const groups = cfg.groups || [];

  function init() {
    const $container = $('#gvc-product-overrides-app');
    const $hidden = $('#gvc_overrides_json');

    if (!$container.length) return;

    let overrides = [];
    try {
      overrides = JSON.parse($hidden.val()) || [];
    } catch (e) {
      overrides = [];
    }

    function render() {
      $hidden.val(JSON.stringify(overrides));

      let html = '<div class="gvc-po-list">';

      if (overrides.length === 0) {
        html += '<p style="color:#999;font-style:italic">No overrides set. This product uses global category/tag rules.</p>';
      } else {
        html += '<table style="width:100%;border-collapse:collapse;font-size:13px">';
        html += '<thead><tr><th style="text-align:left;padding:6px">Group</th><th style="text-align:left;padding:6px">Override Type</th><th style="padding:6px">Action</th></tr></thead>';
        html += '<tbody>';

        overrides.forEach((o, idx) => {
          const group = groups.find(g => g.id == o.group_id);
          html += `<tr>
            <td style="padding:6px">${group ? group.title : `Group #${o.group_id}`}</td>
            <td style="padding:6px">
              <select class="gvc-po-type" data-idx="${idx}">
                <option value="include" ${o.override_type === 'include' ? 'selected' : ''}>Include</option>
                <option value="exclude" ${o.override_type === 'exclude' ? 'selected' : ''}>Exclude</option>
              </select>
            </td>
            <td style="padding:6px;text-align:center">
              <button type="button" class="button gvc-po-remove" data-idx="${idx}">Remove</button>
            </td>
          </tr>`;
        });

        html += '</tbody></table>';
      }

      html += '<div style="margin-top:12px">';
      html += '<select id="gvc-po-add-group" style="margin-right:8px">';
      html += '<option value="">— Select Group —</option>';
      groups.forEach(g => {
        html += `<option value="${g.id}">${g.title}</option>`;
      });
      html += '</select>';
      html += '<button type="button" class="button button-primary" id="gvc-po-add-btn">Add Override</button>';
      html += '</div>';

      html += '</div>';

      $container.html(html);
    }

    // Event delegation
    $container.on('click', '#gvc-po-add-btn', function () {
      const groupId = $('#gvc-po-add-group').val();
      if (!groupId) return;
      if (overrides.find(o => o.group_id == groupId)) {
        alert('This group is already added.');
        return;
      }
      overrides.push({ group_id: parseInt(groupId), type: 'include', override_type: 'include' });
      render();
    });

    $container.on('click', '.gvc-po-remove', function () {
      const idx = parseInt($(this).data('idx'));
      overrides.splice(idx, 1);
      render();
    });

    $container.on('change', '.gvc-po-type', function () {
      const idx = parseInt($(this).data('idx'));
      overrides[idx].override_type = $(this).val();
      overrides[idx].type = $(this).val();
      $hidden.val(JSON.stringify(overrides));
    });

    render();
  }

  $(document).ready(init);

})(jQuery);
