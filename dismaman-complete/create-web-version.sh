#!/bin/bash

# Script pour créer une version web-safe sans clés API
echo "🔒 Création version web-safe pour dismaman-website"

# Créer dossier web-version
mkdir -p web-version
cp -r frontend/* web-version/

cd web-version

echo "🧹 Nettoyage des clés API..."

# Supprimer/masquer les fichiers sensibles
rm -f .env
rm -f .env.local
rm -f .env.production

# Créer un .env web public
cat > .env << 'EOF'
# Configuration WEB PUBLIC - Pas de clés sensibles
EXPO_PUBLIC_BACKEND_URL=https://votre-backend-public.com
EXPO_PUBLIC_APP_ENV=web
EOF

# Nettoyer les clés API dans les fichiers de code
echo "📝 Remplacement des clés API par des variables..."

# Remplacer dans tous les fichiers JS/TS
find . -name "*.js" -o -name "*.ts" -o -name "*.tsx" | xargs sed -i '' 's/sk-[a-zA-Z0-9]*/process.env.EXPO_PUBLIC_API_KEY/g'

# Supprimer les imports de clés
find . -name "*.js" -o -name "*.ts" -o -name "*.tsx" | xargs sed -i '' '/import.*api.*key/d'

echo "✅ Version web-safe créée dans ./web-version/"
echo "📁 Prête pour dismaman-website repo"