import { DecimalString, Timestamp } from '../common';

/**
 * Supported Hyperliquid candle intervals.
 */
export type CandleInterval =
  | '1m'
  | '3m'
  | '5m'
  | '15m'
  | '30m'
  | '1h'
  | '2h'
  | '4h'
  | '8h'
  | '12h'
  | '1d'
  | '3d'
  | '1w'
  | '1M';

/**
 * Raw candle data returned by the Hyperliquid `candleSnapshot` endpoint.
 */
export interface CandleSnapshot {
  /** Candle open timestamp (ms). */
  t: Timestamp;

  /** Candle close timestamp (ms). */
  T: Timestamp;

  /** Asset symbol (e.g. BTC or xyz:XYZ100 for HIP-3 markets). */
  s: string;

  /** Candle interval. */
  i: CandleInterval;

  /** Open price. */
  o: DecimalString;

  /** Close price. */
  c: DecimalString;

  /** Highest traded price during the interval. */
  h: DecimalString;

  /** Lowest traded price during the interval. */
  l: DecimalString;

  /** Traded volume in base asset. */
  v: DecimalString;

  /** Number of trades included in the candle. */
  n: number;
}

/**
 * Parameters for querying historical candles.
 */
export interface CandleSnapshotRequest {
  /** Asset symbol (e.g. BTC or xyz:XYZ100 for HIP-3 markets). */
  coin: string;

  /** Candle interval. */
  interval: CandleInterval;

  /** Start timestamp in milliseconds (inclusive). */
  startTime: Timestamp;

  /** End timestamp in milliseconds (inclusive). Defaults to current time. */
  endTime?: Timestamp;
}
