import { DecimalString } from '../interfaces/common';

/**
 * ============================================================================
 * L'ÉTAT D'UN TRAILING STOP NATIF VIT DANS UN TEXTE
 *
 * Un trailing stop natif (`orderType` `"Trailing Stop Market"`) ne rend pas son
 * état dans des champs : `frontendOpenOrders` l'écrit en texte libre dans
 * `triggerCondition`. Les trois formes **lues sur le compte de développement**
 * le 2026-11-16 (`nest-trading-bot/docs/hyperliquid/live-check.md`, « Le
 * trailing stop natif : ce que l'API en rend ») :
 *
 * - `Activation immediate, retracement 10%, best 1828.3` — suivi en cours, repli
 *   en pourcentage ;
 * - `Activation above 2100, retracement 1%, best waiting` — en attente du prix
 *   d'activation ; `triggerPx` vaut alors `"0.0"` ;
 * - `Activation immediate, retracement 275, best 1832.9` — repli en prix,
 *   écrit **nu**, sans unité.
 *
 * ⚠️ `Activation below <px>` n'a **pas** été lu : c'est la forme d'un achat (le
 * stop d'un short), que le client officiel attend dans ses expressions
 * régulières (`activation above|below <px>`, `config-BkGHbgaN.js`, le
 * 2026-11-16). Elle est acceptée sur cette seule foi ; si l'exchange l'écrit
 * autrement, ce lecteur lèvera — il ne la devinera pas.
 *
 * Le lecteur est **strict** : un texte qui ne suit pas exactement cette forme
 * lève une `TrailingStopConditionError` au lieu de rendre un état partiel. Un
 * texte libre peut changer à chaque déploiement de l'exchange, et un état mal
 * lu (un repli en prix pris pour un pourcentage, par exemple) afficherait un
 * stop à un autre endroit que celui où il est réellement.
 *
 * Ce que ce lecteur ne fait pas : recalculer le déclencheur. `triggerPx` le
 * donne, hors de la grille de prix (`1645.47` pour un best de `1828.3` à 10 %).
 * ============================================================================
 */

/** Ce qui démarre le suivi : tout de suite, ou le passage d'un prix. */
export type HLTrailingActivation =
  | { kind: 'immediate' }
  | { kind: 'above'; px: DecimalString }
  /** ⚠️ Non mesurée : forme attendue par le client officiel, jamais lue. */
  | { kind: 'below'; px: DecimalString };

/** Le repli qui déclenche, avec l'unité que l'exchange a écrite. `pct` est en points (`"10"` pour 10 %). */
export type HLTrailingRetracementState =
  | { kind: 'pct'; pct: DecimalString }
  | { kind: 'px'; px: DecimalString };

export interface HLTrailingStopCondition {
  activation: HLTrailingActivation;
  retracement: HLTrailingRetracementState;
  /** Le meilleur prix vu depuis l'activation, ou `null` tant que le suivi attend (`best waiting`). */
  best: DecimalString | null;
}

export class TrailingStopConditionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TrailingStopConditionError';
  }
}

// Une décimale positive telle que l'exchange l'écrit : chiffres, un point
// facultatif suivi de chiffres. Ni signe, ni exposant, ni séparateur de milliers.
const DECIMAL = String.raw`\d+(?:\.\d+)?`;

const CONDITION = new RegExp(
  String.raw`^Activation (?:(immediate)|(above|below) (${DECIMAL})), ` +
    String.raw`retracement (${DECIMAL})(%?), ` +
    String.raw`best (?:(waiting)|(${DECIMAL}))$`,
);

/**
 * Lit le `triggerCondition` d'un trailing stop natif. Lève une
 * `TrailingStopConditionError` sur tout texte qui ne suit pas exactement la
 * forme mesurée — y compris la casse et les séparateurs.
 */
export function parseTrailingStopCondition(text: string): HLTrailingStopCondition {
  const match = CONDITION.exec(text);
  if (!match) {
    throw new TrailingStopConditionError(`Unrecognised trailing stop triggerCondition: "${text}"`);
  }
  const [, immediate, direction, activationPx, amount, percentSign, waiting, best] = match;

  const activation: HLTrailingActivation = immediate
    ? { kind: 'immediate' }
    : { kind: direction as 'above' | 'below', px: activationPx };

  const retracement: HLTrailingRetracementState =
    percentSign === '%' ? { kind: 'pct', pct: amount } : { kind: 'px', px: amount };

  if (!isPositive(amount)) {
    throw new TrailingStopConditionError(
      `Trailing stop triggerCondition has a zero retracement: "${text}"`,
    );
  }

  return { activation, retracement, best: waiting ? null : best };
}

function isPositive(decimal: string): boolean {
  return /[1-9]/.test(decimal);
}
