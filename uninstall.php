<?php
/**
 * Uninstall script.
 *
 * Data is intentionally preserved so reinstalling the plugin
 * restores all groups, items, rules and settings.
 *
 * To perform a full cleanup (drop tables + options), set the
 * constant GVC_DELETE_DATA to true in wp-config.php before
 * deleting the plugin:
 *
 *     define( 'GVC_DELETE_DATA', true );
 *
 * @package GartenVista\Configurator
 */

defined( 'WP_UNINSTALL_PLUGIN' ) || exit;

// Only wipe data if explicitly requested
if ( defined( 'GVC_DELETE_DATA' ) && GVC_DELETE_DATA === true ) {

    global $wpdb;

    $tables = [
        $wpdb->prefix . 'gvc_addon_groups',
        $wpdb->prefix . 'gvc_addon_items',
        $wpdb->prefix . 'gvc_global_rules',
        $wpdb->prefix . 'gvc_product_overrides',
    ];

    foreach ( $tables as $table ) {
        $wpdb->query( "DROP TABLE IF EXISTS {$table}" ); // phpcs:ignore WordPress.DB.PreparedSQL
    }

    delete_option( 'gvc_settings' );
    delete_option( 'gvc_db_version' );

    if ( function_exists( 'wp_cache_flush' ) ) {
        wp_cache_flush();
    }
}
