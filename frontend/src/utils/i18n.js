/**
 * i18n – Multilingual translation utility for the GartenVista Configurator.
 *
 * Supports: de_DE (default), nl_NL, nl_BE, fr_FR, fr_BE, tr_TR
 * Reads locale from gvcFrontend.locale (passed from PHP via wp_localize_script).
 *
 * Usage:
 *   import { t } from '../utils/i18n';
 *   t('price_overview')           → "Preisübersicht" (de) / "Prijsoverzicht" (nl)
 *   t('vat', { rate: 21 })        → "MwSt. (21%)" (de) / "BTW (21%)" (nl)
 */

const cfg = window.gvcFrontend || {};

const translations = {
  de_DE: {
    // PriceSidebar
    price_overview: 'Preisübersicht',
    included: 'Inklusive',
    no_options_selected: 'Noch keine Optionen ausgewählt',
    subtotal: 'Zwischensumme',
    vat: 'MwSt. ({rate}%)',
    total: 'Gesamt',
    total_label: 'Gesamt:',
    incl_vat: 'Inkl. MwSt.',
    excl_vat: 'Exkl. MwSt.',
    required_options_missing: 'Erforderliche Optionen noch nicht ausgewählt',

    // Configurator
    loading: 'Konfiguration wird geladen…',
    previous: '← Zurück',
    next: 'Weiter →',
    select_required: 'Bitte wählen Sie die erforderlichen Optionen:',

    // AddonGroup
    select_placeholder: '— {title} auswählen —',
    search_options: 'Optionen suchen…',
    no_selection: '— Keine Auswahl —',
    no_options_found: 'Keine Optionen gefunden.',

    // AddonItem
    more_info: 'Mehr Informationen',
    free: 'Kostenlos',
    out_of_stock: 'Nicht auf Lager',
    added: 'Hinzugefügt',
    add: 'Hinzufügen',

    // InfoModal
    close: 'Schließen',
    specifications: 'Spezifikationen',
    product_out_of_stock: 'Dieses Produkt ist derzeit nicht auf Lager.',

    // CustomFieldsModal
    custom_fields_title: 'Angaben für: {title}',
    confirm: 'Bestätigen',
    cancel: 'Abbrechen',
    field_required: 'Dieses Feld ist erforderlich.',

    // Complete Configuration
    complete_configuration: 'Konfiguration abschließen ✓',
  },

  nl_NL: {
    price_overview: 'Prijsoverzicht',
    included: 'Inclusief',
    no_options_selected: 'Nog geen opties geselecteerd',
    subtotal: 'Subtotaal',
    vat: 'BTW ({rate}%)',
    total: 'Totaal',
    total_label: 'Totaal:',
    incl_vat: 'Inclusief BTW',
    excl_vat: 'Exclusief BTW',
    required_options_missing: 'Vereiste opties nog niet geselecteerd',

    loading: 'Configuratie laden…',
    previous: '← Vorige',
    next: 'Volgende →',
    select_required: 'Selecteer vereiste opties:',

    select_placeholder: '— Selecteer {title} —',
    search_options: 'Zoek opties…',
    no_selection: '— Geen selectie —',
    no_options_found: 'Geen opties gevonden.',

    more_info: 'Meer informatie',
    free: 'Gratis',
    out_of_stock: 'Niet op voorraad',
    added: 'Toegevoegd',
    add: 'Toevoegen',

    close: 'Sluiten',
    specifications: 'Specificaties',
    product_out_of_stock: 'Dit product is momenteel niet op voorraad.',

    custom_fields_title: 'Gegevens voor: {title}',
    confirm: 'Bevestigen',
    cancel: 'Annuleren',
    field_required: 'Dit veld is verplicht.',

    complete_configuration: 'Configuratie afronden ✓',
  },

  fr_FR: {
    price_overview: 'Aperçu des prix',
    included: 'Inclus',
    no_options_selected: 'Aucune option sélectionnée',
    subtotal: 'Sous-total',
    vat: 'TVA ({rate}%)',
    total: 'Total',
    total_label: 'Total :',
    incl_vat: 'TVA incluse',
    excl_vat: 'Hors TVA',
    required_options_missing: 'Options requises non sélectionnées',

    loading: 'Chargement de la configuration…',
    previous: '← Précédent',
    next: 'Suivant →',
    select_required: 'Veuillez sélectionner les options requises :',

    select_placeholder: '— Sélectionner {title} —',
    search_options: 'Rechercher des options…',
    no_selection: '— Aucune sélection —',
    no_options_found: 'Aucune option trouvée.',

    more_info: 'Plus d\'informations',
    free: 'Gratuit',
    out_of_stock: 'Rupture de stock',
    added: 'Ajouté',
    add: 'Ajouter',

    close: 'Fermer',
    specifications: 'Spécifications',
    product_out_of_stock: 'Ce produit est actuellement en rupture de stock.',

    custom_fields_title: 'Détails pour : {title}',
    confirm: 'Confirmer',
    cancel: 'Annuler',
    field_required: 'Ce champ est obligatoire.',

    complete_configuration: 'Terminer la configuration ✓',
  },

  tr_TR: {
    price_overview: 'Fiyat Özeti',
    included: 'Dahil',
    no_options_selected: 'Henüz seçenek belirlenmedi',
    subtotal: 'Ara Toplam',
    vat: 'KDV ({rate}%)',
    total: 'Toplam',
    total_label: 'Toplam:',
    incl_vat: 'KDV Dahil',
    excl_vat: 'KDV Hariç',
    required_options_missing: 'Gerekli seçenekler henüz belirlenmedi',

    loading: 'Yapılandırma yükleniyor…',
    previous: '← Önceki',
    next: 'Sonraki →',
    select_required: 'Lütfen gerekli seçenekleri belirleyin:',

    select_placeholder: '— {title} seçin —',
    search_options: 'Seçenekleri ara…',
    no_selection: '— Seçim yok —',
    no_options_found: 'Seçenek bulunamadı.',

    more_info: 'Daha fazla bilgi',
    free: 'Ücretsiz',
    out_of_stock: 'Stokta yok',
    added: 'Eklendi',
    add: 'Ekle',

    close: 'Kapat',
    specifications: 'Özellikler',
    product_out_of_stock: 'Bu ürün şu anda stokta bulunmamaktadır.',

    custom_fields_title: '{title} için bilgiler',
    confirm: 'Onayla',
    cancel: 'İptal',
    field_required: 'Bu alan zorunludur.',

    complete_configuration: 'Yapılandırmayı tamamla ✓',
  },
};

// Alias: nl_BE → nl_NL, fr_BE → fr_FR, de_AT/de_CH → de_DE
const localeAliases = {
  nl_BE: 'nl_NL',
  nl_NL_formal: 'nl_NL',
  fr_BE: 'fr_FR',
  de_DE_formal: 'de_DE',
  de_AT: 'de_DE',
  de_CH: 'de_DE',
  de_CH_informal: 'de_DE',
};

/**
 * Resolve the current locale to a supported translation key.
 * Falls back: exact match → alias → language prefix (e.g. 'de') → de_DE.
 */
function resolveLocale() {
  const locale = cfg.locale || 'de_DE';

  // Exact match
  if (translations[locale]) return locale;

  // Alias match
  if (localeAliases[locale] && translations[localeAliases[locale]]) {
    return localeAliases[locale];
  }

  // Language prefix match (e.g. 'de' matches 'de_DE')
  const lang = locale.split('_')[0];
  const prefixMatch = Object.keys(translations).find((k) => k.startsWith(lang + '_'));
  if (prefixMatch) return prefixMatch;

  // Default: German
  return 'de_DE';
}

const currentLocale = resolveLocale();
const strings = translations[currentLocale] || translations.de_DE;

/**
 * Translate a string key, with optional placeholder replacement.
 *
 * @param {string} key   Translation key, e.g. 'price_overview'
 * @param {object} params  Optional placeholders, e.g. { rate: 21 }
 * @returns {string} Translated string
 *
 * @example
 *   t('price_overview')        → "Preisübersicht"
 *   t('vat', { rate: 21 })     → "MwSt. (21%)"
 *   t('select_placeholder', { title: 'Farbe' }) → "— Farbe auswählen —"
 */
export function t(key, params = {}) {
  let str = strings[key] || translations.de_DE[key] || key;

  // Replace {placeholder} tokens
  Object.entries(params).forEach(([k, v]) => {
    str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
  });

  return str;
}

export default t;
