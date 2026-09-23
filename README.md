# @syldel/hl-shared-types

Ce package centralise les définitions TypeScript pour l'écosystème **Hyperliquid**. Il sert de source de vérité unique pour les interfaces d'API, les types de la blockchain (L1) et les DTOs de communication entre le Gateway, le Bot de trading et l'application mobile.

<p align="center">
    <a href="https://www.typescriptlang.org/" target="_blank"><img src="https://i.postimg.cc/28V1jRWW/typescript.png" alt="Typescript" height="120" /></a>
    &nbsp;&nbsp;&nbsp;&nbsp;
    <a href="https://app.hyperliquid.xyz/" target="_blank"><img src="https://i.postimg.cc/prPKc0cg/HL-symbol-mint-green.png" alt="Hyperliquid" height="120" /></a>
</p>

---

## 🛠 Structure du projet

* **Common** : Types de base (Hex, DecimalStrings, ID d'ordres).
* **Account** : États du compte, positions Perp et soldes Spot.
* **Market** : Métadonnées des actifs et résumés de marché.
* **Orders** : Définitions des ordres ouverts et historiques.
* **Format** : les règles de **tick et de lot** d'Hyperliquid — la seule logique exécutable
  du package, et la seule qui décide ce qui part vers l'exchange.

---

## ⚠️ `format/` : du code, pas seulement des types

`formatPrice`, `formatSize`, `priceDecimals` et `snapPrice` appliquent les règles de
[tick and lot size](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/tick-and-lot-size)
d'Hyperliquid. Elles vivent ici pour qu'il n'en existe **qu'une seule implémentation** :
le gateway les applique en sortie, et le bot doit pouvoir savoir *avant d'envoyer* ce qui
sera posé. Deux implémentations, c'est la garantie qu'un émetteur croira un jour avoir posé
autre chose que ce qui l'a été — ce qui s'est produit, et se paie sur un stop loss.

Trois conséquences pour qui touche à ce dossier :

* **aucune dépendance**, ici moins qu'ailleurs : le consommateur de ce code est le processus
  qui signe les transactions ;
* **rien ne passe par `Number`** — tout le calcul se fait sur les chiffres écrits, en
  `BigInt` ;
* **la conformité se prouve** : `test/tick-and-lot.spec.ts` rejoue *tous* les exemples de la
  documentation, sourcés et datés. `npm run build` lance les tests avant de compiler — une
  logique exécutable non testée ne se publie pas.

```bash
npm test
```

---

## 👨‍💻 Développement

### Installation des dépendances
```bash
npm install
```

### Compilation
Génère le dossier `dist/` contenant les fichiers JavaScript et les déclarations de types (`.d.ts`).
```bash
npm run build
```

### Qualité du code
Le projet utilise **ESLint** pour la logique et **Prettier** pour le formatage.
```bash
# Vérifier les erreurs
npx eslint .
```

---

## 🔗 Utilisation en local (Development Workflow)

Pour utiliser ce package dans tes autres projets (`bot`, `gateway` ou `mobile`) sans le publier sur NPM :

1.  Dans le dossier `hl-shared-types` :
    ```bash
    npm link
    ```
2.  Dans ton projet (ex: `my-trading-bot`) :
    ```bash
    npm link @syldel/hl-shared-types
    ```

---

## 📦 Publication

Le projet utilise des **Granular Access Tokens** pour la publication afin de contourner la double authentification (2FA) manuelle tout en maintenant une sécurité maximale.

### Configuration du Token
1. Générer un token sur NPM avec les permissions `Read and Write`.
2. Restreindre l'accès au package `@syldel/hl-shared-types` uniquement.
3. Utiliser l'option `Bypass 2FA` pour permettre l'automatisation.

### Commande de publication rapide
Si tu n'utilises pas de fichier `.npmrc`, tu peux publier en passant le token directement :
```bash
npm publish --access public --//registry.npmjs.org/:_authToken=TON_TOKEN_ICI
```

### Configuration de la publication
Créez un fichier .npmrc à la racine (ignoré par Git) pour l'authentification :

```
//registry.npmjs.org/:_authToken=npm_votre_token_ici
```

### Publier une nouvelle version
La commande suivante automatise le build, l'incrémentation de version et l'envoi vers NPM :

```bash
npm run release
```

### Pousse le commit ET le tag sur GitHub
```bash
git push origin main --follow-tags
```

---

## 📝 Conventions de code

* **Sauts de ligne** : Une ligne vide est automatiquement insérée entre chaque `interface` pour une meilleure lisibilité.
* **Naming** : Toutes les interfaces commencent par `HL`.
* **Types stricts** : Usage de `DecimalString` pour la précision financière.

---
