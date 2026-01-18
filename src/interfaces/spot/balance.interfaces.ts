import { DecimalString } from '../common';

export interface HLSpotBalance {
  coin: string;
  token: number;
  hold: DecimalString;
  total: DecimalString;
  entryNtl: DecimalString;
}

export interface HLSpotClearinghouseState {
  balances: HLSpotBalance[];
}
