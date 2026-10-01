import type {
  HLPerpAssetCtx,
  HLPerpMarketExtended,
  HLPerpMarketInfo,
  HLPerpMetaAndCtx,
} from '../src/interfaces/perp/meta.interfaces';

/**
 * ============================================================================
 * DES TESTS DONT L'ATTENDU EST UN REFUS DU COMPILATEUR
 *
 * Ce paquet ne publie ici que des types : il n'a aucun comportement à exercer,
 * et pourtant c'est lui qui décide si `Number(ctx.midPx)` est écrivable sans
 * garde. L'invariant à figer n'est donc pas « la fonction rend X » mais « le
 * compilateur refuse Y » — ce qu'un `@ts-expect-error` exprime exactement : si
 * la ligne suivante venait à compiler, c'est le `@ts-expect-error` lui-même
 * qui devient une erreur, et la suite tombe.
 *
 * C'est le seul endroit où un test a le droit de porter sur la compilation.
 * Ailleurs, la règle du dépôt tient : une mutation qui ne compile pas n'est pas
 * une lacune. Ici, le refus **est** le comportement.
 *
 * Les valeurs ne sont pas inventées : relevé du 2026-10-01 sur les cinq dex
 * vivants (`''`, `xyz`, `para`, `mkts`, `io`), 434 entrées d'univers et 363
 * contextes d'actif.
 * ============================================================================
 */

/** `meta` du dex principal, entrée 0, recopiée telle quelle. */
const btc: HLPerpMarketInfo = {
  name: 'BTC',
  szDecimals: 5,
  maxLeverage: 40,
  marginTableId: 56,
};

/** `meta?dex=io`, entrée 0 : un HIP-3 vivant, avec ses quatre champs propres. */
const oai: HLPerpMarketInfo = {
  name: 'io:OAI',
  szDecimals: 3,
  maxLeverage: 6,
  marginTableId: 6,
  onlyIsolated: true,
  marginMode: 'noCross',
  growthMode: 'enabled',
  lastFeeScaleChangeTime: '2026-09-02T13:30:38.854252862',
  deployerFeeScale: '1.0',
};

/** `metaAndAssetCtxs` du dex principal, contexte de `MATIC` (délisté). */
const delistedCtx: HLPerpAssetCtx = {
  dayNtlVlm: '0.0',
  dayBaseVlm: '0.0',
  funding: '0.0',
  impactPxs: null,
  markPx: '0.2159',
  midPx: null,
  openInterest: '0.0',
  oraclePx: '0.2159',
  premium: null,
  prevDayPx: '0.2159',
};

const asMarket = (market: HLPerpMarketInfo): HLPerpMarketInfo => market;

describe('HLPerpMarketInfo', () => {
  it('requires the margin table every market carries', () => {
    // @ts-expect-error — 434/434 marchés le portent : l'omettre rend une forme que l'exchange ne rend jamais.
    asMarket({ name: 'BTC', szDecimals: 5, maxLeverage: 40 });

    expect(btc.marginTableId).toBe(56);
  });

  // Un marché vivant n'a pas la clé. Écrire `false` serait inventer une
  // troisième forme, et c'est ce qu'un double ne doit pas faire.
  it('refuses a delisting flag set to false', () => {
    // @ts-expect-error — `isDelisted` ne vaut jamais `false` : il est absent.
    asMarket({ ...btc, isDelisted: false });

    expect('isDelisted' in btc).toBe(false);
  });

  it('refuses an isolated-margin flag set to false', () => {
    // @ts-expect-error — même raison : 162/162 occurrences valent `true`.
    asMarket({ ...btc, onlyIsolated: false });

    expect(oai.onlyIsolated).toBe(true);
  });

  // Le champ nomme un mode, pas une présence : d'autres valeurs sont
  // plausibles même si `'enabled'` est la seule relevée. Contrairement aux
  // deux drapeaux ci-dessus, le type reste donc ouvert.
  it('leaves the HIP-3 growth mode open to values not yet observed', () => {
    expect(asMarket({ ...oai, growthMode: 'paused' }).growthMode).toBe('paused');
  });

  // Le nom dit `Time`, la valeur est une chaîne sans fuseau : la typer `number`
  // aurait invité un `Date.parse` qui décale selon la machine.
  it('keeps the fee-scale change date a string', () => {
    // @ts-expect-error — une date Hyperliquid n'est pas un horodatage.
    asMarket({ ...oai, lastFeeScaleChangeTime: 1756819838854 });

    expect(oai.lastFeeScaleChangeTime).toContain('.854252862');
  });
});

describe('HLPerpAssetCtx', () => {
  /**
   * Le cœur du chantier. Avant, `midPx` était déclaré `string` : cette ligne
   * compilait, et `Number(null)` rendait `0` — un prix, là où un marché mort
   * n'en a pas. Dans une comparaison `mid >= oracle`, `NaN` n'aurait tranché
   * ni dans un sens ni dans l'autre ; `0` tranche.
   */
  it('refuses to pass a null mid price off as a string', () => {
    // @ts-expect-error — 75/363 contextes rendent `null`, tous délistés.
    const price: string = delistedCtx.midPx;

    expect(price).toBeNull();
  });

  it('refuses the same for the premium and the impact prices', () => {
    // @ts-expect-error — mêmes 75 contextes.
    const premium: string = delistedCtx.premium;
    // @ts-expect-error — idem, et le tableau fait sinon toujours deux entrées.
    const impacts: string[] = delistedCtx.impactPxs;

    expect(premium).toBeNull();
    expect(impacts).toBeNull();
  });

  // `markPx` reste non-nullable : c'est le seul prix présent sur les 363
  // contextes relevés, délistés compris. Le déclarer nullable « par prudence »
  // forcerait une garde inutile à chaque usage.
  it('keeps the mark price non-nullable, because the exchange always sends it', () => {
    const mark: string = delistedCtx.markPx;

    expect(mark).toBe('0.2159');
  });

  it('declares the base volume that already crossed the wire', () => {
    // @ts-expect-error — 363/363 le portent ; un contexte sans lui est inventé.
    const ctx: HLPerpAssetCtx = { ...delistedCtx, dayBaseVlm: undefined };

    expect(ctx.dayBaseVlm).toBeUndefined();
  });
});

describe('HLPerpMetaAndCtx', () => {
  // Le tuple déclarait `{ universe }` seul : le collatéral du dex était sur le
  // fil et illisible, ce qui imposait un second appel à `meta`.
  it('exposes the whole meta, collateral token included', () => {
    const response: HLPerpMetaAndCtx = [
      { universe: [btc], marginTables: [], collateralToken: 0 },
      [delistedCtx],
    ];

    expect(response[0].collateralToken).toBe(0);
    expect(response[0].marginTables).toEqual([]);
  });
});

describe('HLPerpMarketExtended', () => {
  // La forme normalisée recopiait les champs de `HLPerpMarketInfo` à la main,
  // et avait déjà divergé. Elle en hérite maintenant : un champ ajouté par
  // l'exchange atteint les deux formes, ou aucune.
  it('inherits the HIP-3 fields instead of copying a subset', () => {
    const market: HLPerpMarketExtended = { ...oai, index: 0, markPrice: '31.2' };

    expect(market.deployerFeeScale).toBe('1.0');
    expect(market.growthMode).toBe('enabled');
  });

  // `null` et `undefined` ne racontent pas le même incident : l'un dit que
  // l'exchange n'a pas de prix milieu, l'autre que la ligne de contexte
  // manquait en face de l'entrée d'univers.
  it('lets a mid price be null without letting it be a bare string', () => {
    const market: HLPerpMarketExtended = { ...btc, index: 0, midPrice: null };
    // @ts-expect-error — le `null` doit être écarté avant tout calcul.
    const price: string | undefined = market.midPrice;

    expect(price).toBeNull();
  });
});
