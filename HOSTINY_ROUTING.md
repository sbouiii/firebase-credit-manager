# Configuration du routage pour Hostiny/Netlify

## Problème

Les applications React SPA (Single Page Application) utilisent le routage côté client. Quand vous accédez directement à une route comme `/customers` ou `/credits`, le serveur essaie de trouver un fichier physique à cet emplacement, ce qui n'existe pas. Il faut rediriger toutes les routes vers `index.html` pour que React puisse gérer le routage.

## Solutions

### 1. Pour Netlify

Deux fichiers ont été créés :

#### `public/_redirects`

```
/*    /index.html   200
```

Ce fichier doit être dans le dossier `public/` et sera automatiquement copié dans `dist/public/` lors du build.

#### `netlify.toml`

```toml
[build]
  command = "npm run build"
  publish = "dist/public"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### 2. Pour Hostiny (Apache)

Un fichier `.htaccess` a été créé pour les serveurs Apache :

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

Ce fichier doit être copié dans `dist/public/` après le build.

### 3. Pour Nginx

Si vous utilisez Nginx, ajoutez cette configuration :

```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

## Vérification

Après le déploiement, testez ces routes :

- `/` - Doit fonctionner
- `/customers` - Doit rediriger vers index.html et afficher la page customers
- `/credits` - Doit rediriger vers index.html et afficher la page credits
- `/customer-track/CUST-XXXX-XXXX-XXXX` - Doit fonctionner (route publique)

## Configuration Vite

La configuration Vite a été mise à jour pour copier automatiquement le dossier `public/` dans le build :

```typescript
publicDir: path.resolve(import.meta.dirname, "public"),
build: {
  copyPublicDir: true,
}
```

Cela garantit que `_redirects` et `.htaccess` sont copiés dans `dist/public/`.
