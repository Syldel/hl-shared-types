import type {
  HLPerpAssetPosition,
  HLPerpLeverage,
  HLPerpPositionDetail,
} from '../src/interfaces/perp/balance.interfaces';

/**
 * ============================================================================
 * CE QUE `clearinghouseState` REND VRAIMENT POUR UNE POSITION
 *
 * Les valeurs viennent des captures réelles du gateway du 2026-09-22
 * (`nest-trading-bot/captures/`, relues le 2026-10-04) : 22 instantanés, mais
 * **6 états distincts d'une seule paire** (`xyz:MU`, toujours en `cross`), dont
 * 3 sans prix de liquidation. Un échantillon étroit, et c'est dit ici parce
 * qu'il serait facile de lire « 22 » comme 22 observations indépendantes.
 *
 * La **forme de l'union**, elle, ne repose pas sur cet échantillon : elle est
 * celle du SDK Python officiel (`hyperliquid-python-sdk`,
 * `hyperliquid/utils/types.py`), qui déclare `CrossLeverage` sans `rawUsd` et
 * `IsolatedLeverage` avec. La branche isolée est recoupée par l'exemple de la
 * doc de `clearinghouseState` ; aucune position isolée n'a été observée ici.
 *
 * Comme pour `perp-meta.types.spec`, l'attendu de plusieurs de ces tests est un
 * **refus du compilateur** : c'est le seul comportement qu'un fichier de types
 * possède, et `@ts-expect-error` le rend mesurable.
 * ============================================================================
 */

/** `xyz:MU` long, levier 6 : sans prix de liquidation, comme les 3 longs relevés. */
const crossPosition: HLPerpPositionDetail = {
  coin: 'xyz:MU',
  szi: '0.024',
  entryPx: '1030.3',
  positionValue: '24.7272',
  unrealizedPnl: '0.0',
  returnOnEquity: '0.0',
  liquidationPx: null,
  marginUsed: '4.1212',
  maxLeverage: 10,
  leverage: { type: 'cross', value: 6 },
  cumFunding: { allTime: '0.0', sinceChange: '0.0', sinceOpen: '0.0' },
};

/** Le même marché en short : là, les 2 états relevés portent un prix. */
const withLiquidationPrice: HLPerpPositionDetail = {
  ...crossPosition,
  liquidationPx: '87690.1956107661',
};

describe('HLPerpLeverage', () => {
  // Le cœur du chantier : le SDK officiel déclare `CrossLeverage` sans
  // `rawUsd`, et tous les leviers relevés ici sont de cette forme. L'ancien
  // `rawUsd` obligatoire forçait le faux gateway à mentir.
  it('describes a cross leverage without a notional value', () => {
    const leverage: HLPerpLeverage = { type: 'cross', value: 6 };

    expect(leverage).not.toHaveProperty('rawUsd');
  });

  it('refuses a cross leverage carrying one anyway', () => {
    // @ts-expect-error — `rawUsd` n'appartient pas à la branche cross.
    const leverage: HLPerpLeverage = { type: 'cross', value: 6, rawUsd: '-95' };

    expect(leverage.type).toBe('cross');
  });

  /**
   * Pourquoi une union et non `rawUsd?: DecimalString` : l'optionnel aurait
   * laissé écrire ceci sans broncher, et `Number(undefined)` rend `NaN` —
   * silencieusement, sur un levier qui n'a jamais eu ce champ.
   */
  it('refuses to read the notional value before the mode has been checked', () => {
    const leverage: HLPerpLeverage = { type: 'cross', value: 6 };

    // @ts-expect-error — `rawUsd` n'existe que sur une branche de l'union.
    const notional = leverage.rawUsd;

    expect(notional).toBeUndefined();
  });

  it('lets the notional value be read once the mode is known', () => {
    const leverage: HLPerpLeverage = {
      type: 'isolated',
      value: 20,
      rawUsd: '-95.059824',
    };

    // Le rétrécissement par `type` est tout ce que l'union demande en échange.
    const notional = leverage.type === 'isolated' ? leverage.rawUsd : null;

    expect(notional).toBe('-95.059824');
  });

  // Déclarée par le SDK officiel et montrée par l'exemple de la doc ; jamais
  // observée ici, faute de position isolée sur le compte de développement.
  it('requires the notional value on an isolated leverage', () => {
    // @ts-expect-error — l'isolé sans `rawUsd` n'est pas une forme connue.
    const leverage: HLPerpLeverage = { type: 'isolated', value: 20 };

    expect(leverage.value).toBe(20);
  });
});

describe('HLPerpPositionDetail', () => {
  it('accepts a position without a reachable liquidation price', () => {
    expect(crossPosition.liquidationPx).toBeNull();
    expect(withLiquidationPrice.liquidationPx).toBe('87690.1956107661');
  });

  /**
   * Le défaut que ce champ portait : déclaré `DecimalString`, il faisait
   * rendre `0` à `Number(position.liquidationPx)` — et un prix de liquidation
   * à zéro est le plus rassurant des mensonges, puisqu'il paraît infiniment
   * loin du prix courant.
   */
  it('refuses to pass a null liquidation price off as a string', () => {
    // @ts-expect-error — nul sur 3 des 6 états relevés, soit 3 de trop pour un
    // type qui promettait une chaîne.
    const price: string = crossPosition.liquidationPx;

    expect(price).toBeNull();
  });

  // Les autres champs restent non-nullables : sur les états relevés,
  // `liquidationPx` est le seul à être jamais revenu nul. Les élargir « par
  // prudence » imposerait une garde à chaque usage pour un cas que rien
  // n'atteste — et l'échantillon est trop étroit pour en tirer autre chose.
  it('keeps every other field non-nullable, because none was ever null', () => {
    const entry: string = crossPosition.entryPx;
    const used: string = crossPosition.marginUsed;

    expect(entry).toBe('1030.3');
    expect(used).toBe('4.1212');
  });
});

describe('HLPerpAssetPosition', () => {
  // Nullable bien qu'aucun relevé ne soit nul : la doc nomme le cas, et un
  // lecteur du bot a déjà planté dessus faute de l'avoir gardé.
  it('still allows an entry without a position', () => {
    const empty: HLPerpAssetPosition = { position: null, type: 'oneWay' };

    expect(empty.position).toBeNull();
  });

  /**
   * Ce test dit deux choses d'un coup, et c'est voulu : le compilateur refuse
   * la ligne (`@ts-expect-error` tomberait sans ça), **et** la ligne lèverait
   * vraiment si on l'écrivait. C'est exactement l'incident du moteur, qui
   * déréférençait `p.position.coin` juste après une entrée remplie.
   */
  it('refuses to read a position without checking it is there', () => {
    const empty: HLPerpAssetPosition = { position: null, type: 'oneWay' };

    expect(() => {
      // @ts-expect-error — le refus du compilateur est la moitié de l'attendu.
      return empty.position.coin;
    }).toThrow(TypeError);
  });
});
