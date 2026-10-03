# Réperto’Poche — base de préparation v54

## Statut
Copie de travail créée depuis v53 sans modification du code de v53 ni des données d’un appareil.

## Architecture constatée
- Application web monopage : `index.html` charge `styles.css` et `app.js`.
- Données métier : `localStorage` (`rp-*`).
- Pièces jointes : IndexedDB, base `reperto-poche-files`, magasin `attachments`.
- Sauvegarde : export JSON complet des collections `rp-*` et des pièces jointes.
- Navigation : rendu côté client dans `app.js`, routeurs `data-go`.
- Accueil : fonction `home()` ; cartes générées par `category()`.
- Cache hors connexion : service worker `sw.js`.

## Compatibilité à préserver
- Ne jamais renommer ni migrer de façon destructive les clés actuelles `rp-*`.
- Les nouveaux champs doivent être optionnels avec une valeur de repli.
- Les sauvegardes v53 doivent pouvoir être restaurées ; une sauvegarde v54 doit conserver toutes les collections précédentes.
- Établissements, planning et rémunération ne doivent pas être inclus dans le partage de fiches.

## Ajouts envisagés — isolés et réversibles
- `rp-personal-folders` : dossiers personnels, avec couleur et sections facultatives.
- `rp-shared-cards` (ou collection équivalente) : fiches créées/importées, séparées des rubriques sensibles.
- Export ciblé : une seule fiche autorisée, pièces jointes opt-in ; jamais données d’établissement, planning, rémunération ni profil.
- Import : copie indépendante ; destination choisie dans l’accueil ; les fiches Urgences restent dans Urgences.

## Ordre d’intégration
1. Ajouter les modèles optionnels et les inclure dans sauvegarde/restauration.
2. Afficher les dossiers personnels sur l’accueil sans modifier les rubriques existantes.
3. Créer dossiers et sections facultatives.
4. Ajouter le mode « Où ranger cette fiche ? » sur l’accueil.
5. Ajouter export/import contrôlé, puis tests de non-inclusion des données sensibles.
6. Incrémenter les versions du manifeste et du service worker seulement au moment de publier.

## Point de retour
La source `Reperto-Poche-v53` reste intacte. Toute expérimentation se fait uniquement dans ce dossier de préparation.
