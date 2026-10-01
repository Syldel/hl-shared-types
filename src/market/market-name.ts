/**
 * ============================================================================
 * LE NOM D'UN MARCHÉ DIT DE QUEL CATALOGUE IL RELÈVE
 *
 * Source : doc Hyperliquid « Asset IDs », relevée le 2026-09-30.
 *
 * - un perp déployé par un builder porte **toujours** un nom `{dex}:{coin}` —
 *   la doc écrit « always », ce n'est pas une heuristique ;
 * - une paire spot se désigne par `10000 + spotInfo.index`, d'où la forme
 *   protocolaire `@<index>` ; seules les canoniques portent `BASE/QUOTE`.
 *   L'exemple HYPE de la doc (token 150, spot 107) recoupe le relevé du
 *   2026-09-30 : le solde porte `token: 150`, la paire s'appelle `@107` ;
 * - tout le reste est un perp du dex principal, que l'API désigne par un `dex`
 *   vide.
 *
 * Ce module vit ici, et non dans le bot ou le mobile, pour la même raison que
 * `tick-and-lot` : qu'il n'en existe **qu'une seule implémentation**. Les deux
 * doivent décider à l'identique de quel univers relève un marché — sans quoi
 * l'un signalerait comme morte une paire que l'autre continuerait de trader,
 * ou l'inverse. Une divergence silencieuse entre l'écran et le moteur est
 * exactement ce qu'on ne peut pas se permettre ici.
 *
 * L'incident qui l'a motivé, le 2026-09-30 : `vntl:ROBOT` était configurée sur
 * l'écran Bot Strategies, ratio et protections comprises, sur un dex dont les
 * 15 marchés sont délistés — et rien ne le disait. Le dex principal n'est pas
 * épargné : 56 de ses 234 marchés le sont aussi.
 *
 * ⚠️ Le piège est le spot. Sur 330 paires spot relevées, la grande majorité
 * s'appelle `@N` et ne porte **ni** barre oblique **ni** deux-points. Les
 * traiter par défaut comme des perps les ferait chercher — en vain — dans
 * l'univers du dex principal, et déclarer inexistant un marché vivant.
 * ============================================================================
 */

/** Ce qu'un nom de marché désigne, du point de vue du catalogue à consulter. */
export type HLMarketKind =
  /** Perp du dex principal : `BTC`, `ETH`. L'API le désigne par un `dex` vide. */
  | 'perp'
  /** Perp déployé par un builder (HIP-3) : `vntl:ROBOT`, `xyz:AAPL`. */
  | 'builderPerp'
  /** Paire spot : `PURR/USDC` (canonique) ou `@107` (forme protocolaire). */
  | 'spot';

/**
 * Le genre de marché que ce nom désigne, ou `null` quand le nom n'en désigne
 * aucun.
 */
export function hlMarketKind(name: string): HLMarketKind | null {
  if (!name) return null;

  // Le spot se teste en premier : un nom peut porter les deux marques
  // (`cash:XYZ/USDT`), et c'est alors la paire qui prime sur le dex.
  if (name.includes('/') || name.startsWith('@')) return 'spot';

  const separator = name.indexOf(':');
  if (separator === -1) return 'perp';

  // Un nom de builder doit porter ses deux moitiés. Les accepter amputées
  // serait pire que les refuser : `:BTC` rendrait un dex vide, donc le dex
  // **principal**, et ferait juger un marché contre un univers qui n'est pas
  // le sien.
  const dex = name.slice(0, separator);
  const coin = name.slice(separator + 1);

  return dex && coin ? 'builderPerp' : null;
}

/**
 * Le dex perp dont relève ce marché — `''` pour le dex principal, le préfixe
 * pour un HIP-3 —, ou `null` quand ce n'est pas un marché perp.
 *
 * C'est la valeur à passer à `meta({ dex })` : l'API accepte la chaîne vide
 * pour le dex principal, et `null` dit qu'il n'y a rien à charger.
 */
export function hlPerpDexOf(name: string): string | null {
  const kind = hlMarketKind(name);

  if (kind === 'perp') return '';
  if (kind === 'builderPerp') return name.slice(0, name.indexOf(':'));

  return null;
}
