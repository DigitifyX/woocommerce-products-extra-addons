<?php
/**
 * Frontend – enqueue React configurator on product pages.
 *
 * @package GartenVista\Configurator
 */

namespace GVC;

defined( 'ABSPATH' ) || exit;

class Frontend {

    public static function init() {
        add_action( 'wp_enqueue_scripts', [ __CLASS__, 'enqueue_scripts' ] );
        add_action( 'woocommerce_before_add_to_cart_button', [ __CLASS__, 'render_configurator_mount' ], 5 );
        add_filter( 'woocommerce_product_add_to_cart_text', [ __CLASS__, 'custom_button_text' ], 10, 2 );
    }

    /**
     * Enqueue frontend assets on single product pages.
     */
    public static function enqueue_scripts() {
        if ( ! is_product() ) {
            return;
        }

        global $post;
        if ( ! $post ) {
            return;
        }

        $product = wc_get_product( $post->ID );
        if ( ! $product ) {
            return;
        }

        // Check if product has configurator data
        $groups = DB::resolve_groups_for_product( $product->get_id() );
        if ( empty( $groups ) ) {
            return;
        }

        // Custom frontend styles
        wp_enqueue_style(
            'gvc-frontend-css',
            GVC_PLUGIN_URL . 'frontend/css/configurator.css',
            [],
            GVC_VERSION
        );

        // React app
        wp_enqueue_script(
            'gvc-frontend-js',
            GVC_PLUGIN_URL . 'frontend/dist/configurator.js',
            [ 'wp-element' ],
            GVC_VERSION,
            true
        );

        $settings = get_option( 'gvc_settings', [] );

        wp_localize_script( 'gvc-frontend-js', 'gvcFrontend', [
            'restUrl'        => rest_url( REST_API::NAMESPACE ),
            'productId'      => $product->get_id(),
            'nonce'          => wp_create_nonce( 'wp_rest' ),
            'ajaxUrl'        => admin_url( 'admin-ajax.php' ),
            'cartUrl'        => wc_get_cart_url(),
            'currency'       => get_woocommerce_currency(),
            'currencySymbol' => html_entity_decode( get_woocommerce_currency_symbol() ),
            'currencyPos'    => get_option( 'woocommerce_currency_pos', 'left' ),
            'decimals'       => wc_get_price_decimals(),
            'decimalSep'     => wc_get_price_decimal_separator(),
            'thousandSep'    => wc_get_price_thousand_separator(),
            'primaryColor'   => $settings['primary_color'] ?? '#2D6A4F',
            'accentColor'    => $settings['accent_color'] ?? '#40916C',
            'showVat'        => ! empty( $settings['show_vat_breakdown'] ),
            'lazyLoad'       => ! empty( $settings['lazy_load_images'] ),
        ]);
    }

    /**
     * Render the mount point for the React configurator.
     */
    public static function render_configurator_mount() {
        global $product;
        if ( ! $product || ! is_object( $product ) ) {
            global $post;
            $product = $post ? wc_get_product( $post->ID ) : null;
        }
        if ( ! $product ) {
            return;
        }

        $groups = DB::resolve_groups_for_product( $product->get_id() );
        if ( empty( $groups ) ) {
            return;
        }

        echo '<div id="gvc-configurator-root" data-product-id="' . esc_attr( $product->get_id() ) . '"></div>';
        echo '<input type="hidden" name="gvc_selections" id="gvc-selections-input" value="">';
    }

    /**
     * Optionally customize the add to cart button text.
     */
    public static function custom_button_text( $text, $product ) {
        if ( is_product() && is_object( $product ) && method_exists( $product, 'get_id' ) ) {
            $groups = DB::resolve_groups_for_product( $product->get_id() );
            if ( ! empty( $groups ) ) {
                return __( 'Configure & Add to Cart', 'gv-configurator' );
            }
        }
        return $text;
    }
}
