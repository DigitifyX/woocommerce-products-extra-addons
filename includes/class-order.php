<?php
/**
 * Order integration – display configurator metadata in admin.
 *
 * @package GartenVista\Configurator
 */

namespace GVC;

defined( 'ABSPATH' ) || exit;

class Order {

    public static function init() {
        // Display config in admin order view
        add_action( 'woocommerce_after_order_itemmeta', [ __CLASS__, 'display_config_in_admin' ], 10, 3 );

        // Include config in order emails
        add_filter( 'woocommerce_order_item_get_formatted_meta_data', [ __CLASS__, 'format_order_meta' ], 10, 2 );
    }

    /**
     * Show a detailed config breakdown in the admin order page.
     */
    public static function display_config_in_admin( $item_id, $item, $product ) {
        $config = $item->get_meta( '_gvc_config', true );
        if ( empty( $config ) || empty( $config['selections'] ) ) {
            return;
        }

        echo '<div class="gvc-order-config" style="margin-top:12px;padding:10px;background:#f8f8f8;border-left:3px solid #2D6A4F;border-radius:3px">';
        echo '<strong style="display:block;margin-bottom:6px">🔧 Configurator Selections</strong>';
        echo '<table style="width:100%;font-size:12px;border-collapse:collapse">';
        echo '<thead><tr><th style="text-align:left;padding:4px">Item</th><th style="text-align:right;padding:4px">Price</th><th style="text-align:center;padding:4px">Qty</th><th style="text-align:right;padding:4px">Total</th></tr></thead>';
        echo '<tbody>';

        foreach ( $config['selections'] as $sel ) {
            $total = $sel['price'] * $sel['quantity'];
            echo '<tr>';
            echo '<td style="padding:4px">' . esc_html( $sel['title'] );
            if ( ! empty( $sel['sku'] ) ) {
                echo ' <small style="color:#666">(' . esc_html( $sel['sku'] ) . ')</small>';
            }
            echo '</td>';
            echo '<td style="text-align:right;padding:4px">' . wc_price( $sel['price'] ) . '</td>';
            echo '<td style="text-align:center;padding:4px">' . (int) $sel['quantity'] . '</td>';
            echo '<td style="text-align:right;padding:4px">' . wc_price( $total ) . '</td>';
            echo '</tr>';
        }

        echo '</tbody>';
        echo '<tfoot><tr><td colspan="3" style="text-align:right;padding:6px 4px;font-weight:bold">Add-ons Total:</td>';
        echo '<td style="text-align:right;padding:6px 4px;font-weight:bold">' . wc_price( $config['addons_total'] ) . '</td></tr></tfoot>';
        echo '</table>';
        echo '</div>';
    }

    /**
     * Hide internal meta from visible display but keep human-readable ones.
     */
    public static function format_order_meta( $formatted_meta, $item ) {
        foreach ( $formatted_meta as $key => $meta ) {
            if ( $meta->key === '_gvc_config' ) {
                unset( $formatted_meta[ $key ] );
            }
        }
        return $formatted_meta;
    }
}
