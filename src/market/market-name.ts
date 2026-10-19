/**
 * ============================================================================
 * LE NOM D'UN MARCHÉ DIT DE QUEL CATALOGUE IL RELÈVE
 *
 * Source : doc Hyperliquid « Asset IDs », relevée le 2026-09-30 et relue le
 * 2026-10-19 (avec les pages « Info endpoint », « Spot » et HIP-4, relues le
 * même jour) :
 *
 * - un perp déployé par un builder porte **toujours** un nom `{dex}:{coin}` —
 *   la doc écrit « always », ce n'est pas une heuristique ;
 * - une paire spot se désigne par `10000 + spotInfo.index`, d'où la forme
 *   protocolaire `@<index>` ; seules les canoniques portent `BASE/QUOTE`.
 *   L'exemple HYPE de la doc (token 150, spot 107) recoupe le relevé du
 *   2026-09-30 : le solde porte `token: 150`, la paire s'appelle `@107`. La
 *   page « Info endpoint » le dit : pour le spot, `coin` vaut `PURR/USDC` pour
 *   PURR et `@{index}` pour toutes les autres paires ;
 * - un **outcome** (HIP-4) porte un coin `#<encodage>` et un jeton
 *   `+<encodage>`, avec `encodage = 10 × outcome + côté` (côté 0 ou 1) et un
 *   identifiant d'actif `100 000 000 + encodage` — « Outcomes share most
 *   implementation details with spot trading », mais leur représentation par
 *   l'API diffère du spot comme des perps. Exemple de la doc : outcome 1, côté
 *   0 → `#10`, `+10`, `100000010`. La page HIP-4, elle, ne décrit aucun format
 *   de nom : c'est « Asset IDs » qui le fait ;
 * - tout le reste est un perp du dex principal, que l'API désigne par un `dex`
 *   vide.
 *
 * ⚠️ « Tout le reste est un perp » était **faux** pour les outcomes jusqu'au
 * 2026-10-19 : `#10` et `+10` rendaient `perp`. Ils existent sur le mainnet
 * (`outcomeMeta` en rend 329 ce jour-là, dont des contests sportifs et des
 * binaires sur prix), alors que la page HIP-4 ne décrit qu'un premier marché
 * quotidien : la doc est en retard sur le réseau. Un outcome est donc un genre
 * à part, que les consommateurs refusent ou traitent — jamais un perp par défaut.
 *
 * Mesuré le 2026-10-19 (`allPerpMetas` : 544 perps ; `spotMeta` : 334 paires,
 * 508 jetons) : aucun nom ne porte de caractère hors `A-Za-z0-9`, `:`, `/`, `@` ;
 * les noms de paires spot sont 1 `PURR/USDC` et 333 `@N`, aucun autre.
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
  | 'spot'
  /**
   * Marché outcome (HIP-4) : coin `#10` ou jeton `+10`, soit `#<encodage>` /
   * `+<encodage>` avec `encodage = 10 × outcome + côté`. Ni un perp, ni une paire
   * spot : son asset id est `100 000 000 + encodage`, et l'API le représente
   * autrement que les deux.
   */
  | 'outcome';

/** `#` (coin) ou `+` (jeton) en tête : la marque d'un outcome, jamais celle d'un perp. */
const OUTCOME_MARK = /^[#+]/;

/** La forme documentée : `#<encodage>` ou `+<encodage>`, l'encodage étant un entier. */
const OUTCOME_NAME = /^[#+]\d+$/;

/**
 * Le genre de marché que ce nom désigne, ou `null` quand le nom n'en désigne
 * aucun.
 */
export function hlMarketKind(name: string): HLMarketKind | null {
  if (!name) return null;

  // Le spot se teste en premier : un nom peut porter les deux marques
  // (`cash:XYZ/USDT`), et c'est alors la paire qui prime sur le dex.
  if (name.includes('/') || name.startsWith('@')) return 'spot';

  // Un outcome : `#` ou `+`, puis l'encodage — un entier, rien d'autre. Strict à
  // dessein : `#` seul, `#1a` ou `+-3` ne sont pas la forme documentée, et ne sont
  // donc **pas** reconnus comme outcome. Ils ne sont pas non plus des perps : ces
  // deux marques ne désignent jamais un perp, donc un nom qui les porte hors de la
  // forme documentée est un **doute** (`null`), pas « tout le reste ». Doit précéder
  // la règle « tout le reste est un perp ».
  if (OUTCOME_MARK.test(name)) return OUTCOME_NAME.test(name) ? 'outcome' : null;

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
