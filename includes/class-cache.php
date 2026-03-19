<?php
/**
 * Cache layer – Redis/Memcached/WP Object Cache abstraction.
 *
 * @package GartenVista\Configurator
 */

namespace GVC;

defined( 'ABSPATH' ) || exit;

class Cache {

    const GROUP     = 'gvc';
    const GROUP_TTL = 'gvc_ttl';

    private static $settings = null;

    public static function init() {
        // Nothing to hook – cache is used on-demand
    }

    private static function settings() {
        if ( self::$settings === null ) {
            self::$settings = get_option( 'gvc_settings', [] );
        }
        return self::$settings;
    }

    private static function ttl() {
        $s = self::settings();
        return (int) ( $s['cache_ttl'] ?? 3600 );
    }

    private static function enabled() {
        $s = self::settings();
        return ! empty( $s['enable_cache'] );
    }

    /* ── Core get/set ──────────────────────────────────────── */

    public static function get( $key ) {
        if ( ! self::enabled() ) {
            return false;
        }
        return wp_cache_get( $key, self::GROUP );
    }

    public static function set( $key, $data ) {
        if ( ! self::enabled() ) {
            return;
        }
        wp_cache_set( $key, $data, self::GROUP, self::ttl() );
    }

    public static function delete( $key ) {
        wp_cache_delete( $key, self::GROUP );
    }

    /* ── Convenience: product configurator data ────────────── */

    public static function get_product_config( $product_id ) {
        return self::get( 'product_config_' . $product_id );
    }

    public static function set_product_config( $product_id, $data ) {
        self::set( 'product_config_' . $product_id, $data );
    }

    /* ── Flush helpers ─────────────────────────────────────── */

    public static function flush_groups() {
        self::delete( 'all_groups' );
        // We can't easily iterate all product_config_* keys with wp_cache_delete,
        // so we increment a generation counter to invalidate them.
        self::increment_generation();
    }

    public static function flush_product_configs() {
        self::increment_generation();
    }

    public static function flush_product_config( $product_id ) {
        self::delete( 'product_config_' . $product_id );
    }

    public static function flush_all() {
        if ( function_exists( 'wp_cache_flush_group' ) ) {
            wp_cache_flush_group( self::GROUP );
        } else {
            self::increment_generation();
        }
    }

    /**
     * Increment cache generation to soft-invalidate all keys.
     */
    private static function increment_generation() {
        $gen = (int) wp_cache_get( 'generation', self::GROUP );
        wp_cache_set( 'generation', $gen + 1, self::GROUP, 0 );
    }

    public static function get_generation() {
        return (int) wp_cache_get( 'generation', self::GROUP );
    }

    /* ── Stats for admin page ──────────────────────────────── */

    public static function get_stats() {
        global $wp_object_cache;

        $backend = 'WP Object Cache (default)';
        if ( class_exists( 'Redis' ) && method_exists( $wp_object_cache, 'redis_instance' ) ) {
            $backend = 'Redis';
        } elseif ( class_exists( 'Memcached' ) ) {
            $backend = 'Memcached';
        } elseif ( defined( 'WP_REDIS_DISABLED' ) && ! WP_REDIS_DISABLED ) {
            $backend = 'Redis (via plugin)';
        }

        return [
            'backend' => $backend,
            'keys'    => 'N/A (use Redis CLI for details)',
            'ttl'     => self::ttl(),
        ];
    }
}
