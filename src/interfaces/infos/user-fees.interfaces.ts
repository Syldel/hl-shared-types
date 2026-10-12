import { DecimalString, HexString } from '../common';

/**
 * ============================================================================
 * LE BARÈME RÉEL D'UN UTILISATEUR
 *
 * Réponse de `userFees`, servie telle quelle par
 * `GET /hyperliquid/info/user-fees` du gateway.
 *
 * Recopiée de la documentation officielle (« Query a user's fees », relevée le
 * 2026-10-11), **pas déduite** de la formule publiée sur la page des frais. Les
 * deux ne portent pas les mêmes noms, et c'est le piège : le pseudo-code de la
 * formule écrit `fees: { makerRate, takerRate }`, alors que le point de
 * terminaison ne connaît ni l'un ni l'autre. Ce sont `userCrossRate` (preneur)
 * et `userAddRate` (apporteur).
 *
 * ⚠️ Tout est en **chaînes décimales**, y compris des taux qui peuvent être
 * négatifs (`tiers.mm[].add` vaut `'-0.00001'` : un rebate). `Number('')` rend
 * `0`, soit un barème parfaitement plausible — donc jamais de conversion sans
 * refuser ce qui n'est pas un nombre.
 * ============================================================================
 */

/** Un palier de volume : au-delà de `ntlCutoff`, ces taux s'appliquent. */
export interface HlVipFeeTier {
  ntlCutoff: DecimalString;
  cross: DecimalString;
  add: DecimalString;
  spotCross: DecimalString;
  spotAdd: DecimalString;
}

/**
 * Un palier d'apporteur de liquidité. `add` y est **négatif** : c'est un
 * rebate, payé à l'utilisateur et non prélevé.
 */
export interface HlMakerFeeTier {
  makerFractionCutoff: DecimalString;
  add: DecimalString;
}

export interface HlStakingDiscountTier {
  bpsOfMaxSupply: DecimalString;
  discount: DecimalString;
}

/** Le barème **public**, identique pour tous : les paliers de base et leurs seuils. */
export interface HlFeeSchedule {
  /** Preneur, perp. `'0.00045'` au palier de base. */
  cross: DecimalString;
  /** Apporteur, perp. `'0.00015'` au palier de base. */
  add: DecimalString;
  spotCross: DecimalString;
  spotAdd: DecimalString;
  tiers: {
    vip: HlVipFeeTier[];
    mm: HlMakerFeeTier[];
  };
  referralDiscount: DecimalString;
  stakingDiscountTiers: HlStakingDiscountTier[];
}

/** Le volume d'un jour, tel que le barème le compte. */
export interface HlDailyUserVolume {
  /** `'2025-05-23'` — une date sans heure ni fuseau. */
  date: string;
  userCross: DecimalString;
  userAdd: DecimalString;
  exchange: DecimalString;
}

/**
 * Le lien entre un compte qui stake et un compte qui trade.
 *
 * ⚠️ Lier est **irréversible** et donne au compte de staking le pouvoir de
 * vider le compte de trading — ne jamais proposer cette action depuis l'app.
 */
export interface HlStakingLink {
  type: string;
  stakingUser: HexString;
}

export interface HlActiveStakingDiscount {
  bpsOfMaxSupply: DecimalString;
  discount: DecimalString;
}

export interface HlUserFees {
  dailyUserVlm: HlDailyUserVolume[];
  feeSchedule: HlFeeSchedule;

  /**
   * Le taux **preneur** de cet utilisateur, déjà net de son palier de volume et
   * de sa remise de staking — mais **pas** de sa remise de parrainage, que la
   * formule officielle applique à part, ni du barème propre à un marché HIP-3.
   *
   * Vérifié sur l'exemple de la documentation : `'0.000315'` vaut
   * `0,00045 × 0,7`, et `activeStakingDiscount.discount` y vaut `'0.3'`.
   */
  userCrossRate: DecimalString;
  /** Le taux **apporteur**, mêmes réserves. Peut être négatif : voir `HlMakerFeeTier`. */
  userAddRate: DecimalString;
  userSpotCrossRate: DecimalString;
  userSpotAddRate: DecimalString;

  /** Entre `'0.0'` et `'1.0'`. C'est le `(1 - activeReferralDiscount)` de la formule. */
  activeReferralDiscount: DecimalString;

  /**
   * `null` quand aucun essai n'est en cours.
   *
   * ⚠️ Seule la valeur `null` a été observée : la forme du cas non nul est
   * **inconnue**, et l'inventer ici donnerait à un consommateur l'illusion de
   * pouvoir la lire. `unknown` force à la vérifier avant d'y toucher — et
   * `unknown | null` se réduirait à `unknown`, donc le `null` est explicite
   * dans ce commentaire plutôt que dans un type qui ne le dirait pas.
   */
  trial: unknown;
  /**
   * ⚠️ **La documentation appelle ce champ `feeTrialReward` ; le serveur envoie
   * `feeTrialEscrow`.** Relevé le 2026-10-12 sur une vraie réponse de
   * `GET /hyperliquid/info/user-fees` — c'est le nom servi qui fait foi, et le
   * type écrit d'après la documentation était faux sur ce point.
   *
   * Aucun code ne le lit, donc rien n'a cassé : c'est précisément le genre
   * d'écart qu'un type recopié d'une page de documentation porte en silence
   * jusqu'à ce qu'on regarde la réponse.
   */
  feeTrialEscrow: DecimalString;
  /** `null` quand il n'y en a pas de prévu. */
  nextTrialAvailableTimestamp: number | null;

  /** Absent quand le compte ne stake pas depuis un autre compte. */
  stakingLink?: HlStakingLink | null;
  activeStakingDiscount?: HlActiveStakingDiscount | null;
}
