<?php
/**
 * REST API endpoints for the frontend React configurator.
 * Uses WooCommerce REST API patterns for efficiency.
 *
 * @package GartenVista\Configurator
 */

namespace GVC;

defined( 'ABSPATH' ) || exit;

class REST_API {

    const NAMESPACE = 'gvc/v1';

    public static function init() {
        add_action( 'rest_api_init', [ __CLASS__, 'register_routes' ] );
    }

    public static function register_routes() {

        /* ── Public endpoints (frontend) ───────────────────── */

        // Get configurator data for a product
        register_rest_route( self::NAMESPACE, '/product/(?P<id>\d+)/config', [
            'methods'             => 'GET',
            'callback'            => [ __CLASS__, 'get_product_config' ],
            'permission_callback' => '__return_true',
            'args'                => [
                'id' => [
                    'required'          => true,
                    'validate_callback' => function ( $param ) {
                        return is_numeric( $param );
                    },
                ],
            ],
        ]);

        // Validate & calculate price
        register_rest_route( self::NAMESPACE, '/product/(?P<id>\d+)/calculate', [
            'methods'             => 'POST',
            'callback'            => [ __CLASS__, 'calculate_price' ],
            'permission_callback' => '__return_true',
        ]);

        /* ── Admin endpoints ───────────────────────────────── */

        // Groups CRUD
        register_rest_route( self::NAMESPACE, '/admin/groups', [
            [
                'methods'             => 'GET',
                'callback'            => [ __CLASS__, 'admin_get_groups' ],
                'permission_callback' => [ __CLASS__, 'admin_permission' ],
            ],
            [
                'methods'             => 'POST',
                'callback'            => [ __CLASS__, 'admin_create_group' ],
                'permission_callback' => [ __CLASS__, 'admin_permission' ],
            ],
        ]);

        register_rest_route( self::NAMESPACE, '/admin/groups/(?P<id>\d+)', [
            [
                'methods'             => 'GET',
                'callback'            => [ __CLASS__, 'admin_get_group' ],
                'permission_callback' => [ __CLASS__, 'admin_permission' ],
            ],
            [
                'methods'             => 'PUT',
                'callback'            => [ __CLASS__, 'admin_update_group' ],
                'permission_callback' => [ __CLASS__, 'admin_permission' ],
            ],
            [
                'methods'             => 'DELETE',
                'callback'            => [ __CLASS__, 'admin_delete_group' ],
                'permission_callback' => [ __CLASS__, 'admin_permission' ],
            ],
        ]);

        // Items CRUD
        register_rest_route( self::NAMESPACE, '/admin/groups/(?P<group_id>\d+)/items', [
            [
                'methods'             => 'GET',
                'callback'            => [ __CLASS__, 'admin_get_items' ],
                'permission_callback' => [ __CLASS__, 'admin_permission' ],
            ],
            [
                'methods'             => 'POST',
                'callback'            => [ __CLASS__, 'admin_create_item' ],
                'permission_callback' => [ __CLASS__, 'admin_permission' ],
            ],
        ]);

        register_rest_route( self::NAMESPACE, '/admin/items/(?P<id>\d+)', [
            [
                'methods'             => 'PUT',
                'callback'            => [ __CLASS__, 'admin_update_item' ],
                'permission_callback' => [ __CLASS__, 'admin_permission' ],
            ],
            [
                'methods'             => 'DELETE',
                'callback'            => [ __CLASS__, 'admin_delete_item' ],
                'permission_callback' => [ __CLASS__, 'admin_permission' ],
            ],
        ]);

        // Taxonomy terms (categories + tags browser)
        register_rest_route( self::NAMESPACE, '/admin/taxonomies', [
            'methods'             => 'GET',
            'callback'            => [ __CLASS__, 'admin_get_taxonomies' ],
            'permission_callback' => [ __CLASS__, 'admin_permission' ],
        ]);

        // All rules overview
        register_rest_route( self::NAMESPACE, '/admin/rules/all', [
            'methods'             => 'GET',
            'callback'            => [ __CLASS__, 'admin_get_all_rules' ],
            'permission_callback' => [ __CLASS__, 'admin_permission' ],
        ]);

        // Global rules (per term)
        register_rest_route( self::NAMESPACE, '/admin/rules', [
            [
                'methods'             => 'GET',
                'callback'            => [ __CLASS__, 'admin_get_rules' ],
                'permission_callback' => [ __CLASS__, 'admin_permission' ],
            ],
            [
                'methods'             => 'POST',
                'callback'            => [ __CLASS__, 'admin_set_rules' ],
                'permission_callback' => [ __CLASS__, 'admin_permission' ],
            ],
        ]);

        // Product overrides
        register_rest_route( self::NAMESPACE, '/admin/overrides/(?P<product_id>\d+)', [
            [
                'methods'             => 'GET',
                'callback'            => [ __CLASS__, 'admin_get_overrides' ],
                'permission_callback' => [ __CLASS__, 'admin_permission' ],
            ],
            [
                'methods'             => 'POST',
                'callback'            => [ __CLASS__, 'admin_set_overrides' ],
                'permission_callback' => [ __CLASS__, 'admin_permission' ],
            ],
        ]);

        // WC Products search (for linking items to WC products)
        register_rest_route( self::NAMESPACE, '/admin/wc-products', [
            'methods'             => 'GET',
            'callback'            => [ __CLASS__, 'admin_search_wc_products' ],
            'permission_callback' => [ __CLASS__, 'admin_permission' ],
        ]);

        // WC Attributes (for condition builder)
        register_rest_route( self::NAMESPACE, '/admin/wc-attributes', [
            'methods'             => 'GET',
            'callback'            => [ __CLASS__, 'admin_get_wc_attributes' ],
            'permission_callback' => [ __CLASS__, 'admin_permission' ],
        ]);

        // Settings
        register_rest_route( self::NAMESPACE, '/admin/settings', [
            [
                'methods'             => 'GET',
                'callback'            => [ __CLASS__, 'admin_get_settings' ],
                'permission_callback' => [ __CLASS__, 'admin_permission' ],
            ],
            [
                'methods'             => 'POST',
                'callback'            => [ __CLASS__, 'admin_save_settings' ],
                'permission_callback' => [ __CLASS__, 'admin_permission' ],
            ],
        ]);
    }

    /* ── Permission ────────────────────────────────────────── */

    public static function admin_permission() {
        return current_user_can( 'manage_woocommerce' );
    }

    /* ══════════════════════════════════════════════════════════
     *  PUBLIC: Get product configurator data (cached)
     * ══════════════════════════════════════════════════════════ */

    public static function get_product_config( $request ) {
        $product_id = (int) $request->get_param( 'id' );
        $product    = wc_get_product( $product_id );

        if ( ! $product ) {
            return new \WP_Error( 'not_found', 'Product not found.', [ 'status' => 404 ] );
        }

        // Check cache
        $cache_key = 'product_config_' . $product_id . '_gen_' . Cache::get_generation();
        $cached    = Cache::get( $cache_key );
        if ( $cached !== false ) {
            return rest_ensure_response( $cached );
        }

        // Resolve groups
        $groups = DB::resolve_groups_for_product( $product_id );
        $group_ids = array_column( $groups, 'id' );

        // Fetch groups with items in bulk
        $groups_with_items = DB::get_groups_with_items( $group_ids );

        // Enrich items with WC product data where applicable
        // and filter by visibility conditions
        foreach ( $groups_with_items as &$group ) {
            $filtered_items = [];
            foreach ( $group['items'] as &$item ) {
                $item['price']     = (float) $item['price'];
                $item['meta_json'] = $item['meta_json'] ? json_decode( $item['meta_json'], true ) : null;

                // ── Evaluate visibility conditions ──
                if ( ! self::evaluate_item_conditions( $item, $product ) ) {
                    continue; // Skip this item – conditions not met
                }

                if ( $item['item_type'] === 'wc_product' && ! empty( $item['wc_product_id'] ) ) {
                    $wc_prod = wc_get_product( $item['wc_product_id'] );
                    if ( $wc_prod ) {
                        $item['price']     = (float) $wc_prod->get_price();
                        $item['image_url'] = $item['image_url'] ?: wp_get_attachment_url( $wc_prod->get_image_id() );
                        $item['sku']       = $wc_prod->get_sku();
                        $item['in_stock']  = $wc_prod->is_in_stock();
                    }
                }

                // ── Expose guarantee-specific data for frontend ──
                if ( $item['item_type'] === 'guarantee' && ! empty( $item['meta_json'] ) ) {
                    $item['guarantee_data'] = [
                        'subtitle'       => $item['meta_json']['subtitle'] ?? '',
                        'original_price' => (float) ( $item['meta_json']['original_price'] ?? 0 ),
                        'features'       => $item['meta_json']['features'] ?? [],
                    ];
                }

                // ── Select Dropdown: force price to 0 ──
                if ( $item['item_type'] === 'select_dropdown' ) {
                    $item['price'] = 0;
                }

                // Strip conditions from public response (admin-only data)
                if ( isset( $item['meta_json']['conditions'] ) ) {
                    unset( $item['meta_json']['conditions'] );
                    unset( $item['meta_json']['conditions_match'] );
                }

                $filtered_items[] = $item;
            }
            $group['items'] = array_values( $filtered_items );
        }

        // Build product info
        $tax_display  = get_option( 'woocommerce_tax_display_shop', 'excl' );
        $base_price   = $tax_display === 'incl'
            ? wc_get_price_including_tax( $product )
            : wc_get_price_excluding_tax( $product );

        $data = [
            'product_id'      => $product_id,
            'product_name'    => $product->get_name(),
            'base_price'      => (float) $base_price,
            'currency'        => get_woocommerce_currency(),
            'currency_symbol' => get_woocommerce_currency_symbol(),
            'tax_display'     => $tax_display,
            'prices_include_tax' => wc_prices_include_tax(),
            'tax_rate'        => Tax::get_product_tax_rate( $product ),
            'groups'          => $groups_with_items,
            'settings'        => [
                'primary_color'      => get_option( 'gvc_settings' )['primary_color'] ?? '#2D6A4F',
                'accent_color'       => get_option( 'gvc_settings' )['accent_color'] ?? '#40916C',
                'show_vat_breakdown' => get_option( 'gvc_settings' )['show_vat_breakdown'] ?? true,
                'lazy_load_images'   => get_option( 'gvc_settings' )['lazy_load_images'] ?? true,
            ],
        ];

        Cache::set( $cache_key, $data );

        return rest_ensure_response( $data );
    }

    /* ══════════════════════════════════════════════════════════
     *  PUBLIC: Calculate price with selections
     * ══════════════════════════════════════════════════════════ */

    public static function calculate_price( $request ) {
        $product_id = (int) $request->get_param( 'id' );
        $selections = $request->get_json_params()['selections'] ?? [];
        $product    = wc_get_product( $product_id );

        if ( ! $product ) {
            return new \WP_Error( 'not_found', 'Product not found.', [ 'status' => 404 ] );
        }

        $base_price   = (float) $product->get_price();
        $addons_total = 0;
        $breakdown    = [];

        foreach ( $selections as $sel ) {
            $item = DB::get_item( (int) $sel['item_id'] );
            if ( ! $item ) {
                continue;
            }

            $item_price = (float) $item['price'];

            // If WC product, get live price
            if ( $item['item_type'] === 'wc_product' && ! empty( $item['wc_product_id'] ) ) {
                $wc_prod = wc_get_product( $item['wc_product_id'] );
                if ( $wc_prod ) {
                    $item_price = (float) $wc_prod->get_price();
                }
            }

            $qty   = max( 1, (int) ( $sel['quantity'] ?? 1 ) );
            $total = $item_price * $qty;
            $addons_total += $total;

            $breakdown[] = [
                'item_id'   => (int) $item['id'],
                'group_id'  => (int) $item['group_id'],
                'title'     => $item['title'],
                'unit_price'=> $item_price,
                'quantity'  => $qty,
                'total'     => $total,
            ];
        }

        $subtotal = $base_price + $addons_total;
        $tax_rate = Tax::get_product_tax_rate( $product );
        $tax_amount = Tax::calculate_tax( $subtotal, $tax_rate, wc_prices_include_tax() );

        $data = [
            'base_price'    => $base_price,
            'addons_total'  => $addons_total,
            'subtotal'      => $subtotal,
            'tax_rate'      => $tax_rate,
            'tax_amount'    => $tax_amount,
            'total'         => wc_prices_include_tax() ? $subtotal : $subtotal + $tax_amount,
            'breakdown'     => $breakdown,
        ];

        return rest_ensure_response( $data );
    }

    /* ══════════════════════════════════════════════════════════
     *  ADMIN: Groups CRUD
     * ══════════════════════════════════════════════════════════ */

    public static function admin_get_groups() {
        $groups = DB::get_all_groups();

        // Enrich each group with assignment summaries
        foreach ( $groups as &$group ) {
            $rules = DB::get_rules_for_group( $group['id'] );
            $cats = []; $tags = [];
            foreach ( $rules as $r ) {
                $term = get_term( (int) $r['taxonomy_term_id'], $r['rule_type'] === 'category' ? 'product_cat' : 'product_tag' );
                $name = ( $term && ! is_wp_error( $term ) ) ? $term->name : '#' . $r['taxonomy_term_id'];
                if ( $r['rule_type'] === 'category' ) $cats[] = $name;
                else $tags[] = $name;
            }
            $prods = DB::get_products_for_group( $group['id'] );
            $group['assigned_summary'] = [
                'categories' => $cats,
                'tags'       => $tags,
                'products'   => count( $prods ),
            ];
        }

        return rest_ensure_response( $groups );
    }

    public static function admin_get_group( $request ) {
        $group = DB::get_group( (int) $request->get_param( 'id' ) );
        if ( ! $group ) {
            return new \WP_Error( 'not_found', 'Group not found.', [ 'status' => 404 ] );
        }
        $group['items'] = DB::get_items_by_group( $group['id'] );

        // Include assigned categories, tags, and products
        $rules = DB::get_rules_for_group( $group['id'] );
        $group['assigned_categories'] = [];
        $group['assigned_tags'] = [];
        foreach ( $rules as $rule ) {
            if ( $rule['rule_type'] === 'category' ) {
                $group['assigned_categories'][] = (int) $rule['taxonomy_term_id'];
            } elseif ( $rule['rule_type'] === 'tag' ) {
                $group['assigned_tags'][] = (int) $rule['taxonomy_term_id'];
            }
        }

        $product_overrides = DB::get_products_for_group( $group['id'] );
        $group['assigned_products'] = [];
        foreach ( $product_overrides as $po ) {
            $p = wc_get_product( (int) $po['product_id'] );
            $group['assigned_products'][] = [
                'id'   => (int) $po['product_id'],
                'name' => $p ? $p->get_name() : 'Product #' . $po['product_id'],
            ];
        }

        return rest_ensure_response( $group );
    }

    public static function admin_create_group( $request ) {
        $params = $request->get_json_params();
        $id = DB::insert_group([
            'title'        => sanitize_text_field( $params['title'] ?? '' ),
            'slug'         => sanitize_title( $params['slug'] ?? $params['title'] ?? '' ),
            'description'  => sanitize_textarea_field( $params['description'] ?? '' ),
            'sort_order'   => (int) ( $params['sort_order'] ?? 0 ),
            'display_type' => sanitize_text_field( $params['display_type'] ?? 'radio' ),
            'is_required'  => (int) ( $params['is_required'] ?? 0 ),
            'icon_url'     => esc_url_raw( $params['icon_url'] ?? '' ),
        ]);

        // Save taxonomy assignments
        self::save_group_assignments( $id, $params );

        return rest_ensure_response( [ 'id' => $id, 'message' => 'Group created.' ] );
    }

    public static function admin_update_group( $request ) {
        $id = (int) $request->get_param( 'id' );
        $params = $request->get_json_params();

        $data = [];
        if ( isset( $params['title'] ) )        $data['title']        = sanitize_text_field( $params['title'] );
        if ( isset( $params['slug'] ) )          $data['slug']         = sanitize_title( $params['slug'] );
        if ( isset( $params['description'] ) )   $data['description']  = sanitize_textarea_field( $params['description'] );
        if ( isset( $params['sort_order'] ) )    $data['sort_order']   = (int) $params['sort_order'];
        if ( isset( $params['display_type'] ) )  $data['display_type'] = sanitize_text_field( $params['display_type'] );
        if ( isset( $params['is_required'] ) )   $data['is_required']  = (int) $params['is_required'];
        if ( isset( $params['icon_url'] ) )      $data['icon_url']     = esc_url_raw( $params['icon_url'] );

        if ( ! empty( $data ) ) {
            DB::update_group( $id, $data );
        }

        // Save taxonomy assignments
        self::save_group_assignments( $id, $params );

        return rest_ensure_response( [ 'id' => $id, 'message' => 'Group updated.' ] );
    }

    /**
     * Save category/tag/product assignments for a group.
     */
    private static function save_group_assignments( $group_id, $params ) {
        // Build rules array from categories + tags
        $rules = [];
        $categories = $params['assigned_categories'] ?? [];
        $tags        = $params['assigned_tags'] ?? [];

        foreach ( $categories as $term_id ) {
            $rules[] = [ 'rule_type' => 'category', 'term_id' => (int) $term_id ];
        }
        foreach ( $tags as $term_id ) {
            $rules[] = [ 'rule_type' => 'tag', 'term_id' => (int) $term_id ];
        }

        DB::set_rules_for_group( $group_id, $rules );

        // Product assignments
        $product_ids = $params['assigned_products'] ?? [];
        DB::set_products_for_group( $group_id, array_map( 'intval', $product_ids ) );
    }

    public static function admin_delete_group( $request ) {
        $id = (int) $request->get_param( 'id' );
        DB::delete_group( $id );
        return rest_ensure_response( [ 'message' => 'Group deleted.' ] );
    }

    /* ══════════════════════════════════════════════════════════
     *  ADMIN: Items CRUD
     * ══════════════════════════════════════════════════════════ */

    public static function admin_get_items( $request ) {
        $group_id = (int) $request->get_param( 'group_id' );
        return rest_ensure_response( DB::get_items_by_group( $group_id ) );
    }

    public static function admin_create_item( $request ) {
        $group_id = (int) $request->get_param( 'group_id' );
        $params   = $request->get_json_params();

        $id = DB::insert_item([
            'group_id'      => $group_id,
            'item_type'     => sanitize_text_field( $params['item_type'] ?? 'virtual' ),
            'wc_product_id' => ! empty( $params['wc_product_id'] ) ? (int) $params['wc_product_id'] : null,
            'title'         => sanitize_text_field( $params['title'] ?? '' ),
            'description'   => sanitize_textarea_field( $params['description'] ?? '' ),
            'price'         => (float) ( $params['price'] ?? 0 ),
            'image_url'     => esc_url_raw( $params['image_url'] ?? '' ),
            'sku'           => sanitize_text_field( $params['sku'] ?? '' ),
            'sort_order'    => (int) ( $params['sort_order'] ?? 0 ),
            'is_default'    => (int) ( $params['is_default'] ?? 0 ),
            'meta_json'     => ! empty( $params['meta'] ) ? wp_json_encode( $params['meta'] ) : null,
        ]);

        return rest_ensure_response( [ 'id' => $id, 'message' => 'Item created.' ] );
    }

    public static function admin_update_item( $request ) {
        $id = (int) $request->get_param( 'id' );
        $params = $request->get_json_params();

        $data = [];
        if ( isset( $params['item_type'] ) )     $data['item_type']     = sanitize_text_field( $params['item_type'] );
        if ( isset( $params['wc_product_id'] ) ) $data['wc_product_id'] = (int) $params['wc_product_id'] ?: null;
        if ( isset( $params['title'] ) )         $data['title']         = sanitize_text_field( $params['title'] );
        if ( isset( $params['description'] ) )   $data['description']   = sanitize_textarea_field( $params['description'] );
        if ( isset( $params['price'] ) )         $data['price']         = (float) $params['price'];
        if ( isset( $params['image_url'] ) )     $data['image_url']     = esc_url_raw( $params['image_url'] );
        if ( isset( $params['sku'] ) )           $data['sku']           = sanitize_text_field( $params['sku'] );
        if ( isset( $params['sort_order'] ) )    $data['sort_order']    = (int) $params['sort_order'];
        if ( isset( $params['is_default'] ) )    $data['is_default']    = (int) $params['is_default'];
        if ( isset( $params['meta'] ) )          $data['meta_json']     = wp_json_encode( $params['meta'] );

        DB::update_item( $id, $data );
        return rest_ensure_response( [ 'id' => $id, 'message' => 'Item updated.' ] );
    }

    public static function admin_delete_item( $request ) {
        $id = (int) $request->get_param( 'id' );
        DB::delete_item( $id );
        return rest_ensure_response( [ 'message' => 'Item deleted.' ] );
    }

    /* ══════════════════════════════════════════════════════════
     *  ADMIN: Global Rules
     * ══════════════════════════════════════════════════════════ */

    public static function admin_get_rules( $request ) {
        $term_id   = (int) $request->get_param( 'term_id' );
        $rule_type = sanitize_text_field( $request->get_param( 'rule_type' ) ?: 'category' );
        return rest_ensure_response( DB::get_rules_for_term( $term_id, $rule_type ) );
    }

    public static function admin_set_rules( $request ) {
        $params    = $request->get_json_params();
        $term_id   = (int) ( $params['term_id'] ?? 0 );
        $rule_type = sanitize_text_field( $params['rule_type'] ?? 'category' );
        $group_ids = array_map( 'intval', $params['group_ids'] ?? [] );

        DB::set_rules_for_term( $term_id, $rule_type, $group_ids );
        return rest_ensure_response( [ 'message' => 'Rules updated.' ] );
    }

    /**
     * Get all WooCommerce product categories (hierarchical) and tags.
     */
    public static function admin_get_taxonomies() {
        // Categories (hierarchical)
        $cat_terms = get_terms([
            'taxonomy'   => 'product_cat',
            'hide_empty' => false,
            'orderby'    => 'name',
            'order'      => 'ASC',
        ]);

        $categories = [];
        if ( ! is_wp_error( $cat_terms ) ) {
            foreach ( $cat_terms as $term ) {
                $categories[] = [
                    'id'       => $term->term_id,
                    'name'     => $term->name,
                    'slug'     => $term->slug,
                    'parent'   => $term->parent,
                    'count'    => $term->count,
                ];
            }
        }

        // Build tree structure
        $cat_tree = self::build_term_tree( $categories, 0 );

        // Tags (flat)
        $tag_terms = get_terms([
            'taxonomy'   => 'product_tag',
            'hide_empty' => false,
            'orderby'    => 'name',
            'order'      => 'ASC',
        ]);

        $tags = [];
        if ( ! is_wp_error( $tag_terms ) ) {
            foreach ( $tag_terms as $term ) {
                $tags[] = [
                    'id'    => $term->term_id,
                    'name'  => $term->name,
                    'slug'  => $term->slug,
                    'count' => $term->count,
                ];
            }
        }

        return rest_ensure_response([
            'categories' => $cat_tree,
            'tags'       => $tags,
        ]);
    }

    /**
     * Build a nested tree from flat term list.
     */
    private static function build_term_tree( $terms, $parent_id ) {
        $tree = [];
        foreach ( $terms as $term ) {
            if ( (int) $term['parent'] === $parent_id ) {
                $children = self::build_term_tree( $terms, $term['id'] );
                $term['children'] = $children;
                $tree[] = $term;
            }
        }
        return $tree;
    }

    /**
     * Get ALL rules across all terms (for the overview page).
     */
    public static function admin_get_all_rules() {
        global $wpdb;

        $results = $wpdb->get_results(
            "SELECT r.*, g.title AS group_title, g.slug AS group_slug
             FROM " . DB::rules_table() . " r
             JOIN " . DB::groups_table() . " g ON g.id = r.group_id
             ORDER BY r.rule_type ASC, r.taxonomy_term_id ASC, r.sort_order ASC",
            ARRAY_A
        );

        // Enrich with term names
        foreach ( $results as &$rule ) {
            $taxonomy = $rule['rule_type'] === 'category' ? 'product_cat' : 'product_tag';
            $term = get_term( (int) $rule['taxonomy_term_id'], $taxonomy );
            $rule['term_name'] = ( $term && ! is_wp_error( $term ) ) ? $term->name : 'Unknown (#' . $rule['taxonomy_term_id'] . ')';
        }

        return rest_ensure_response( $results );
    }

    /* ══════════════════════════════════════════════════════════
     *  ADMIN: Product Overrides
     * ══════════════════════════════════════════════════════════ */

    public static function admin_get_overrides( $request ) {
        $product_id = (int) $request->get_param( 'product_id' );
        return rest_ensure_response( DB::get_overrides_for_product( $product_id ) );
    }

    public static function admin_set_overrides( $request ) {
        $product_id = (int) $request->get_param( 'product_id' );
        $overrides  = $request->get_json_params()['overrides'] ?? [];
        DB::set_overrides_for_product( $product_id, $overrides );
        return rest_ensure_response( [ 'message' => 'Overrides updated.' ] );
    }

    /* ══════════════════════════════════════════════════════════
     *  ADMIN: Search WC Products
     * ══════════════════════════════════════════════════════════ */

    public static function admin_search_wc_products( $request ) {
        $search = sanitize_text_field( $request->get_param( 'search' ) ?? '' );
        $page   = max( 1, (int) $request->get_param( 'page' ) );
        $limit  = 20;

        $args = [
            'status'  => 'publish',
            'limit'   => $limit,
            'page'    => $page,
            'orderby' => 'title',
            'order'   => 'ASC',
        ];

        if ( $search ) {
            $args['s'] = $search;
        }

        $products = wc_get_products( $args );
        $result   = [];

        foreach ( $products as $p ) {
            $result[] = [
                'id'        => $p->get_id(),
                'name'      => $p->get_name(),
                'sku'       => $p->get_sku(),
                'price'     => (float) $p->get_price(),
                'image_url' => wp_get_attachment_url( $p->get_image_id() ),
            ];
        }

        return rest_ensure_response( $result );
    }

    /* ══════════════════════════════════════════════════════════
     *  ADMIN: WC Attributes (for condition builder)
     * ══════════════════════════════════════════════════════════ */

    public static function admin_get_wc_attributes() {
        $attribute_taxonomies = wc_get_attribute_taxonomies();
        $result = [];

        foreach ( $attribute_taxonomies as $attr ) {
            $slug = 'pa_' . $attr->attribute_name;
            $terms = get_terms([
                'taxonomy'   => $slug,
                'hide_empty' => false,
                'orderby'    => 'name',
            ]);

            $term_list = [];
            if ( ! is_wp_error( $terms ) ) {
                foreach ( $terms as $term ) {
                    $term_list[] = [
                        'id'   => $term->term_id,
                        'name' => $term->name,
                        'slug' => $term->slug,
                    ];
                }
            }

            $result[] = [
                'id'    => (int) $attr->attribute_id,
                'name'  => $attr->attribute_label,
                'slug'  => $slug,
                'terms' => $term_list,
            ];
        }

        return rest_ensure_response( $result );
    }

    /* ══════════════════════════════════════════════════════════
     *  CONDITION EVALUATOR
     *  Evaluates item visibility conditions against a product.
     * ══════════════════════════════════════════════════════════ */

    /**
     * Check if an item's conditions are met for a given product.
     *
     * @param array       $item    The addon item (with meta_json decoded).
     * @param \WC_Product $product The WooCommerce product being viewed.
     * @return bool True if item should be visible.
     */
    private static function evaluate_item_conditions( $item, $product ) {
        $meta = $item['meta_json'];
        if ( is_string( $meta ) ) {
            $meta = json_decode( $meta, true );
        }

        if ( empty( $meta['conditions'] ) || ! is_array( $meta['conditions'] ) ) {
            return true; // No conditions = always visible
        }

        $conditions = $meta['conditions'];
        $match_mode = $meta['conditions_match'] ?? 'all'; // 'all' = AND, 'any' = OR

        $product_id = $product->get_id();

        // Pre-fetch product data for condition checks
        $product_attrs = self::get_product_attribute_values( $product );
        $product_cat_ids   = [];
        $product_cat_slugs = [];
        $product_tag_ids   = [];
        $product_tag_slugs = [];

        $cat_terms = get_the_terms( $product_id, 'product_cat' );
        if ( ! is_wp_error( $cat_terms ) && $cat_terms ) {
            foreach ( $cat_terms as $t ) {
                $product_cat_ids[]   = $t->term_id;
                $product_cat_slugs[] = $t->slug;
            }
        }

        $tag_terms = get_the_terms( $product_id, 'product_tag' );
        if ( ! is_wp_error( $tag_terms ) && $tag_terms ) {
            foreach ( $tag_terms as $t ) {
                $product_tag_ids[]   = $t->term_id;
                $product_tag_slugs[] = $t->slug;
            }
        }

        $results = [];

        foreach ( $conditions as $cond ) {
            $source   = $cond['source'] ?? '';
            $operator = $cond['operator'] ?? 'is';
            $value    = trim( $cond['value'] ?? '' );

            if ( $value === '' ) {
                $results[] = true; // Empty value = skip condition
                continue;
            }

            $pass = false;

            switch ( $source ) {
                case 'attribute':
                    $attr_slug = $cond['attribute'] ?? '';
                    if ( empty( $attr_slug ) ) {
                        $pass = true;
                        break;
                    }
                    $product_val = $product_attrs[ $attr_slug ] ?? '';

                    // Support comma-separated attribute values (e.g. variable products)
                    $product_values = is_array( $product_val )
                        ? $product_val
                        : array_map( 'trim', explode( ',', (string) $product_val ) );

                    switch ( $operator ) {
                        case 'is':
                            $pass = in_array( strtolower( $value ), array_map( 'strtolower', $product_values ) );
                            break;
                        case 'is_not':
                            $pass = ! in_array( strtolower( $value ), array_map( 'strtolower', $product_values ) );
                            break;
                        case 'contains':
                            foreach ( $product_values as $pv ) {
                                if ( stripos( $pv, $value ) !== false ) {
                                    $pass = true;
                                    break;
                                }
                            }
                            break;
                        case 'greater_than':
                            foreach ( $product_values as $pv ) {
                                $num_pv = (float) preg_replace( '/[^\d.,\-]/', '', str_replace( ',', '.', $pv ) );
                                $num_val = (float) preg_replace( '/[^\d.,\-]/', '', str_replace( ',', '.', $value ) );
                                if ( $num_pv > $num_val ) {
                                    $pass = true;
                                    break;
                                }
                            }
                            break;
                        case 'less_than':
                            foreach ( $product_values as $pv ) {
                                $num_pv = (float) preg_replace( '/[^\d.,\-]/', '', str_replace( ',', '.', $pv ) );
                                $num_val = (float) preg_replace( '/[^\d.,\-]/', '', str_replace( ',', '.', $value ) );
                                if ( $num_pv < $num_val ) {
                                    $pass = true;
                                    break;
                                }
                            }
                            break;
                        default:
                            $pass = true;
                    }
                    break;

                case 'category':
                    $check_val = strtolower( $value );
                    $in_cat = in_array( $check_val, array_map( 'strtolower', $product_cat_slugs ) )
                           || in_array( (int) $value, $product_cat_ids );
                    $pass = ( $operator === 'is' ) ? $in_cat : ! $in_cat;
                    break;

                case 'tag':
                    $check_val = strtolower( $value );
                    $in_tag = in_array( $check_val, array_map( 'strtolower', $product_tag_slugs ) )
                           || in_array( (int) $value, $product_tag_ids );
                    $pass = ( $operator === 'is' ) ? $in_tag : ! $in_tag;
                    break;

                default:
                    $pass = true;
            }

            $results[] = $pass;
        }

        if ( empty( $results ) ) {
            return true;
        }

        if ( $match_mode === 'any' ) {
            return in_array( true, $results, true );
        }

        // Default: 'all' (AND)
        return ! in_array( false, $results, true );
    }

    /**
     * Get all attribute values for a product as slug => value(s).
     */
    private static function get_product_attribute_values( $product ) {
        $result = [];
        $attributes = $product->get_attributes();

        foreach ( $attributes as $attr_key => $attr ) {
            if ( $attr instanceof \WC_Product_Attribute ) {
                if ( $attr->is_taxonomy() ) {
                    $terms = wp_get_post_terms( $product->get_id(), $attr->get_name(), [ 'fields' => 'names' ] );
                    $result[ $attr->get_name() ] = is_wp_error( $terms ) ? [] : $terms;
                } else {
                    $result[ $attr_key ] = $attr->get_options();
                }
            } else {
                $result[ $attr_key ] = is_array( $attr ) ? $attr : [ $attr ];
            }
        }

        return $result;
    }

    /* ══════════════════════════════════════════════════════════
     *  ADMIN: Settings
     * ══════════════════════════════════════════════════════════ */

    public static function admin_get_settings() {
        return rest_ensure_response( get_option( 'gvc_settings', [] ) );
    }

    public static function admin_save_settings( $request ) {
        $params   = $request->get_json_params();
        $settings = get_option( 'gvc_settings', [] );

        $allowed = [
            'enable_cache', 'cache_ttl', 'lazy_load_images',
            'show_vat_breakdown', 'primary_color', 'accent_color',
        ];

        foreach ( $allowed as $key ) {
            if ( isset( $params[ $key ] ) ) {
                $settings[ $key ] = $params[ $key ];
            }
        }

        update_option( 'gvc_settings', $settings );
        Cache::flush_all();

        return rest_ensure_response( [ 'message' => 'Settings saved.', 'settings' => $settings ] );
    }
}
