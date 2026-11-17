import { DecimalString } from '../common';

/**
 * ============================================================================
 * LE TRAILING STOP NATIF — L'ACTION `trailingStop`
 *
 * Ajouté par Hyperliquid le 2026-09-21 (annonce `aq5gf58qal`). Source : page
 * `exchange-endpoint`, section « Place a trailing stop order », lue en brut le
 * 2026-11-16. Aucun SDK ne l'implémentait à cette date : ni le SDK Python
 * officiel (dernier push le 2026-06-04), ni le SDK TypeScript communautaire
 * (`nktkas/hyperliquid`, demande ouverte #203 du 2026-11-11).
 *
 * ⚠️ **L'ordre des clés compte** : l'action est hachée en msgpack, dans l'ordre
 * où ses clés sont écrites. Une interface ne l'impose pas ; celui qui construit
 * l'objet doit écrire `type, asset, isBuy, sz, reduceOnly, retracement,
 * activationPx`, l'ordre de la doc et du client officiel (`app.hyperliquid.xyz`,
 * fonction qui construit l'action, lue le 2026-11-16).
 *
 * L'écriture des valeurs, d'après ce même client (la seule forme connue pour
 * être acceptée) :
 *
 * - `sz`, `retracement.px`, `activationPx` : décimale canonique, sans zéro final
 *   ni `.0` (`"0.0065"`, `"2100"`) ;
 * - `retracement.pct` : **quatre décimales et un `%`**, zéros compris
 *   (`"10.0000%"`). La doc donne `"1.234%"` en exemple ; les deux formes ne
 *   disent pas si l'exchange normalise ce texte avant de le hacher ;
 * - `activationPx` : `null` **explicite** quand le suivi commence tout de
 *   suite, jamais une clé omise (un nil msgpack de moins change le hachage).
 *
 * Ce que l'action n'a pas : de `cloid` (un ordre posé ne se retrouve qu'en
 * relisant les ordres ouverts), et aucune action de modification n'est
 * documentée (l'interface officielle n'en propose pas pour ce type).
 * L'annulation est un `cancel` ordinaire, par oid.
 * ============================================================================
 */

/** Le repli qui déclenche : un pourcentage du watermark, ou une distance en prix. Exactement une des deux. */
export type HLTrailingRetracement = { pct: string } | { px: DecimalString };

export interface HLTrailingStopAction {
  type: 'trailingStop';
  /** L'identifiant d'actif (perps seulement : « Trailing stops are available for perp markets »). */
  asset: number;
  isBuy: boolean;
  sz: DecimalString;
  reduceOnly: boolean;
  retracement: HLTrailingRetracement;
  /** Le prix qui démarre le suivi, ou `null` pour un suivi immédiat. */
  activationPx: DecimalString | null;
}
