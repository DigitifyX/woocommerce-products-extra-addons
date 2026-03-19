<?php
/**
 * Database abstraction layer – optimized queries for 2000+ products.
 *
 * @package GartenVista\Configurator
 */

namespace GVC;

defined( 'ABSPATH' ) || exit;

class DB {

    /* ── Table helpers ──────────────────────────────────────── */

    public static function groups_table() {
        global $wpdb;
        return $wpdb->prefix . 'gvc_addon_groups';
    }

    public static function items_table() {
        global $wpdb;
        return $wpdb->prefix . 'gvc_addon_items';
    }

    public static function rules_table() {
        global $wpdb;
        return $wpdb->prefix . 'gvc_global_rules';
    }

    public static function overrides_table() {
        global $wpdb;
        return $wpdb->prefix . 'gvc_product_overrides';
    }

    /* ── CRUD: Groups ──────────────────────────────────────── */

    public static function get_group( $id ) {
        global $wpdb;
        return $wpdb->get_row(
            $wpdb->prepare( "SELECT * FROM %i WHERE id = %d", self::groups_table(), $id ),
            ARRAY_A
        );
    }

    public static function get_all_groups() {
        global $wpdb;
        return $wpdb->get_results(
            "SELECT * FROM " . self::groups_table() . " ORDER BY sort_order ASC, id ASC",
            ARRAY_A
        );
    }

    public static function insert_group( $data ) {
        global $wpdb;
        $wpdb->insert( self::groups_table(), $data );
        Cache::flush_groups();
        return $wpdb->insert_id;
    }

    public static function update_group( $id, $data ) {
        global $wpdb;
        $result = $wpdb->update( self::groups_table(), $data, [ 'id' => $id ] );
        Cache::flush_groups();
        return $result;
    }

    public static function delete_group( $id ) {
        global $wpdb;
        // Cascade: delete items and rules referencing this group
        $wpdb->delete( self::items_table(), [ 'group_id' => $id ] );
        $wpdb->delete( self::rules_table(), [ 'group_id' => $id ] );
        $wpdb->delete( self::overrides_table(), [ 'group_id' => $id ] );
        $result = $wpdb->delete( self::groups_table(), [ 'id' => $id ] );
        Cache::flush_groups();
        return $result;
    }

    /* ── CRUD: Items ───────────────────────────────────────── */

    public static function get_items_by_group( $group_id ) {
        global $wpdb;
        return $wpdb->get_results(
            $wpdb->prepare(
                "SELECT * FROM %i WHERE group_id = %d ORDER BY sort_order ASC, id ASC",
                self::items_table(),
                $group_id
            ),
            ARRAY_A
        );
    }

    public static function get_item( $id ) {
        global $wpdb;
        return $wpdb->get_row(
            $wpdb->prepare( "SELECT * FROM %i WHERE id = %d", self::items_table(), $id ),
            ARRAY_A
        );
    }

    public static function insert_item( $data ) {
        global $wpdb;
        $wpdb->insert( self::items_table(), $data );
        Cache::flush_groups();
        return $wpdb->insert_id;
    }

    public static function update_item( $id, $data ) {
        global $wpdb;
        $result = $wpdb->update( self::items_table(), $data, [ 'id' => $id ] );
        Cache::flush_groups();
        return $result;
    }

    public static function delete_item( $id ) {
        global $wpdb;
        $result = $wpdb->delete( self::items_table(), [ 'id' => $id ] );
        Cache::flush_groups();
        return $result;
    }

    /* ── CRUD: Global Rules ────────────────────────────────── */

    public static function get_rules_for_term( $term_id, $rule_type = 'category' ) {
        global $wpdb;
        return $wpdb->get_results(
            $wpdb->prepare(
                "SELECT r.*, g.title AS group_title, g.slug AS group_slug
                 FROM %i r
                 JOIN %i g ON g.id = r.group_id
                 WHERE r.taxonomy_term_id = %d AND r.rule_type = %s
                 ORDER BY r.sort_order ASC",
                self::rules_table(),
                self::groups_table(),
                $term_id,
                $rule_type
            ),
            ARRAY_A
        );
    }

    /**
     * Get all rules assigned to a specific group (reverse lookup).
     */
    public static function get_rules_for_group( $group_id ) {
        global $wpdb;
        return $wpdb->get_results(
            $wpdb->prepare(
                "SELECT * FROM %i WHERE group_id = %d ORDER BY rule_type ASC, sort_order ASC",
                self::rules_table(),
                $group_id
            ),
            ARRAY_A
        );
    }

    /**
     * Set all taxonomy rules for a group (replaces existing).
     */
    public static function set_rules_for_group( $group_id, $rules ) {
        global $wpdb;
        $wpdb->delete( self::rules_table(), [ 'group_id' => $group_id ] );
        foreach ( $rules as $order => $rule ) {
            $wpdb->insert( self::rules_table(), [
                'rule_type'        => sanitize_text_field( $rule['rule_type'] ),
                'taxonomy_term_id' => (int) $rule['term_id'],
                'group_id'         => (int) $group_id,
                'sort_order'       => $order,
            ]);
        }
        Cache::flush_product_configs();
    }

    public static function set_rules_for_term( $term_id, $rule_type, $group_ids ) {
        global $wpdb;
        $wpdb->delete( self::rules_table(), [
            'taxonomy_term_id' => $term_id,
            'rule_type'        => $rule_type,
        ]);
        foreach ( $group_ids as $order => $group_id ) {
            $wpdb->insert( self::rules_table(), [
                'rule_type'        => $rule_type,
                'taxonomy_term_id' => $term_id,
                'group_id'         => (int) $group_id,
                'sort_order'       => $order,
            ]);
        }
        Cache::flush_product_configs();
    }

    /* ── CRUD: Product Overrides ───────────────────────────── */

    /**
     * Get all products directly assigned to a group.
     */
    public static function get_products_for_group( $group_id ) {
        global $wpdb;
        return $wpdb->get_results(
            $wpdb->prepare(
                "SELECT * FROM %i WHERE group_id = %d AND override_type = 'include' ORDER BY sort_order ASC",
                self::overrides_table(),
                $group_id
            ),
            ARRAY_A
        );
    }

    /**
     * Set product assignments for a group (replaces existing).
     */
    public static function set_products_for_group( $group_id, $product_ids ) {
        global $wpdb;
        // Remove existing include overrides for this group
        $wpdb->query( $wpdb->prepare(
            "DELETE FROM %i WHERE group_id = %d AND override_type = 'include'",
            self::overrides_table(),
            $group_id
        ));
        foreach ( $product_ids as $order => $product_id ) {
            $wpdb->insert( self::overrides_table(), [
                'product_id'    => (int) $product_id,
                'group_id'      => (int) $group_id,
                'override_type' => 'include',
                'sort_order'    => $order,
            ]);
        }
        Cache::flush_product_configs();
    }

    public static function get_overrides_for_product( $product_id ) {
        global $wpdb;
        return $wpdb->get_results(
            $wpdb->prepare(
                "SELECT o.*, g.title AS group_title
                 FROM %i o
                 JOIN %i g ON g.id = o.group_id
                 WHERE o.product_id = %d
                 ORDER BY o.sort_order ASC",
                self::overrides_table(),
                self::groups_table(),
                $product_id
            ),
            ARRAY_A
        );
    }

    public static function set_overrides_for_product( $product_id, $overrides ) {
        global $wpdb;
        $wpdb->delete( self::overrides_table(), [ 'product_id' => $product_id ] );
        foreach ( $overrides as $order => $override ) {
            $wpdb->insert( self::overrides_table(), [
                'product_id'    => $product_id,
                'group_id'      => (int) $override['group_id'],
                'override_type' => sanitize_text_field( $override['type'] ?? 'include' ),
                'sort_order'    => $order,
            ]);
        }
        Cache::flush_product_config( $product_id );
    }

    /* ── Resolver: Get groups for a specific product ───────── */
    /**
     * Resolve the final set of addon groups for a product.
     * Priority: product override > category rules > tag rules.
     * Optimized with a single query + PHP merge.
     */
    public static function resolve_groups_for_product( $product_id ) {
        global $wpdb;

        // 1. Check for product-level overrides
        $overrides = self::get_overrides_for_product( $product_id );

        if ( ! empty( $overrides ) ) {
            $include_ids = [];
            $exclude_ids = [];
            foreach ( $overrides as $o ) {
                if ( $o['override_type'] === 'exclude' ) {
                    $exclude_ids[] = (int) $o['group_id'];
                } else {
                    $include_ids[] = (int) $o['group_id'];
                }
            }

            // If explicit includes, use only those (minus excludes)
            if ( ! empty( $include_ids ) ) {
                $final_ids = array_diff( $include_ids, $exclude_ids );
            } else {
                // Only excludes → get global, then subtract
                $global_ids = self::resolve_global_group_ids( $product_id );
                $final_ids  = array_diff( $global_ids, $exclude_ids );
            }

            if ( empty( $final_ids ) ) {
                return [];
            }

            $ids_str = implode( ',', array_map( 'intval', $final_ids ) );
            return $wpdb->get_results(
                "SELECT * FROM " . self::groups_table() . " WHERE id IN ({$ids_str}) ORDER BY sort_order ASC",
                ARRAY_A
            );
        }

        // 2. Fall back to global rules
        $global_ids = self::resolve_global_group_ids( $product_id );

        if ( empty( $global_ids ) ) {
            return [];
        }

        $ids_str = implode( ',', array_map( 'intval', array_unique( $global_ids ) ) );
        return $wpdb->get_results(
            "SELECT * FROM " . self::groups_table() . " WHERE id IN ({$ids_str}) ORDER BY sort_order ASC",
            ARRAY_A
        );
    }

    /**
     * Get group IDs from global rules (categories + tags) for a product.
     * Uses a single efficient JOIN query.
     */
    private static function resolve_global_group_ids( $product_id ) {
        global $wpdb;

        $term_relationships = $wpdb->prefix . 'term_relationships';
        $term_taxonomy       = $wpdb->prefix . 'term_taxonomy';

        $results = $wpdb->get_col(
            $wpdb->prepare(
                "SELECT DISTINCT r.group_id
                 FROM %i r
                 JOIN %i tt ON (
                    (r.rule_type = 'category' AND tt.taxonomy = 'product_cat' AND tt.term_id = r.taxonomy_term_id)
                    OR
                    (r.rule_type = 'tag' AND tt.taxonomy = 'product_tag' AND tt.term_id = r.taxonomy_term_id)
                 )
                 JOIN %i tr ON tr.term_taxonomy_id = tt.term_taxonomy_id
                 WHERE tr.object_id = %d
                 ORDER BY r.sort_order ASC",
                self::rules_table(),
                $term_taxonomy,
                $term_relationships,
                $product_id
            )
        );

        return array_map( 'intval', $results ?: [] );
    }

    /* ── Bulk fetch: groups with items (one query) ─────────── */

    public static function get_groups_with_items( $group_ids ) {
        global $wpdb;

        if ( empty( $group_ids ) ) {
            return [];
        }

        $ids_str = implode( ',', array_map( 'intval', $group_ids ) );

        $groups = $wpdb->get_results(
            "SELECT * FROM " . self::groups_table() . " WHERE id IN ({$ids_str}) ORDER BY sort_order ASC",
            ARRAY_A
        );

        $items = $wpdb->get_results(
            "SELECT * FROM " . self::items_table() . " WHERE group_id IN ({$ids_str}) ORDER BY group_id ASC, sort_order ASC",
            ARRAY_A
        );

        // Index items by group_id
        $items_map = [];
        foreach ( $items as $item ) {
            $items_map[ $item['group_id'] ][] = $item;
        }

        foreach ( $groups as &$group ) {
            $group['items'] = $items_map[ $group['id'] ] ?? [];
        }

        return $groups;
    }
}
