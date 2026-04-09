import { HLOid, Timestamp } from '../common';
import { HLFrontendOpenOrder } from './open-order.interfaces';

export type HLOrderStatus =
  | 'open'
  | 'filled'
  | 'canceled'
  | 'triggered'
  | 'rejected'
  | 'marginCanceled'
  | 'vaultWithdrawalCanceled'
  | 'openInterestCapCanceled'
  | 'selfTradeCanceled'
  | 'reduceOnlyCanceled'
  | 'siblingFilledCanceled'
  | 'delistedCanceled'
  | 'liquidatedCanceled'
  | 'scheduledCancel'
  | 'tickRejected'
  | 'minTradeNtlRejected'
  | 'perpMarginRejected'
  | 'reduceOnlyRejected'
  | 'badAloPxRejected'
  | 'iocCancelRejected'
  | 'badTriggerPxRejected'
  | 'marketOrderNoLiquidityRejected'
  | 'positionIncreaseAtOpenInterestCapRejected'
  | 'positionFlipAtOpenInterestCapRejected'
  | 'tooAggressiveAtOpenInterestCapRejected'
  | 'openInterestIncreaseRejected'
  | 'insufficientSpotBalanceRejected'
  | 'oracleRejected'
  | 'perpMaxPositionRejected';

export interface HLOrderStatusDetails extends HLFrontendOpenOrder {
  children: unknown[]; // Specific to order status queries
}

export interface HLOrderStatusData {
  order: HLOrderStatusDetails;
  status: HLOrderStatus;
  statusTimestamp: Timestamp;
}

export interface HLOrderStatusResponse {
  status: 'order' | 'unknownOid';
  order: HLOrderStatusData;
}

export interface HLOrderStatusRequest {
  type: 'orderStatus';
  user: `0x${string}`;
  oid: HLOid;
}
