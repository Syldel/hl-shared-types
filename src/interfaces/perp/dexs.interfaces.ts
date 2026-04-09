/**
 * Represents the request body for the Hyperliquid info endpoint.
 */
export interface HLInfoRequest {
  /** The type of information to retrieve. For perpetual DEXs, use 'perpDexs'. */
  type: 'perpDexs';
}

/**
 * Represents a Perpetual DEX entry on the Hyperliquid exchange.
 */
export interface HLPerpDex {
  /** The unique short name/identifier of the DEX. */
  name: string;
  /** The full descriptive name of the DEX. */
  fullName: string;
  /** The Ethereum address of the account that deployed the DEX. */
  deployer: string;
  /** The address authorized to update oracles, or null if not set. */
  oracleUpdater: string | null;
  /** The address designated to receive trading fees, or null if not set. */
  feeRecipient: string | null;
  /** * A collection of streaming Open Interest caps per asset.
   * Represented as an array of tuples: [Asset Name, Cap Value].
   */
  assetToStreamingOiCap: [string, string][];
  /** * A collection of funding rate multipliers per asset.
   * Represented as an array of tuples: [Asset Name, Multiplier].
   */
  assetToFundingMultiplier: [string, string][];
}

/**
 * The raw response format from the Hyperliquid API for the 'perpDexs' type.
 * The API typically returns an array where the first element can be null.
 */
export type HLPerpDexsResponse = (HLPerpDex | null)[];
