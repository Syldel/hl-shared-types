import { HLOid } from '../common';

/**
 * La réponse à une action `trailingStop` acceptée, **telle que la doc l'écrit**
 * (`exchange-endpoint`, lue en brut le 2026-11-16) : l'oid directement dans
 * `data`, et non un tableau `statuses` comme pour `order`.
 *
 * ⚠️ Non mesurée à la date de ce type. La doc n'a pas d'onglet d'erreur pour
 * cette action ; le client officiel lit un refus comme `{ status: 'err',
 * response: <texte> }`, le refus d'une action entière (`HLRefusedResponse`).
 */
export interface HLTrailingStopResponseData {
  type: 'trailingStop';
  data: {
    oid: HLOid;
  };
}
