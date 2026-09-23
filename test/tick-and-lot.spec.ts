import {
  formatPrice,
  formatSize,
  MAX_PRICE_DECIMALS,
  priceDecimals,
  roundDecimal,
  snapPrice,
  TickAndLotError,
} from '../src/format/tick-and-lot';

/**
 * ============================================================================
 * LA CONFORMITÉ SE PROUVE, ELLE NE SE SUPPOSE PAS
 *
 * Ce paquet porte de la logique exécutable sur le chemin de l'argent, et il est
 * publié séparément : rien d'autre ne le vérifie. Les cas ci-dessous ne sont pas
 * des cas choisis par nous — ce sont **tous les exemples de la documentation**
 * d'Hyperliquid, recopiés tels quels, plus ceux de l'implémentation tierce qui
 * nous sert d'oracle.
 *
 * Sources :
 * - https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/tick-and-lot-size
 *   relevée le 2026-09-23 ;
 * - nktkas/hyperliquid, `src/utils/_format.ts`, **lu** le 2026-09-23 (jamais
 *   installé : c'est un oracle, pas une dépendance — voir le bloc « oracle »
 *   plus bas).
 * ============================================================================
 */

describe('les exemples de la documentation Hyperliquid', () => {
  describe('prix perp', () => {
    it.each([
      // [prix, szDecimals, attendu, ce que dit la doc]
      ['1234.5', 0, '1234.5', 'valide'],
      ['1234.56', 0, '1234.5', 'refusé : 6 chiffres significatifs'],
      ['0.001234', 0, '0.001234', 'valide'],
      ['0.0012345', 0, '0.001234', 'refusé : plus de 6 décimales'],
      ['0.01234', 1, '0.01234', 'valide'],
      ['0.012345', 1, '0.01234', 'refusé : plus de 6 − 1 décimales'],
      ['123456', 0, '123456', 'un prix entier est toujours accepté'],
    ])('formatPrice(%s, szDecimals %i) = %s — %s', (price, szDecimals, expected) => {
      expect(formatPrice(price, szDecimals, 'perp')).toBe(expected);
    });
  });

  describe('prix spot', () => {
    it.each([
      ['0.0001234', 0, '0.0001234', 'valide : 7 ≤ 8 − 0 décimales'],
      ['0.0001234', 1, '0.0001234', 'valide : 7 ≤ 8 − 1 décimales'],
      ['0.0001234', 2, '0.000123', 'refusé : 7 > 8 − 2 décimales'],
      ['0.0001234', 3, '0.00012', 'refusé : 7 > 8 − 3 décimales'],
    ])('formatPrice(%s, szDecimals %i, spot) = %s — %s', (price, szDecimals, expected) => {
      expect(formatPrice(price, szDecimals, 'spot')).toBe(expected);
    });
  });

  describe('tailles', () => {
    it.each([
      ['1.001', 3, '1.001', 'valide quand szDecimals = 3'],
      ['1.0001', 3, '1', 'refusé quand szDecimals = 3, donc tronqué'],
    ])('formatSize(%s, szDecimals %i) = %s — %s', (size, szDecimals, expected) => {
      expect(formatSize(size, szDecimals)).toBe(expected);
    });
  });
});

describe("les exemples de l'oracle (nktkas/hyperliquid, lus le 2026-09-23)", () => {
  // Une implémentation tierce qu'on **lit** sans en dépendre : l'utiliser comme
  // oracle a trouvé chez nous, en dix minutes, le défaut de l'exemption des
  // entiers appliquée à l'écriture d'entrée plutôt qu'à la valeur.
  it.each([
    ['97123.456789', 0, 'perp', '97123'],
    ['1.23456789', 5, 'perp', '1.2'],
    ['0.0000123456789', 0, 'spot', '0.00001234'],
  ] as Array<[string, number, 'perp' | 'spot', string]>)(
    'formatPrice(%s, %i, %s) = %s',
    (price, szDecimals, type, expected) => {
      expect(formatPrice(price, szDecimals, type)).toBe(expected);
    },
  );

  it.each([
    ['1.23456789', 5, '1.23456'],
    ['0.123456789', 2, '0.12'],
    ['100', 0, '100'],
  ])('formatSize(%s, %i) = %s', (size, szDecimals, expected) => {
    expect(formatSize(size, szDecimals)).toBe(expected);
  });

  it('never eats the zeros of a whole number', () => {
    // Le défaut mesuré le 2026-09-22 dans le bot : un `replace(/\.?0+$/, '')`
    // appliqué à une valeur sans point décimal rongeait l'entier lui-même, et
    // un stop de 85 990 partait à 8 599.
    expect(formatSize('100', 0)).toBe('100');
    expect(formatSize('10', 0)).toBe('10');
    expect(formatPrice('85990', 2)).toBe('85990');
    expect(formatPrice('1200', 2)).toBe('1200');
    expect(formatPrice('1000000', 0)).toBe('1000000');
  });

  describe('⚠️ un écart assumé avec les deux implémentations existantes', () => {
    // Au-delà de 99 999 avec une partie fractionnaire, l'oracle et l'ancien
    // gateway appliquent les 5 chiffres significatifs **avant** de constater
    // que le résultat tronqué est entier : 123456.7 y devient 123450.
    //
    // La documentation dit « Integer prices are always allowed, regardless of
    // the number of significant figures » : 123456 est donc un prix valide, et
    // c'est le plus proche de la cible. On perd 6 $ de moins.
    //
    // ⚠️ Non vérifié sur le vrai exchange (cela demande de passer un ordre) :
    // à confirmer lors d'un prochain test en conditions réelles. Le mode
    // d'échec serait bruyant — un ordre refusé, pas un ordre posé de travers.
    it.each([
      ['123456.7', 2, '123456'],
      ['123456.0', 2, '123456'],
      ['1234567.8', 2, '1234567'],
      ['999999.9', 0, '999999'],
    ])(
      'formatPrice(%s, %i) = %s, where both references give a rounder number',
      (price, szDecimals, expected) => {
        expect(formatPrice(price, szDecimals)).toBe(expected);
      },
    );

    it('formats the same value the same way, however it is written', () => {
      // C'est le vrai défaut que l'écart corrige : l'ancien gateway rendait
      // 123456 pour '123456' et 123450 pour '123456.0'.
      expect(formatPrice('123456.0', 2)).toBe(formatPrice('123456', 2));
      expect(formatPrice('1103.0', 2)).toBe(formatPrice('1103', 2));
    });
  });
});

describe('une taille se tronque, jamais ne s’arrondit', () => {
  // Arrondir vers le haut, ce serait trader **plus** que ce qui a été calculé :
  // dépasser une position sur un ordre `reduceOnly`, ou le collatéral sur une
  // ouverture. Freqtrade tronque aussi, sans option (`amount_to_precision`
  // passe `TRUNCATE` en dur). Ces cas sont ceux où les deux diffèrent.
  it.each([
    ['1.23456789', 5, '1.23456', '1.23457'],
    ['1.9999', 0, '1', '2'],
    ['0.999', 0, null, '1'],
    ['1.0009', 3, '1', '1.001'],
    ['0.0006', 3, null, '0.001'],
    ['9.87', 1, '9.8', '9.9'],
  ] as Array<[string, number, string | null, string]>)(
    'formatSize(%s, %i) = %s, never %s',
    (size, szDecimals, truncated, ifItRounded) => {
      if (truncated === null) {
        // Une valeur trop petite pour la grille se refuse ; l'arrondir
        // inventerait une taille que personne n'a demandée.
        expect(() => formatSize(size, szDecimals)).toThrow(TickAndLotError);
      } else {
        expect(formatSize(size, szDecimals)).toBe(truncated);
      }

      expect(roundDecimal(size, szDecimals, 'nearest')).toBe(ifItRounded);
    },
  );

  it('never returns more than it was given', () => {
    for (const size of ['1.9999', '0.123456789', '1.0009', '9.87']) {
      for (const szDecimals of [0, 1, 2, 3]) {
        let formatted: string;
        try {
          formatted = formatSize(size, szDecimals);
        } catch {
          continue;
        }

        expect(Number(formatted)).toBeLessThanOrEqual(Number(size));
      }
    }
  });
});

describe('priceDecimals — les deux règles réunies en un nombre', () => {
  it.each([
    // [prix, szDecimals, type, décimales autorisées]
    ['1234.5', 0, 'perp', 1],
    ['0.001234', 0, 'perp', 6],
    ['0.01234', 1, 'perp', 5],
    ['97123.456789', 0, 'perp', 0],
    ['1.23456789', 5, 'perp', 1],
    ['0.0000123456789', 0, 'spot', 8],
    ['0.0000123456789', 2, 'spot', 6],
    ['123456.7', 2, 'perp', 0],
    ['86000', 2, 'perp', 0],
  ] as Array<[string, number, 'perp' | 'spot', number]>)(
    'priceDecimals(%s, %i, %s) = %i',
    (price, szDecimals, type, expected) => {
      expect(priceDecimals(price, szDecimals, type)).toBe(expected);
    },
  );

  it('never allows more decimals than the asset itself does', () => {
    for (const type of ['perp', 'spot'] as const) {
      for (let szDecimals = 0; szDecimals <= MAX_PRICE_DECIMALS[type]; szDecimals++) {
        for (const price of ['0.00004321', '4.321', '432.1', '43210', '4321000.5']) {
          expect(priceDecimals(price, szDecimals, type)).toBeLessThanOrEqual(
            Math.max(MAX_PRICE_DECIMALS[type] - szDecimals, 0),
          );
        }
      }
    }
  });
});

describe("l'invariant du point fixe", () => {
  // Ce que le gateway pose doit être **exactement** ce que l'émetteur a envoyé.
  // Si formater une valeur déjà formatée la change, l'émetteur ne sait pas ce
  // qu'il a posé — et son prochain contrôle de cohérence réclamera indéfiniment
  // un prix que le placement ne pose jamais.
  const prices = [
    '1234.56',
    '0.0012345',
    '0.012345',
    '97123.456789',
    '1.23456789',
    '123456.7',
    '85990',
    '0.0000123456789',
    '9.99999',
    '99999.5',
  ];

  /**
   * Applique `format` et rend son resultat, ou `null` si la valeur n'est pas
   * representable sur cette grille — auquel cas le refus doit etre typé, ce
   * que ce helper verifie au passage.
   */
  function formattedOrRefused(format: () => string): string | null {
    try {
      return format();
    } catch (error) {
      expect(error).toBeInstanceOf(TickAndLotError);
      return null;
    }
  }

  it.each(prices)('formatPrice is idempotent on %s', (price) => {
    let posed = 0;

    for (const type of ['perp', 'spot'] as const) {
      for (const szDecimals of [0, 1, 2, 3, 5]) {
        const once = formattedOrRefused(() => formatPrice(price, szDecimals, type));
        if (once === null) continue;

        posed++;
        expect(formatPrice(once, szDecimals, type)).toBe(once);
      }
    }

    expect(posed).toBeGreaterThan(0);
  });

  it.each(['1.23456789', '0.123456789', '100', '1.0001'])(
    'formatSize is idempotent on %s',
    (size) => {
      let posed = 0;

      for (const szDecimals of [0, 2, 3, 5]) {
        const once = formattedOrRefused(() => formatSize(size, szDecimals));
        if (once === null) continue;

        posed++;
        expect(formatSize(once, szDecimals)).toBe(once);
      }

      expect(posed).toBeGreaterThan(0);
    },
  );

  it.each(prices)('every snapPrice result is already on the grid: %s', (price) => {
    let posed = 0;

    for (const mode of ['truncate', 'up', 'down', 'nearest'] as const) {
      for (const szDecimals of [0, 1, 2, 5]) {
        // Un prix peut n'etre representable sur aucune grille de cet actif :
        // 0,0000123 avec szDecimals 5 ne laisse qu'une decimale. Refuser est
        // alors la bonne reponse.
        const snapped = formattedOrRefused(() => snapPrice(price, szDecimals, 'perp', mode));
        if (snapped === null) continue;

        posed++;
        expect(formatPrice(snapped, szDecimals, 'perp')).toBe(snapped);
      }
    }

    // Le test ne doit pas etre vide de sens : au moins une grille doit poser.
    expect(posed).toBeGreaterThan(0);
  });
});

describe('snapPrice — poser un prix dans un sens choisi', () => {
  it('rounds a long stop up and a short stop down, so it never sits further away', () => {
    // La règle arrêtée le 2026-09-23 : la distance à l'ancre n'est jamais
    // étendue par l'arrondi, seulement raccourcie. Sur 12,34567 à 3 décimales
    // autorisées, le bas vaut 12,345 et le haut 12,346.
    expect(priceDecimals('12.34567', 1)).toBe(3);
    expect(snapPrice('12.34567', 1, 'perp', 'down')).toBe('12.345');
    expect(snapPrice('12.34567', 1, 'perp', 'up')).toBe('12.346');
    expect(snapPrice('12.34567', 1, 'perp', 'nearest')).toBe('12.346');
    expect(snapPrice('12.34527', 1, 'perp', 'nearest')).toBe('12.345');
  });

  it('stays on the grid when rounding up crosses into a coarser one', () => {
    // 9,999996 à 4 décimales devient 10, dont la grille n'a plus que
    // 3 décimales : le résultat doit rester valide.
    const snapped = snapPrice('9.999996', 0, 'perp', 'up');

    expect(snapped).toBe('10');
    expect(formatPrice(snapped, 0, 'perp')).toBe('10');
  });

  it('leaves a value already on the grid untouched, whatever the direction', () => {
    for (const mode of ['truncate', 'up', 'down', 'nearest'] as const) {
      expect(snapPrice('1234.5', 0, 'perp', mode)).toBe('1234.5');
      expect(snapPrice('85990', 2, 'perp', mode)).toBe('85990');
    }
  });
});

describe('roundDecimal — les quatre sens', () => {
  it.each([
    // [valeur, décimales, truncate, up, down, nearest]
    // `nearest` ecarte la demi-valeur de zero : 1,2345 a 3 decimales donne
    // 1,235, et -1,2345 donne -1,235.
    ['1.2345', 3, '1.234', '1.235', '1.234', '1.235'],
    ['1.2355', 3, '1.235', '1.236', '1.235', '1.236'],
    ['1.2344', 3, '1.234', '1.235', '1.234', '1.234'],
    ['-1.2345', 3, '-1.234', '-1.234', '-1.235', '-1.235'],
    ['-1.2355', 3, '-1.235', '-1.235', '-1.236', '-1.236'],
    ['-1.2344', 3, '-1.234', '-1.234', '-1.235', '-1.234'],
  ])('%s at %i decimals', (value, decimals, truncate, up, down, nearest) => {
    expect(roundDecimal(value, decimals, 'truncate')).toBe(truncate);
    expect(roundDecimal(value, decimals, 'up')).toBe(up);
    expect(roundDecimal(value, decimals, 'down')).toBe(down);
    expect(roundDecimal(value, decimals, 'nearest')).toBe(nearest);
  });

  it('truncates toward zero, which is what Hyperliquid does', () => {
    expect(roundDecimal('1.9999', 0)).toBe('1');
    expect(roundDecimal('-1.9999', 0)).toBe('-1');
  });

  it('never returns a signed zero', () => {
    expect(roundDecimal('-0.0004', 3)).toBe('0');
    expect(roundDecimal('-0', 2)).toBe('0');
  });

  it('carries across the decimal point', () => {
    expect(roundDecimal('9.9999', 3, 'up')).toBe('10');
    expect(roundDecimal('0.9996', 3, 'up')).toBe('1');
  });
});

describe('ce qui est refusé plutôt que deviné', () => {
  it('expands a number written in scientific notation instead of rejecting it', () => {
    // Une valeur **calculée** arrive en `number` : `String(0.0000001)` rend
    // `'1e-7'`, que la documentation n'accepte pas. On l'écrit correctement.
    expect(formatSize(0.0000001, 7)).toBe('0.0000001');
    expect(formatSize(1e-7, 7)).toBe('0.0000001');
    expect(roundDecimal(1.5e3, 0)).toBe('1500');
    expect(roundDecimal(1.23e-7, 9)).toBe('0.000000123');
  });

  it('refuses a scientific notation that arrives as text', () => {
    // Un **texte** vient d'un DTO ou de l'API : une notation scientifique y
    // signale qu'un flottant s'est glissé en amont, et la laisser passer
    // masquerait le défaut.
    expect(() => formatSize('1e-7', 7)).toThrow(TickAndLotError);
    expect(() => formatPrice('1E3', 0)).toThrow(TickAndLotError);
  });

  it.each(['', '   ', 'abc', 'NaN', 'Infinity', '1.2.3', '.', '1,5'])('refuses %s', (value) => {
    expect(() => formatPrice(value, 0)).toThrow(TickAndLotError);
    expect(() => formatSize(value, 0)).toThrow(TickAndLotError);
  });

  it.each([NaN, Infinity, -Infinity])('refuses the non-finite number %s', (value) => {
    expect(() => formatPrice(value, 0)).toThrow(TickAndLotError);
    expect(() => formatSize(value, 0)).toThrow(TickAndLotError);
  });

  it('refuses a value truncated to zero rather than send nothing', () => {
    expect(() => formatSize('0.004', 2)).toThrow('Size is too small');
    expect(() => formatPrice('0', 2)).toThrow('Price is too small');
  });

  it('refuses a nonsensical szDecimals', () => {
    expect(() => formatSize('1', -1)).toThrow(TickAndLotError);
    expect(() => formatSize('1', 1.5)).toThrow(TickAndLotError);
  });

  it('names the offending value, so a failure is diagnosable without a replay', () => {
    expect(() => formatPrice('oops', 0)).toThrow('price is not a plain decimal string: "oops"');
  });
});
