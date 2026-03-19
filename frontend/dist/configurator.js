(() => {
  "use strict";
  const e = window.React,
    t = window.wp.element,
    a = window.gvcFrontend || {};
  function n(e) {
    var t;
    const n = null !== (t = a.decimals) && void 0 !== t ? t : 2,
      c = a.decimalSep || ",",
      l = a.thousandSep || ".",
      s = a.currencySymbol || "€",
      r = a.currencyPos || "left",
      i = parseFloat(e).toFixed(n),
      [o, m] = i.split("."),
      d = o.replace(/\B(?=(\d{3})+(?!\d))/g, l),
      g = n > 0 ? `${d}${c}${m}` : d;
    switch (r) {
      case "left":
      default:
        return `${s}${g}`;
      case "left_space":
        return `${s} ${g}`;
      case "right":
        return `${g}${s}`;
      case "right_space":
        return `${g} ${s}`;
    }
  }
  const c = window.gvcFrontend || {};
  function l({
    item: a,
    isSelected: c,
    displayType: l,
    onSelect: s,
    onInfo: r,
    quantity: i,
    onQuantityChange: o,
    lazyLoad: m,
  }) {
    const [d, g] = (0, t.useState)(!1),
      [u, v] = (0, t.useState)(i || 1),
      p = (0, t.useRef)(null);
    ((0, t.useEffect)(() => {
      v(i || 1);
    }, [i]),
      (0, t.useEffect)(() => {
        if (!m || !p.current || !a.image_url) return;
        const e = new IntersectionObserver(
          ([t]) => {
            t.isIntersecting && ((p.current.src = a.image_url), e.disconnect());
          },
          { rootMargin: "200px" },
        );
        return (e.observe(p.current), () => e.disconnect());
      }, [a.image_url, m]));
    const _ = parseFloat(a.price) || 0,
      E = 0 === _,
      b = !1 === a.in_stock;
    let y = "gvc-item";
    (c && (y += " gvc-item--selected"), b && (y += " gvc-item--disabled"));
    const N = (e, t) => {
      (t.preventDefault(), t.stopPropagation());
      const a = Math.max(1, e);
      (v(a), c && o && o(a));
    };
    // ── Select Dropdown Rendering ──
    if (a.item_type === "select_dropdown") {
      const ddMeta = a.meta_json || {};
      const ddOpts = ddMeta.dropdown_options || [];
      const [ddOpen, setDdOpen] = (0, t.useState)(!1);
      const [ddSelected, setDdSelected] = (0, t.useState)(ddOpts.length > 0 ? 0 : -1);
      const currentOpt = ddSelected >= 0 ? ddOpts[ddSelected] : null;
      const handleDdSelect = (idx) => {
        setDdSelected(idx);
        setDdOpen(!1);
        if (s) s(1);
      };
      return (0, e.createElement)("div", { className: "gvc-select-dropdown" },
        (0, e.createElement)("div", {
          className: "gvc-select-dropdown__trigger" + (ddOpen ? " gvc-select-dropdown__trigger--open" : ""),
          onClick: () => setDdOpen(!ddOpen)
        },
          currentOpt && currentOpt.image_url && (0, e.createElement)("img", { src: currentOpt.image_url, className: "gvc-select-dropdown__img", alt: currentOpt.label }),
          (0, e.createElement)("span", { className: "gvc-select-dropdown__label" }, currentOpt ? currentOpt.label : (a.title || "Select...")),
          (0, e.createElement)("span", { className: "gvc-select-dropdown__arrow" }, ddOpen ? "▲" : "▼")
        ),
        ddOpen && ddOpts.length > 0 && (0, e.createElement)("div", { className: "gvc-select-dropdown__list" },
          ddOpts.map((opt, oi) => (0, e.createElement)("div", {
            key: oi,
            className: "gvc-select-dropdown__option" + (oi === ddSelected ? " gvc-select-dropdown__option--active" : ""),
            onClick: () => handleDdSelect(oi)
          },
            opt.image_url && (0, e.createElement)("img", { src: opt.image_url, className: "gvc-select-dropdown__img", alt: opt.label }),
            (0, e.createElement)("span", { className: "gvc-select-dropdown__label" }, opt.label),
            oi === ddSelected && (0, e.createElement)("span", { className: "gvc-select-dropdown__check" }, "▲")
          ))
        )
      );
    }
    // ── Guarantee Card Rendering ──
    if (a.item_type === "guarantee") {
      const gd = a.guarantee_data || {};
      const gFeats = gd.features || [];
      const origPrice = gd.original_price || 0;
      const salePrice = _ ;
      let gCls = "gvc-guarantee";
      if (c) gCls += " gvc-guarantee--selected";
      return (0, e.createElement)("div", {
        className: gCls,
        onClick: () => s && s(c ? null : 1),
        style: { cursor: "pointer" }
      },
        (0, e.createElement)("div", { className: "gvc-guarantee__header" },
          (0, e.createElement)("div", { className: "gvc-guarantee__check" },
            (0, e.createElement)("span", {
              className: l === "radio" ? ("gvc-radio" + (c ? " gvc-radio--on" : "")) : ("gvc-checkbox" + (c ? " gvc-checkbox--on" : ""))
            })
          ),
          (0, e.createElement)("div", { className: "gvc-guarantee__info" },
            (0, e.createElement)("div", { className: "gvc-guarantee__title-row" },
              (0, e.createElement)("h4", { className: "gvc-guarantee__title" }, a.title),
              (0, e.createElement)("div", { className: "gvc-guarantee__pricing" },
                origPrice > 0 && (0, e.createElement)("span", { className: "gvc-guarantee__original-price" }, n(origPrice)),
                (0, e.createElement)("span", { className: "gvc-guarantee__sale-price" }, salePrice > 0 ? n(salePrice) : "Kostenlos")
              )
            ),
            gd.subtitle && (0, e.createElement)("p", { className: "gvc-guarantee__subtitle" }, "(" + gd.subtitle + ")")
          )
        ),
        gFeats.length > 0 && (0, e.createElement)("ul", { className: "gvc-guarantee__features" },
          gFeats.map((feat, fi) => (0, e.createElement)("li", { key: fi, className: "gvc-guarantee__feature" },
            (0, e.createElement)("span", { className: "gvc-guarantee__feature-icon" }, "✓"),
            (0, e.createElement)("div", { className: "gvc-guarantee__feature-body" },
              feat.heading && (0, e.createElement)("p", { className: "gvc-guarantee__feature-heading" }, feat.heading),
              feat.text && (0, e.createElement)("p", { className: "gvc-guarantee__feature-text" }, feat.text)
            )
          ))
        )
      );
    }
    return (0, e.createElement)(
      "div",
      { className: y },
      a.image_url &&
        (0, e.createElement)(
          "div",
          { className: "gvc-item__img-wrap" },
          (0, e.createElement)("img", {
            ref: p,
            src: m ? "" : a.image_url,
            alt: a.title,
            className: "gvc-item__img " + (d ? "gvc-item__img--loaded" : ""),
            onLoad: () => g(!0),
            width: "120",
            height: "120",
          }),
          !d &&
            (0, e.createElement)("div", {
              className: "gvc-item__img-placeholder",
            }),
        ),
      (0, e.createElement)(
        "div",
        { className: "gvc-item__body" },
        (0, e.createElement)(
          "div",
          { className: "gvc-item__content-col" },
          (0, e.createElement)(
            "div",
            { className: "gvc-item__title-row" },
            (0, e.createElement)(
              "h4",
              { className: "gvc-item__title" },
              a.title,
            ),
            a.description &&
              (0, e.createElement)(
                "button",
                {
                  type: "button",
                  className: "gvc-info-btn gvc-info-btn--card",
                  onClick: (e) => {
                    (e.preventDefault(), e.stopPropagation(), r());
                  },
                  title: "Meer informatie",
                },
                "i",
              ),
          ),
          a.sku &&
            (0, e.createElement)(
              "span",
              { className: "gvc-item__sku" },
              "SKU: ",
              a.sku,
            ),
          (0, e.createElement)(
            "div",
            { className: "gvc-item__price" },
            E
              ? (0, e.createElement)(
                  "span",
                  { className: "gvc-item__price--included" },
                  "Inclusief",
                )
              : (0, e.createElement)(
                  "span",
                  { className: "gvc-item__price--amount" },
                  "(+ ",
                  n(_),
                  ")",
                ),
          ),
          b &&
            (0, e.createElement)(
              "span",
              { className: "gvc-item__stock gvc-item__stock--out" },
              "Niet op voorraad",
            ),
        ),
      ),
      !b &&
        (0, e.createElement)(
          "div",
          {
            className: "gvc-item__action-row",
            onClick: (e) => e.stopPropagation(),
          },
          (0, e.createElement)(
            "div",
            { className: "gvc-item__qty" },
            (0, e.createElement)(
              "button",
              {
                type: "button",
                className: "gvc-qty-btn",
                onClick: (e) => N(u - 1, e),
                disabled: u <= 1,
              },
              "−",
            ),
            (0, e.createElement)("span", { className: "gvc-qty-val" }, u),
            (0, e.createElement)(
              "button",
              {
                type: "button",
                className: "gvc-qty-btn",
                onClick: (e) => N(u + 1, e),
              },
              "+",
            ),
          ),
          (0, e.createElement)(
            "button",
            {
              type: "button",
              className: "gvc-btn gvc-btn--add " + (c ? "gvc-btn--added" : ""),
              onClick: (e) => {
                (e.preventDefault(), e.stopPropagation(), b || s(u));
              },
              "aria-label": c ? "Hinzugefügt" : "Hinzufügen",
              title: c ? "Hinzugefügt" : "Hinzufügen",
            },
            c ? "✓" : "+",
          ),
        ),
    );
  }
  function s({
    group: a,
    selection: n,
    onSelect: c,
    onClear: s,
    onQuantityChange: r,
    onInfo: i,
    lazyLoad: o,
  }) {
    const [m, d] = (0, t.useState)(""),
      g = a.items || [],
      u = a.display_type || "radio",
      v = m
        ? g.filter((e) => e.title.toLowerCase().includes(m.toLowerCase()))
        : g,
      // Split items: regular vs guarantee
      vRegular = v.filter((e) => e.item_type !== "guarantee"),
      vGuarantee = v.filter((e) => e.item_type === "guarantee"),
      p = (0, t.useCallback)(
        (e, t = 1) => {
          c(e, t);
        },
        [c],
      );
    return (0, e.createElement)(
      "div",
      { className: "gvc-group" },
      (0, e.createElement)(
        "div",
        { className: "gvc-group__header" },
        a.description &&
          (0, e.createElement)("div", {
            className: "gvc-group__desc",
            dangerouslySetInnerHTML: { __html: a.description },
          }),
      ),
      g.length > 8 &&
        (0, e.createElement)(
          "div",
          { className: "gvc-group__search" },
          (0, e.createElement)("input", {
            type: "text",
            placeholder: "Zoek opties…",
            value: m,
            onChange: (e) => d(e.target.value),
            className: "gvc-search-input",
          }),
        ),
      "dropdown" === u &&
        (0, e.createElement)(
          "select",
          {
            className: "gvc-dropdown",
            value: Object.keys(n)[0] || "",
            onChange: (e) => {
              const t = parseInt(e.target.value, 10);
              if (!t) return void s();
              const a = g.find((e) => e.id == t);
              a && c(a, 1);
            },
          },
          !a.is_required &&
            (0, e.createElement)("option", { value: "" }, "— Geen selectie —"),
          v.map((t) =>
            (0, e.createElement)(
              "option",
              { key: t.id, value: t.id },
              t.title,
              " — ",
              parseFloat(t.price) > 0
                ? `+€${parseFloat(t.price).toFixed(2)}`
                : "Inclusief",
            ),
          ),
        ),
      "dropdown" !== u &&
        vRegular.length > 0 &&
        (0, e.createElement)(
          "div",
          { className: `gvc-items gvc-items--${u}` },
          vRegular.map((t) => {
            const a = !!n[t.id],
              c = a ? n[t.id].quantity : 1;
            return (0, e.createElement)(l, {
              key: t.id,
              item: t,
              isSelected: a,
              displayType: u,
              onSelect: (e) => p(t, e),
              onInfo: () => i(t),
              quantity: c,
              onQuantityChange: a ? (e) => r(t.id, e) : null,
              lazyLoad: o,
            });
          }),
        ),
      vGuarantee.length > 0 &&
        (0, e.createElement)(
          "div",
          { className: "gvc-items gvc-items--guarantee" },
          vGuarantee.map((t) => {
            const a = !!n[t.id],
              c = a ? n[t.id].quantity : 1;
            return (0, e.createElement)(l, {
              key: t.id,
              item: t,
              isSelected: a,
              displayType: u,
              onSelect: (e) => p(t, e),
              onInfo: () => i(t),
              quantity: c,
              onQuantityChange: a ? (e) => r(t.id, e) : null,
              lazyLoad: o,
            });
          }),
        ),
      0 === v.length &&
        (0, e.createElement)(
          "p",
          { className: "gvc-empty" },
          "Geen opties gevonden.",
        ),
    );
  }
  function r({
    config: t,
    totals: a,
    selections: c,
    groups: l,
    showVat: s,
    isMobile: r = !1,
  }) {
    if (!t) return null;
    const i = r ? "gvc-sidebar gvc-sidebar--mobile" : "gvc-sidebar";
    return (0, e.createElement)(
      "div",
      { className: i },
      (0, e.createElement)(
        "div",
        { className: "gvc-sidebar__inner" },
        (0, e.createElement)(
          "h3",
          { className: "gvc-sidebar__title" },
          "Prijsoverzicht",
        ),
        (0, e.createElement)(
          "div",
          { className: "gvc-sidebar__row gvc-sidebar__row--base" },
          (0, e.createElement)(
            "span",
            { className: "gvc-sidebar__label" },
            t.product_name,
          ),
          (0, e.createElement)(
            "span",
            { className: "gvc-sidebar__value" },
            n(a.base),
          ),
        ),
        (0, e.createElement)(
          "div",
          { className: "gvc-sidebar__addons" },
          a.breakdown.map((t, a) => {
            const c = l.find((e) => e.id == t.groupId);
            return (0, e.createElement)(
              "div",
              { key: a, className: "gvc-sidebar__row gvc-sidebar__row--addon" },
              (0, e.createElement)(
                "span",
                { className: "gvc-sidebar__label" },
                (0, e.createElement)(
                  "span",
                  { className: "gvc-sidebar__group-label" },
                  c?.title || "",
                ),
                t.title,
                t.quantity > 1 &&
                  (0, e.createElement)(
                    "span",
                    { className: "gvc-sidebar__qty" },
                    " ×",
                    t.quantity,
                  ),
              ),
              (0, e.createElement)(
                "span",
                { className: "gvc-sidebar__value" },
                t.total > 0 ? `+ ${n(t.total)}` : "Inclusief",
              ),
            );
          }),
          0 === a.breakdown.length &&
            (0, e.createElement)(
              "p",
              { className: "gvc-sidebar__empty" },
              "Nog geen opties geselecteerd",
            ),
        ),
        (0, e.createElement)("div", { className: "gvc-sidebar__divider" }),
        s &&
          a.taxRate > 0 &&
          (0, e.createElement)(
            e.Fragment,
            null,
            (0, e.createElement)(
              "div",
              { className: "gvc-sidebar__row gvc-sidebar__row--subtotal" },
              (0, e.createElement)(
                "span",
                { className: "gvc-sidebar__label" },
                "Subtotaal",
              ),
              (0, e.createElement)(
                "span",
                { className: "gvc-sidebar__value" },
                n(t.prices_include_tax ? a.subtotal - a.tax : a.subtotal),
              ),
            ),
            (0, e.createElement)(
              "div",
              { className: "gvc-sidebar__row gvc-sidebar__row--tax" },
              (0, e.createElement)(
                "span",
                { className: "gvc-sidebar__label" },
                "BTW (",
                a.taxRate,
                "%)",
              ),
              (0, e.createElement)(
                "span",
                { className: "gvc-sidebar__value" },
                n(a.tax),
              ),
            ),
            (0, e.createElement)("div", { className: "gvc-sidebar__divider" }),
          ),
        (0, e.createElement)(
          "div",
          { className: "gvc-sidebar__row gvc-sidebar__row--total" },
          (0, e.createElement)(
            "span",
            { className: "gvc-sidebar__label" },
            "Totaal",
          ),
          (0, e.createElement)(
            "span",
            { className: "gvc-sidebar__value" },
            n(a.total),
          ),
        ),
        s &&
          a.taxRate > 0 &&
          (0, e.createElement)(
            "p",
            { className: "gvc-sidebar__vat-note" },
            t.prices_include_tax ? "Inclusief" : "Exclusief",
            " BTW",
          ),
        l.some(
          (e) => 1 == e.is_required && 0 === Object.keys(c[e.id] || {}).length,
        ) &&
          (0, e.createElement)(
            "div",
            { className: "gvc-sidebar__warning" },
            (0, e.createElement)("span", null, "⚠"),
            (0, e.createElement)(
              "span",
              null,
              "Vereiste opties nog niet geselecteerd",
            ),
          ),
      ),
    );
  }
  function i({
    item: a,
    group: c,
    selection: l,
    onSelect: s,
    onQuantityChange: r,
    onClose: i,
  }) {
    const o = (0, t.useRef)(null),
      m = !!l[a.id],
      d = m && l[a.id]?.quantity ? l[a.id].quantity : 1,
      [g, u] = (0, t.useState)(d),
      v = parseFloat(a.price) || 0,
      p = 0 === v,
      _ = !1 === a.in_stock,
      E = a.meta_json || {};
    ((0, t.useEffect)(() => {
      const e = (e) => {
        "Escape" === e.key && i();
      };
      return (
        document.addEventListener("keydown", e),
        () => document.removeEventListener("keydown", e)
      );
    }, [i]),
      (0, t.useEffect)(() => {
        m && l[a.id]?.quantity && u(l[a.id].quantity);
      }, [m, l, a.id]),
      (0, t.useEffect)(
        () => (
          (document.body.style.overflow = "hidden"),
          () => {
            document.body.style.overflow = "";
          }
        ),
        [],
      ));
    const b = (e, t) => {
      (t.preventDefault(), t.stopPropagation());
      const a = Math.max(1, e);
      (u(a), m && r && r(a));
    };
    return (0, e.createElement)(
      "div",
      {
        className: "gvc-modal-overlay",
        ref: o,
        onClick: (e) => {
          e.target === o.current && i();
        },
      },
      (0, e.createElement)(
        "div",
        { className: "gvc-modal", role: "dialog", "aria-modal": "true" },
        (0, e.createElement)(
          "button",
          {
            className: "gvc-modal__close",
            onClick: i,
            "aria-label": "Sluiten",
          },
          "✕",
        ),
        (0, e.createElement)(
          "div",
          { className: "gvc-modal__content" },
          a.image_url &&
            (0, e.createElement)(
              "div",
              { className: "gvc-modal__img-wrap" },
              (0, e.createElement)("img", {
                src: a.image_url,
                alt: a.title,
                className: "gvc-modal__img",
              }),
            ),
          (0, e.createElement)(
            "div",
            { className: "gvc-modal__details" },
            (0, e.createElement)(
              "h3",
              { className: "gvc-modal__title" },
              a.title,
            ),
            a.sku &&
              (0, e.createElement)(
                "span",
                { className: "gvc-modal__sku" },
                "SKU: ",
                a.sku,
              ),
            (0, e.createElement)(
              "div",
              { className: "gvc-modal__price" },
              p
                ? (0, e.createElement)(
                    "span",
                    { className: "gvc-item__price--included" },
                    "Inclusief",
                  )
                : (0, e.createElement)(
                    "span",
                    { className: "gvc-item__price--amount" },
                    "+ ",
                    n(v),
                  ),
            ),
            a.description &&
              (0, e.createElement)("div", {
                className: "gvc-modal__desc",
                dangerouslySetInnerHTML: { __html: a.description },
              }),
            E &&
              Object.keys(E).length > 0 &&
              (0, e.createElement)(
                "div",
                { className: "gvc-modal__meta" },
                (0, e.createElement)("h4", null, "Specificaties"),
                (0, e.createElement)(
                  "table",
                  { className: "gvc-modal__meta-table" },
                  (0, e.createElement)(
                    "tbody",
                    null,
                    Object.entries(E).map(([t, a]) =>
                      (0, e.createElement)(
                        "tr",
                        { key: t },
                        (0, e.createElement)(
                          "td",
                          { className: "gvc-modal__meta-key" },
                          t,
                        ),
                        (0, e.createElement)(
                          "td",
                          { className: "gvc-modal__meta-val" },
                          String(a),
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            _ &&
              (0, e.createElement)(
                "div",
                { className: "gvc-modal__stock-warning" },
                "Dit product is momenteel niet op voorraad.",
              ),
            !_ &&
              (0, e.createElement)(
                "div",
                { className: "gvc-modal__action-row" },
                (0, e.createElement)(
                  "div",
                  { className: "gvc-item__qty gvc-modal__qty" },
                  (0, e.createElement)(
                    "button",
                    {
                      type: "button",
                      className: "gvc-qty-btn",
                      onClick: (e) => b(g - 1, e),
                      disabled: g <= 1,
                    },
                    "−",
                  ),
                  (0, e.createElement)("span", { className: "gvc-qty-val" }, g),
                  (0, e.createElement)(
                    "button",
                    {
                      type: "button",
                      className: "gvc-qty-btn",
                      onClick: (e) => b(g + 1, e),
                    },
                    "+",
                  ),
                ),
                (0, e.createElement)(
                  "button",
                  {
                    type: "button",
                    className:
                      "gvc-btn gvc-btn--add gvc-modal__add-btn " +
                      (m ? "gvc-btn--added" : ""),
                    onClick: (e) => {
                      (e.preventDefault(), e.stopPropagation(), _ || s(g));
                    },
                    "aria-label": m ? "Hinzugefügt" : "Hinzufügen",
                    title: m ? "Hinzugefügt" : "Hinzufügen",
                  },
                  m ? "✓ Hinzugefügt" : "+ Hinzufügen",
                ),
              ),
          ),
        ),
      ),
    );
  }
  const o = window.gvcFrontend || {},
    m = document.getElementById("gvc-configurator-root");
  if (m) {
    const a = m.dataset.productId;
    (0, t.createRoot)(m).render(
      (0, e.createElement)(
        function ({ productId: a }) {
          const {
              config: l,
              loading: m,
              error: d,
              selections: g,
              activeStep: u,
              setActiveStep: v,
              selectItem: p,
              clearSelection: _,
              updateQuantity: E,
              totals: b,
              validation: y,
            } = (function (e) {
              const [a, n] = (0, t.useState)(null),
                [l, s] = (0, t.useState)(!0),
                [r, i] = (0, t.useState)(null),
                [o, m] = (0, t.useState)({}),
                [d, g] = (0, t.useState)(0);
              (0, t.useEffect)(() => {
                let t = !1;
                return (
                  (async function () {
                    try {
                      s(!0);
                      const a = await fetch(
                        `${c.restUrl}/product/${e}/config`,
                        { headers: { "X-WP-Nonce": c.nonce } },
                      );
                      if (!a.ok)
                        throw new Error("Failed to load configurator data");
                      const l = await a.json();
                      if (!t) {
                        n(l);
                        const e = {};
                        ((l.groups || []).forEach((t) => {
                          e[t.id] = {};
                          const a = t.items?.find((e) => 1 == e.is_default);
                          a &&
                            (e[t.id][a.id] = {
                              item_id: a.id,
                              quantity: 1,
                              item: a,
                            });
                        }),
                          m(e));
                      }
                    } catch (e) {
                      t || i(e.message);
                    } finally {
                      t || s(!1);
                    }
                  })(),
                  () => {
                    t = !0;
                  }
                );
              }, [e]);
              const u = (0, t.useCallback)(
                  (e, t, n = 1) => {
                    m((c) => {
                      const l = a?.groups?.find((t) => t.id == e),
                        s = l?.display_type || "radio",
                        r = { ...(c[e] || {}) };
                      return "dropdown" === s
                        ? {
                            ...c,
                            [e]: {
                              [t.id]: { item_id: t.id, quantity: n, item: t },
                            },
                          }
                        : (r[t.id]
                            ? delete r[t.id]
                            : (r[t.id] = {
                                item_id: t.id,
                                quantity: n,
                                item: t,
                              }),
                          { ...c, [e]: r });
                    });
                  },
                  [a],
                ),
                v = (0, t.useCallback)((e) => {
                  m((t) => ({ ...t, [e]: {} }));
                }, []),
                p = (0, t.useCallback)((e, t, a) => {
                  m((n) => {
                    const c = n[e];
                    return c && c[t]
                      ? {
                          ...n,
                          [e]: {
                            ...c,
                            [t]: { ...c[t], quantity: Math.max(1, a) },
                          },
                        }
                      : n;
                  });
                }, []),
                _ = (0, t.useMemo)(() => {
                  if (!a)
                    return {
                      base: 0,
                      addons: 0,
                      subtotal: 0,
                      tax: 0,
                      total: 0,
                      breakdown: [],
                    };
                  const e = a.base_price || 0;
                  let t = 0;
                  const n = [];
                  Object.values(o).forEach((e) => {
                    Object.values(e).forEach((e) => {
                      if (!e.item) return;
                      const a = parseFloat(e.item.price) || 0,
                        c = e.quantity || 1,
                        l = a * c;
                      ((t += l),
                        n.push({
                          title: e.item.title,
                          price: a,
                          quantity: c,
                          total: l,
                          groupId: e.item.group_id,
                        }));
                    });
                  });
                  const c = e + t,
                    l = a.tax_rate || 0,
                    s = (function (e, t, a) {
                      return t <= 0
                        ? 0
                        : a
                          ? e - e / (1 + t / 100)
                          : e * (t / 100);
                    })(c, l, a.prices_include_tax),
                    r = a.prices_include_tax ? c : c + s;
                  return {
                    base: e,
                    addons: t,
                    subtotal: c,
                    tax: s,
                    taxRate: l,
                    total: r,
                    breakdown: n,
                  };
                }, [a, o]);
              (0, t.useEffect)(() => {
                const e = document.getElementById("gvc-selections-input");
                if (!e) return;
                const t = [];
                (Object.values(o).forEach((e) => {
                  Object.values(e).forEach((e) => {
                    t.push({ item_id: e.item_id, quantity: e.quantity });
                  });
                }),
                  (e.value = JSON.stringify(t)));
              }, [o]);
              const E = (0, t.useMemo)(() => {
                if (!a) return { valid: !0, missing: [] };
                const e = [];
                return (
                  (a.groups || []).forEach((t) => {
                    const a = o[t.id] || {};
                    1 == t.is_required &&
                      0 === Object.keys(a).length &&
                      e.push(t);
                  }),
                  { valid: 0 === e.length, missing: e }
                );
              }, [a, o]);
              return {
                config: a,
                loading: l,
                error: r,
                selections: o,
                activeStep: d,
                setActiveStep: g,
                selectItem: u,
                clearSelection: v,
                updateQuantity: p,
                totals: _,
                validation: E,
              };
            })(a),
            [N, f] = (0, t.useState)(null),
            [h, k] = (0, t.useState)(!1),
            w = (0, t.useRef)(null);
          if (
            ((0, t.useEffect)(() => {
              w.current &&
                (w.current.style.setProperty(
                  "--gvc-primary",
                  o.primaryColor || "#2D6A4F",
                ),
                w.current.style.setProperty(
                  "--gvc-accent",
                  o.accentColor || "#40916C",
                ));
            }, []),
            m)
          )
            return (0, e.createElement)(
              "div",
              { className: "gvc-loading", ref: w },
              (0, e.createElement)("div", {
                className: "gvc-loading__spinner",
              }),
              (0, e.createElement)(
                "p",
                { className: "gvc-loading__text" },
                "Configuratie laden…",
              ),
            );
          if (d)
            return (0, e.createElement)(
              "div",
              { className: "gvc-error", ref: w },
              (0, e.createElement)("p", null, "⚠️ ", d),
            );
          if (!l || !l.groups?.length) return null;
          const C = l.groups;
          return (0, e.createElement)(
            "div",
            { className: "gvc-configurator", ref: w },
            (0, e.createElement)(
              "div",
              { className: "gvc-layout" },
              (0, e.createElement)(
                "div",
                { className: "gvc-main" },
                C.map((t, a) => {
                  const c = u === a,
                    l = g[t.id] || {},
                    r = Object.keys(l).length > 0,
                    i = a < u || (r && !c),
                    m = b.breakdown.filter((e) => e.groupId == t.id);
                  return (0, e.createElement)(
                    "div",
                    {
                      key: t.id,
                      className: `gvc-step-panel ${c ? "gvc-step-panel--active" : ""} ${i ? "gvc-step-panel--completed" : ""}`,
                    },
                    (0, e.createElement)(
                      "div",
                      {
                        className: "gvc-step-panel__header",
                        onClick: () => v(a),
                        role: "button",
                        tabIndex: 0,
                      },
                      (0, e.createElement)(
                        "h3",
                        { className: "gvc-step-panel__title" },
                        t.title,
                        1 == t.is_required &&
                          (0, e.createElement)(
                            "span",
                            { className: "gvc-required" },
                            "*",
                          ),
                      ),
                      !c &&
                        m.length > 0 &&
                        (0, e.createElement)(
                          "div",
                          { className: "gvc-step-panel__summary" },
                          m.map((t, a) =>
                            (0, e.createElement)(
                              "div",
                              {
                                key: a,
                                className: "gvc-step-panel__summary-item",
                              },
                              t.title,
                              t.quantity > 1 ? ` × ${t.quantity} ` : "",
                              (0, e.createElement)(
                                "span",
                                { className: "gvc-step-panel__summary-price" },
                                t.total > 0 ? ` (+${n(t.total)})` : "",
                              ),
                            ),
                          ),
                        ),
                      !c &&
                        0 === m.length &&
                        (0, e.createElement)(
                          "div",
                          { className: "gvc-step-panel__summary" },
                          "Nog geen opties geselecteerd",
                        ),
                    ),
                    c &&
                      (0, e.createElement)(
                        "div",
                        { className: "gvc-step-panel__body" },
                        (0, e.createElement)(s, {
                          group: t,
                          selection: l,
                          onSelect: (e, a) => p(t.id, e, a),
                          onClear: () => _(t.id),
                          onQuantityChange: (e, a) => E(t.id, e, a),
                          onInfo: (e) => f({ item: e, group: t }),
                          lazyLoad: o.lazyLoad,
                        }),
                        (0, e.createElement)(
                          "div",
                          {
                            className: "gvc-step-nav",
                            style: {
                              marginTop: "24px",
                              display: "flex",
                              justifyContent: "space-between",
                            },
                          },
                          u > 0 && C.length > 1
                            ? (0, e.createElement)(
                                "button",
                                {
                                  type: "button",
                                  className: "gvc-btn gvc-btn--outline",
                                  onClick: (e) => {
                                    (e.stopPropagation(),
                                      v((e) => Math.max(0, e - 1)));
                                  },
                                },
                                "← Vorige",
                              )
                            : (0, e.createElement)("div", null),
                          u < C.length - 1 &&
                            C.length > 1 &&
                            (0, e.createElement)(
                              "button",
                              {
                                type: "button",
                                className: "gvc-btn gvc-btn--primary",
                                onClick: (e) => {
                                  (e.stopPropagation(),
                                    v((e) => Math.min(C.length - 1, e + 1)));
                                },
                              },
                              "Volgende →",
                            ),
                          u === C.length - 1 &&
                            !y.valid &&
                            (0, e.createElement)(
                              "div",
                              {
                                className: "gvc-validation-msg",
                                style: {
                                  alignSelf: "center",
                                  color: "var(--gvc-error)",
                                },
                              },
                              "Selecteer vereiste opties: ",
                              y.missing.map((e) => e.title).join(", "),
                            ),
                        ),
                      ),
                  );
                }),
              ),
              (0, e.createElement)(r, {
                config: l,
                totals: b,
                selections: g,
                groups: C,
                showVat: o.showVat,
              }),
            ),
            (0, e.createElement)(
              "div",
              { className: "gvc-mobile-bar", onClick: () => k(!h) },
              (0, e.createElement)(
                "span",
                { className: "gvc-mobile-bar__label" },
                "Totaal:",
              ),
              (0, e.createElement)(
                "span",
                { className: "gvc-mobile-bar__price" },
                n(b.total),
              ),
              (0, e.createElement)(
                "span",
                { className: "gvc-mobile-bar__toggle" },
                h ? "▼" : "▲",
              ),
            ),
            h &&
              (0, e.createElement)(
                "div",
                { className: "gvc-mobile-summary" },
                (0, e.createElement)(r, {
                  config: l,
                  totals: b,
                  selections: g,
                  groups: C,
                  showVat: o.showVat,
                  isMobile: !0,
                }),
              ),
            N &&
              (0, e.createElement)(i, {
                item: N.item,
                group: N.group,
                selection: g[N.group.id] || {},
                onSelect: (e) => p(N.group.id, N.item, e),
                onQuantityChange: (e) => E(N.group.id, N.item.id, e),
                onClose: () => f(null),
              }),
          );
        },
        { productId: parseInt(a, 10) },
      ),
    );
  }
})();
