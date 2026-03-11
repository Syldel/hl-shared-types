import { DecimalString } from '../common';

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

  /** Whether the market only supports isolated margin. */
  onlyIsolated?: boolean;

  /** Whether the market has been delisted. */
  isDelisted?: boolean;

  /** Optional margin mode restriction. */
  marginMode?: 'strictIsolated' | 'noCross';
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

  /** Current funding rate. */
  funding: string;

  /** Impact price levels used for slippage estimation. */
  impactPxs: string[];

  /** Mark price used for PnL calculations. */
  markPx: string;

  /** Mid price between best bid and ask. */
  midPx: string;

  /** Total open interest. */
  openInterest: string;

  /** Oracle price reference. */
  oraclePx: string;

  /** Price premium relative to the oracle. */
  premium: string;

  /** Previous day's closing price. */
  prevDayPx: string;
}

/**
 * Response combining market metadata and runtime context.
 */
export type HLPerpMetaAndCtx = [{ universe: HLPerpMarketInfo[] }, HLPerpAssetCtx[]];

/**
 * Normalized representation of a perpetual market used by the SDK.
 */
export interface HLPerpMarket {
  /** Market index in the universe list. */
  index: number;

  /** Market symbol (e.g. BTC). */
  name: string;

  /** Size precision for orders. */
  szDecimals: number;

  /** Maximum leverage allowed. */
  maxLeverage: number;

  /** Margin table identifier. */
  marginTableId?: number;

  /** Current mark price. */
  markPrice?: DecimalString;

  /** Current mid price. */
  midPrice?: DecimalString;

  /** Current funding rate. */
  funding?: DecimalString;

  /** Current open interest. */
  openInterest?: DecimalString;
}
