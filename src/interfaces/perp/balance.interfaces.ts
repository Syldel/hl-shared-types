import { DecimalString, Timestamp } from '../common';

/**
 * Leverage configuration for a perpetual position.
 *
 * ============================================================================
 * UNE UNION, PARCE QUE LES DEUX MODES NE PORTENT PAS LES MÊMES CHAMPS
 *
 * `rawUsd` était déclaré **obligatoire** pour les deux modes, et le faux
 * gateway devait donc mentir par une assertion de type pour construire une
 * position cross plausible — exactement ce qu'un double n'a pas le droit de
 * faire.
 *
 * La forme vient du **SDK Python officiel** (`hyperliquid-dex/
 * hyperliquid-python-sdk`, `hyperliquid/utils/types.py`), qui déclare la même
 * union, discriminée sur `type` :
 *
 *     CrossLeverage    = {"type": Literal["cross"],    "value": int}
 *     IsolatedLeverage = {"type": Literal["isolated"], "value": int,
 *                         "rawUsd": str}
 *     Leverage = Union[CrossLeverage, IsolatedLeverage]
 *
 * Deux relevés la recoupent, chacun pour une branche : les captures du gateway
 * du 2026-09-22 n'ont que des leviers `cross`, tous en `{ type, value }` nus ;
 * l'exemple de la doc de `clearinghouseState` n'a qu'une position isolée, qui
 * porte `rawUsd: "-95.059824"`. Aucun des deux ne couvre l'autre branche — le
 * SDK, lui, les couvre toutes les deux.
 *
 * ⚠️ Ce « officiel » ne se déduit **pas** du nom de l'organisation GitHub, qui
 * n'est d'ailleurs pas vérifiée (`is_verified: false`). Il repose sur la page
 * d'API de la documentation, qui distingue ce SDK des bibliothèques
 * communautaires, et sur PyPI, qui le publie sous `hello@hyperliquid.xyz`. La
 * chaîne et ses limites : `nest-hyperliquid-gateway/docs/sources.md`.
 *
 * Pourquoi l'union et non `rawUsd?: DecimalString` : l'optionnel rendrait
 * `lev.rawUsd` lisible sans vérifier `type`, et `Number(undefined)` rend `NaN`
 * sans un mot. L'union en fait une erreur de compilation. Et si un cross
 * portait un jour `rawUsd`, le coût de s'être trompé ici est nul — personne ne
 * lit ce champ, il serait simplement invisible — là où le coût du `NaN`
 * silencieux se paierait sur un dimensionnement.
 * ============================================================================
 */
export type HLPerpLeverage =
  | {
      /** Margin mode used for the position. */
      type: 'cross';

      /** Current leverage multiplier. */
      value: number;
    }
  | {
      type: 'isolated';

      value: number;

      /**
       * Notional value in USD used for leverage calculation. Propre à l'isolé,
       * où la marge est cantonnée à la position.
       */
      rawUsd: DecimalString;
    };

/**
 * Funding payments accumulated for a perpetual position.
 */
export interface HLPerpCumFunding {
  /** Total funding paid or received since account creation. */
  allTime: DecimalString;

  /** Funding accumulated since the last position change. */
  sinceChange: DecimalString;

  /** Funding accumulated since the position was opened. */
  sinceOpen: DecimalString;
}

/**
 * Detailed information about a perpetual position.
 */
export interface HLPerpPositionDetail {
  /** Asset symbol (e.g. BTC, ETH). */
  coin: string;

  /** Funding payments history. */
  cumFunding: HLPerpCumFunding;

  /** Average entry price of the position. */
  entryPx: DecimalString;

  /** Leverage configuration. */
  leverage: HLPerpLeverage;

  /**
   * Estimated liquidation price, **`null`** quand l'exchange n'en publie pas.
   *
   * Relevé le 2026-09-22 dans les captures réelles du gateway : sur 6 états
   * distincts d'une même paire (`xyz:MU`, cross), les 3 **longs** rendent
   * `null` et les 2 **shorts** rendent une chaîne. Un seul coin sur un seul
   * dex : cette corrélation avec le sens de la position n'explique rien, et je
   * ne connais pas la règle.
   *
   * Ce qui est établi suffit pourtant, et c'est asymétrique : une nullité se
   * prouve par un seul contre-exemple, alors que la non-nullité demanderait de
   * l'avoir épuisée. Trois `null` mesurés closent la question du type ; ils ne
   * disent rien de *quand*.
   *
   * Conséquence pour un consommateur : le `null` s'écarte, il ne se convertit
   * pas. `Number(null)` rend `0`, et un prix de liquidation à zéro est le plus
   * rassurant des mensonges — il paraît infiniment loin du prix courant.
   */
  liquidationPx: DecimalString | null;

  /** Margin currently used by the position. */
  marginUsed: DecimalString;

  /** Maximum allowed leverage for this market. */
  maxLeverage: number;

  /** Notional value of the position. */
  positionValue: DecimalString;

  /** Return on equity (ROE). */
  returnOnEquity: DecimalString;

  /** Position size (positive = long, negative = short). */
  szi: DecimalString;

  /** Unrealized profit or loss. */
  unrealizedPnl: DecimalString;
}

/**
 * Wrapper describing a perpetual asset position.
 */
export interface HLPerpAssetPosition {
  /**
   * Position details (null if no active position).
   *
   * ⚠️ Laissé nullable bien qu'aucune des entrées relevées le 2026-09-22 ne
   * soit nulle : des observations d'une valeur présente ne prouvent pas qu'elle
   * le soit toujours — et celles-ci portent sur une seule paire —, la doc nomme
   * le cas, et deux des trois lecteurs du bot le gardaient déjà. Le troisième
   * ne le gardait pas, et levait un `Cannot read properties of null` juste
   * après une entrée remplie : c'est ce défaut qui a fait garder ce `| null`
   * plutôt que le resserrer.
   */
  position: HLPerpPositionDetail | null;

  /** Position mode configuration. */
  type: 'oneWay' | 'hedged';
}

/**
 * Margin summary for a perpetual account.
 */
export interface HLPerpMarginSummary {
  /** Total account value. */
  accountValue: DecimalString;

  /** Margin currently used by open positions. */
  totalMarginUsed: DecimalString;

  /** Total notional position value. */
  totalNtlPos: DecimalString;

  /** Raw USD balance before adjustments. */
  totalRawUsd: DecimalString;
}

/**
 * Clearinghouse state for a perpetual trading account.
 */
export interface HLClearinghouseState {
  /** List of perpetual positions. */
  assetPositions: HLPerpAssetPosition[];

  /** Cross maintenance margin currently required. */
  crossMaintenanceMarginUsed: DecimalString;

  /** Cross margin account summary. */
  crossMarginSummary: HLPerpMarginSummary;

  /** Global margin summary. */
  marginSummary: HLPerpMarginSummary;

  /** Timestamp of the snapshot. */
  time: Timestamp;

  /** Amount available for withdrawal. */
  withdrawable: DecimalString;
}
