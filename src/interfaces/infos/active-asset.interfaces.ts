import { DecimalString, HexString } from '../common';

/** Request payload pour récupérer les données d'un actif actif */
export interface HlActiveAssetDataRequest {
  /** Type de l'action, doit être 'activeAssetData' */
  type: 'activeAssetData';
  /** Adresse publique de l'utilisateur (format hexadécimal) */
  user: HexString;
  /** Symbole de l'actif (ex: "ETH" ou "xyz:XYZ100") */
  coin: string;
}

/** Configuration du levier appliqué à l'actif */
export interface HlActiveAssetLeverage {
  /** Mode de marge utilisé ('cross' ou 'isolated') */
  type: 'cross' | 'isolated';
  /** Valeur multiplicatrice du levier */
  value: number;
  /** Marge actuelle en USD (uniquement en mode 'isolated') */
  rawUsd?: DecimalString;
}

/** Données de l'actif actif renvoyées par Hyperliquid */
export interface HlActiveAssetData {
  /** Adresse publique de l'utilisateur */
  user: HexString;
  /** Symbole de l'actif */
  coin: string;
  /** Configuration et état actuel du levier */
  leverage: HlActiveAssetLeverage;
  /** Taille maximale de trade autorisée [long, short] */
  maxTradeSzs: [DecimalString, DecimalString];
  /** Capital disponible immédiatement pour trader [long, short] */
  availableToTrade: [DecimalString, DecimalString];
  /** Prix mark actuel de l'actif */
  markPx: DecimalString;
}
