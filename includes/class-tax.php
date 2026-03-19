<?php
/**
 * Tax/VAT calculation – integrates with WooCommerce Tax Settings.
 *
 * @package GartenVista\Configurator
 */

namespace GVC;

defined( 'ABSPATH' ) || exit;

class Tax {

    public static function init() {
        // Tax is used on-demand, no hooks needed
    }

    /**
     * Get the applicable tax rate for a product.
     */
    public static function get_product_tax_rate( $product ) {
        if ( ! wc_tax_enabled() || ! $product->is_taxable() ) {
            return 0;
        }

        $tax_class = $product->get_tax_class();
        $rates     = \WC_Tax::get_base_tax_rates( $tax_class );

        if ( empty( $rates ) ) {
            return 0;
        }

        // Sum compound rates
        $total_rate = 0;
        foreach ( $rates as $rate ) {
            $total_rate += (float) $rate['rate'];
        }

        return $total_rate;
    }

    /**
     * Calculate tax amount for a given subtotal.
     *
     * @param float $subtotal       The subtotal amount.
     * @param float $tax_rate       Tax rate percentage (e.g. 21 for 21%).
     * @param bool  $price_incl_tax Whether prices already include tax.
     * @return float Tax amount.
     */
    public static function calculate_tax( $subtotal, $tax_rate, $price_incl_tax = false ) {
        if ( $tax_rate <= 0 ) {
            return 0;
        }

        if ( $price_incl_tax ) {
            // Extract tax from inclusive price
            return $subtotal - ( $subtotal / ( 1 + ( $tax_rate / 100 ) ) );
        }

        // Calculate tax on exclusive price
        return $subtotal * ( $tax_rate / 100 );
    }

    /**
     * Get price with or without tax for display.
     */
    public static function get_display_price( $price, $tax_rate, $prices_include_tax, $display_incl ) {
        if ( $tax_rate <= 0 ) {
            return $price;
        }

        if ( $prices_include_tax && ! $display_incl ) {
            // Strip tax
            return $price / ( 1 + ( $tax_rate / 100 ) );
        }

        if ( ! $prices_include_tax && $display_incl ) {
            // Add tax
            return $price * ( 1 + ( $tax_rate / 100 ) );
        }

        return $price;
    }
}
