import { DecimalString } from '../common';

/**
 * ============================================================================
 * DÉCLARER CE QUE L'EXCHANGE REND, PAS CE QU'IL POURRAIT RENDRE
 *
 * Les champs ci-dessous ont été relevés le 2026-10-01 sur les cinq dex vivants
 * (`''`, `xyz`, `para`, `mkts`, `io`) : 434 entrées d'univers et 363 contextes
 * d'actif, via `meta` et `metaAndAssetCtxs`. Les commentaires portent ces
 * comptes parce qu'un type optimiste coûte plus cher qu'un type absent : tant
 * que `midPx` était déclaré `string`, `Number(ctx.midPx)` rendait **`0`** sur
 * les marchés délistés — un prix, pas une erreur.
 *
 * Deux traitements, selon ce que l'absence du champ signifie déjà :
 *
 * - **Drapeau de présence** (`onlyIsolated`, `isDelisted`) : l'absence porte le
 *   sens complémentaire, donc une seule valeur est utile et le type la fixe
 *   (`?: true`). Écrire `false` serait redondant, et dans un double ce serait
 *   rendre une forme que l'exchange ne rend pas.
 * - **Dimension à valeurs** (`growthMode`, `marginMode`, `deployerFeeScale`) :
 *   d'autres valeurs sont plausibles même si une seule a été observée, donc le
 *   type reste ouvert et le commentaire dit ce qui a été vu.
 * ============================================================================
 */

/**
 * Metadata describing a perpetual market.
 */
export interface HLPerpMarketInfo {
  /** Market symbol (e.g. BTC, ETH). */
  name: string;

  /** Number of decimals used for order size. */
  szDecimals: number;

  /** Maximum leverage allowed. */
  maxLeverage: number;

  /**
   * Clé de la table de marge qui s'applique à ce marché, à chercher dans
   * `HLPerpMeta.marginTables`.
   *
   * **Requis**, et non optionnel : présent sur **434/434** marchés des cinq
   * dex, délistés compris. Le déclarer optionnel n'évitait aucune erreur — il
   * autorisait seulement des doubles à l'omettre, donc à rendre une forme que
   * l'exchange ne rend jamais.
   */
  marginTableId: number;

  /**
   * Présent **uniquement** sur les marchés restreints à la marge isolée, et
   * toujours accompagné de `marginMode` (0 contre-exemple sur 434).
   *
   * ⚠️ Ce champ n'est **pas** déprécié, contrairement à ce que suggère le dex
   * principal : il n'y survit que sur 8 marchés, tous délistés. Les HIP-3 le
   * rendent partout — `io` 8/8 vivants, `xyz` 90/110, `para` 26/29, soit 126
   * marchés vivants au total. Le marquer `@deprecated` ferait clignoter du
   * code juste.
   *
   * `true` et non `boolean` : les 162 occurrences relevées valent `true`.
   */
  onlyIsolated?: true;

  /**
   * Présent **uniquement** sur les marchés délistés, et toujours à `true` —
   * c'est ainsi que l'exchange marque un marché mort (doc `meta`, exemple
   * `LOOM`). Un marché vivant n'a pas la clé du tout.
   *
   * `true` et non `boolean`, pour que le compilateur refuse
   * `isDelisted: false` : écrit dans un double, il rendrait une forme que le
   * vrai ne rend pas, et c'est précisément ce qu'un double ne doit pas faire.
   */
  isDelisted?: true;

  /**
   * Restriction de mode de marge. Toujours accompagnée de `onlyIsolated`, dans
   * les deux sens. Valeurs relevées : `strictIsolated` sur 52 marchés du dex
   * principal et de `xyz`, `noCross` sur 129 HIP-3.
   */
  marginMode?: 'strictIsolated' | 'noCross';

  /* ----- Champs propres aux dex HIP-3 ----------------------------------- */

  /**
   * Relevé sur les quatre dex HIP-3, jamais sur le principal (0/234).
   *
   * Laissé ouvert (`string`) bien que `'enabled'` soit la seule valeur vue sur
   * 154 marchés : le champ nomme un mode, d'autres états sont plausibles, et il
   * **subsiste sur 13 marchés délistés** — donc il n'est pas tenu à jour et ne
   * dit rien de la vivacité d'un marché. Pour ça, `isDelisted`.
   */
  growthMode?: string;

  /**
   * Multiplicateur appliqué aux frais du déployeur. Relevé sur les quatre dex
   * HIP-3 (200 marchés), jamais sur le principal. Valeurs vues : `'1.0'` et
   * `'0.5'` — laissé ouvert, c'est une échelle.
   */
  deployerFeeScale?: DecimalString;

  /**
   * Date du dernier changement de `deployerFeeScale`.
   *
   * ⚠️ Une **chaîne**, malgré le `Time` du nom, et une chaîne piégeuse :
   * `"2025-11-23T17:37:10.033211662"` — 9 décimales de seconde et **aucun
   * fuseau**. `Date.parse` l'accepte sans broncher, tronque les nanosecondes
   * **et l'interprète en heure locale** : mesuré, cette valeur donne
   * `16:37:10Z` sur une machine en UTC+1 et un autre instant ailleurs. Donc
   * jamais `number`, et pas de parsing sans imposer le fuseau explicitement.
   */
  lastFeeScaleChangeTime?: string;
}

/**
 * Margin tier defining leverage limits for a position size range.
 */
export interface HLPerpMarginTier {
  /** Minimum notional value for the tier. */
  lowerBound: string;

  /** Maximum leverage allowed in this tier. */
  maxLeverage: number;
}

/**
 * Margin configuration table for a perpetual market.
 */
export interface HLPerpMarginTable {
  /** Human-readable description. */
  description: string;

  /** Margin tiers applied to this market. */
  marginTiers: HLPerpMarginTier[];
}

/**
 * Entry linking a margin table ID to its configuration.
 */
export type HLPerpMarginTableEntry = [number, HLPerpMarginTable];

/**
 * Metadata returned by the `meta` endpoint.
 */
export interface HLPerpMeta {
  /** List of available perpetual markets. */
  universe: HLPerpMarketInfo[];

  /** Margin configuration tables. */
  marginTables: HLPerpMarginTableEntry[];

  /**
   * Index du token qui sert de collatéral à **tout** ce dex — `0` pour USDC.
   *
   * C'est la correspondance dex → collatéral que l'exchange publie, et la seule
   * qui ne vieillit pas. Les trois dépôts en tenaient jusqu'ici une copie en
   * dur (`cash → USDT`, `hyna → USDE`, sinon USDC) : elle était **juste** quand
   * elle a été écrite — les marchés Dreamcash s'appelaient bien `TSLA-USDT` et
   * la marge HyENA était rendue en USDE — mais ces deux dex ont été éteints en
   * juin et août 2026, et elle ne couvrait de toute façon que 2 des 10 dex
   * déployés. Relevé le 2026-09-30 : les quatre dex vivants (`xyz`, `para`,
   * `mkts`, `io`) rendent tous `collateralToken: 0`.
   *
   * Un `index`, et non un symbole : c'est ce que fait le calcul officiel du
   * ratio de compte unifié, qui apparie ensuite `spotBalances[].token`. Deux
   * tokens peuvent porter le même nom ; aucun ne partage un index. Le symbole
   * se retrouve dans `spotMeta.tokens[].name`, pour l'affichage seulement.
   *
   * ⚠️ Optionnel, bien que l'API le rende sur tous les dex mesurés — y compris
   * le principal : la doc de `meta` ne le montre pas dans son exemple (celle de
   * `metaAndAssetCtxs`, si). Une réponse qui ne le porterait pas doit se
   * traiter comme une absence de réponse, jamais comme « USDC par défaut ».
   */
  collateralToken?: number;
}

/**
 * Market metadata including its index in the universe list.
 */
export interface HLPerpMarketUniverse extends HLPerpMarketInfo {
  /** Market index in the universe array. */
  index: number;
}

/* ********************************************************** */

/**
 * Runtime market data for a perpetual asset.
 */
export interface HLPerpAssetCtx {
  /** Daily notional trading volume. */
  dayNtlVlm: string;

  /**
   * Volume quotidien exprimé dans l'actif de base, là où `dayNtlVlm` l'exprime
   * en notionnel. Relevé sur 363/363 contextes ; il traversait déjà le fil sans
   * qu'aucun type ne le déclare.
   */
  dayBaseVlm: string;

  /** Current funding rate. */
  funding: string;

  /**
   * Prix d'impact estimés, `[bid, ask]`.
   *
   * **`null`** quand l'exchange n'a pas de carnet à montrer : mesuré sur 75/363
   * contextes, tous délistés. Le tableau, lui, fait toujours exactement deux
   * entrées quand il existe (288/288).
   */
  impactPxs: string[] | null;

  /**
   * Mark price used for PnL calculations. Jamais `null` sur les 363 contextes
   * relevés, délistés compris — c'est le seul prix sur lequel on peut compter.
   */
  markPx: string;

  /**
   * Prix milieu du spread, **`null`** sur les mêmes 75 contextes délistés.
   *
   * C'est le champ qui a motivé ce chantier. Déclaré `string`, il faisait
   * rendre `0` à `Number(ctx.midPx)` — et `0` n'est pas une absence de réponse
   * mais une réponse affirmative : dans une comparaison `mid >= oracle`, un
   * `NaN` aurait rendu les deux côtés `false`, `0` tranche. Un consommateur
   * doit donc écarter le `null` avant de calculer, pas le convertir.
   */
  midPx: string | null;

  /** Total open interest. */
  openInterest: string;

  /** Oracle price reference. */
  oraclePx: string;

  /** Price premium relative to the oracle. **`null`** sur les mêmes 75. */
  premium: string | null;

  /** Previous day's closing price. */
  prevDayPx: string;
}

/**
 * Response combining market metadata and runtime context.
 *
 * Le premier élément est le **`HLPerpMeta` complet** : relevé le 2026-10-01 sur
 * `''` et `xyz`, `metaAndAssetCtxs[0]` porte exactement les mêmes trois clés
 * que `meta` — `universe`, `marginTables`, `collateralToken`. Il était typé
 * `{ universe }` seul, ce qui rendait le collatéral du dex illisible depuis cet
 * appel alors qu'il était déjà sur le fil : il fallait un second appel à `meta`
 * pour obtenir une donnée reçue.
 */
export type HLPerpMetaAndCtx = [HLPerpMeta, HLPerpAssetCtx[]];

/**
 * Normalized representation of a perpetual market used by the SDK.
 *
 * Étend `HLPerpMarketInfo` au lieu d'en recopier les champs : la copie avait
 * déjà divergé — `marginTableId` y était déclaré alors qu'il manquait à la
 * source, et les trois champs HIP-3 traversaient le gateway (`{ ...market }`)
 * sans qu'aucun des deux types ne les connaisse. Un champ ajouté par l'exchange
 * se propage maintenant aux deux formes, ou à aucune.
 */
export interface HLPerpMarket extends HLPerpMarketInfo {
  /** Market index in the universe list. */
  index: number;

  /** Current mark price. */
  markPrice?: DecimalString;

  /**
   * Current mid price, `null` quand l'exchange n'en publie pas (marché
   * délisté). `undefined` dit autre chose : la ligne de contexte manquait en
   * face de l'entrée d'univers — deux incidents, deux diagnostics.
   */
  midPrice?: DecimalString | null;

  /** Current funding rate. */
  funding?: DecimalString;

  /** Current open interest. */
  openInterest?: DecimalString;
}

/**
 * Normalized perpetual market enriched with additional runtime and microstructure data.
 */
export interface HLPerpMarketExtended extends HLPerpMarket {
  /** Oracle price reference. */
  oraclePrice?: DecimalString;

  /** Premium vs oracle, `null` sur un marché sans prix milieu. */
  premium?: DecimalString | null;

  /** Daily notional volume. */
  dayNotionalVolume?: DecimalString;

  /** Estimated bid impact price. */
  impactBidPrice?: DecimalString;

  /** Estimated ask impact price. */
  impactAskPrice?: DecimalString;

  /** Previous day reference price. */
  prevDayPrice?: DecimalString;

  /** Estimated spread from impact prices. */
  estimatedSpreadBps?: number;
}
