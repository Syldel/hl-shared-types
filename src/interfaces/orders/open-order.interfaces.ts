import { DecimalString, HLOid, HLTif, Timestamp } from '../common';

/* ****************************** Open Orders (simple) ****************************** */

/**
 * Base response for any order info returned by the API.
 * These fields are common to all order-related info endpoints.
 */
export interface HLOpenOrder {
  /** Asset symbol (e.g., "BTC", "@107") */
  coin: string;
  /** Limit price as a string */
  limitPx: DecimalString;
  /** Internal Hyperliquid Order ID */
  oid: HLOid;
  /** 'A' for Ask (Sell), 'B' for Bid (Buy) */
  side: 'A' | 'B';
  /** Current size of the order */
  sz: DecimalString;
  /** Transaction timestamp in milliseconds */
  timestamp: Timestamp;
}

export type HLOpenOrdersResponse = HLOpenOrder[];

/* *************** Frontend Open Orders (avec infos supplémentaires) *************** */

/**
 * Enhanced order details for frontend-specific views.
 */
export interface HLFrontendOpenOrder extends HLOpenOrder {
  /** True if this is a Take Profit or Stop Loss for an open position */
  isPositionTpsl: boolean;
  /** True if this is a trigger order (Stop/TP) */
  isTrigger: boolean;
  /** Descriptive order type (e.g., "Limit", "Stop Market") */
  orderType: string;
  /** Original size of the order when placed */
  origSz: DecimalString;
  /** True if the order can only reduce position size */
  reduceOnly: boolean;
  /** Human-readable trigger condition (e.g., "Price >= 30000" or "N/A") */
  triggerCondition: string;
  /** Price that triggers the order, if applicable */
  triggerPx: DecimalString;
  /** Time In Force: API can return specific labels like "FrontendMarket" */
  tif?: HLTif | string | null;
  /** Client Order ID: always present in response, but can be null */
  cloid?: string | null;
}

export type HLFrontendOpenOrdersResponse = HLFrontendOpenOrder[];
