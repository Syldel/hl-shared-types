import type {
  CollateralBalance,
  CollateralBalanceResponse,
} from '../src/interfaces/infos/collateral-balance.interfaces';

/**
 * ============================================================================
 * LE RÉSULTAT DU SERVICE ET LA RÉPONSE DE LA ROUTE
 *
 * `CollateralBalance` est ce que le service calcule, sans `asset`. La route y
 * ajoute `asset` (`{ asset, ...balance }`). La réponse `ok` vient de la capture
 * réelle du bot du 2026-10-18 (ETH, compte unifié, 24,73757982 USDC) : `asset`
 * en première clé. Les trois autres statuts ne sont pas mesurés : ils tiennent
 * de la lecture du contrôleur.
 *
 * Comme pour `perp-balance.types.spec`, plusieurs attendus sont un **refus du
 * compilateur** : c'est le seul comportement qu'un fichier de types possède.
 * ============================================================================
 */

const ok: CollateralBalance = {
  status: 'ok',
  mode: 'unifiedAccount',
  collateral: 'USDC',
  collateralToken: 0,
  total: '24.73757982',
  used: '0.0',
};

describe('CollateralBalance — what the service computes', () => {
  it('carries no `asset` on any status: the caller passed it', () => {
    const unknown: CollateralBalance = {
      status: 'unknown-collateral',
      mode: 'unifiedAccount',
      // @ts-expect-error — `asset` n'appartient plus au résultat du service.
      asset: 'NOPE',
    };
    const unsupported: CollateralBalance = {
      status: 'unsupported-mode',
      mode: 'portfolioMargin',
      // @ts-expect-error — idem pour le refus de mode.
      asset: 'ETH',
    };

    expect(unknown.status).toBe('unknown-collateral');
    expect(unsupported.status).toBe('unsupported-mode');
  });

  it('still tells the statuses apart, so a consumer cannot read a total off a missing entry', () => {
    const entry: CollateralBalance = {
      status: 'no-balance-entry',
      mode: 'unifiedAccount',
      collateral: 'USDC',
      collateralToken: 0,
    };

    if (entry.status === 'no-balance-entry') {
      // @ts-expect-error — pas de `total` sur ce statut : « probablement zéro » n'est pas un solde.
      expect(entry.total).toBeUndefined();
    }
  });
});

describe('CollateralBalanceResponse — what the route answers', () => {
  it('is the service result with `asset` in front, as the live capture showed', () => {
    const onTheWire: CollateralBalanceResponse = { asset: 'ETH', ...ok };

    expect(Object.keys(onTheWire)).toEqual([
      'asset',
      'status',
      'mode',
      'collateral',
      'collateralToken',
      'total',
      'used',
    ]);
  });

  it('refuses a route answer without `asset`, whatever its status', () => {
    // @ts-expect-error — `asset` manque sur un `ok`.
    const okWithout: CollateralBalanceResponse = ok;
    // @ts-expect-error — et sur un refus de mode.
    const unsupportedWithout: CollateralBalanceResponse = {
      status: 'unsupported-mode',
      mode: 'portfolioMargin',
    };

    expect(okWithout.status).toBe('ok');
    expect(unsupportedWithout.status).toBe('unsupported-mode');
  });

  it('is assignable to CollateralBalance, so a consumer that wants only the result can take it', () => {
    const response: CollateralBalanceResponse = {
      asset: 'NOPE',
      status: 'unknown-collateral',
      mode: 'unifiedAccount',
    };

    const result: CollateralBalance = response;

    expect(result.status).toBe('unknown-collateral');
  });

  it('keeps the statuses apart: no `total` on a `no-balance-entry` answer either', () => {
    const response: CollateralBalanceResponse = {
      asset: 'ETH',
      status: 'no-balance-entry',
      mode: 'unifiedAccount',
      collateral: 'USDC',
      collateralToken: 0,
    };

    if (response.status === 'no-balance-entry') {
      // @ts-expect-error — pas de `total` sur ce statut.
      expect(response.total).toBeUndefined();
    }
  });
});
