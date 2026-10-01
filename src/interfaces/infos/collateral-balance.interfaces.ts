import { DecimalString } from '../common';
import { AccountAbstractionMode } from './account-abstraction.type';

/**
 * ============================================================================
 * LE COLLATÉRAL D'UN MARCHÉ : TROIS RÉPONSES, PAS UN NOMBRE
 *
 * Réponse de `GET /hyperliquid/info/collateral-balance` du gateway.
 *
 * Ce type vit ici parce qu'il **traverse** le réseau : le gateway le produit,
 * le bot le consomme. Une copie de chaque côté finirait par diverger, et la
 * divergence porterait sur un chiffre qui dimensionne des ordres.
 *
 * Trois cas, parce que leurs remèdes sont trois : approvisionner le compte,
 * corriger le nom du marché, ou attendre que le registre soit synchronisé.
 * Jusqu'au 2026-10-01 les trois rendaient `'0'`, donc aucun n'était
 * distinguable d'un compte vide — et `'0'` sur un calcul de taille fait
 * dimensionner un ordre sur un capital qui n'a jamais été lu.
 * ============================================================================
 */
export type CollateralBalance =
  /** Le solde a été lu. `total` et `used` sont ceux du collatéral nommé. */
  | {
      status: 'ok';
      /** Le mode qui a décidé d'où le solde a été lu — spot, ou état perp du dex. */
      mode: AccountAbstractionMode;
      /** Symbole du collatéral, pour l'affichage et les journaux. */
      collateral: string;
      /**
       * Index du token, qui fait autorité pour apparier un solde.
       * `null` quand l'appelant a imposé un symbole plutôt qu'un index.
       */
      collateralToken: number | null;
      total: DecimalString;
      used: DecimalString;
    }
  /**
   * Le collatéral est identifié, mais le compte ne porte aucune ligne pour lui.
   *
   * ⚠️ Ce n'est **pas** la même chose qu'un solde nul. Hyperliquid n'énumère
   * que les actifs que le compte a touchés : une absence vaut probablement
   * zéro, mais « probablement » ne se présente pas comme un solde.
   */
  | {
      status: 'no-balance-entry';
      mode: AccountAbstractionMode;
      collateral: string;
      collateralToken: number | null;
    }
  /**
   * Le catalogue ne dit pas dans quoi ce marché se règle — nom inconnu, ou
   * registre pas encore synchronisé.
   *
   * Aucune valeur de repli n'est fournie, et c'est le point : la table en dur
   * que ce contrat remplace répondait « USDC » à cette question.
   */
  | {
      status: 'unknown-collateral';
      mode: AccountAbstractionMode;
      asset: string;
    }
  /**
   * Le compte est dans un mode dont ce gateway ne sait pas lire le collatéral.
   *
   * Deux cas, et c'est un refus **délibéré** plutôt qu'une approximation :
   *
   * - **`portfolioMargin`** réunit plusieurs actifs en un seul portefeuille
   *   (HYPE, BTC, USDC, USDT à ce jour). Rendre le solde d'un seul d'entre eux
   *   sous-estimerait le capital, et les agréger demanderait de valoriser HYPE
   *   et BTC en dollars — donc d'introduire une source de **prix** dans un
   *   calcul de collatéral. C'est un chantier, pas une ligne ;
   * - **`dexAbstraction`** est arrêté par l'exchange. La doc le décrit (USDC
   *   depuis le solde perp, tout autre collatéral depuis le spot), mais aucun
   *   compte ne permet de l'éprouver — et une implémentation non exercée d'un
   *   mode qu'on ne peut pas tester vaut moins qu'un refus net.
   *
   * L'appelant doit le traiter comme les autres statuts sans montant : ne rien
   * dimensionner, et le dire. Un nombre plausible aurait traversé tout le
   * système sans rien déclencher.
   */
  | {
      status: 'unsupported-mode';
      mode: AccountAbstractionMode;
      asset: string;
    };
