# 🚀 Déploiement Automatique GitHub

## 🎯 Solution : Déploiement sans terminal avec clés sécurisées

Cette configuration permet de déployer automatiquement la PWA sur GitHub Pages avec les clés API sécurisées, **sans les exposer dans le code public**.

## 🔐 Comment ça marche

1. **Code public** : Aucune clé API visible dans GitHub
2. **GitHub Secrets** : Clés stockées de manière sécurisée 
3. **GitHub Actions** : Build automatique avec les clés
4. **Déploiement** : PWA fonctionnelle sur dismaman.com

## ⚙️ Configuration GitHub (étapes pour vous)

### 1. **Créer le repo dismaman-website**
```bash
# Créer un nouveau repo PUBLIC sur GitHub
# Nom: dismaman-website
```

### 2. **Ajouter les GitHub Secrets**
Dans votre repo GitHub, allez dans :
**Settings** → **Secrets and variables** → **Actions** → **New repository secret**

Ajoutez ces secrets :

```
EXPO_PUBLIC_BACKEND_URL = https://votre-backend-url.com
EXPO_PUBLIC_API_KEY = votre-clé-api-ici
```

### 3. **Activer GitHub Pages**
**Settings** → **Pages** → **Source** : "GitHub Actions"

### 4. **Push le code**
```bash
git add .
git commit -m "🚀 PWA avec déploiement automatique"
git push origin main
```

## 🎯 Résultat

- ✅ **GitHub Actions** build automatiquement
- ✅ **PWA fonctionnelle** avec vraies clés API
- ✅ **Code public** sans clés sensibles
- ✅ **Déploiement automatique** sur dismaman.com

## 📁 Structure des repos

```
📱 dismaman-mobile (PRIVÉ)
├── frontend/ (code complet)
├── backend/ 
└── eas.json (pour iOS builds)

🌐 dismaman-website (PUBLIC)  
├── frontend/ (code sans clés)
├── .github/workflows/ (CI/CD)
└── README.md
```

## 🔄 Workflow automatique

1. **Push code** → GitHub
2. **GitHub Actions** → Récupère les secrets
3. **Build PWA** → Avec vraies clés
4. **Deploy** → https://dismaman.com
5. **App fonctionnelle** → Utilisateurs peuvent l'utiliser !

## 🔒 Sécurité

- ✅ Clés API **jamais visibles** dans le code public
- ✅ Stockage sécurisé avec **GitHub Secrets**
- ✅ Build dans environnement isolé
- ✅ PWA fonctionne avec vraies API

## 🎉 Avantages

- **Aucun terminal** requis après setup
- **Déploiement automatique** à chaque push
- **Sécurité maximale** des clés
- **App web complètement fonctionnelle**

---

**🚀 Une fois configuré, il suffit de push le code et tout se déploie automatiquement !**