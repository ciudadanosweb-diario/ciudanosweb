#!/bin/bash

# Comandos rápidos para Netlify Deploy

echo "🚀 Comandos Rápidos para Netlify"
echo ""
echo "Elige una opción:"
echo ""
echo "1. Verificar configuración antes de deploy"
echo "2. Compilar la aplicación"
echo "3. Probar meta tags de artículos"
echo "4. Deploy a Netlify (requiere CLI instalada)"
echo "5. Ver todos los comandos"
echo ""
read -p "Opción (1-5): " option

case $option in
  1)
    echo "🔍 Verificando configuración..."
    bash scripts/pre-deploy-check.sh
    ;;
  2)
    echo "🏗️  Compilando aplicación..."
    npm run build
    echo ""
    echo "✓ Build completado en: dist/"
    ;;
  3)
    echo "🧪 Probando meta tags de artículos..."
    node scripts/test-meta-tags.mjs
    ;;
  4)
    echo "🚀 Desplegando a Netlify..."
    echo ""
    echo "Primero, compilando..."
    npm run build
    echo ""
    echo "Ahora desplegando..."
    netlify deploy --prod --dir=dist
    ;;
  5)
    echo ""
    echo "📋 Comandos Disponibles:"
    echo ""
    echo "# Verificar antes de deploy"
    echo "bash scripts/pre-deploy-check.sh"
    echo ""
    echo "# Compilar"
    echo "npm run build"
    echo ""
    echo "# Probar meta tags"
    echo "node scripts/test-meta-tags.mjs"
    echo ""
    echo "# Deploy a Netlify"
    echo "netlify deploy --prod --dir=dist"
    echo ""
    echo "# Desarrollo local"
    echo "npm run dev"
    echo ""
    echo "# Servidor de producción local"
    echo "npm run serve"
    echo ""
    echo "# Netlify dev local"
    echo "netlify dev"
    echo ""
    ;;
  *)
    echo "❌ Opción inválida"
    ;;
esac
