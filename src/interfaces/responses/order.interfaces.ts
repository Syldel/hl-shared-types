import { DecimalString, HLOid } from '../common';

export interface HLPlaceOrderStatus {
  resting?: { oid: HLOid };
  filled?: { oid: HLOid; totalSz: DecimalString; avgPx: DecimalString };
  error?: string;
}

export interface HLPlaceOrderResponse {
  type: 'order';
  data: {
    statuses: HLPlaceOrderStatus[];
  };
}
