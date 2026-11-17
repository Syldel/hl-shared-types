import { HLOid } from '../common';

/**
 * La réponse à une action `trailingStop` acceptée, **telle que la doc l'écrit**
 * (`exchange-endpoint`, lue en brut le 2026-11-16) : l'oid directement dans
 * `data`, et non un tableau `statuses` comme pour `order`.
 *
 * Mesurée le 2026-11-17 par le gateway (ETH, reduce-only, 10 %, sans
 * activation) : `{"status":"ok","response":{"type":"trailingStop","data":
 * {"oid":607975946526}}}`. ⚠️ Le refus ne l'est pas encore : la doc n'a pas
 * d'onglet d'erreur pour cette action, et le client officiel le lit comme
 * `{ status: 'err', response: <texte> }` (`HLRefusedResponse`).
 */
export interface HLTrailingStopResponseData {
  type: 'trailingStop';
  data: {
    oid: HLOid;
  };
}
