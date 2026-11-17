/**
 * ============================================================================
 * LES `orderType` QU'HYPERLIQUID ÉCRIT DANS SES LECTURES D'ORDRES
 *
 * `frontendOpenOrders`, `orderStatus` et `historicalOrders` portent un
 * `orderType` en texte (« Stop Market »). Les consommateurs le lisaient par
 * **morceaux** (« stop » dans le nom) : le trailing stop natif, ajouté le
 * 2026-09-21, se lit `"Trailing Stop Market"` et passait donc pour un stop
 * ordinaire dans le bot, le gateway et le mobile (corrigé le 2026-11-16 dans
 * les trois). La règle depuis : **comparer à l'exact**, à ces libellés.
 *
 * D'où vient chaque libellé :
 *
 * - **lus sur le compte de développement** : `Limit`, `Market` (dans
 *   `historicalOrders`), `Stop Market`, `Stop Limit` (le 2026-10-18),
 *   `Take Profit Market`, `Trailing Stop Market` (le 2026-11-16) ;
 * - **seulement dans la liste que déclare le client officiel**
 *   (`app.hyperliquid.xyz`, lue le 2026-11-16) : `Take Profit Limit`,
 *   `Twap Slice`. Cette liste porte aussi les six libellés lus.
 *
 * `HLFrontendOpenOrder.orderType` reste un `string` : un libellé que ce paquet
 * ne connaît pas encore doit pouvoir arriver, et être refusé ou laissé de côté
 * par son consommateur — jamais deviné.
 * ============================================================================
 */
export const HL_ORDER_TYPE = {
  limit: 'Limit',
  market: 'Market',
  stopMarket: 'Stop Market',
  stopLimit: 'Stop Limit',
  takeProfitMarket: 'Take Profit Market',
  takeProfitLimit: 'Take Profit Limit',
  trailingStopMarket: 'Trailing Stop Market',
  twapSlice: 'Twap Slice',
} as const;

export type HLOrderTypeLabel = (typeof HL_ORDER_TYPE)[keyof typeof HL_ORDER_TYPE];

const KNOWN_LABELS: ReadonlySet<string> = new Set(Object.values(HL_ORDER_TYPE));

/** Un libellé que ce paquet connaît, comparé à l'exact (casse comprise). */
export function isKnownOrderType(orderType: string): orderType is HLOrderTypeLabel {
  return KNOWN_LABELS.has(orderType);
}
