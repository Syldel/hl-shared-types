import { DecimalString } from '../common';

/**
 * User's balance for a spot asset.
 */
export interface HLSpotBalance {
  /** Asset symbol, e.g. "USDC" or "ETH". */
  coin: string;
  /** Token index in Hyperliquid's system. */
  token: number;
  /** Amount currently on hold / reserved. */
  hold: DecimalString;
  /** Total amount owned (available + hold). */
  total: DecimalString;
  /** Entry notional for the position. */
  entryNtl: DecimalString;
}

/**
 * Spot clearinghouse state containing all balances.
 */
export interface HLSpotClearinghouseState {
  /** Array of spot balances for this user. */
  balances: HLSpotBalance[];
}
