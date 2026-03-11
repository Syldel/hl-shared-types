import { DecimalString, Timestamp } from '../common';

/**
 * Time-series data point represented as [timestamp, value].
 */
export type PortfolioPoint = [Timestamp, DecimalString];

/**
 * Portfolio statistics for a given time period.
 */
export interface PortfolioStats {
  /** Historical account value over time. */
  accountValueHistory: PortfolioPoint[];

  /** Historical profit and loss over time. */
  pnlHistory: PortfolioPoint[];

  /** Total traded volume for the period. */
  vlm: DecimalString;
}

/**
 * Supported portfolio time ranges returned by the API.
 */
export type PortfolioPeriod =
  | 'day'
  | 'week'
  | 'month'
  | 'allTime'
  | 'perpDay'
  | 'perpWeek'
  | 'perpMonth'
  | 'perpAllTime';

/**
 * Portfolio response returned by the `portfolio` endpoint.
 *
 * Each entry is a tuple: [period, stats].
 *
 * Example:
 * ["day", { accountValueHistory: [...], pnlHistory: [...], vlm: "12345.67" }]
 */
export type PortfolioResponse = [PortfolioPeriod, PortfolioStats][];
