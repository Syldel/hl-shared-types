/**
 * ============================================================================
 * PRIX ET TAILLES : LES RÈGLES DE TICK ET DE LOT D'HYPERLIQUID
 *
 * Source : https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/tick-and-lot-size
 * relevée le 2026-09-23. Deux règles, et une exception :
 *
 * - **taille** : tronquée à `szDecimals`, propre à chaque actif (réponse `meta`) ;
 * - **prix** : au plus 5 chiffres significatifs, ET au plus
 *   `MAX_DECIMALS - szDecimals` décimales, `MAX_DECIMALS` valant 6 en perp et
 *   8 en spot ;
 * - **un prix entier est toujours accepté**, quel que soit son nombre de
 *   chiffres significatifs (`123456` est valide là où `12345.6` ne l'est pas).
 *
 * Ce module vit ici, et non dans le gateway ou le bot, pour qu'il n'en existe
 * **qu'une seule implémentation** : un prix mal écrit est refusé par
 * Hyperliquid, ou accepté sous une forme tronquée qui n'est plus celle qu'on
 * voulait. Sur un stop loss, la différence entre les deux, c'est une position
 * protégée et une position qui ne l'est pas. Deux implémentations, c'est la
 * garantie qu'un émetteur croira un jour avoir posé autre chose que ce qui
 * l'a été.
 *
 * ⚠️ Un faux gateway de test, lui, doit garder sa **copie indépendante** : s'il
 * importait ces fonctions, un défaut s'y annulerait des deux côtés et aucun
 * test ne le verrait.
 *
 * Rien ne passe par `Number` : tout le calcul se fait sur les chiffres écrits,
 * en `BigInt`. Un `parseFloat` réintroduirait exactement l'erreur d'arrondi que
 * ces règles servent à éviter.
 * ============================================================================
 */

/** Marché visé : les deux n'ont pas le même plafond de décimales. */
export type HLMarketType = 'perp' | 'spot';

/**
 * Sens de l'arrondi. `truncate` va vers zéro — c'est ce que fait Hyperliquid,
 * et le seul sens autorisé pour une taille. `up` et `down` vont vers +∞ et
 * −∞, ce qui ne diffère de `truncate` que sur une valeur négative.
 */
export type RoundingMode = 'truncate' | 'up' | 'down' | 'nearest';

/** Levée plutôt que de rendre une valeur que l'exchange refuserait. */
export class TickAndLotError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TickAndLotError';
  }
}

/** `MAX_DECIMALS` de la documentation, par type de marché. */
export const MAX_PRICE_DECIMALS: Readonly<Record<HLMarketType, number>> = {
  perp: 6,
  spot: 8,
};

/** Le plafond de chiffres significatifs d'un prix non entier. */
export const MAX_PRICE_SIGNIFICANT_DIGITS = 5;

/** Un décimal simple, signe optionnel : `12`, `-0.5`, `.75`, `3.`. */
const PLAIN_DECIMAL = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/;

const EXPONENTIAL = /^([+-]?)(\d+)(?:\.(\d+))?[eE]([+-]?\d+)$/;

interface SplitDecimal {
  negative: boolean;
  int: string;
  frac: string;
}

/**
 * Réécrit une notation scientifique en décimal simple. `String(0.0000001)`
 * rend `'1e-7'`, que la documentation n'accepte pas et que nous refuserions
 * plus loin : autant l'écrire correctement ici.
 */
function expandExponential(text: string): string {
  const match = EXPONENTIAL.exec(text);
  if (!match) return text;

  const [, sign, int, frac = '', exponentText] = match;
  const digits = `${int}${frac}`;
  const pointIndex = int.length + Number(exponentText);

  if (pointIndex <= 0) {
    return `${sign}0.${'0'.repeat(-pointIndex)}${digits}`;
  }
  if (pointIndex >= digits.length) {
    return `${sign}${digits}${'0'.repeat(pointIndex - digits.length)}`;
  }

  return `${sign}${digits.slice(0, pointIndex)}.${digits.slice(pointIndex)}`;
}

/**
 * Rend le texte décimal d'une valeur.
 *
 * Un `number` est une valeur **calculée** : on l'écrit exactement, notation
 * scientifique dépliée. Une `string` est un texte qui vient déjà d'ailleurs —
 * d'un DTO, de l'API — et doit donc être un décimal simple : une notation
 * scientifique y signale qu'un flottant s'est glissé en amont, et la laisser
 * passer masquerait le défaut.
 */
function toDecimalText(value: string | number, field: string): string {
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      throw new TickAndLotError(`${field} is not finite: ${String(value)}`);
    }

    return expandExponential(String(value));
  }

  const text = String(value).trim();
  if (!PLAIN_DECIMAL.test(text)) {
    throw new TickAndLotError(`${field} is not a plain decimal string: ${JSON.stringify(value)}`);
  }

  return text;
}

function split(text: string): SplitDecimal {
  const negative = text.startsWith('-');
  const [int = '', frac = ''] = text.replace(/^[+-]/, '').split('.');

  return { negative, int: int || '0', frac };
}

/** Réécrit une valeur mise à l'échelle, sans zéro de queue ni `-0`. */
function formatUnits(negative: boolean, units: bigint, decimals: number): string {
  const digits = units.toString().padStart(decimals + 1, '0');
  const int = digits.slice(0, digits.length - decimals);
  const frac = decimals > 0 ? digits.slice(digits.length - decimals).replace(/0+$/, '') : '';
  const body = frac ? `${int}.${frac}` : int;

  return negative && units !== 0n ? `-${body}` : body;
}

function assertWholeCount(value: number, field: string): void {
  if (!Number.isInteger(value) || value < 0) {
    throw new TickAndLotError(`${field} must be a non-negative integer: ${String(value)}`);
  }
}

/**
 * L'exposant décimal de la valeur — `2` pour 345, `-3` pour 0,001234 — ou
 * `null` pour zéro, qui n'en a pas.
 */
function log10Floor(text: string): number | null {
  const { int, frac } = split(text);
  const significantInt = int.replace(/^0+/, '');
  if (significantInt) return significantInt.length - 1;

  const leadingZeros = /^0*/.exec(frac)?.[0].length ?? 0;
  if (leadingZeros === frac.length) return null;

  return -(leadingZeros + 1);
}

/**
 * Arrondit une valeur à `decimals` décimales, dans le sens demandé, sans
 * jamais passer par un flottant.
 */
export function roundDecimal(
  value: string | number,
  decimals: number,
  mode: RoundingMode = 'truncate',
): string {
  assertWholeCount(decimals, 'decimals');

  const { negative, int, frac } = split(toDecimalText(value, 'value'));
  const kept = frac.slice(0, decimals).padEnd(decimals, '0');
  const dropped = frac.slice(decimals);

  let units = BigInt(`${int}${kept}`);

  if (/[1-9]/.test(dropped)) {
    const awayFromZero =
      mode === 'nearest'
        ? dropped.charAt(0) >= '5'
        : mode === 'up'
          ? !negative
          : mode === 'down'
            ? negative
            : false;

    if (awayFromZero) units += 1n;
  }

  return formatUnits(negative, units, decimals);
}

/**
 * Le nombre de décimales que ce prix a le droit d'avoir — les deux règles
 * réunies en un seul nombre.
 *
 * Le plancher à zéro **est** l'exception des entiers : quand les chiffres
 * significatifs en réclameraient moins que zéro décimale (un prix au-delà de
 * 99 999), la documentation autorise malgré tout n'importe quel entier, donc
 * on s'arrête à l'entier plutôt que de raboter aussi les unités.
 */
export function priceDecimals(
  price: string | number,
  szDecimals: number,
  type: HLMarketType = 'perp',
): number {
  assertWholeCount(szDecimals, 'szDecimals');

  const byDecimals = Math.max(MAX_PRICE_DECIMALS[type] - szDecimals, 0);
  const magnitude = log10Floor(toDecimalText(price, 'price'));
  if (magnitude === null) return byDecimals;

  const bySignificantDigits = MAX_PRICE_SIGNIFICANT_DIGITS - 1 - magnitude;

  return Math.min(byDecimals, Math.max(bySignificantDigits, 0));
}

/**
 * Le prix, réécrit comme Hyperliquid l'accepte : tronqué à ce que
 * `priceDecimals` autorise.
 *
 * @throws {TickAndLotError} si la valeur est illisible, ou tronquée à zéro.
 */
export function formatPrice(
  price: string | number,
  szDecimals: number,
  type: HLMarketType = 'perp',
): string {
  const decimals = priceDecimals(price, szDecimals, type);
  const formatted = roundDecimal(price, decimals, 'truncate');

  if (formatted === '0') {
    throw new TickAndLotError('Price is too small and was truncated to 0');
  }

  return formatted;
}

/**
 * La taille, réécrite comme Hyperliquid l'accepte : **tronquée** à
 * `szDecimals`, jamais arrondie. Arrondir vers le haut, ce serait trader plus
 * que ce qui a été calculé — dépasser une position sur un ordre `reduceOnly`,
 * ou le collatéral sur une ouverture.
 *
 * @throws {TickAndLotError} si la valeur est illisible, ou tronquée à zéro.
 */
export function formatSize(size: string | number, szDecimals: number): string {
  assertWholeCount(szDecimals, 'szDecimals');

  const formatted = roundDecimal(size, szDecimals, 'truncate');

  if (formatted === '0') {
    throw new TickAndLotError('Size is too small and was truncated to 0');
  }

  return formatted;
}

/**
 * Pose un prix sur la grille de l'actif **dans un sens choisi**, et garantit
 * que le résultat en est un point fixe : `formatPrice(snapPrice(p)) === snapPrice(p)`.
 *
 * C'est ce que `formatPrice` seul ne sait pas faire — il tronque toujours.
 * Un émetteur qui veut qu'un stop ne s'éloigne jamais de son ancre a besoin du
 * sens opposé, et il a besoin que le formatage final ne défasse pas ce choix.
 *
 * @throws {TickAndLotError} si la valeur est illisible, ou ramenée à zéro.
 */
export function snapPrice(
  price: string | number,
  szDecimals: number,
  type: HLMarketType = 'perp',
  mode: RoundingMode = 'truncate',
): string {
  const snapped = roundDecimal(price, priceDecimals(price, szDecimals, type), mode);

  // Un arrondi vers l'extérieur peut franchir un palier — 9,9999 devient 10 —
  // et la grille change avec l'ordre de grandeur. On la recalcule une fois.
  const settled = roundDecimal(snapped, priceDecimals(snapped, szDecimals, type), mode);

  if (settled === '0') {
    throw new TickAndLotError('Price is too small and was snapped to 0');
  }

  if (formatPrice(settled, szDecimals, type) !== settled) {
    throw new TickAndLotError(
      `snapPrice produced ${settled}, which is not on the grid for szDecimals ${szDecimals}`,
    );
  }

  return settled;
}
