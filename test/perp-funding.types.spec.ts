import type {
  HLFundingHistoryEntry,
  HLFundingHistoryRequest,
} from '../src/interfaces/perp/funding.interfaces';

/**
 * ============================================================================
 * CE QUE `fundingHistory` REND VRAIMENT
 *
 * Les valeurs viennent de deux appels à `api.hyperliquid.xyz` le 2026-10-06,
 * sur six heures chacun : **BTC** (vivant) et **MATIC** (délisté). Six entrées
 * de part et d'autre, ce qui confirme la cadence horaire.
 *
 * Comme pour `perp-meta.types.spec`, l'attendu de plusieurs de ces tests est un
 * **refus du compilateur** : c'est le seul comportement qu'un fichier de types
 * possède, et `@ts-expect-error` le rend mesurable. Un `@ts-expect-error` qui
 * se met à compiler devient lui-même une erreur (TS2578), donc un relâchement
 * du type casse le build au lieu de passer inaperçu.
 *
 * ⚠️ `@ts-expect-error` ne couvre que la ligne **immédiatement suivante**. Pour
 * une propriété manquante, l'erreur s'ancre sur la déclaration et la directive
 * va au-dessus d'elle ; pour une valeur du mauvais type, elle s'ancre sur la
 * propriété au milieu du littéral, et la directive doit y descendre. Mis au
 * point en le ratant : TS2578 et l'erreur réelle étaient rapportées ensemble.
 * ============================================================================
 */

/** BTC, 2026-10-06 : le taux au plancher, une prime négative. Relevé tel quel. */
const liveEntry: HLFundingHistoryEntry = {
  coin: 'BTC',
  fundingRate: '0.0000125',
  premium: '-0.0001505982',
  time: 1791280800037,
};

/** MATIC, délisté : l'endpoint rend `"0.0"`, pas `null`, pas un tableau vide. */
const delistedEntry: HLFundingHistoryEntry = {
  coin: 'MATIC',
  fundingRate: '0.0',
  premium: '0.0',
  time: 1791280800037,
};

/**
 * `xyz:XYZ100`, HIP-3 vivant : le nom préfixé est accepté et rendu tel quel, et
 * le taux vaut le plancher **multiplié par le 0.5 du dex** — mesuré via
 * `perpDexs`. C'est ce qui rend un seuil absolu non transposable.
 */
const hip3Entry: HLFundingHistoryEntry = {
  coin: 'xyz:XYZ100',
  fundingRate: '0.00000625',
  premium: '0.000019168',
  time: 1791280800037,
};

describe('HLFundingHistoryEntry', () => {
  it('accepts a live market entry as measured', () => {
    expect(liveEntry.fundingRate).toBe('0.0000125');
    expect(Number(liveEntry.premium)).toBeLessThan(0);
  });

  // Le piège central : zéro n'est pas une absence, c'est une valeur rendue.
  it('accepts a delisted market entry, which reports zero rather than nothing', () => {
    expect(delistedEntry.fundingRate).toBe('0.0');
    expect(Number(delistedEntry.fundingRate)).toBe(0);
  });

  // Mesuré : le préfixe de dex traverse la requête et la réponse sans
  // transformation. Un nom de marché HIP-3 est donc utilisable tel quel.
  it('accepts a HIP-3 market, whose prefixed name comes back unchanged', () => {
    expect(hip3Entry.coin).toBe('xyz:XYZ100');
  });

  /**
   * Le piège qu'aucun type ne peut porter, donc qui est épinglé par un test.
   *
   * Ces deux entrées sont **indistinguables** dans cette réponse : l'une vient
   * d'un marché mort, l'autre d'un marché vivant dont le dex déclare un
   * multiplicateur nul (`flx`, `vntl`). Le zéro ne dit pas lequel — il faut
   * `isDelisted` et `assetToFundingMultiplier` pour trancher.
   */
  it('cannot tell a dead market from a live one with a zero multiplier', () => {
    const liveWithZeroMultiplier: HLFundingHistoryEntry = {
      coin: 'flx:COIN',
      fundingRate: '0.0',
      premium: '0.0',
      time: 1791280800037,
    };

    expect(liveWithZeroMultiplier.fundingRate).toBe(delistedEntry.fundingRate);
  });

  /**
   * Les quatre champs sont **requis**. Les déclarer optionnels inviterait un
   * consommateur à écrire un repli — or l'endpoint rend toujours les quatre,
   * y compris sur un marché mort. Un repli n'aurait donc aucun cas d'emploi,
   * et il masquerait une réponse malformée.
   */
  it('refuses an entry without a funding rate', () => {
    // @ts-expect-error `fundingRate` est requis : mesuré présent même à zéro.
    const missing: HLFundingHistoryEntry = {
      coin: 'BTC',
      premium: '0.0',
      time: 1791280800037,
    };

    expect(missing).toBeDefined();
  });

  // Trouvé par mutation : rien n'exigeait `coin`. L'endpoint le rend pourtant
  // toujours, et un consommateur qui lit plusieurs marchés en a besoin pour
  // savoir à qui appartient l'entrée.
  it('refuses an entry without a coin', () => {
    // @ts-expect-error `coin` est requis : l'entrée dirait sinon de quel
    // marché sans jamais le nommer.
    const missing: HLFundingHistoryEntry = {
      fundingRate: '0.0',
      premium: '0.0',
      time: 1791280800037,
    };

    expect(missing).toBeDefined();
  });

  it('refuses an entry without a premium', () => {
    // @ts-expect-error `premium` est requis, pour la même raison.
    const missing: HLFundingHistoryEntry = {
      coin: 'BTC',
      fundingRate: '0.0',
      time: 1791280800037,
    };

    expect(missing).toBeDefined();
  });

  /**
   * ⚠️ Ce test interdit une tentation précise : déclarer `fundingRate` ou
   * `premium` nullable « par prudence ». Ce ne serait pas de la prudence mais
   * une inexactitude — rien dans les deux relevés ne rend `null`, et un type
   * nullable obligerait chaque lecteur à traiter un cas qui n'existe pas, ce
   * qui finit en `?? 0` et ramène la valeur de repli par la porte de derrière.
   */
  it('refuses a null funding rate, which the endpoint never returns', () => {
    const nulled: HLFundingHistoryEntry = {
      coin: 'MATIC',
      // @ts-expect-error mesuré : un marché mort rend `"0.0"`, jamais `null`.
      fundingRate: null,
      premium: '0.0',
      time: 1791280800037,
    };

    expect(nulled).toBeDefined();
  });

  // `time` est un nombre de millisecondes, pas une chaîne décimale : c'est le
  // seul champ de cette réponse qui ne soit pas en chaîne.
  it('refuses a timestamp given as a string', () => {
    const stringly: HLFundingHistoryEntry = {
      coin: 'BTC',
      fundingRate: '0.0',
      premium: '0.0',
      // @ts-expect-error `time` est un `Timestamp`, donc un nombre.
      time: '1791280800037',
    };

    expect(stringly).toBeDefined();
  });
});

describe('HLFundingHistoryRequest', () => {
  it('accepts a request without an end time, which defaults to now', () => {
    const request: HLFundingHistoryRequest = {
      coin: 'BTC',
      startTime: 1791280800037,
    };

    expect(request.endTime).toBeUndefined();
  });

  // `startTime` est requis par l'API, et son absence est le genre d'oubli qui
  // se paie par un appel refusé plutôt que par une réponse vide.
  it('refuses a request without a start time', () => {
    // @ts-expect-error `startTime` est requis côté Hyperliquid.
    const missing: HLFundingHistoryRequest = { coin: 'BTC' };

    expect(missing).toBeDefined();
  });
});
