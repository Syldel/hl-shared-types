import { HLOrderGrouping } from '../actions';
import { HLOid } from '../common';
import { HLOrderDetails } from '../orders';

// --- Action Input Params (Write) ---

export interface PlaceOrderParams {
  order: HLOrderDetails;
  grouping?: HLOrderGrouping;
  builder?: { b: string; f: number };
  isTestnet?: boolean;
}

export interface ModifyOrderItem {
  oid: HLOid;
  order: HLOrderDetails;
}

export interface ModifyOrderParams extends ModifyOrderItem {
  isTestnet?: boolean;
}

export interface BatchModifyOrdersParams {
  modifies: ModifyOrderItem[];
  isTestnet?: boolean;
}

export interface CancelOrderParams {
  cancels: { asset: number; oid: HLOid }[];
  isTestnet?: boolean;
}

export interface CancelOrderByCloidParams {
  cancels: { asset: number; cloid: string }[];
  isTestnet?: boolean;
}

export interface UpdateLeverageParams {
  asset: number;
  isCross: boolean;
  leverage: number;
  isTestnet?: boolean;
}

// --- Request Input Params (Read / Query) ---

export interface GetOpenOrdersQueryParams {
  dex?: string;
  isTestnet?: boolean;
}

export interface OrderStatusQueryParams {
  isTestnet?: boolean;
}

// --- Transfer Input Params ---

export interface TransferSpotPerpParams {
  amount: string;
  toPerp: boolean;
  isTestnet?: boolean;
}

// --- Instant and Protective ---

export interface ProtectiveActionResult {
  cancelled: HLOid[];
  created: HLOid[];
  updated: HLOid[];
}

export interface SmartOrderResponse {
  tp: ProtectiveActionResult;
  sl: ProtectiveActionResult;
}
