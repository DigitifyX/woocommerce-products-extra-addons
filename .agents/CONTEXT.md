# GartenVista Product Configurator — Full Plugin Context

> **Use this file as the single source of truth for understanding the plugin.**
> Every AI agent or developer working on this codebase should read this first.

---

## What Is This Plugin?

**GartenVista Product Configurator** is a high-performance WooCommerce plugin (v1.2.7) that adds a multi-step, React-powered product configurator to WooCommerce product pages. It allows store admins to create configurable "addon groups" (e.g., Foundation, Lighting, Accessories) with selectable items, and customers to configure products step-by-step before adding them to cart.

- **Author:** Shakir Ahmed Joy
- **Text Domain:** `gv-configurator`
- **Namespace:** `GVC\`
- **PHP Requirement:** 7.4+ (8.0+ recommended)
- **WooCommerce Compatibility:** 6.0 – 8.5, HPOS compatible
- **Frontend:** React (via `@wordpress/scripts` / Webpack), mobile-first responsive
- **Caching:** WordPress Object Cache (Redis/Memcached recommended for 2000+ products)

---

## Core Concepts

### Addon Groups
Configuration steps shown to the customer (e.g., "Foundation", "Lighting"). Each group has:
- Title, slug, description, icon
- Display type: `radio` | `checkbox` | `cards` | `dropdown`
- `is_required` flag
- `sort_order` for step sequencing

### Addon Items
Individual selectable options within a group. Two types:
1. **Virtual** — custom name + price + image (not a WC product)
2. **WC Product** — linked to an existing WooCommerce product (inherits live price & stock status)

Additional item types used internally:
- `guarantee` — special rendering with subtitle, original price, features list (stored in `meta_json`)
- `select_dropdown` — forces price to 0 (used for dropdown selections)

Items support **visibility conditions** stored in `meta_json.conditions`:
- **Sources:** `attribute`, `category`, `tag`
- **Operators:** `is`, `is_not`, `contains`, `greater_than`, `less_than`
- **Match mode:** `all` (AND) or `any` (OR)

### Global Rules
Map WooCommerce categories or tags to addon groups. All products in a matched category/tag automatically get those configurator steps.

### Product Overrides
Per-product overrides that take precedence over global rules:
- **Include** — explicitly assign groups (bypasses global rules)
- **Exclude** — remove specific groups from the global set

### Rule Resolution Priority
```
1. Product Overrides (include/exclude)  ← highest priority
2. Category Rules
3. Tag Rules
```

---

## Architecture

### Why Custom Database Tables (Not wp_options)?
With 2000+ products, `wp_options` causes autoload bloat, unindexed queries, and serialization overhead. Custom tables give indexed lookups, JOINs, and zero autoload impact.

### Database Tables

| Table | Purpose | Key Columns |
|---|---|---|
| `wp_gvc_addon_groups` | Configuration steps | `id`, `title`, `slug`, `display_type`, `is_required`, `sort_order` |
| `wp_gvc_addon_items` | Options within groups | `id`, `group_id`, `item_type`, `wc_product_id`, `title`, `price`, `is_default`, `meta_json` |
| `wp_gvc_global_rules` | Category/tag → group mappings | `id`, `rule_type`, `taxonomy_term_id`, `group_id`, `sort_order` |
| `wp_gvc_product_overrides` | Per-product overrides | `id`, `product_id`, `group_id`, `override_type` (`include`/`exclude`) |

### Caching Strategy
- Uses WordPress Object Cache API (`wp_cache_get`/`wp_cache_set`)
- Cache group: `gvc`
- **Generation-based invalidation** — incrementing a generation counter invalidates all keys without iterating
- Cache key pattern: `product_config_{id}_gen_{generation}`
- Configurable TTL (default 3600s)
- `Cache::flush_groups()` — invalidates on group/item CRUD
- `Cache::flush_product_configs()` — invalidates on rule changes
- `Cache::flush_all()` — uses `wp_cache_flush_group()` if available

---

## File Structure & What Each File Does

```
gartenvista-configurator/
├── gartenvista-configurator.php    # Main entry. Constants, autoloader, activation hooks, boot sequence.
│                                    # Checks for WooCommerce. Requires all includes. Initializes all components.
│                                    # Declares HPOS compatibility.
│
├── uninstall.php                   # Data cleanup on delete. Only drops tables if GVC_DELETE_DATA === true.
├── package.json                    # npm config. Uses @wordpress/scripts for build/start/lint/zip.
├── webpack.config.js               # Webpack config for React bundle.
│
├── includes/
│   ├── class-activator.php         # Creates 4 DB tables on activation. Seeds default settings to wp_options.
│   ├── class-db.php                # Database abstraction. All CRUD for groups, items, rules, overrides.
│   │                                # resolve_groups_for_product() — main resolver with override/global fallback.
│   │                                # get_groups_with_items() — bulk fetch in 2 queries (not N+1).
│   ├── class-cpt.php               # Admin menu registration (Configurator → Addon Groups, Settings, Cache).
│   │                                # Renders React mount point and cache management page.
│   ├── class-cache.php             # Redis/Memcached/Object Cache abstraction. Generation-based invalidation.
│   ├── class-rest-api.php          # ALL REST API endpoints (public + admin). Condition evaluator.
│   │                                # 945 lines — the largest file. Handles config resolution, price calc,
│   │                                # groups/items/rules/overrides CRUD, WC product search, taxonomy browser,
│   │                                # WC attributes for condition builder, settings CRUD.
│   ├── class-admin.php             # Admin scripts enqueue. WC product data tab "Configurator".
│   │                                # Product-level override UI (select2-based).
│   ├── class-frontend.php          # Enqueues React bundle + CSS on single product pages (only if groups exist).
│   │                                # Renders <div id="gvc-configurator-root"> mount point.
│   │                                # Adds hidden input for gvc_selections. Localizes JS with WC settings.
│   ├── class-cart.php              # WooCommerce cart integration:
│   │                                # - add_cart_item_data: captures & validates selections from hidden input
│   │                                # - adjust_cart_prices: adds addon total to base price
│   │                                # - display_cart_item_data: shows itemized breakdown in cart/checkout
│   │                                # - add_order_item_meta: persists _gvc_config (hidden) + readable meta
│   │                                # - unique_key: same product + different config = different cart items
│   ├── class-tax.php               # VAT/tax calculation. Integrates with WC_Tax::get_base_tax_rates().
│   │                                # Handles both tax-inclusive and tax-exclusive pricing.
│   └── class-order.php             # Displays configurator breakdown in admin order view.
│                                    # Hides _gvc_config from visible meta, shows human-readable lines.
│
├── admin/
│   ├── css/admin.css               # Admin panel styles
│   └── js/
│       ├── admin.js                # Admin React app (groups/items/rules/settings management)
│       └── product-meta.js         # Product edit page — override UI (jQuery + Select2)
│
├── frontend/
│   ├── css/configurator.css        # Frontend styles (mobile-first, responsive)
│   ├── dist/                       # Built React bundle (output of `npm run build`)
│   │   └── configurator.js
│   └── src/
│       ├── index.jsx               # React entry point — mounts <Configurator> on #gvc-configurator-root
│       ├── components/
│       │   ├── Configurator.jsx    # Main component. Orchestrates steps, selections, form submission.
│       │   ├── StepTabs.jsx        # Progress bar + step navigation
│       │   ├── AddonGroup.jsx      # Step content — renders items grid with search filter (8+ items)
│       │   ├── AddonItem.jsx       # Individual addon card (supports radio/checkbox/cards/dropdown)
│       │   ├── PriceSidebar.jsx    # Sticky price breakdown sidebar (desktop)
│       │   └── InfoModal.jsx       # Item detail popup with metadata
│       ├── hooks/
│       │   └── useConfigurator.js  # Custom hook: API data fetching, selections state, price calculation
│       └── utils/
│           └── price.js            # Price formatting + tax calculation helpers
│
└── scripts/
    └── package-plugin.ps1          # PowerShell script to package plugin as ZIP
```

---

## REST API Reference

### Public Endpoints (no auth required)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/gvc/v1/product/{id}/config` | Full configurator data for a product (cached, with conditions evaluated) |
| `POST` | `/gvc/v1/product/{id}/calculate` | Server-side price validation with selections |

### Admin Endpoints (requires `manage_woocommerce` capability)

| Method | Endpoint | Description |
|---|---|---|
| `GET/POST` | `/gvc/v1/admin/groups` | List all groups (enriched with assignment summaries) / Create group |
| `GET/PUT/DELETE` | `/gvc/v1/admin/groups/{id}` | Get (with items, assignments) / Update / Delete group |
| `GET/POST` | `/gvc/v1/admin/groups/{group_id}/items` | List items in group / Create item |
| `PUT/DELETE` | `/gvc/v1/admin/items/{id}` | Update / Delete item |
| `GET` | `/gvc/v1/admin/taxonomies` | All WC categories (hierarchical tree) + tags |
| `GET` | `/gvc/v1/admin/rules/all` | All rules across all terms (overview) |
| `GET/POST` | `/gvc/v1/admin/rules` | Get rules for a term / Set rules for a term |
| `GET/POST` | `/gvc/v1/admin/overrides/{product_id}` | Get / Set product-level overrides |
| `GET` | `/gvc/v1/admin/wc-products` | Search WC products (paginated, for linking) |
| `GET` | `/gvc/v1/admin/wc-attributes` | All WC attributes + their terms (for condition builder) |
| `GET/POST` | `/gvc/v1/admin/settings` | Get / Save plugin settings |

### Settings Object (stored in `wp_options` as `gvc_settings`)
```json
{
  "enable_cache": true,
  "cache_ttl": 3600,
  "lazy_load_images": true,
  "show_vat_breakdown": true,
  "primary_color": "#2D6A4F",
  "accent_color": "#40916C"
}
```

---

## Frontend Flow (Customer-Facing)

1. Customer visits a WooCommerce product page
2. `Frontend::enqueue_scripts()` checks if the product has configurator groups (via `DB::resolve_groups_for_product()`)
3. If groups exist → enqueues CSS + React bundle, renders `#gvc-configurator-root` mount point
4. React app fetches config from `/gvc/v1/product/{id}/config`
5. Customer navigates through multi-step tabs, selecting options
6. Live price calculation runs client-side (using `useConfigurator` hook)
7. On "Add to Cart" → selections are serialized to the hidden `gvc_selections` input
8. WooCommerce native form submit triggers `Cart::add_cart_item_data()`
9. Server validates items, calculates addon total, stores in cart session
10. Cart/checkout shows itemized addon breakdown
11. On order creation → `_gvc_config` (hidden JSON) + human-readable meta saved to order

---

## WooCommerce Cart Integration Details

- **Price adjustment:** `base_price + sum(addon_price × quantity)` — set via `wc_product->set_price()`
- **Unique cart items:** Same product with different configurations = separate cart line items (via `unique_key` = MD5 hash of selections)
- **Session persistence:** Config data survives cart sessions via `woocommerce_get_cart_item_from_session`
- **Order metadata:** `_gvc_config` stored as hidden meta for API/admin use; individual addon lines stored as visible meta for emails & admin

---

## Tax/VAT Handling

- Respects `woocommerce_tax_display_shop` setting (incl/excl)
- Uses `WC_Tax::get_base_tax_rates()` for accurate rate lookup
- Frontend shows VAT breakdown in price sidebar (configurable)
- Tax calculation handles both inclusive and exclusive pricing modes

---

## Build & Development

```bash
npm install              # Install dependencies
npm run build            # Production build → frontend/dist/configurator.js
npm run start            # Development mode with watch/HMR
npm run lint             # Lint frontend source
npm run zip              # Package plugin as ZIP
```

PowerShell packaging: `scripts/package-plugin.ps1`

---

## Key Design Decisions

1. **Custom DB tables over wp_options** — performance at scale (2000+ products)
2. **Generation-based cache invalidation** — avoids expensive key iteration
3. **Bulk fetching** — groups + items loaded in 2 queries, not N+1
4. **Server-side price validation** — client calculates for UX, server validates on cart add
5. **Condition system** — items can be conditionally shown/hidden based on product attributes, categories, or tags
6. **HPOS compatibility** — declared for WooCommerce High-Performance Order Storage
7. **Data preservation on uninstall** — tables kept unless `GVC_DELETE_DATA` constant is explicitly set

---

## Common Modification Patterns

### Adding a new addon item type
1. Add the type string to `class-rest-api.php` → `get_product_config()` (handle enrichment)
2. Update `AddonItem.jsx` to render the new type
3. Update `class-cart.php` → `add_cart_item_data()` if pricing differs

### Adding a new setting
1. Add to `$allowed` array in `REST_API::admin_save_settings()`
2. Add default value in `Activator::seed_defaults()`
3. Expose in `get_product_config()` response → `settings` object
4. Localize in `Frontend::enqueue_scripts()` → `wp_localize_script()`

### Adding a new visibility condition source
1. Add case in `REST_API::evaluate_item_conditions()` switch block
2. Pre-fetch needed data at the top of the function
3. Update admin condition builder UI (`admin.js`)

### Adding a new REST API endpoint
1. Register route in `REST_API::register_routes()`
2. Add callback method in the same class
3. Use `admin_permission` callback for admin-only endpoints

---

## Important Constants

| Constant | Value | Purpose |
|---|---|---|
| `GVC_VERSION` | `1.2.7` | Plugin version (used for cache busting) |
| `GVC_PLUGIN_DIR` | `plugin_dir_path(__FILE__)` | Absolute server path |
| `GVC_PLUGIN_URL` | `plugin_dir_url(__FILE__)` | Public URL path |
| `GVC_PLUGIN_FILE` | `__FILE__` | Main plugin file reference |
| `GVC_DB_VERSION` | `1.0.0` | Database schema version |

---

## Gotchas & Known Patterns

- **Autoloader** maps `GVC\ClassName` → `includes/class-classname.php` (lowercase, underscores become hyphens)
- **Cache generation** is appended to cache keys, so changing any group/item/rule automatically invalidates old caches
- `class-cache.php` is `require_once`'d early (before autoloader-dependent classes) because the activator needs it
- The frontend React app uses `wp-element` (WordPress's React wrapper), not a standalone React install
- `meta_json` column stores arbitrary JSON per item (conditions, guarantee data, etc.)
- Frontend conditions are **stripped** from the public API response for security — only evaluated server-side
