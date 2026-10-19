import { hlMarketKind, hlPerpDexOf } from '../src/market/market-name';

/**
 * ============================================================================
 * UNE RÈGLE DE NOMMAGE QUI SERT DEUX MOTEURS
 *
 * Ce paquet est publié séparément : rien d'autre ne vérifie ce qui suit. Et la
 * règle est consommée par le mobile **et** par le bot, donc une erreur ici ne
 * se traduit pas par un affichage de travers mais par une divergence entre ce
 * que l'écran annonce et ce que le moteur exécute.
 *
 * Les cas ne sont pas inventés : ils viennent de la doc « Asset IDs » et du
 * relevé du 2026-09-30 sur le compte de développement (dex réels `vntl`,
 * `xyz`, `para`, `cash` ; paires spot `PURR/USDC` et `@107`).
 * ============================================================================
 */

describe('hlMarketKind', () => {
  it('reads a bare name as a perp of the main dex', () => {
    expect(hlMarketKind('BTC')).toBe('perp');
  });

  // La doc écrit « always » : un perp de builder porte toujours `{dex}:{coin}`.
  it('reads a prefixed name as a builder-deployed perp', () => {
    expect(hlMarketKind('vntl:ROBOT')).toBe('builderPerp');
  });

  it('reads a canonical spot pair by its slash', () => {
    expect(hlMarketKind('PURR/USDC')).toBe('spot');
  });

  // Le piège central : la forme protocolaire ne porte aucune des deux marques.
  it('reads a spot pair named by its protocol index', () => {
    expect(hlMarketKind('@107')).toBe('spot');
  });

  // Un nom peut porter les deux marques. C'est la paire qui prime : le marché
  // est spot, quelle que soit la ressemblance du préfixe avec un dex.
  it('lets the spot pair win over a dex-looking prefix', () => {
    expect(hlMarketKind('cash:XYZ/USDT')).toBe('spot');
  });

  it('designates no market with an empty name', () => {
    expect(hlMarketKind('')).toBeNull();
  });

  // Amputé d'une moitié, un nom de builder ne désigne rien. L'accepter serait
  // pire que le refuser : le dex vide est celui du dex **principal**.
  it('designates no market when the dex half is missing', () => {
    expect(hlMarketKind(':BTC')).toBeNull();
  });

  it('designates no market when the coin half is missing', () => {
    expect(hlMarketKind('vntl:')).toBeNull();
  });

  // Les perps réels du relevé du 2026-10-19 (544, 11 dex) : aucun ne porte de caractère hors
  // `A-Za-z0-9` et `:`. Les noms avec chiffres, minuscule initiale ou préfixe restent des perps.
  it.each([
    ['1000SHIB', 'perp'],
    ['kPEPE', 'perp'],
    ['AI16Z', 'perp'],
    ['xyz:XYZ100', 'builderPerp'],
  ])('keeps reading the real perp %s as %s', (name, kind) => {
    expect(hlMarketKind(name)).toBe(kind);
  });
});

/**
 * ============================================================================
 * LES OUTCOMES (HIP-4) NE SONT NI DES PERPS NI DES PAIRES SPOT
 *
 * Source : doc « Asset IDs », relue le 2026-10-19 : un outcome a un coin
 * `#<encodage>` et un jeton `+<encodage>`, avec `encodage = 10 × outcome + côté`
 * (côté 0 ou 1) ; exemple de la doc : outcome 1, côté 0 → `#10`, `+10`, et l'asset
 * id `100000010`. `outcomeMeta` en rend 329 sur le mainnet ce jour-là.
 *
 * Avant cette règle, `#10` et `+10` rendaient `perp` — « tout le reste est un perp
 * du dex principal » — et auraient été cherchés dans le mauvais univers.
 * ============================================================================
 */
describe('hlMarketKind — outcomes', () => {
  it.each([
    // L'exemple de la doc : outcome 1, côté 0.
    '#10',
    '+10',
    // outcome 1, côté 1.
    '#11',
    // Un outcome réel d'`outcomeMeta` (14200), côté 0 puis 1.
    '#142000',
    '#142001',
    '+142000',
    // Le `+1230` de l'exemple de solde de la doc « Spot ».
    '+1230',
    '#0',
  ])('reads %s as an outcome', (name) => {
    expect(hlMarketKind(name)).toBe('outcome');
  });

  it('never reads an outcome as a perp: that was the defect', () => {
    for (const name of ['#10', '+10', '#142000', '+1230']) {
      expect(hlMarketKind(name)).not.toBe('perp');
    }
  });

  // Strict : la forme documentée est `#` ou `+` puis un entier. Le reste n'est pas un outcome — et
  // n'est pas non plus un perp, car ces deux marques n'en désignent jamais : c'est un doute.
  it.each(['#', '+', '#1a', '+-3', '#1.5', '#10 ', '#10:x', '+0x1F', '##10'])(
    'designates no market for "%s": it carries an outcome mark without the documented form',
    (name) => {
      expect(hlMarketKind(name)).toBeNull();
    },
  );

  // La marque ne compte qu'en tête : ailleurs, `#` et `+` n'ont pas de sens particulier ici.
  it('does not take a mark in the middle of a name for an outcome', () => {
    expect(hlMarketKind('BTC#10')).toBe('perp');
    expect(hlMarketKind('xyz:#10')).toBe('builderPerp');
  });

  // La paire spot prime toujours : un nom qui porte `/` ou `@` reste spot.
  it('still lets the spot pair win when a name carries both marks', () => {
    expect(hlMarketKind('#10/USDC')).toBe('spot');
  });
});

describe('hlPerpDexOf', () => {
  // La chaîne vide n'est pas un défaut de valeur : c'est ce que l'API attend
  // pour le dex principal (« defaults to the empty string which represents the
  // first perp dex »).
  it('answers the empty string for a perp of the main dex', () => {
    expect(hlPerpDexOf('ETH')).toBe('');
  });

  it('answers the prefix for a builder-deployed perp', () => {
    expect(hlPerpDexOf('vntl:ROBOT')).toBe('vntl');
  });

  it('answers the prefix whatever the coin contains', () => {
    expect(hlPerpDexOf('xyz:XYZ100')).toBe('xyz');
  });

  // `null` veut dire « rien à charger », et se distingue de `''` qui veut dire
  // « charge le dex principal ». Confondre les deux ferait chercher une paire
  // spot dans l'univers perp.
  it('has no perp dex to offer for a spot pair', () => {
    expect(hlPerpDexOf('PURR/USDC')).toBeNull();
    expect(hlPerpDexOf('@107')).toBeNull();
  });

  it('has no perp dex to offer for a name that designates no market', () => {
    expect(hlPerpDexOf('')).toBeNull();
    expect(hlPerpDexOf(':BTC')).toBeNull();
    expect(hlPerpDexOf('vntl:')).toBeNull();
  });

  // Un outcome n'est pas un perp du dex principal : `''` voudrait dire « charge le dex principal ».
  it('has no perp dex to offer for an outcome, nor for a name that carries an outcome mark', () => {
    expect(hlPerpDexOf('#10')).toBeNull();
    expect(hlPerpDexOf('+1230')).toBeNull();
    expect(hlPerpDexOf('#1a')).toBeNull();
  });
});
