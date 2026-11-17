import {
  parseTrailingStopCondition,
  TrailingStopConditionError,
} from '../src/orders/trailing-stop-condition';
import { HL_ORDER_TYPE, isKnownOrderType } from '../src/orders/order-type';

/**
 * ============================================================================
 * UN ÉTAT D'ORDRE LU DANS UN TEXTE LIBRE
 *
 * Les trois premiers cas sont les textes exacts rendus par `frontendOpenOrders`
 * sur le compte de développement le 2026-11-16 (voir
 * `nest-trading-bot/docs/hyperliquid/live-check.md`). Le cas `below` n'est pas
 * mesuré : il vient des expressions régulières du client officiel. Les refus
 * disent ce qu'un lecteur strict doit faire d'un texte qui a changé : lever,
 * jamais rendre un état partiel.
 * ============================================================================
 */

describe('parseTrailingStopCondition', () => {
  it('reads an immediate trailing stop with a percent retracement (measured)', () => {
    expect(
      parseTrailingStopCondition('Activation immediate, retracement 10%, best 1828.3'),
    ).toEqual({
      activation: { kind: 'immediate' },
      retracement: { kind: 'pct', pct: '10' },
      best: '1828.3',
    });
  });

  // Tant que le prix d'activation n'est pas passé, il n'y a pas de meilleur prix.
  it('reads a waiting trailing stop as having no best price yet (measured)', () => {
    expect(
      parseTrailingStopCondition('Activation above 2100, retracement 1%, best waiting'),
    ).toEqual({
      activation: { kind: 'above', px: '2100' },
      retracement: { kind: 'pct', pct: '1' },
      best: null,
    });
  });

  // Le piège : un repli en prix s'écrit nu. Le lire comme un pourcentage
  // placerait le stop à 275 % du watermark au lieu de 275 $ en dessous.
  it('reads a bare retracement as a price distance, not a percent (measured)', () => {
    expect(
      parseTrailingStopCondition('Activation immediate, retracement 275, best 1832.9'),
    ).toEqual({
      activation: { kind: 'immediate' },
      retracement: { kind: 'px', px: '275' },
      best: '1832.9',
    });
  });

  it('reads a below activation, the form the official client expects for a buy (unmeasured)', () => {
    expect(
      parseTrailingStopCondition('Activation below 1500.5, retracement 2.5%, best waiting'),
    ).toEqual({
      activation: { kind: 'below', px: '1500.5' },
      retracement: { kind: 'pct', pct: '2.5' },
      best: null,
    });
  });

  it('keeps the decimals exactly as the exchange wrote them', () => {
    const condition = parseTrailingStopCondition(
      'Activation above 0.000123, retracement 0.05%, best 0.0001250',
    );
    expect(condition.activation).toEqual({ kind: 'above', px: '0.000123' });
    expect(condition.retracement).toEqual({ kind: 'pct', pct: '0.05' });
    expect(condition.best).toBe('0.0001250');
  });

  describe('refuses a text it does not recognise', () => {
    it.each([
      ['an empty text', ''],
      ['the condition of an ordinary stop', 'Price below 1800'],
      ['another casing', 'activation immediate, retracement 10%, best 1828.3'],
      ['a missing best', 'Activation immediate, retracement 10%'],
      ['an unknown activation word', 'Activation pending, retracement 10%, best waiting'],
      ['an activation without its price', 'Activation above, retracement 1%, best waiting'],
      ['an unknown retracement unit', 'Activation immediate, retracement 10bp, best 1828.3'],
      ['a negative number', 'Activation immediate, retracement -10%, best 1828.3'],
      ['an exponent', 'Activation immediate, retracement 10%, best 1.8e3'],
      ['a thousands separator', 'Activation immediate, retracement 10%, best 1,828.3'],
      ['trailing text', 'Activation immediate, retracement 10%, best 1828.3, extra'],
      ['a missing separator space', 'Activation immediate,retracement 10%, best 1828.3'],
    ])('%s', (_label, text) => {
      expect(() => parseTrailingStopCondition(text)).toThrow(TrailingStopConditionError);
    });

    // Un repli nul déclencherait au premier tick : ce n'est pas un état qu'un
    // ordre accepté peut avoir, donc c'est un texte mal lu.
    it.each(['0%', '0', '0.000'])('a zero retracement (%s)', (amount) => {
      expect(() =>
        parseTrailingStopCondition(`Activation immediate, retracement ${amount}, best 1828.3`),
      ).toThrow(TrailingStopConditionError);
    });

    it('names the text it could not read', () => {
      expect(() => parseTrailingStopCondition('Price below 1800')).toThrow('"Price below 1800"');
    });
  });
});

describe('isKnownOrderType', () => {
  it.each(Object.values(HL_ORDER_TYPE))('knows %s', (label) => {
    expect(isKnownOrderType(label)).toBe(true);
  });

  // La règle qui a motivé cette liste : comparer à l'exact, jamais par morceau.
  it.each([
    ['a fragment of a known label', 'Stop'],
    ['another casing', 'trailing stop market'],
    ['the display name of the official client', 'Trailing Stop'],
    ['an empty text', ''],
  ])('does not know %s', (_label, orderType) => {
    expect(isKnownOrderType(orderType)).toBe(false);
  });
});
