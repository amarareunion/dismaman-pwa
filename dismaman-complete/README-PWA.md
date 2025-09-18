# 📱 Dis Maman ! - Configuration PWA

## 🎯 Configuration PWA Complète

Cette configuration transforme l'app React Native Expo en PWA (Progressive Web App) installable.

### ✅ Fichiers PWA ajoutés :

1. **`app.json`** - Configuration web PWA étendue
2. **`public/manifest.json`** - Manifest PWA avec icônes et shortcuts
3. **`public/sw.js`** - Service Worker pour cache offline
4. **`web/index.html`** - HTML personnalisé avec PWA features

### 🚀 Fonctionnalités PWA incluses :

- ✅ **Installation** sur mobile et desktop
- ✅ **Mode offline** avec cache intelligent
- ✅ **Notifications push** (configurées)
- ✅ **Écran splash** personnalisé
- ✅ **Thème adaptatif** (violet-rose)
- ✅ **Shortcuts** (Question rapide, Historique)
- ✅ **SEO optimisé** avec meta tags

### 📦 Comment créer le build PWA :

```bash
# Dans le dossier frontend
cd ~/Desktop/Dis-Maman-MOBILE-main-9/dismaman-complete/frontend

# Export web/PWA
npx expo export --platform web

# Les fichiers seront dans le dossier 'dist/'
```

### 🌐 Déploiement sur GitHub Pages :

1. **Créer un repo GitHub** pour la PWA
2. **Copier le contenu de `dist/`** vers le repo
3. **Activer GitHub Pages** dans les settings
4. **Configurer le domaine** dismaman.com

### 📂 Structure des fichiers générés :

```
dist/
├── index.html
├── manifest.json
├── sw.js
├── _expo/
│   └── static/
│       ├── js/
│       ├── css/
│       └── media/
└── assets/
    └── images/
```

### 🔧 Configuration domaine custom :

1. **Ajouter CNAME** dans le repo : `dismaman.com`
2. **Configurer DNS** : 
   - A record : `185.199.108.153`
   - CNAME : `username.github.io`

### 📱 Test PWA :

1. **Ouvrir** `https://dismaman.com` dans Chrome/Safari
2. **Bouton d'installation** apparaît automatiquement
3. **Installer** l'app sur l'écran d'accueil
4. **Tester offline** en coupant internet

### 🎨 Personnalisation :

- **Couleurs** : Modifiez `themeColor` dans `app.json`
- **Icônes** : Remplacez les fichiers dans `assets/images/`
- **Nom** : Changez `name` et `shortName` dans `manifest.json`

### 🔐 HTTPS Requis :

Les PWA nécessitent HTTPS. GitHub Pages fournit automatiquement HTTPS.

### 📊 Analytics (optionnel) :

Ajoutez Google Analytics dans `web/index.html` :

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

### 🎯 Prochaines étapes :

1. **Créer le build** avec `npx expo export --platform web`
2. **Tester localement** avec `npx serve dist`
3. **Déployer** sur GitHub Pages
4. **Tester l'installation** PWA

---

**🎉 Votre app "Dis Maman !" est maintenant prête à être déployée comme PWA !**