import { DecimalString, Timestamp } from '../common';

/**
 * ============================================================================
 * L'HISTORIQUE DE FUNDING — LE SEUL CHAMP DE CONTEXTE QUI AIT UNE VRAIE SÉRIE
 *
 * `fundingHistory` est, au 2026-10-06, le **seul** endpoint d'information qui
 * rende une série temporelle d'un champ de contexte de marché. Il n'existe
 * aucun endpoint documenté pour l'historique de l'intérêt ouvert, ni pour celui
 * des prix d'impact : ces valeurs ne sont lisibles qu'à l'instant courant.
 *
 * C'est ce qui décide de ce qu'un moteur de règles peut en faire : une
 * transformation glissante (z-score, pente, percentile) a besoin d'une série,
 * donc elle n'est légitime que sur `fundingRate` et `premium`.
 *
 * ## Ce qui a été mesuré, le 2026-10-06
 *
 * Deux appels, sur six heures, sur `api.hyperliquid.xyz` :
 *
 * - **BTC** (vivant) : 6 entrées pour 6 heures — la cadence est bien horaire,
 *   ce que la documentation confirme (« funding is paid every hour at one
 *   eighth of the computed rate »). Quatre clés, toutes en chaîne sauf `time`.
 *   **Aucun nul**, sur aucun champ.
 * - **MATIC** (délisté) : 6 entrées également, avec `fundingRate: "0.0"` et
 *   `premium: "0.0"`.
 * - **xyz:XYZ100** (HIP-3, vivant) : 6 entrées, écarts de 3 600 000 ms ± 20 ms,
 *   et le `coin` rendu est identique à celui demandé, préfixe compris.
 *
 * ⚠️ Les horodatages ne tombent **pas exactement** sur l'heure : les restes
 * modulo une heure relevés valaient 37, 39, 27, 7, 46 et 24 ms. Aligner une
 * fenêtre de requête sur l'heure pleine reste correct — `startTime` est
 * inclusif, donc arrondir vers le bas attrape l'entrée — mais comparer un
 * horodatage à une frontière d'heure par égalité ne marcherait pas.
 *
 * ## ⚠️ Trois pièges que ces mesures révèlent
 *
 * **1. `"0.0"` a trois significations différentes, et rien ne les distingue
 * dans cette réponse.** Mesuré le 2026-10-06 via `perpDexs` :
 *
 * - un **marché délisté** rend `"0.0"` (MATIC) ;
 * - un **marché vivant et sain** peut rendre `"0.0"` en permanence, parce que
 *   son dex déclare un multiplicateur de funding nul : `assetToFundingMultiplier`
 *   vaut `0.0` sur **tous** les actifs de `flx` et de `vntl` ;
 * - et un financement réellement nul à cette heure-là.
 *
 * Une règle du genre `funding <= 0` serait donc vraie en permanence sur des
 * marchés parfaitement vivants. Un consommateur doit croiser cette série avec
 * `isDelisted` (voir `HLPerpMarketInfo`) **et** avec le multiplicateur du dex
 * (voir `HLPerpDex.assetToFundingMultiplier`). L'API fournit ici elle-même la
 * valeur de repli plausible et fausse que ce dépôt refuse d'habitude de
 * fabriquer.
 *
 * **2. Un seuil de funding absolu n'est pas transposable d'un marché à
 * l'autre.** Les multiplicateurs relevés vont de `0.0` (`flx`, `vntl`) à
 * `0.000001` (`cash`), `0.01` à `1.0` (`hyna`, qui les fait varier **par
 * actif** dans un même dex), `0.1` à `0.6` (`para`), `0.125` à `0.5` (`io`),
 * `0.5` partout sur `xyz`. Trois dex n'en déclarent aucun. Un `funding >
 * 0.00001` serait donc courant sur l'un et impossible sur l'autre : ce champ
 * se compare **relativement** (z-score, percentile) ou normalisé par le
 * multiplicateur, jamais à une constante écrite en dur.
 *
 * **3. `fundingRate` est souvent constant.** Sur BTC, les trois heures relevées
 * valaient toutes `0.0000125`, soit exactement le plancher (un huitième de
 * 0,01 %) ; sur `xyz:XYZ100`, toutes `0.00000625`, soit ce même plancher
 * multiplié par le `0.5` du dex. Une transformation glissante sur un taux au
 * plancher voit une série plate : son écart-type est nul, et un z-score n'y a
 * aucun sens. `premium`, lui, varie en continu sur les deux marchés — c'est la
 * série informative des deux.
 *
 * ## `premium` ici n'est pas `premium` dans `metaAndAssetCtxs`
 *
 * La documentation dit que « the premium is sampled **every 5 seconds and
 * averaged over the hour** », et que `premium = impact_price_difference /
 * oracle_price`. Le champ rendu ici est donc une **moyenne horaire** sur
 * environ 720 échantillons, là où le `premium` d'un contexte d'actif est la
 * lecture de l'instant. Les deux portent le même nom et ne sont pas la même
 * quantité.
 * ============================================================================
 */

/**
 * Une entrée de l'historique de funding, telle que `fundingHistory` la rend.
 *
 * Aucun champ n'est optionnel ni nullable : mesuré sur un marché vivant **et**
 * sur un marché délisté, l'endpoint rend toujours les quatre, et rend `"0.0"`
 * plutôt que `null` quand il n'y a rien à payer.
 */
export interface HLFundingHistoryEntry {
  /** Le marché concerné, tel que demandé (ex. `BTC`, `xyz:XYZ100`). */
  coin: string;

  /**
   * Le taux **horaire** réellement appliqué, soit un huitième du taux calculé
   * sur 8 heures. `"0.0"` sur un marché délisté — voir l'en-tête.
   */
  fundingRate: DecimalString;

  /**
   * La prime moyenne de l'heure : `impact_price_difference / oracle_price`,
   * échantillonnée toutes les 5 secondes et moyennée. Peut être négative.
   */
  premium: DecimalString;

  /** Début de l'heure de funding, en millisecondes. */
  time: Timestamp;
}

/**
 * Les paramètres de `fundingHistory`.
 *
 * ⚠️ À plat dans le corps de la requête, contrairement à `candleSnapshot` qui
 * imbrique les siens sous une clé `req`. Deux endpoints voisins, deux formes :
 * c'est le genre d'écart qui se découvre par un appel qui échoue.
 */
export interface HLFundingHistoryRequest {
  coin: string;
  /** Inclusif, en millisecondes. Requis. */
  startTime: Timestamp;
  /** Inclusif. Par défaut, l'instant courant. */
  endTime?: Timestamp;
}
