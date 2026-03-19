<?php
/**
 * Plugin activator – creates custom database tables.
 *
 * @package GartenVista\Configurator
 */

namespace GVC;

defined( 'ABSPATH' ) || exit;

class Activator {

    /**
     * Run on plugin activation.
     */
    public static function activate() {
        self::create_tables();
        self::seed_defaults();
        flush_rewrite_rules();
        update_option( 'gvc_db_version', GVC_DB_VERSION );
    }

    /**
     * Run on plugin deactivation.
     */
    public static function deactivate() {
        flush_rewrite_rules();
    }

    /**
     * Create custom tables for addon groups and items.
     * We intentionally avoid wp_options for configuration storage.
     */
    private static function create_tables() {
        global $wpdb;

        $charset = $wpdb->get_charset_collate();

        // ── Addon Groups table ─────────────────────────────────
        $groups_table = $wpdb->prefix . 'gvc_addon_groups';
        $sql_groups = "CREATE TABLE {$groups_table} (
            id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            title           VARCHAR(255)    NOT NULL DEFAULT '',
            slug            VARCHAR(255)    NOT NULL DEFAULT '',
            description     TEXT            NULL,
            sort_order      INT             NOT NULL DEFAULT 0,
            display_type    VARCHAR(50)     NOT NULL DEFAULT 'radio',
            is_required     TINYINT(1)      NOT NULL DEFAULT 0,
            icon_url        VARCHAR(500)    NULL,
            created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY idx_slug (slug),
            KEY idx_sort (sort_order)
        ) {$charset};";

        // ── Addon Items table ──────────────────────────────────
        $items_table = $wpdb->prefix . 'gvc_addon_items';
        $sql_items = "CREATE TABLE {$items_table} (
            id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            group_id        BIGINT UNSIGNED NOT NULL,
            item_type       VARCHAR(50)     NOT NULL DEFAULT 'virtual',
            wc_product_id   BIGINT UNSIGNED NULL,
            title           VARCHAR(255)    NOT NULL DEFAULT '',
            description     TEXT            NULL,
            price           DECIMAL(12,4)   NOT NULL DEFAULT 0.0000,
            image_url       VARCHAR(500)    NULL,
            sku             VARCHAR(100)    NULL,
            sort_order      INT             NOT NULL DEFAULT 0,
            is_default      TINYINT(1)      NOT NULL DEFAULT 0,
            meta_json       LONGTEXT        NULL,
            created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY idx_group (group_id),
            KEY idx_product (wc_product_id),
            KEY idx_sort (group_id, sort_order)
        ) {$charset};";

        // ── Global Rules table (category/tag → groups) ─────────
        $rules_table = $wpdb->prefix . 'gvc_global_rules';
        $sql_rules = "CREATE TABLE {$rules_table} (
            id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            rule_type       VARCHAR(50)     NOT NULL DEFAULT 'category',
            taxonomy_term_id BIGINT UNSIGNED NOT NULL,
            group_id        BIGINT UNSIGNED NOT NULL,
            sort_order      INT             NOT NULL DEFAULT 0,
            created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY idx_rule_group (rule_type, taxonomy_term_id, group_id),
            KEY idx_group (group_id),
            KEY idx_term (taxonomy_term_id)
        ) {$charset};";

        // ── Product Overrides table ────────────────────────────
        $overrides_table = $wpdb->prefix . 'gvc_product_overrides';
        $sql_overrides = "CREATE TABLE {$overrides_table} (
            id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            product_id      BIGINT UNSIGNED NOT NULL,
            group_id        BIGINT UNSIGNED NOT NULL,
            override_type   VARCHAR(50)     NOT NULL DEFAULT 'include',
            sort_order      INT             NOT NULL DEFAULT 0,
            created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY idx_prod_group (product_id, group_id),
            KEY idx_product (product_id),
            KEY idx_group (group_id)
        ) {$charset};";

        require_once ABSPATH . 'wp-admin/includes/upgrade.php';

        dbDelta( $sql_groups );
        dbDelta( $sql_items );
        dbDelta( $sql_rules );
        dbDelta( $sql_overrides );
    }

    /**
     * Seed default configuration options.
     */
    private static function seed_defaults() {
        // Minimal options – just plugin-level settings, NOT group data
        if ( false === get_option( 'gvc_settings' ) ) {
            update_option( 'gvc_settings', [
                'enable_cache'       => true,
                'cache_ttl'          => 3600,
                'lazy_load_images'   => true,
                'show_vat_breakdown' => true,
                'primary_color'      => '#2D6A4F',
                'accent_color'       => '#40916C',
            ]);
        }
    }
}
