# 🎯 Dis Maman ! - Application Mobile

**Application mobile de conversation IA pour enfants avec système de monétisation premium.**

## 📱 **STRUCTURE DU PROJET**

```
dismaman-MOBILE/
├── frontend/          # Application Expo React Native
├── backend/          # API FastAPI + MongoDB  
├── website/          # Landing page pour App Store
├── eas.json          # Configuration EAS Build
└── README.md         # Ce fichier
```

## 🛠 **INSTALLATION LOCALE**

### **Prérequis:**
- Node.js 18+
- Expo CLI
- EAS CLI  
- MongoDB (local ou cloud)

### **Backend Setup:**
```bash
cd backend
pip install -r requirements.txt
python server.py
```

### **Frontend Setup:**
```bash
cd frontend
npm install
expo start
```

## 📦 **BUILDS MOBILES**

### **Build iOS:**
```bash
cd frontend
eas build --platform ios --profile production
```

### **Build Android:**
```bash
cd frontend  
eas build --platform android --profile production
```

## ✅ **DERNIÈRES CORRECTIONS (v1.0.2)**

- **✅ Fix Premium Status:** Correction de la condition de course MonetizationContext
- **✅ Fix History Button:** Le bouton "Historique" attend maintenant le chargement complet
- **✅ TypeScript Fix:** Ajout du type `history_premium` manquant
- **✅ Debug Logs:** Amélioration des logs pour le débogage

## 🔐 **CONFIGURATION**

### **Variables d'environnement:**
- `MONGO_URL`: URL de connexion MongoDB
- `OPENAI_API_KEY`: Clé API OpenAI pour l'IA
- `SECRET_KEY`: Clé secrète JWT

### **Comptes de test:**
- **Apple Review:** `test@dismaman.fr` / `Test123!` (Premium activé)
- **Admin:** `amarareunion@icloud.com` (Accès admin)

## 📋 **FONCTIONNALITÉS**

- ✅ Système d'authentification JWT
- ✅ Gestion des profils enfants (max 4)
- ✅ Conversations IA adaptées à l'âge (GPT-5 + GPT-4o fallback)
- ✅ Système de monétisation (essai 30j + Premium)
- ✅ Historique des conversations avec TTS
- ✅ Interface premium/gratuit différenciée

## 🚀 **DÉPLOIEMENT APP STORE**

1. **Build iOS** avec EAS
2. **Upload** vers App Store Connect
3. **Soumission** pour review Apple
4. **Website** de support configuré

---

**Dernière mise à jour:** Version 1.0.2 - Correction premium status detection