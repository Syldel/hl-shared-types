import { DecimalString, Timestamp } from '../common';

/**
 * Supported Hyperliquid candle intervals (source of truth array).
 */
export const CANDLE_INTERVALS = [
  '1m',
  '3m',
  '5m',
  '15m',
  '30m',
  '1h',
  '2h',
  '4h',
  '8h',
  '12h',
  '1d',
  '3d',
  '1w',
  '1M',
] as const;

/**
 * Supported Hyperliquid candle intervals type.
 */
export type CandleInterval = (typeof CANDLE_INTERVALS)[number];

/**
 * Duration in minutes for each native Hyperliquid interval.
 */
export const CANDLE_INTERVAL_MINUTES: Record<CandleInterval, number> = {
  '1m': 1,
  '3m': 3,
  '5m': 5,
  '15m': 15,
  '30m': 30,
  '1h': 60,
  '2h': 120,
  '4h': 240,
  '8h': 480,
  '12h': 720,
  '1d': 1440,
  '3d': 4320,
  '1w': 10080,
  '1M': 43200,
};

/**
 * Type guard to check if a string is a valid native Hyperliquid CandleInterval.
 */
export function isCandleInterval(value: string): value is CandleInterval {
  return (CANDLE_INTERVALS as readonly string[]).includes(value);
}

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
