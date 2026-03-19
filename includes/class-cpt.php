<?php
/**
 * Custom Post Type placeholder and admin menu registration.
 * Data is stored in custom tables, but we register an admin menu.
 *
 * @package GartenVista\Configurator
 */

namespace GVC;

defined( 'ABSPATH' ) || exit;

class CPT {

    public static function init() {
        add_action( 'admin_menu', [ __CLASS__, 'register_menu' ] );
    }

    public static function register_menu() {
        // Main menu
        add_menu_page(
            __( 'Configurator', 'gv-configurator' ),
            __( 'Configurator', 'gv-configurator' ),
            'manage_woocommerce',
            'gvc-configurator',
            [ __CLASS__, 'render_admin_page' ],
            'dashicons-admin-generic',
            56
        );

        // Submenu pages
        add_submenu_page(
            'gvc-configurator',
            __( 'Addon Groups', 'gv-configurator' ),
            __( 'Addon Groups', 'gv-configurator' ),
            'manage_woocommerce',
            'gvc-configurator',
            [ __CLASS__, 'render_admin_page' ]
        );

        add_submenu_page(
            'gvc-configurator',
            __( 'Settings', 'gv-configurator' ),
            __( 'Settings', 'gv-configurator' ),
            'manage_woocommerce',
            'gvc-settings',
            [ __CLASS__, 'render_admin_page' ]
        );

        add_submenu_page(
            'gvc-configurator',
            __( 'Cache', 'gv-configurator' ),
            __( 'Cache', 'gv-configurator' ),
            'manage_woocommerce',
            'gvc-cache',
            [ __CLASS__, 'render_cache_page' ]
        );
    }

    /**
     * Render the React-powered admin page.
     */
    public static function render_admin_page() {
        echo '<div id="gvc-admin-root" class="wrap"></div>';
    }

    /**
     * Render cache management page.
     */
    public static function render_cache_page() {
        if ( isset( $_POST['gvc_flush_cache'] ) && wp_verify_nonce( $_POST['_wpnonce'], 'gvc_flush_cache' ) ) {
            Cache::flush_all();
            echo '<div class="notice notice-success"><p>Cache flushed successfully.</p></div>';
        }

        echo '<div class="wrap">';
        echo '<h1>GartenVista Configurator – Cache</h1>';

        $cache_info = Cache::get_stats();
        echo '<table class="widefat" style="max-width:600px;margin-top:20px">';
        echo '<tbody>';
        echo '<tr><td><strong>Cache Backend</strong></td><td>' . esc_html( $cache_info['backend'] ) . '</td></tr>';
        echo '<tr><td><strong>Cached Keys</strong></td><td>' . esc_html( $cache_info['keys'] ) . '</td></tr>';
        echo '<tr><td><strong>TTL</strong></td><td>' . esc_html( $cache_info['ttl'] ) . 's</td></tr>';
        echo '</tbody></table>';

        echo '<form method="post" style="margin-top:20px">';
        wp_nonce_field( 'gvc_flush_cache' );
        echo '<button type="submit" name="gvc_flush_cache" class="button button-primary">Flush All Cache</button>';
        echo '</form>';
        echo '</div>';
    }
}
