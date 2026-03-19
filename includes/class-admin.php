<?php
/**
 * Admin functionality – scripts, meta boxes, product integration.
 *
 * @package GartenVista\Configurator
 */

namespace GVC;

defined( 'ABSPATH' ) || exit;

class Admin {

    public static function init() {
        add_action( 'admin_enqueue_scripts', [ __CLASS__, 'enqueue_scripts' ] );
        add_action( 'add_meta_boxes', [ __CLASS__, 'register_meta_boxes' ] );
        add_action( 'save_post_product', [ __CLASS__, 'save_product_meta' ], 20 );

        // Add product data tab
        add_filter( 'woocommerce_product_data_tabs', [ __CLASS__, 'product_data_tab' ] );
        add_action( 'woocommerce_product_data_panels', [ __CLASS__, 'product_data_panel' ] );
    }

    /**
     * Enqueue admin scripts on relevant pages.
     */
    public static function enqueue_scripts( $hook ) {
        $screen = get_current_screen();

        // Admin React app for configurator pages
        if ( strpos( $hook, 'gvc-' ) !== false || $hook === 'toplevel_page_gvc-configurator' ) {
            wp_enqueue_style(
                'gvc-admin-css',
                GVC_PLUGIN_URL . 'admin/css/admin.css',
                [],
                GVC_VERSION
            );
            wp_enqueue_script(
                'gvc-admin-js',
                GVC_PLUGIN_URL . 'admin/js/admin.js',
                [ 'wp-element', 'wp-components', 'wp-api-fetch' ],
                GVC_VERSION,
                true
            );
            wp_localize_script( 'gvc-admin-js', 'gvcAdmin', [
                'restUrl'   => rest_url( REST_API::NAMESPACE ),
                'nonce'     => wp_create_nonce( 'wp_rest' ),
                'adminUrl'  => admin_url(),
                'pluginUrl' => GVC_PLUGIN_URL,
            ]);
        }

        // Product edit page scripts
        if ( $screen && $screen->id === 'product' ) {
            wp_enqueue_script(
                'gvc-product-meta-js',
                GVC_PLUGIN_URL . 'admin/js/product-meta.js',
                [ 'jquery', 'select2' ],
                GVC_VERSION,
                true
            );
            wp_localize_script( 'gvc-product-meta-js', 'gvcProductMeta', [
                'restUrl' => rest_url( REST_API::NAMESPACE ),
                'nonce'   => wp_create_nonce( 'wp_rest' ),
                'groups'  => DB::get_all_groups(),
            ]);
        }
    }

    /**
     * Register meta box on product edit screen.
     */
    public static function register_meta_boxes() {
        // We use WC product data tabs instead, but also add a meta box as fallback
    }

    /**
     * Add "Configurator" tab to WC product data.
     */
    public static function product_data_tab( $tabs ) {
        $tabs['gvc_configurator'] = [
            'label'    => __( 'Configurator', 'gv-configurator' ),
            'target'   => 'gvc_configurator_data',
            'class'    => [ 'show_if_simple', 'show_if_variable' ],
            'priority' => 75,
        ];
        return $tabs;
    }

    /**
     * Render product data panel.
     */
    public static function product_data_panel() {
        global $post;
        $product_id = $post->ID;
        $overrides  = DB::get_overrides_for_product( $product_id );
        $all_groups = DB::get_all_groups();

        echo '<div id="gvc_configurator_data" class="panel woocommerce_options_panel">';
        echo '<div class="options_group">';
        echo '<h4 style="padding:0 12px">Product Configurator Overrides</h4>';
        echo '<p style="padding:0 12px;color:#666">Override global rules for this specific product. Leave empty to use category/tag rules.</p>';

        echo '<div id="gvc-product-overrides-app" data-product-id="' . esc_attr( $product_id ) . '">';
        echo '<p style="padding:12px">Loading...</p>';
        echo '</div>';

        // Hidden field to store override data
        echo '<input type="hidden" name="gvc_overrides_json" id="gvc_overrides_json" value="' . esc_attr( wp_json_encode( $overrides ) ) . '">';
        wp_nonce_field( 'gvc_save_overrides', 'gvc_overrides_nonce' );

        echo '</div>';
        echo '</div>';
    }

    /**
     * Save product overrides on product save.
     */
    public static function save_product_meta( $product_id ) {
        if ( ! isset( $_POST['gvc_overrides_nonce'] ) || ! wp_verify_nonce( $_POST['gvc_overrides_nonce'], 'gvc_save_overrides' ) ) {
            return;
        }

        if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) {
            return;
        }

        if ( ! current_user_can( 'edit_product', $product_id ) ) {
            return;
        }

        $json = wp_unslash( $_POST['gvc_overrides_json'] ?? '[]' );
        $overrides = json_decode( $json, true );

        if ( is_array( $overrides ) ) {
            DB::set_overrides_for_product( $product_id, $overrides );
        }
    }
}
