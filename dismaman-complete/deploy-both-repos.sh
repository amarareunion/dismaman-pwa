#!/bin/bash

echo "🚀 Déploiement Dis Maman ! - Mobile & Web"
echo "========================================="

# Rendre les scripts exécutables
chmod +x create-web-version.sh
chmod +x deploy-pwa.sh

echo "📱 ÉTAPE 1: Build Mobile pour dismaman-mobile"
echo "----------------------------------------------"

# Build mobile (avec toutes les clés)
cd frontend
echo "Building IPA..."
eas build --profile production --platform ios --non-interactive

echo ""
echo "✅ Build mobile lancé !"
echo ""

echo "🌐 ÉTAPE 2: Création version web-safe"
echo "------------------------------------"

cd ..
./create-web-version.sh

echo ""
echo "📦 ÉTAPE 3: Build PWA pour dismaman-website"
echo "------------------------------------------"

cd web-version

# Remplacer app.json par la version web
cp ../web-app.json app.json

# Copier les fichiers PWA
cp -r ../frontend/public ./
cp -r ../frontend/web ./

# Build PWA
npm install
npx expo export --platform web

echo ""
echo "🎯 RÉSUMÉ DES BUILDS CRÉÉS:"
echo "=========================="
echo ""
echo "📱 MOBILE (dismaman-mobile repo):"
echo "   - Build EAS en cours sur votre compte"
echo "   - IPA sera téléchargeable depuis EAS"
echo "   - Contient toutes les clés privées"
echo ""
echo "🌐 WEB PWA (dismaman-website repo):"
echo "   - Fichiers dans: ./web-version/dist/"
echo "   - Sans clés sensibles"
echo "   - Prêt pour GitHub Pages"
echo ""
echo "📋 PROCHAINES ÉTAPES:"
echo "==================="
echo ""
echo "1. 📱 Pour dismaman-mobile:"
echo "   - Sauvegarder TOUT le code original (avec clés)"
echo "   - Push vers repo privé dismaman-mobile"
echo ""
echo "2. 🌐 Pour dismaman-website:"
echo "   - Copier SEULEMENT le contenu de web-version/dist/"
echo "   - Push vers repo public dismaman-website"
echo "   - Activer GitHub Pages"
echo ""
echo "3. 🔐 Sécurité:"
echo "   - NE JAMAIS pusher les vraies clés vers dismaman-website"
echo "   - Garder dismaman-mobile privé"
echo ""

# Lister les fichiers créés
echo "📂 Fichiers web-safe créés:"
ls -la web-version/dist/

echo ""
echo "🎉 Builds terminés ! Suivez les étapes ci-dessus."