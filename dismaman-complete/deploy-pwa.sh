#!/bin/bash

# Script de déploiement PWA pour Dis Maman !
# Usage: ./deploy-pwa.sh

echo "🚀 Déploiement PWA Dis Maman !"
echo "================================"

# Vérifier qu'on est dans le bon dossier
if [ ! -f "frontend/app.json" ]; then
    echo "❌ Erreur: Exécutez ce script depuis le dossier dismaman-complete"
    exit 1
fi

# Aller dans le dossier frontend
cd frontend

echo "📦 Installation des dépendances..."
npm install

echo "🔧 Export web/PWA..."
npx expo export --platform web

# Vérifier que l'export a réussi
if [ ! -d "dist" ]; then
    echo "❌ Erreur: L'export web a échoué"
    exit 1
fi

echo "✅ Export PWA réussi !"
echo ""
echo "📂 Fichiers générés dans: frontend/dist/"
echo ""
echo "🌐 Prochaines étapes pour déployer sur GitHub Pages:"
echo ""
echo "1. Créer un nouveau repo GitHub pour la PWA"
echo "2. Copier tout le contenu de frontend/dist/ vers le repo"
echo "3. Activer GitHub Pages dans les settings du repo"
echo "4. Configurer le domaine custom dismaman.com"
echo ""
echo "📱 Structure des fichiers:"
ls -la dist/

echo ""
echo "🎯 URL de test locale:"
echo "Exécutez: npx serve dist"
echo "Puis ouvrez: http://localhost:3000"
echo ""
echo "🎉 PWA prête pour le déploiement !"

# Option pour servir localement
read -p "🤔 Voulez-vous tester localement maintenant ? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🌐 Démarrage du serveur local..."
    npx serve dist
fi