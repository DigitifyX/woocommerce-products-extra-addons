<?php
/**
 * Plugin Name: GartenVista Product Configurator
 * Plugin URI:  https://gartenvista.de
 * Description: High-performance modular product configurator for WooCommerce with 2000+ product support, React UI, and Redis caching.
 * Version:     1.2.7
 * Author:      Shakir Ahmed Joy
 * Author URI:  https://www.shakirjoy.xyz/
 * Text Domain: gv-configurator
 * Domain Path: /languages
 * Requires PHP: 7.4
 * WC requires at least: 6.0
 * WC tested up to: 8.5
 *
 * @package GartenVista\Configurator
 */

defined('ABSPATH') || exit;

/* ── Constants ─────────────────────────────────────────────── */
define('GVC_VERSION', '1.2.7');
define('GVC_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('GVC_PLUGIN_URL', plugin_dir_url(__FILE__));
define('GVC_PLUGIN_FILE', __FILE__);
define('GVC_DB_VERSION', '1.0.0');

/* ── Autoloader ────────────────────────────────────────────── */
spl_autoload_register(function ($class) {
    $prefix = 'GVC\\';
    if (strncmp($prefix, $class, strlen($prefix)) !== 0) {
        return;
    }
    $relative = strtolower(str_replace('\\', '/', substr($class, strlen($prefix))));
    $relative = str_replace('_', '-', $relative);
    $file = GVC_PLUGIN_DIR . 'includes/class-' . basename($relative) . '.php';
    if (file_exists($file)) {
        require $file;
    }
});

/* ── Activation / Deactivation ─────────────────────────────── */
require_once GVC_PLUGIN_DIR . 'includes/class-cache.php';
require_once GVC_PLUGIN_DIR . 'includes/class-activator.php';
register_activation_hook(__FILE__, ['GVC\\Activator', 'activate']);
register_deactivation_hook(__FILE__, ['GVC\\Activator', 'deactivate']);

/* ── Boot ──────────────────────────────────────────────────── */
add_action('plugins_loaded', function () {
    if (!class_exists('WooCommerce')) {
        add_action('admin_notices', function () {
                    echo '<div class="notice notice-error"><p><strong>GartenVista Configurator</strong> requires WooCommerce to be active.</p></div>';
                }
                );
                return;
            }

            // Core includes
            require_once GVC_PLUGIN_DIR . 'includes/class-activator.php';
            require_once GVC_PLUGIN_DIR . 'includes/class-db.php';
            require_once GVC_PLUGIN_DIR . 'includes/class-cpt.php';
            require_once GVC_PLUGIN_DIR . 'includes/class-cache.php';
            require_once GVC_PLUGIN_DIR . 'includes/class-rest-api.php';
            require_once GVC_PLUGIN_DIR . 'includes/class-admin.php';
            require_once GVC_PLUGIN_DIR . 'includes/class-frontend.php';
            require_once GVC_PLUGIN_DIR . 'includes/class-cart.php';
            require_once GVC_PLUGIN_DIR . 'includes/class-tax.php';
            require_once GVC_PLUGIN_DIR . 'includes/class-order.php';

            // Initialize components
            GVC\CPT::init();
            GVC\Cache::init();
            GVC\REST_API::init();
            GVC\Admin::init();
            GVC\Frontend::init();
            GVC\Cart::init();
            GVC\Tax::init();
            GVC\Order::init();

            // HPOS compatibility
            add_action('before_woocommerce_init', function () {
            if (class_exists(\Automattic\WooCommerce\Utilities\FeaturesUtil::class)) {
                \Automattic\WooCommerce\Utilities\FeaturesUtil::declare_compatibility('custom_order_tables', __FILE__, true);
            }
        }
        );
    });
