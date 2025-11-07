# Instructions pour appliquer les règles Firestore

## Problème identifié
L'erreur "Missing or insufficient permissions" indique que les règles Firestore bloquent la requête publique pour les crédits.

## Solution : Appliquer les règles alternatives

### Étapes à suivre :

1. **Ouvrez Firebase Console**
   - Allez sur https://console.firebase.google.com/
   - Sélectionnez votre projet

2. **Accédez aux règles Firestore**
   - Dans le menu de gauche, cliquez sur **"Firestore Database"**
   - Cliquez sur l'onglet **"Rules"** en haut

3. **Copiez les règles alternatives**
   - Ouvrez le fichier `FIRESTORE_RULES_ALTERNATIVE.md` dans votre projet
   - Copiez tout le contenu (de `rules_version = '2';` jusqu'à la fin)

4. **Collez dans Firebase Console**
   - Remplacez toutes les règles existantes par le contenu copié
   - Cliquez sur **"Publish"** pour sauvegarder

5. **Vérifiez que les règles sont appliquées**
   - Attendez quelques secondes pour que les règles se propagent
   - Rechargez la page de suivi de crédit
   - Les crédits devraient maintenant s'afficher

## Règles alternatives (à copier)

Les règles alternatives permettent les requêtes publiques avec :
```javascript
allow list: if request.query.limit <= 100;
```

Cela permet aux clients de voir leurs crédits via le portail public.

## Important

Ces règles sont **moins sécurisées** que les règles originales car elles permettent des requêtes publiques. Cependant, elles sont nécessaires pour que le portail client fonctionne.

Pour améliorer la sécurité plus tard, vous pouvez :
- Limiter les requêtes à un `customerId` spécifique
- Ajouter une validation supplémentaire
- Utiliser des tokens d'accès personnalisés

