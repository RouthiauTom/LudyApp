# Ludylab — inscriptions visiteurs

Application React et TypeScript conçue pour enregistrer les visiteurs d’un événement depuis une tablette. La version actuelle fonctionne sans serveur : les inscriptions et le nom de l’événement sont conservés dans le stockage local du navigateur.

## Prérequis

- Node.js 20 ou plus récent
- npm

## Installation et développement

```bash
npm install
npm run dev
```

Vite affiche l’adresse locale à ouvrir. La page d’administration est disponible via `#/admin` (par exemple `http://localhost:5173/#/admin`). L’accès administrateur est créé lors de la première visite de cette page, avec un mot de passe d’au moins huit caractères.

## Vérifications et build

```bash
npm test
npm run build
npm run preview
```

Les tests couvrent les validations, le stockage local et l’export CSV. Le build de production est généré dans `dist/`.

## Déploiement GitHub Pages

Le workflow `.github/workflows/deploy.yml` construit et publie automatiquement le site lors d’un push sur `main`. Dans les paramètres du dépôt GitHub, choisir **Settings → Pages → Build and deployment → GitHub Actions**. Le workflow déploiera ensuite l’application à l’adresse indiquée par GitHub Pages.

Vite utilise par défaut des chemins relatifs, ce qui permet de servir le site à la racine ou sous le chemin du dépôt. Pour un autre chemin de base, définir `VITE_BASE` au moment du build, par exemple `VITE_BASE=/mon-depot/ npm run build`.

Ouvrir l’URL de Pages dans Chrome sur la tablette Android, puis utiliser le menu du navigateur pour ajouter un raccourci à l’écran d’accueil. Le bouton d’agrandissement de l’écran demande le plein écran lorsque le navigateur le permet. Les ressources applicatives restent nécessaires au premier chargement ; il n’y a pas de synchronisation ni de mode hors ligne garanti.

## Utilisation

1. L’écran d’accueil présente le formulaire visiteur. Les noms, l’adresse email, le code postal et le consentement sont obligatoires ; adultes et enfants sont initialisés à zéro.
2. Après validation, l’écran de confirmation reste affiché dix secondes, ou jusqu’à ce que le visiteur choisisse de terminer.
3. Ouvrir `#/admin` pour accéder à l’administration. À la première ouverture, définir un mot de passe local ; les ouvertures suivantes demandent ce mot de passe.
4. L’administration permet de modifier le nom de l’événement, consulter les groupes et les totaux, puis télécharger un CSV (UTF-8 avec BOM et séparateur point-virgule) ou un JSON.
5. Avant un nouvel événement, exporter les données, puis choisir « Réinitialiser les inscriptions » et confirmer. Le nom de l’événement est vidé afin de pouvoir saisir le suivant.

## Données et limites

Les inscriptions (`ludylab_registrations`), le nom de l’événement (`ludylab_event_name`) et le condensat du mot de passe administrateur sont stockés dans le `localStorage` du navigateur. Ces données ne quittent pas l’appareil et ne sont pas partagées entre navigateurs, profils ou tablettes. Elles peuvent être supprimées par l’effacement des données du navigateur ; le stockage peut aussi échouer ou être indisponible. Exporter régulièrement les inscriptions et conserver les fichiers exportés dans un emplacement maîtrisé.

Pour recréer l’accès administrateur, supprimer la clé `ludylab_admin_hash` dans les outils de stockage du navigateur sur la tablette. Cela ne supprime pas les inscriptions.

L’administration est un verrou d’interface adapté à une tablette contrôlée par Ludylab, pas une sécurité serveur. Le code de l’application est public et peut être modifié ou contourné ; le hash du mot de passe est également accessible au navigateur. Ne pas y stocker de secrets ni utiliser cette version pour des données nécessitant un contrôle d’accès fort. Une future version devra authentifier côté serveur et remplacer l’implémentation `StorageService` par un service d’API.

## Identité visuelle

Le logo Ludylab est livré en local dans `src/assets/ludylab-logo.png` et affiché par `Brand` (`src/App.tsx`), sans requête distante au chargement. Les couleurs et espacements sont regroupés dans les variables de `src/styles.css`. L’interface utilise les polices disponibles sur l’appareil.
