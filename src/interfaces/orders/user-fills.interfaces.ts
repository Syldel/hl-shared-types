import { Timestamp } from '../common';

/**
 * User trade fill returned by the Hyperliquid `userFills` endpoints.
 */
export interface HLUserFill {
  /** Asset symbol or asset id (e.g. "BTC" or "@107" for spot markets). */
  coin: string;

  /** Execution price. */
  px: string;

  /** Executed size (base asset). */
  sz: string;

  /** Liquidity side: A = ask (sell), B = bid (buy). */
  side: 'A' | 'B';

  /** Execution timestamp (ms). */
  time: Timestamp;

  /** Order identifier. */
  oid: number;

  /** Trade identifier. */
  tid: number;

  /** Trade direction (e.g. "Open Long", "Close Short"). */
  dir: string;

  /** Position size before this fill. */
  startPosition: string;

  /** Realized PnL from the fill. */
  closedPnl: string;

  /** Whether the trade executed via crossing order logic. */
  crossed: boolean;

  /** Transaction hash on Hyperliquid. */
  hash: `0x${string}`;

  /** Trading fee paid. */
  fee: string;

  /** Token used to pay the fee. */
  feeToken: string;

  /** Optional builder/referral fee applied to the trade. */
  builderFee?: string;
}

/**
 * List of fills returned by the `userFills` endpoints.
 */
export type HLUserFillsResponse = HLUserFill[];

export interface HLUserFillsRequest {
  /**
   * Whether to aggregate partial fills by block/time.
   */
  aggregateByTime?: boolean;
}

export interface HLUserFillsByTimeRequest extends HLUserFillsRequest {
  /**
   * Start timestamp in milliseconds (inclusive).
   */
  startTime: Timestamp;

  /**
   * End timestamp in milliseconds (inclusive).
   * Defaults to the current time if omitted.
   */
  endTime?: Timestamp;
}
