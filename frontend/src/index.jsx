/**
 * GartenVista Product Configurator – React Frontend
 *
 * Entry point: mounts the Configurator component on #gvc-configurator-root
 */

import { createRoot } from '@wordpress/element';
import Configurator from './components/Configurator';

const root = document.getElementById('gvc-configurator-root');

if (root) {
  const productId = root.dataset.productId;
  createRoot(root).render(<Configurator productId={parseInt(productId, 10)} />);
}
