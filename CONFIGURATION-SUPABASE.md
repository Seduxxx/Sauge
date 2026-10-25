# À configurer de TON côté (Supabase)

Le code des comptes est **déjà écrit et branché**. Mais ces quatre fonctions ne marcheront que lorsque
tu auras fait les étapes ci-dessous dans Supabase. Sans ça, l'application reste en mode invité
(sauvegarde sur l'appareil seulement) — rien ne casse.

| Fonction | Code dans le projet | Ce que TOI tu dois faire |
|---|---|---|
| **Inscription, connexion, sauvegarde en ligne** | `src/supabase-api.js`, fonctions SQL `api_session`, `api_state_put` | Étapes 1, 2, 3, 4 et 5 |
| **Recettes privées et soumission pour publication** | fonctions SQL `api_recipe_*` | Étapes 1, 2, 3 |
| **Étoiles de notation** | fonction SQL `api_rate` | Étapes 1, 2, 3 |
| **Administration et modération** | fonctions SQL `api_admin_*` | Étapes 1, 2, 3 et **6 (te nommer administrateur)** |

## Étapes, dans l'ordre

### 1. Créer le projet Supabase
- Crée un compte et un projet sur supabase.com (choisis une région proche : Canada/États-Unis Est).
- Note le mot de passe de la base quelque part de sûr.

### 2. Créer les tables et les règles de sécurité
- Supabase → **SQL Editor** → New query.
- Colle **tout** le contenu de `supabase/schema.sql` → **Run**. (À faire UNE seule fois.)
- Puis colle `supabase/base-recipes.sql` → **Run**. Il déclare les 31 recettes de base qui peuvent recevoir des étoiles.
  Si tu ajoutes un jour d'autres recettes de base avec photo, relance `npm run seed:sql` et exécute le résultat.

### 3. Donner les deux clés à l'application
- Supabase → **Project Settings → API** : copie **Project URL** et la clé **anon public**.
- Mets-les dans le fichier `.env` (modèle : `.env.example`) ou dans le panneau de secrets/variables de Bolt :
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
- **Ne mets jamais la clé `service_role` dans l'application.** La clé anon est publique par conception;
  la sécurité vient des règles du schéma (tables fermées, tout passe par des fonctions qui vérifient qui appelle).
- Relance l'application (`npm run dev`) : l'écran Mon compte propose alors « Me connecter ou créer mon compte ».

### 4. Régler l'authentification (Authentication)
- **Sign In / Providers → Email** : garde « Email » activé.
- **Longueur minimale du mot de passe : 10** (l'application exige 10 à 128 caractères; il faut le même minimum côté Supabase).
- **Confirm email** :
  - *Activé* (recommandé avant l'ouverture publique) : après l'inscription, la personne voit « Compte créé. Confirmez votre courriel, puis connectez-vous. »
  - *Désactivé* (pratique pour tester) : connexion immédiate après l'inscription.
- **URL Configuration** : mets l'adresse de ton site (celle de Bolt, puis ton vrai domaine) dans *Site URL* et *Redirect URLs*.
- **Courriels** : le service de courriel intégré de Supabase est très limité. Avant d'ouvrir au public,
  branche ton propre SMTP (Authentication → SMTP Settings).
- Active aussi, si disponible dans ton plan : protection contre les mots de passe compromis et CAPTCHA.

### 5. Récupération de mot de passe (pas encore dans l'interface)
- Supabase sait envoyer le courriel de réinitialisation, mais **l'écran n'existe pas encore** dans l'application.
  Demande à Bolt d'ajouter un lien « Mot de passe oublié » qui appelle `supabase.auth.resetPasswordForEmail`
  et une page qui appelle `supabase.auth.updateUser({password})`. À faire avant une ouverture publique.

### 6. Te nommer administrateur (modération)
Personne ne devient administrateur automatiquement, et le rôle ne peut pas être choisi dans un formulaire.
1. Crée ton compte dans l'application (courriel + mot de passe).
2. Supabase → SQL Editor → exécute (en remplaçant le courriel) :
```sql
update public.profiles set role = 'admin'
where id = (select id from auth.users where email = 'ton@courriel.com');
```
3. Recharge l'application : **Mon compte → Administration des recettes** apparaît.
   Examine ingrédients, allergènes, quantités, photo, droits et étapes avant d'approuver.

### 7. Formule Plus (pour tester seulement)
Il n'y a **pas de paiement** branché. Pour essayer les fonctions Plus sur un compte :
```sql
update public.profiles set plan = 'plus'
where id = (select id from auth.users where email = 'ton@courriel.com');
```
(Pour que Plus soit vendu, il faudra Stripe + un webhook vérifié qui change `plan` — à faire plus tard.)

## Avant d'ouvrir au public (rien de cela n'est fait)
- Confidentialité et conditions d'utilisation; suppression et exportation du compte (aucun écran pour l'instant;
  supprimer un utilisateur dans Supabase supprime aussi ses données grâce aux liens en cascade).
- Sauvegardes de la base (selon ton plan Supabase) et surveillance.
- Contrôles côté serveur plus stricts sur les recettes : la base refuse déjà les balises `<` `>`, les photos hors JPEG/PNG,
  les recettes trop grosses et les mauvaises quantités d'ingrédients/étapes. La conversion fine des quantités et le retrait des
  métadonnées des photos (EXIF/GPS) se font dans le navigateur; pour une garantie totale côté serveur, il faudrait une
  Edge Function Supabase. À prévoir si tu ouvres les recettes à des inconnus.
- Audit de sécurité, essais sur de vrais téléphones, vérification de la marque « Sauge » et du domaine.

## Ce qui n'a jamais existé (même avant la conversion)
IA, prix automatiques des détaillants, paiement Stripe.
