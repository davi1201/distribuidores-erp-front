#!/bin/bash

echo "🔄 Atualizando imports..."

# Detectar OS para usar sed apropriado
if [[ "$OSTYPE" == "darwin"* ]]; then
    SED_CMD="sed -i ''"
else
    SED_CMD="sed -i"
fi

# Atualizar imports em src/
echo "Atualizando imports de features/app para @/client..."
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -print0 | while IFS= read -r -d '' file; do
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' 's|from ['\''"]features/app/|from "@/client/|g' "$file"
        sed -i '' 's|import ['\''"]features/app/|import "@/client/|g' "$file"
    else
        sed -i 's|from ['\''"]features/app/|from "@/client/|g' "$file"
        sed -i 's|import ['\''"]features/app/|import "@/client/|g' "$file"
    fi
done

echo "Atualizando imports de features/backoffice para @/admin..."
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -print0 | while IFS= read -r -d '' file; do
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' 's|from ['\''"]features/backoffice/|from "@/admin/|g' "$file"
        sed -i '' 's|import ['\''"]features/backoffice/|import "@/admin/|g' "$file"
    else
        sed -i 's|from ['\''"]features/backoffice/|from "@/admin/|g' "$file"
        sed -i 's|import ['\''"]features/backoffice/|import "@/admin/|g' "$file"
    fi
done

echo "✅ Imports atualizados!"
echo "⚠️  Revise os arquivos e teste a aplicação"
