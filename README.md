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

La publication passe par **GitHub Actions, sans aucun jeton npm** : le workflow
[`publish.yml`](.github/workflows/publish.yml) s'authentifie auprès de npm par OIDC
(« trusted publishing ») et **dépose** la version sans la rendre publique
(`npm stage publish`). Elle ne devient installable qu'après **approbation avec la 2FA**
du mainteneur. Un workflow, une action ou une dépendance compromis ne peut donc, au
pire, que déposer une version qu'on refusera. Le paquet porte en plus une attestation
de provenance qui le relie au commit et au workflow qui l'ont construit.

Jusqu'au 2026-11-03, la publication se faisait depuis le poste avec un jeton « Bypass
2FA » rangé dans un `.npmrc` : n'importe quel paquet malveillant installé sur la
machine pouvait le lire et publier à notre place. npm retire d'ailleurs la publication
directe par jeton en janvier 2027.

### Publier une nouvelle version

```bash
npm version patch   # ou minor, major : met à jour package.json et crée le tag v<version>
git push origin main --follow-tags
```

Le tag `v*` déclenche le workflow : il vérifie que le tag correspond à `package.json`,
relance lint, tests, build et le contrôle du contenu du paquet, puis dépose la version.
Il reste à l'approuver :

- sur [npmjs.com](https://www.npmjs.com), onglet **Staged Packages**, bouton **Approve** ;
- ou en ligne de commande : `npm stage list @syldel/hl-shared-types`, puis
  `npm stage approve <stage-id>` (demande la 2FA).

Une version déposée par erreur se refuse avec `npm stage reject <stage-id>`.

### Réglages côté npm (une fois)

Dans les réglages du paquet sur npmjs.com :

- **Trusted Publisher** : GitHub Actions, utilisateur `Syldel`, dépôt `hl-shared-types`, workflow
  `publish.yml`, actions autorisées **`npm stage publish` seulement**. ⚠️ Une
  déclaration neuve expire si aucune publication ne la valide sous **2 jours**.
- **Publishing access** : « Require two-factor authentication and disallow tokens ».

⚠️ Renommer `publish.yml` ou le dépôt casse la publication (ENEEDAUTH) : la déclaration
sur npmjs.com les nomme exactement. Le champ `repository.url` de `package.json` doit
aussi correspondre au dépôt GitHub.

---

## 🔍 Avant de déclarer un champ : d'où vient l'information

Chaque champ de ce paquet est une **affirmation sur ce que l'exchange rend**, et les trois
dépôts la croient. Une affirmation fausse ne se voit pas : elle se paie plus loin, sur un
dimensionnement ou un affichage. Avant d'ajouter, de resserrer ou d'élargir un type, lire
[`nest-hyperliquid-gateway/docs/sources.md`](https://github.com/Syldel/nest-hyperliquid-gateway/blob/main/docs/sources.md).

En résumé de ce document :

* **La mesure** (captures du gateway, lectures `/hyperliquid/info/*`) prouve qu'une forme
  existe, jamais qu'elle soit la seule. Un `null` vu une fois clôt la nullité d'un champ ;
  mille valeurs présentes ne closent rien. Et un échantillon se décrit honnêtement — 22
  instantanés d'une même position ne sont pas 22 observations.
* **La doc officielle** fait autorité sur les noms, et tient sur **un exemple par
  endpoint** : elle est donc muette sur ce qui varie. Un champ absent d'un exemple n'est ni
  absent de l'API ni optionnel.
* **Le SDK Python officiel**
  ([hyperliquid-dex/hyperliquid-python-sdk](https://github.com/hyperliquid-dex/hyperliquid-python-sdk))
  est de première partie **et typé** : il tranche les unions, les champs propres à une
  variante et les valeurs énumérées que la prose laisse en suspens. Mais il ne type pas
  tout, et son silence n'est pas une réponse.
* **Les SDK communautaires ne concluent pas.** La page d'API en recommande plusieurs — un en
  Rust, deux en TypeScript, plus CCXT — et le dit : ils sont écrits par la communauté. Être
  lié par la doc officielle donne de la visibilité, pas de l'autorité ; ils lisent la même
  API que nous et peuvent s'être trompés pareil. Ils servent à repérer une question, jamais
  à la clore — et le piège est celui en TypeScript, dont on a envie de recopier une union
  toute faite. Il n'existe **aucun SDK TypeScript de première partie**.

`HLPerpLeverage` est le cas d'école : ni les captures (que du `cross`) ni l'exemple de la
doc (que de l'`isolated`) ne pouvaient trancher, et `hyperliquid/utils/types.py` déclare les
deux branches. Les types portent leur source et leur date en commentaire — c'est ce qui
permet de les contredire plus tard au lieu de devoir tout remesurer.

---

## 📝 Conventions de code

* **Sauts de ligne** : Une ligne vide est automatiquement insérée entre chaque `interface` pour une meilleure lisibilité.
* **Naming** : Toutes les interfaces commencent par `HL`.
* **Types stricts** : Usage de `DecimalString` pour la précision financière.
* **Fins de ligne** : LF partout, imposé par `.gitattributes` et non par la configuration de
  la machine — le paquet publié embarque du code généré par `tsc`, dont les fins de ligne
  suivent celles des sources.

---
