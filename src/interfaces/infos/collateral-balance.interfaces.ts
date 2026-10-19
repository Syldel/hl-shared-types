import { DecimalString } from '../common';
import { AccountAbstractionMode } from './account-abstraction.type';

/**
 * ============================================================================
 * LE COLLATÉRAL D'UN MARCHÉ : TROIS RÉPONSES, PAS UN NOMBRE
 *
 * Ce que le **service** du gateway calcule pour un marché donné
 * (`getCollateralBalance(asset)`). La **route**
 * `GET /hyperliquid/info/collateral-balance` répond autre chose :
 * `CollateralBalanceResponse`, plus bas, qui y ajoute `asset`.
 *
 * Ce type vit ici parce qu'il **traverse** le réseau : le gateway le produit,
 * le bot le consomme. Une copie de chaque côté finirait par diverger, et la
 * divergence porterait sur un chiffre qui dimensionne des ordres.
 *
 * Aucun des quatre cas ne porte `asset` : l'appelant l'a passé en paramètre et
 * le connaît. Jusqu'au 2026-10-19 deux d'entre eux le rendaient, les deux autres
 * non, et la route l'ajoutait de toute façon : trois sources pour une valeur
 * que personne n'avait besoin de relire dans le résultat, et un faux gateway
 * qui l'avait omis faute d'un type de réponse à compiler contre.
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
    };

/**
 * Ce que la **route** `GET /hyperliquid/info/collateral-balance` répond : le
 * résultat du service, précédé de `asset`, le marché interrogé (`?asset=`).
 *
 * Le contrôleur du gateway fait `{ asset, ...balance }` quel que soit le
 * statut. Mesuré sur un `ok` le 2026-10-18 (quatre lectures de la capture réelle
 * du bot, ETH, compte unifié) : `asset` y est la première clé. Pour les trois
 * autres statuts, c'est une lecture du contrôleur, pas une mesure.
 *
 * Ce type est celui qu'un client HTTP et un double de la route (le faux gateway
 * du bot) doivent viser : un écart de forme avec la route devient une erreur de
 * compilation, et non une divergence découverte en réel. Un code qui n'a besoin
 * que du résultat garde `CollateralBalance`, dont celui-ci est un sous-type.
 *
 * `asset` est la valeur de `?asset=`, et le gateway refuse en 400 une requête où
 * il manque, est vide ou est répété : toute réponse 200 le porte donc, en chaîne
 * non vide. Ce refus date du 2026-10-19 ; avant lui, une requête sans `?asset=`
 * recevait une réponse sans cette clé (omise par JSON), et ce type était faux
 * pour elle. Éprouvé par les tests du contrôleur, pas contre un gateway qui
 * tourne.
 */
export type CollateralBalanceResponse = { asset: string } & CollateralBalance;
