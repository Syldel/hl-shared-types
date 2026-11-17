export interface HLErrorResponse {
  status: 'error';
  message: string;
}

/**
 * Type guard pour vérifier si un objet est une HLErrorResponse.
 * @param obj Objet à vérifier.
 * @returns True si l'objet correspond à HLErrorResponse.
 */
export function isHLErrorResponse(obj: unknown): obj is HLErrorResponse {
  if (typeof obj !== 'object' || obj === null) {
    return false;
  }

  const errorObj = obj as Record<string, unknown>;
  return (
    'status' in errorObj &&
    errorObj.status === 'error' &&
    'message' in errorObj &&
    typeof errorObj.message === 'string'
  );
}

/**
 * Le refus d'une action **entière** par `/exchange`, en HTTP 200 : le texte est
 * dans `response`, sans `message`. Ce n'est pas `HLErrorResponse`, qui décrit
 * le corps d'une erreur HTTP.
 *
 * Lu sur le compte de développement, par exemple le 2026-10-27 :
 * `{"status":"err","response":"Error placing new order during modify: Post only
 * order would have immediately matched, bbo was 2345.4@2345.5."}`
 * (`nest-hyperliquid-gateway/docs/sources.md`). C'est aussi la forme d'un agent
 * inconnu de l'exchange (« User or API Wallet … does not exist »).
 */
export interface HLRefusedResponse {
  status: 'err';
  response: string;
}
