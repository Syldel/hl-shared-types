export type DecimalString = string;

export type Timestamp = number;

export type HexString = `0x${string}`;

// Info : HLOid est l’ID d’un ordre, pas d’un fill ou d’une position
export type HLOid = number | HexString;

/**
 * Time In Force options for Hyperliquid orders.
 * Gtc: Good Til Cancelled
 * Ioc: Immediate Or Cancel
 * Alo: Add Liquidity Only (Post-Only)
 */
export type HLTif = 'Gtc' | 'Ioc' | 'Alo';
