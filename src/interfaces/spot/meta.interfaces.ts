/**
 * Metadata for a spot token.
 */
export interface HLSpotTokenMeta {
  /** Token symbol, e.g. "USDC". */
  name: string;
  /** Number of decimals for display purposes. */
  szDecimals: number;
  /** Number of decimals used on-chain (wei). */
  weiDecimals: number;
  /** Token index in Hyperliquid system. */
  index: number;
  /** Unique token identifier. */
  tokenId: string;
  /** Whether this is the canonical token in the system. */
  isCanonical: boolean;
  /** EVM contract address (if applicable). */
  evmContract: string | null;
  /** Full token name, optional. */
  fullName: string | null;
}

/**
 * Metadata for a spot market.
 */
export interface HLSpotMarketMeta {
  /** Market symbol, e.g. "ETH/USDC". */
  name: string;
  /** Indexes of the base and quote tokens. */
  tokens: [number, number];
  /** Market index in Hyperliquid system. */
  index: number;
  /** Whether the market uses canonical tokens. */
  isCanonical: boolean;
}

/**
 * Complete spot metadata including tokens and markets.
 */
export interface HLSpotMeta {
  /** All spot tokens. */
  tokens: HLSpotTokenMeta[];
  /** All spot markets (universe). */
  universe: HLSpotMarketMeta[];
}

/**
 * Summary of a spot asset, extending market metadata.
 */
export interface HLSpotAssetSummary extends HLSpotMarketMeta {
  /** Optional: number of decimals for size/amount display. */
  szDecimals?: number;
}
