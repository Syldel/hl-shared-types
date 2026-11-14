import { DecimalString, HexString } from '../common';

/**
 * ============================================================================
 * LE COMPTEUR DE LA LIMITE PAR ADRESSE
 *
 * Réponse de `userRateLimit`, servie telle quelle par
 * `GET /hyperliquid/info/user-rate-limit` du gateway (poids 20 sur la limite
 * par IP).
 *
 * La limite par adresse est la seule qui puisse empêcher de poser un stop sans
 * qu'aucun 429 ne prévienne avant : épuisée, elle ne laisse plus passer qu'une
 * action toutes les 10 s. Elle ne compte que les actions, pas les lectures, et
 * un lot de n ordres pour n (doc « Rate limits and user limits »).
 *
 * Forme recopiée de la documentation (« Query user rate limits », relue en brut
 * le 2026-11-14) **et** mesurée le même jour sur un compte réel : `cumVlm` est
 * une chaîne décimale, les trois compteurs des nombres.
 *
 * ⚠️ La doc définit `nRequestsUsed` et `nRequestsSurplus` par rapport à un
 * « reserved » qu'elle ne définit nulle part. La lecture la plus plausible : les
 * actions **achetées** par `reserveRequestWeight` (« Reserve Additional
 * Actions », 0,0005 USDC l'une), et non la réserve initiale de 10 000, déjà
 * comprise dans `nRequestsCap`. Non départagé : le compte mesuré n'en avait
 * acheté aucune.
 * ============================================================================
 */

export interface HlUserRateLimitRequest {
  type: 'userRateLimit';
  user: HexString;
}

export interface HlUserRateLimit {
  /** Le volume échangé depuis la création de l'adresse, en USDC. */
  cumVlm: DecimalString;
  /**
   * « max(0, cumulative_used minus reserved) » d'après la doc. Mesuré le
   * 2026-11-14 : 2288, aucune action achetée.
   */
  nRequestsUsed: number;
  /**
   * Le plafond : la réserve initiale de 10 000, **comprise**, plus 1 action par
   * USDC échangé. Mesuré le 2026-11-14 : 61638 pour un `cumVlm` de 51638.93,
   * soit exactement 10 000 + le volume arrondi. La marge avant le
   * ralentissement est donc `nRequestsCap − nRequestsUsed`.
   */
  nRequestsCap: number;
  /** « max(0, reserved minus cumulative_used) » d'après la doc. Mesuré à 0. */
  nRequestsSurplus: number;
}
