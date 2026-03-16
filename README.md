# GartenVista Product Configurator

High-performance modular product configurator plugin for WooCommerce, designed to handle **2000+ products** with a seamless React-powered UI.

## Architecture Overview

### Data Layer (Custom Database Tables)

We **deliberately avoid `wp_options`** for configuration storage. All data lives in four custom tables:

| Table | Purpose |
|---|---|
| `wp_gvc_addon_groups` | Configuration steps (Foundation, Lighting, etc.) |
| `wp_gvc_addon_items` | Individual options within each group |
| `wp_gvc_global_rules` | Maps categories/tags → addon groups |
| `wp_gvc_product_overrides` | Per-product overrides of global rules |

**Why custom tables?** With 2000+ products, storing serialized group data in `wp_options` causes:
- Autoload bloat on every page request
- Unindexed queries for lookups
- Serialization overhead

Custom tables give us indexed lookups, JOINs for rule resolution, and zero autoload impact.

### Rule Resolution Priority

When a product page loads, the configurator resolves which addon groups to show:

```
1. Product Overrides (include/exclude) — highest priority
2. Category Rules — matched via term_taxonomy JOIN
3. Tag Rules — matched via term_taxonomy JOIN
```

This uses a single optimized SQL query with JOINs instead of N+1 lookups.

### Caching Strategy

The plugin integrates with WordPress Object Cache (Redis/Memcached):

- **Per-product config** is cached with a generation counter for invalidation
- Cache TTL is configurable (default 1 hour)
- Bulk invalidation uses a generation increment (no key iteration needed)
- Admin actions automatically flush relevant caches

**Redis/Memcached recommended** for production with 2000+ products.

### REST API Endpoints

**Public (frontend):**

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/gvc/v1/product/{id}/config` | Get full configurator data (cached) |
| `POST` | `/gvc/v1/product/{id}/calculate` | Server-side price validation |

**Admin:**

| Method | Endpoint | Purpose |
|---|---|---|
| `GET/POST` | `/gvc/v1/admin/groups` | CRUD addon groups |
| `GET/PUT/DELETE` | `/gvc/v1/admin/groups/{id}` | Single group operations |
| `GET/POST` | `/gvc/v1/admin/groups/{id}/items` | CRUD items within a group |
| `PUT/DELETE` | `/gvc/v1/admin/items/{id}` | Single item operations |
| `GET/POST` | `/gvc/v1/admin/rules` | Global rules management |
| `GET/POST` | `/gvc/v1/admin/overrides/{product_id}` | Product-level overrides |
| `GET` | `/gvc/v1/admin/wc-products` | Search WC products (for linking) |
| `GET/POST` | `/gvc/v1/admin/settings` | Plugin settings |

## Frontend (React)

### Component Structure

```
Configurator (main)
├── StepTabs (progress bar + step navigation)
├── Layout
│   ├── AddonGroup (current step content)
│   │   └── AddonItem[] (selectable cards/radio/checkboxes)
│   └── PriceSidebar (sticky price breakdown)
├── MobileBar (floating total for mobile)
├── MobileSummary (expandable price breakdown)
└── InfoModal (item detail popup)
```

### Features

- **Multi-step tabbed UI** with progress bar
- **Live price calculation** with VAT breakdown (client-side, validated server-side)
- **Display types**: Radio, Checkbox, Cards grid, Dropdown
- **Lazy loading** images via IntersectionObserver
- **Info modals** with full item details and metadata
- **Mobile-first** responsive design with floating price bar
- **Search filter** for groups with 8+ items
- **Quantity controls** per selected addon
- **Default selections** pre-populated on load

### State Management

Uses React `useState` + `useMemo` via the `useConfigurator` custom hook. Selections sync to a hidden form input for WooCommerce's native add-to-cart flow.

## WooCommerce Integration

### Cart Flow

```
1. User configures product → selections stored in hidden input
2. woocommerce_add_cart_item_data → validates items, calculates addon total
3. Cart item gets unique key (same product + different config = different cart items)
4. woocommerce_before_calculate_totals → adjusts price (base + addons)
5. Cart/checkout displays itemized addon breakdown
```

### Order Metadata

- `_gvc_config` (hidden) — full JSON configuration for API/admin use
- Individual addon lines (visible) — human-readable in order emails and admin

### Tax/VAT

Integrates with WooCommerce Tax Settings:
- Respects `woocommerce_tax_display_shop` (incl/excl)
- Uses `WC_Tax::get_base_tax_rates()` for accurate rate calculation
- Handles both tax-inclusive and tax-exclusive pricing
- VAT breakdown shown in the configurator sidebar

### Add-on Types

1. **Virtual Add-ons** — Custom items with name, image, price (not WC products)
2. **WC Product Add-ons** — Linked to existing WooCommerce products (live price, stock status)

## Installation

1. Upload the plugin folder to `wp-content/plugins/`
2. Activate the plugin in WordPress admin
3. The plugin creates custom database tables on activation
4. Navigate to **Configurator** in the admin sidebar

### Building Frontend

```bash
cd wp-content/plugins/gartenvista-configurator
npm install
npm run build    # Production build
npm run start    # Development with watch
```

### Recommended Server Setup

- **PHP 7.4+** (8.0+ recommended)
- **Redis** or **Memcached** for object caching
- Install `wp-redis` or `memcached` object cache drop-in
- Set `cache_ttl` in Configurator → Settings (default: 3600s)

## Admin Usage

### 1. Create Addon Groups

Go to **Configurator → Addon Groups** and create your configuration steps:
- Foundation, Lighting, Accessories, etc.
- Set display type (radio/checkbox/cards/dropdown)
- Mark as required or optional
- Set sort order for step sequence

### 2. Add Items to Groups

Click "Manage Items" on any group to add options:
- **Virtual**: Custom name + price + image
- **WC Product**: Search and link to an existing WooCommerce product (inherits live pricing and stock)

### 3. Set Global Rules

Go to **Configurator → Global Rules**:
- Select category or tag
- Enter the taxonomy term ID
- Check which addon groups apply
- All products in that category/tag automatically get those configurator steps

### 4. Per-Product Overrides

On any product's edit page, open the **Configurator** tab:
- **Include** specific groups (overrides global rules entirely)
- **Exclude** specific groups (removes from global set)

### 5. Settings

Go to **Configurator → Settings** to configure:
- Cache enable/disable and TTL
- Lazy loading toggle
- VAT breakdown visibility
- Brand colors (primary/accent)

## File Structure

```
gartenvista-configurator/
├── gartenvista-configurator.php     # Main plugin file
├── package.json                      # npm build config
├── webpack.config.js                 # Webpack for React
├── includes/
│   ├── class-activator.php          # DB table creation
│   ├── class-db.php                 # Database abstraction (optimized queries)
│   ├── class-cpt.php                # Admin menus
│   ├── class-cache.php              # Redis/Memcached/Object Cache layer
│   ├── class-rest-api.php           # REST API endpoints
│   ├── class-admin.php              # Admin scripts + product meta box
│   ├── class-frontend.php           # Frontend enqueue + mount point
│   ├── class-cart.php               # WooCommerce cart integration
│   ├── class-tax.php                # VAT calculation
│   └── class-order.php              # Order metadata display
├── admin/
│   ├── css/admin.css                # Admin styles
│   └── js/
│       ├── admin.js                 # Admin React app (groups/items/rules/settings)
│       └── product-meta.js          # Product edit page overrides UI
├── frontend/
│   ├── css/configurator.css         # Frontend styles (mobile-first)
│   ├── dist/                        # Built React bundle (npm run build)
│   └── src/
│       ├── index.jsx                # Entry point
│       ├── components/
│       │   ├── Configurator.jsx     # Main component
│       │   ├── StepTabs.jsx         # Progress + step navigation
│       │   ├── AddonGroup.jsx       # Step content with items grid
│       │   ├── AddonItem.jsx        # Individual addon card
│       │   ├── PriceSidebar.jsx     # Sticky price breakdown
│       │   └── InfoModal.jsx        # Item detail popup
│       ├── hooks/
│       │   └── useConfigurator.js   # Data fetching + state management
│       └── utils/
│           └── price.js             # Price formatting + tax calc
└── assets/
    └── images/                      # Plugin icons/placeholders
```

## Performance Notes

- **Zero autoload impact** — no data in `wp_options`
- **Indexed queries** — all lookups use indexed columns
- **Bulk fetching** — groups + items loaded in 2 queries (not N+1)
- **Object caching** — full config response cached per product
- **Generation-based invalidation** — no expensive key iteration
- **Lazy loading** — images load on scroll via IntersectionObserver
- **Client-side calculation** — price updates instantly, validated server-side on cart add

## License

Proprietary – GartenVista. All rights reserved.
