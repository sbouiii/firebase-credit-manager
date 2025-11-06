# Guide de déploiement sur Coolify

## Problèmes courants et solutions

### Erreur 502 Bad Gateway

L'erreur 502 signifie généralement que le serveur ne démarre pas correctement ou qu'il ne peut pas servir les fichiers statiques.

#### Vérifications à faire :

1. **Variables d'environnement dans Coolify** :
   - `NODE_ENV=production` (OBLIGATOIRE)
   - `PORT=5000` (ou le port configuré dans Coolify)
   - Variables Firebase :
     - `VITE_FIREBASE_API_KEY`
     - `VITE_FIREBASE_APP_ID`
     - `VITE_FIREBASE_PROJECT_ID`
     - `VITE_FIREBASE_AUTH_DOMAIN`
     - `VITE_FIREBASE_STORAGE_BUCKET`
     - `VITE_FIREBASE_MESSAGING_SENDER_ID`

2. **Vérifier les logs du serveur** :
   - Le serveur doit afficher : `serving on 0.0.0.0:5000 (production)`
   - Si vous voyez "Looking for static files in: ...", vérifiez que le chemin est correct
   - Si vous voyez "Could not find the build directory", le build n'a pas réussi

3. **Vérifier que le build s'est bien exécuté** :
   - Dans Coolify, vérifiez les logs de build
   - Le build doit créer `dist/public/` avec :
     - `index.html`
     - `assets/` (avec les fichiers JS et CSS)
     - `favicon.png`

4. **Configuration du port** :
   - Coolify doit mapper le port externe vers le port 5000
   - Vérifiez la configuration du port dans Coolify

## Commandes de build

### Build local (pour tester)
```bash
npm run build
npm start
```

### Vérifier le build
```bash
# Vérifier que dist/public existe
ls -la dist/public

# Vérifier le contenu
ls -la dist/public/assets
```

## Configuration Coolify

### Si vous utilisez Docker :
- Coolify devrait détecter automatiquement le `Dockerfile`
- Assurez-vous que le build s'exécute correctement

### Si vous utilisez Node.js directement :
- **Build Command** : `npm run build`
- **Start Command** : `npm start`
- **Port** : `5000`
- **Working Directory** : `/` (racine du projet)

## Dépannage

### Le serveur démarre mais retourne 502
1. Vérifiez que `NODE_ENV=production` est défini
2. Vérifiez les logs du serveur pour voir les erreurs
3. Vérifiez que `dist/public` existe et contient les fichiers

### Les fichiers statiques ne se chargent pas
1. Vérifiez que le build a créé `dist/public/assets/`
2. Vérifiez que les chemins dans `index.html` sont relatifs (commencent par `/`)
3. Vérifiez que `express.static` est configuré correctement

### Le serveur ne démarre pas
1. Vérifiez les logs d'erreur dans Coolify
2. Vérifiez que toutes les dépendances sont installées
3. Vérifiez que le port n'est pas déjà utilisé

