#!/bin/bash

# Script de verificación pre-deploy para Netlify
# Verifica que todos los archivos necesarios estén presentes

echo "🔍 Verificando configuración de Netlify..."
echo ""

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Contador de errores
ERRORS=0

# Función para verificar archivo
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} $1 existe"
        return 0
    else
        echo -e "${RED}✗${NC} $1 NO EXISTE"
        ERRORS=$((ERRORS + 1))
        return 1
    fi
}

# Función para verificar directorio
check_dir() {
    if [ -d "$1" ]; then
        echo -e "${GREEN}✓${NC} $1 existe"
        return 0
    else
        echo -e "${RED}✗${NC} $1 NO EXISTE"
        ERRORS=$((ERRORS + 1))
        return 1
    fi
}

echo "📁 Verificando archivos de configuración..."
check_file "netlify.toml"
check_file "public/_redirects"
check_file "netlify/functions/og-tags.mjs"
check_file "index.html"
check_file "package.json"
echo ""

echo "📦 Verificando dependencias..."
if grep -q "@supabase/supabase-js" package.json; then
    echo -e "${GREEN}✓${NC} @supabase/supabase-js en package.json"
else
    echo -e "${RED}✗${NC} @supabase/supabase-js NO está en package.json"
    ERRORS=$((ERRORS + 1))
fi
echo ""

echo "🔧 Verificando variables de entorno locales..."
if [ -f ".env" ]; then
    echo -e "${GREEN}✓${NC} .env existe (recuerda configurar en Netlify también)"
    if grep -q "VITE_SUPABASE_URL" .env; then
        echo -e "${GREEN}✓${NC} VITE_SUPABASE_URL encontrada"
    else
        echo -e "${YELLOW}⚠${NC} VITE_SUPABASE_URL no encontrada en .env"
    fi
    if grep -q "VITE_SUPABASE_ANON_KEY" .env; then
        echo -e "${GREEN}✓${NC} VITE_SUPABASE_ANON_KEY encontrada"
    else
        echo -e "${YELLOW}⚠${NC} VITE_SUPABASE_ANON_KEY no encontrada en .env"
    fi
else
    echo -e "${YELLOW}⚠${NC} .env no existe (asegúrate de configurar variables en Netlify)"
fi
echo ""

echo "🏗️  Probando build..."
if npm run build > /tmp/build.log 2>&1; then
    echo -e "${GREEN}✓${NC} Build exitoso"
    
    # Verificar que _redirects se copió
    if [ -f "dist/_redirects" ]; then
        echo -e "${GREEN}✓${NC} dist/_redirects copiado correctamente"
    else
        echo -e "${RED}✗${NC} dist/_redirects NO se copió"
        ERRORS=$((ERRORS + 1))
    fi
    
    # Verificar que index.html existe
    if [ -f "dist/index.html" ]; then
        echo -e "${GREEN}✓${NC} dist/index.html generado"
    else
        echo -e "${RED}✗${NC} dist/index.html NO se generó"
        ERRORS=$((ERRORS + 1))
    fi
else
    echo -e "${RED}✗${NC} Build falló"
    echo "Revisa el log: /tmp/build.log"
    ERRORS=$((ERRORS + 1))
fi
echo ""

echo "═══════════════════════════════════════════════"
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✓ Todo listo para deploy en Netlify!${NC}"
    echo ""
    echo "Próximos pasos:"
    echo "1. Configura las variables de entorno en Netlify:"
    echo "   - VITE_SUPABASE_URL"
    echo "   - VITE_SUPABASE_ANON_KEY"
    echo ""
    echo "2. Conecta tu repositorio a Netlify o usa:"
    echo "   netlify deploy --prod --dir=dist"
    echo ""
    echo "3. Después del deploy, prueba con Facebook Debugger:"
    echo "   https://developers.facebook.com/tools/debug/"
    exit 0
else
    echo -e "${RED}✗ Encontrados $ERRORS errores${NC}"
    echo "Por favor, corrige los errores antes de deployar."
    exit 1
fi
