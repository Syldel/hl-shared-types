import { DecimalString, Timestamp } from '../common';

/** Intervalles supportés pour les bougies Hyperliquid */
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

/** Réponse brute d'une bougie (Candle) selon l'API Hyperliquid */
export interface CandleSnapshot {
  t: Timestamp; // Open time
  T: Timestamp; // Close time
  s: string; // Symbol/Coin (ex: "BTC" ou "purp:PURP")
  i: CandleInterval; // Interval
  o: DecimalString; // Open price
  c: DecimalString; // Close price
  h: DecimalString; // High price
  l: DecimalString; // Low price
  v: DecimalString; // Volume (base currency)
  n: number; // Number of trades (celui-ci reste un entier pur)
}

export interface CandleSnapshotRequest {
  coin: string;
  interval: CandleInterval;
  startTime: Timestamp;
  endTime?: Timestamp;
}
