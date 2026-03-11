import { DecimalString, Timestamp } from '../common';

/**
 * Leverage configuration for a perpetual position.
 */
export interface HLPerpLeverage {
  /** Notional value in USD used for leverage calculation. */
  rawUsd: DecimalString;

  /** Margin mode used for the position. */
  type: 'isolated' | 'cross';

  /** Current leverage multiplier. */
  value: number;
}

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

  /** Estimated liquidation price. */
  liquidationPx: DecimalString;

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
  /** Position details (null if no active position). */
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
