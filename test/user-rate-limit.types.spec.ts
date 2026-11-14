import type { HlUserRateLimit, HlUserRateLimitRequest } from '../src';

/**
 * ============================================================================
 * LE COMPTEUR DE LA LIMITE PAR ADRESSE, TEL QU'IL ARRIVE
 *
 * La réponse est la vraie, capturée par le bot le 2026-11-14 (compte de développement,
 * `account-state.ts`) : `cumVlm` en chaîne, les trois compteurs en nombres. Un
 * attendu est un **refus du compilateur** : c'est le seul comportement qu'un
 * fichier de types possède.
 * ============================================================================
 */

const measured: HlUserRateLimit = {
  cumVlm: '51638.93',
  nRequestsUsed: 2288,
  nRequestsCap: 61638,
  nRequestsSurplus: 0,
};

describe('HlUserRateLimit — the reply measured on 2026-11-14', () => {
  it('describes the measured reply, exported from the package root', () => {
    expect(measured.nRequestsCap - measured.nRequestsUsed).toBe(59350);
  });

  // Le plafond comprend la réserve initiale : 10 000 + le volume arrondi.
  it('carries a cap that is the initial reserve plus the volume', () => {
    expect(measured.nRequestsCap).toBe(10000 + Math.floor(Number(measured.cumVlm)));
  });

  it('refuses a volume given as a number, as the exchange never sends it', () => {
    const wrong: HlUserRateLimit = {
      // @ts-expect-error — `cumVlm` est une chaîne décimale.
      cumVlm: 51638.93,
      nRequestsUsed: 2288,
      nRequestsCap: 61638,
      nRequestsSurplus: 0,
    };
    expect(wrong).toBeDefined();
  });

  it('asks for the counter of one address', () => {
    const request: HlUserRateLimitRequest = {
      type: 'userRateLimit',
      user: '0x0000000000000000000000000000000000000001',
    };
    expect(request.type).toBe('userRateLimit');
  });
});
