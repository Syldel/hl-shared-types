import { DecimalString, Timestamp } from '../common';

/**
 * Valid configuration options for significant figures aggregation.
 * null means full precision.
 */
export type HLNSigFigsOptions = 2 | 3 | 4 | 5 | null;

/**
 * Valid mantissa values for aggregation.
 * This field is only allowed if nSigFigs is set to 5.
 */
export type HLMantissaOptions = 1 | 2 | 5;

/**
 * Represents the request payload for the L2 Book Snapshot endpoint.
 */
export interface HLL2BookRequest {
  /** The type of info request. */
  type: 'l2Book';
  /** The trading coin symbol (e.g., "BTC", "ETH"). */
  coin: string;
  /**
   * Optional field to aggregate levels to N significant figures.
   * Valid values are 2, 3, 4, 5, and null (full precision).
   */
  nSigFigs?: HLNSigFigsOptions;
  /**
   * Optional field to aggregate levels.
   * This field is only allowed if nSigFigs is 5.
   */
  mantissa?: HLMantissaOptions;
}

/**
 * Represents a single price level in the L2 order book.
 */
export interface HLL2BookLevel {
  /** The price of the level. String format prevents floating-point precision loss. */
  px: DecimalString;
  /** The total size/volume available at this price level. */
  sz: DecimalString;
  /** The total number of individual orders making up this level. */
  n: number;
}

/**
 * Represents the response data for an L2 Book Snapshot request.
 */
export interface HLL2BookResponse {
  /** The trading coin symbol. */
  coin: string;
  /** The server timestamp when the snapshot was generated. */
  time: Timestamp;
  /**
   * An array containing exactly two elements representing the order book depth.
   * Index 0: Bids (Buy orders), sorted from highest price to lowest.
   * Index 1: Asks (Sell orders), sorted from lowest price to highest.
   * Returns at most 20 levels per side.
   */
  levels: [HLL2BookLevel[], HLL2BookLevel[]];
}
