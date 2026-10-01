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
});
