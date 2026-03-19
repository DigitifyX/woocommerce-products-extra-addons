<?php
/**
 * WooCommerce Cart integration.
 * Passes configurator selections through add_cart_item_data and adjusts totals.
 *
 * @package GartenVista\Configurator
 */

namespace GVC;

defined( 'ABSPATH' ) || exit;

class Cart {

    public static function init() {
        // Add configuration data to cart item
        add_filter( 'woocommerce_add_cart_item_data', [ __CLASS__, 'add_cart_item_data' ], 10, 3 );

        // Adjust cart item price based on selections
        add_action( 'woocommerce_before_calculate_totals', [ __CLASS__, 'adjust_cart_prices' ], 20, 1 );

        // Display configuration in cart
        add_filter( 'woocommerce_get_item_data', [ __CLASS__, 'display_cart_item_data' ], 10, 2 );

        // Persist cart item data through sessions
        add_filter( 'woocommerce_get_cart_item_from_session', [ __CLASS__, 'restore_cart_item_data' ], 10, 3 );

        // Add meta to order items
        add_action( 'woocommerce_checkout_create_order_line_item', [ __CLASS__, 'add_order_item_meta' ], 10, 4 );
    }

    /**
     * Hook: woocommerce_add_cart_item_data
     * Capture configurator selections when product is added to cart.
     */
    public static function add_cart_item_data( $cart_item_data, $product_id, $variation_id ) {
        // phpcs:ignore WordPress.Security.NonceVerification
        if ( empty( $_POST['gvc_selections'] ) ) {
            return $cart_item_data;
        }

        // phpcs:ignore WordPress.Security.NonceVerification
        $raw = wp_unslash( $_POST['gvc_selections'] );
        $selections = json_decode( $raw, true );

        if ( ! is_array( $selections ) ) {
            return $cart_item_data;
        }

        $validated = [];
        $addons_total = 0;

        foreach ( $selections as $sel ) {
            $item = DB::get_item( (int) $sel['item_id'] );
            if ( ! $item ) {
                continue;
            }

            $price = (float) $item['price'];

            // Get live WC product price if applicable
            if ( $item['item_type'] === 'wc_product' && ! empty( $item['wc_product_id'] ) ) {
                $wc_prod = wc_get_product( $item['wc_product_id'] );
                if ( $wc_prod ) {
                    $price = (float) $wc_prod->get_price();
                }
            }

            $qty = max( 1, (int) ( $sel['quantity'] ?? 1 ) );

            $validated[] = [
                'item_id'       => (int) $item['id'],
                'group_id'      => (int) $item['group_id'],
                'title'         => $item['title'],
                'price'         => $price,
                'quantity'      => $qty,
                'item_type'     => $item['item_type'],
                'wc_product_id' => $item['wc_product_id'] ? (int) $item['wc_product_id'] : null,
                'sku'           => $item['sku'],
            ];

            $addons_total += $price * $qty;
        }

        if ( ! empty( $validated ) ) {
            $cart_item_data['gvc_config'] = [
                'selections'   => $validated,
                'addons_total' => $addons_total,
                'timestamp'    => time(),
            ];
            // Unique key to allow same product with different configs
            $cart_item_data['unique_key'] = md5( wp_json_encode( $validated ) . $product_id );
        }

        return $cart_item_data;
    }

    /**
     * Hook: woocommerce_before_calculate_totals
     * Adjust the product price to include addon selections.
     */
    public static function adjust_cart_prices( $cart ) {
        if ( is_admin() && ! defined( 'DOING_AJAX' ) ) {
            return;
        }

        if ( did_action( 'woocommerce_before_calculate_totals' ) >= 2 ) {
            return;
        }

        foreach ( $cart->get_cart() as $cart_item ) {
            if ( empty( $cart_item['gvc_config'] ) ) {
                continue;
            }

            $config       = $cart_item['gvc_config'];
            $addons_total = (float) $config['addons_total'];
            $base_price   = (float) $cart_item['data']->get_price();
            $new_price    = $base_price + $addons_total;

            $cart_item['data']->set_price( $new_price );
        }
    }

    /**
     * Hook: woocommerce_get_item_data
     * Show configuration details in cart/checkout.
     */
    public static function display_cart_item_data( $item_data, $cart_item ) {
        if ( empty( $cart_item['gvc_config'] ) ) {
            return $item_data;
        }

        $config = $cart_item['gvc_config'];
        $currency_symbol = get_woocommerce_currency_symbol();

        foreach ( $config['selections'] as $sel ) {
            $price_display = wc_price( $sel['price'] * $sel['quantity'] );
            $qty_text      = $sel['quantity'] > 1 ? ' (×' . $sel['quantity'] . ')' : '';

            $item_data[] = [
                'key'   => esc_html( $sel['title'] ),
                'value' => $price_display . $qty_text,
            ];
        }

        // Total addons line
        $item_data[] = [
            'key'   => __( 'Add-ons Total', 'gv-configurator' ),
            'value' => '<strong>' . wc_price( $config['addons_total'] ) . '</strong>',
        ];

        return $item_data;
    }

    /**
     * Hook: woocommerce_get_cart_item_from_session
     * Restore config data from session.
     */
    public static function restore_cart_item_data( $cart_item, $values, $key ) {
        if ( ! empty( $values['gvc_config'] ) ) {
            $cart_item['gvc_config'] = $values['gvc_config'];
        }
        return $cart_item;
    }

    /**
     * Hook: woocommerce_checkout_create_order_line_item
     * Persist configuration metadata on the order line item.
     */
    public static function add_order_item_meta( $item, $cart_item_key, $values, $order ) {
        if ( empty( $values['gvc_config'] ) ) {
            return;
        }

        $config = $values['gvc_config'];

        // Store full config as hidden meta (for admin/API use)
        $item->add_meta_data( '_gvc_config', $config, true );

        // Store human-readable lines as visible meta
        foreach ( $config['selections'] as $sel ) {
            $qty_text = $sel['quantity'] > 1 ? ' ×' . $sel['quantity'] : '';
            $item->add_meta_data(
                $sel['title'],
                wp_strip_all_tags( wc_price( $sel['price'] * $sel['quantity'] ) ) . $qty_text,
                false
            );
        }

        $item->add_meta_data(
            __( 'Add-ons Total', 'gv-configurator' ),
            wp_strip_all_tags( wc_price( $config['addons_total'] ) ),
            true
        );
    }
}
