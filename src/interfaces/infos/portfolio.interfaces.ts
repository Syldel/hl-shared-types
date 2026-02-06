import { DecimalString, Timestamp } from '../common';

/** Un point de donnée : [Timestamp, Valeur] */
export type PortfolioPoint = [Timestamp, DecimalString];

/** Données de portfolio pour une période donnée */
export interface PortfolioStats {
  accountValueHistory: PortfolioPoint[];
  pnlHistory: PortfolioPoint[];
  vlm: DecimalString;
}

/** Labels de périodes supportés par Hyperliquid */
export type PortfolioPeriod =
  | 'day'
  | 'week'
  | 'month'
  | 'allTime'
  | 'perpDay'
  | 'perpWeek'
  | 'perpMonth'
  | 'perpAllTime';

/** * La réponse est un tableau de tuples : [Période, Stats]
 * Exemple: ["day", { accountValueHistory: [...], ... }]
 */
export type PortfolioResponse = [PortfolioPeriod, PortfolioStats][];
