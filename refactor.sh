#!/bin/bash

# Script para migração e melhoria da arquitetura Next.js/React
# Versão Corrigida - Move arquivos efetivamente

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Criar backup
create_backup() {
    log_info "Criando backup da estrutura atual..."
    
    BACKUP_DIR="backup_features_$(date +%Y%m%d_%H%M%S)"
    
    if [ -d "features" ]; then
        cp -r features "$BACKUP_DIR"
        log_success "Backup criado em: $BACKUP_DIR"
        echo "$BACKUP_DIR" > .last_backup
    else
        log_error "Diretório 'features' não encontrado!"
        exit 1
    fi
}

# Criar nova estrutura
create_new_structure() {
    log_info "Criando nova estrutura src/features..."
    
    mkdir -p src/features/client
    mkdir -p src/features/admin
    mkdir -p src/shared/{components,hooks,utils,types,constants,services}
    mkdir -p src/lib
    
    log_success "Estrutura base criada"
}

# Migrar um módulo específico
migrate_module() {
    local source_module=$1
    local target_base=$2
    local module_name=$(basename "$source_module")
    
    log_info "Migrando: $module_name"
    
    # Criar diretório do módulo
    mkdir -p "$target_base/$module_name"
    
    # 1. Migrar COMPONENTS (ou componentes)
    if [ -d "$source_module/components" ]; then
        log_info "  - Copiando components/"
        cp -r "$source_module/components" "$target_base/$module_name/"
    fi
    
    if [ -d "$source_module/componentes" ]; then
        log_info "  - Copiando componentes/ -> components/"
        cp -r "$source_module/componentes" "$target_base/$module_name/components"
    fi
    
    # 2. Migrar SERVICES -> api/
    mkdir -p "$target_base/$module_name/api"
    find "$source_module" -maxdepth 1 -name "*-service.ts" -o -name "*-services.ts" | while read service_file; do
        if [ -f "$service_file" ]; then
            filename=$(basename "$service_file")
            new_name=$(echo "$filename" | sed 's/-service\.ts/.service.ts/' | sed 's/-services\.ts/.service.ts/')
            log_info "  - Copiando $filename -> api/$new_name"
            cp "$service_file" "$target_base/$module_name/api/$new_name"
        fi
    done
    
    # 3. Migrar TYPES
    if [ -f "$source_module/types.ts" ]; then
        mkdir -p "$target_base/$module_name/types"
        log_info "  - Copiando types.ts"
        cp "$source_module/types.ts" "$target_base/$module_name/types/"
    fi
    
    # 4. Migrar CONSTANTS
    if [ -d "$source_module/constants" ]; then
        log_info "  - Copiando constants/"
        cp -r "$source_module/constants" "$target_base/$module_name/"
    fi
    
    # 5. Migrar STORES
    if [ -d "$source_module/stores" ]; then
        log_info "  - Copiando stores/"
        cp -r "$source_module/stores" "$target_base/$module_name/"
    fi
    
    # 6. Migrar HOOKS (se existir)
    if [ -d "$source_module/hooks" ]; then
        log_info "  - Copiando hooks/"
        cp -r "$source_module/hooks" "$target_base/$module_name/"
    fi
    
    # 7. Migrar index.tsx ou outros arquivos raiz
    find "$source_module" -maxdepth 1 -type f \( -name "*.tsx" -o -name "*.ts" \) | while read root_file; do
        filename=$(basename "$root_file")
        if [[ "$filename" != *"-service.ts" && "$filename" != "types.ts" ]]; then
            log_info "  - Copiando $filename"
            cp "$root_file" "$target_base/$module_name/"
        fi
    done
    
    # 8. Criar barrel export
    create_barrel_export "$target_base/$module_name"
    
    log_success "Módulo $module_name migrado ✓"
    echo ""
}

# Criar barrel export para o módulo
create_barrel_export() {
    local module_path=$1
    local index_file="$module_path/index.ts"
    
    if [ -f "$index_file" ]; then
        return
    fi
    
    cat > "$index_file" << 'EOF'
// Auto-generated barrel export
// Ajuste conforme necessário

EOF
    
    # Exportar componentes principais
    if [ -d "$module_path/components" ]; then
        find "$module_path/components" -maxdepth 1 -name "*.tsx" -type f | while read comp; do
            comp_name=$(basename "$comp" .tsx)
            echo "export { $comp_name } from './components/$comp_name';" >> "$index_file"
        done
    fi
    
    # Exportar services
    if [ -d "$module_path/api" ]; then
        find "$module_path/api" -name "*.service.ts" | while read service; do
            service_name=$(basename "$service" .service.ts)
            echo "export * from './api/$(basename "$service")';" >> "$index_file"
        done
    fi
    
    # Exportar types
    if [ -d "$module_path/types" ]; then
        echo "export * from './types/types';" >> "$index_file"
    fi
}

# Função principal de migração
perform_migration() {
    log_info "=========================================="
    log_info "Iniciando migração de features/app -> src/features/client"
    log_info "=========================================="
    echo ""
    
    if [ -d "features/app" ]; then
        # Listar todos os módulos
        for module_dir in features/app/*/; do
            if [ -d "$module_dir" ]; then
                migrate_module "$module_dir" "src/features/client"
            fi
        done
    else
        log_warning "Diretório features/app não encontrado"
    fi
    
    echo ""
    log_info "=========================================="
    log_info "Iniciando migração de features/backoffice -> src/features/admin"
    log_info "=========================================="
    echo ""
    
    if [ -d "features/backoffice" ]; then
        for module_dir in features/backoffice/*/; do
            if [ -d "$module_dir" ]; then
                migrate_module "$module_dir" "src/features/admin"
            fi
        done
    else
        log_warning "Diretório features/backoffice não encontrado"
    fi
}

# Criar configuração de paths
create_tsconfig_paths() {
    log_info "Criando tsconfig.paths.json..."
    
    cat > "tsconfig.paths.json" << 'EOF'
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/features/*": ["./src/features/*"],
      "@/client/*": ["./src/features/client/*"],
      "@/admin/*": ["./src/features/admin/*"],
      "@/shared/*": ["./src/shared/*"],
      "@/components/*": ["./src/shared/components/*"],
      "@/hooks/*": ["./src/shared/hooks/*"],
      "@/utils/*": ["./src/shared/utils/*"],
      "@/types/*": ["./src/shared/types/*"],
      "@/lib/*": ["./src/lib/*"]
    }
  }
}
EOF
    
    log_success "Arquivo tsconfig.paths.json criado"
    log_warning "AÇÃO NECESSÁRIA: Adicione 'extends: \"./tsconfig.paths.json\"' no seu tsconfig.json"
}

# Gerar relatório
generate_report() {
    log_info "Gerando relatório..."
    
    REPORT_FILE="migration_report.md"
    
    cat > "$REPORT_FILE" << 'EOF'
# 📋 Relatório de Migração

## ✅ Estrutura Criada

```
src/
├── features/
│   ├── client/          # Migrado de features/app/
│   └── admin/           # Migrado de features/backoffice/
├── shared/
└── lib/
```

## 📊 Estatísticas

EOF
    
    echo "- **Módulos em client:** $(find src/features/client -mindepth 1 -maxdepth 1 -type d 2>/dev/null | wc -l)" >> "$REPORT_FILE"
    echo "- **Módulos em admin:** $(find src/features/admin -mindepth 1 -maxdepth 1 -type d 2>/dev/null | wc -l)" >> "$REPORT_FILE"
    echo "- **Componentes totais:** $(find src/features -name "*.tsx" 2>/dev/null | wc -l)" >> "$REPORT_FILE"
    echo "- **Services totais:** $(find src/features -name "*.service.ts" 2>/dev/null | wc -l)" >> "$REPORT_FILE"
    
    cat >> "$REPORT_FILE" << 'EOF'

## 🔄 Próximos Passos

### 1. Atualizar Imports
Você precisa atualizar os imports em todos os arquivos. Execute:

```bash
# Para atualizar imports de features/app para @/client
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' 's|features/app/|@/client/|g' {} +

# Para atualizar imports de features/backoffice para @/admin  
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' 's|features/backoffice/|@/admin/|g' {} +
```

### 2. Configurar Path Aliases
Adicione ao seu `tsconfig.json`:

```json
{
  "extends": "./tsconfig.paths.json",
  "compilerOptions": {
    // ... resto da config
  }
}
```

### 3. Testar a Aplicação
```bash
npm run dev
# ou
yarn dev
```

### 4. Remover Estrutura Antiga
Após validar que tudo funciona:

```bash
rm -rf features/
```

## 📁 Backup
EOF
    
    if [ -f ".last_backup" ]; then
        echo "Backup salvo em: \`$(cat .last_backup)\`" >> "$REPORT_FILE"
    fi
    
    cat >> "$REPORT_FILE" << 'EOF'

## ⚠️ Atenção

- [ ] Atualizar imports nos arquivos
- [ ] Configurar path aliases no tsconfig.json
- [ ] Testar build: `npm run build`
- [ ] Testar aplicação: `npm run dev`
- [ ] Revisar barrel exports (index.ts)
- [ ] Validar que tudo funciona
- [ ] Remover pasta `features/` antiga

EOF
    
    cat "$REPORT_FILE"
    log_success "Relatório salvo em: $REPORT_FILE"
}

# Criar script de update de imports
create_update_imports_script() {
    log_info "Criando script para atualizar imports..."
    
    cat > "update-imports.sh" << 'EOF'
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
EOF
    
    chmod +x update-imports.sh
    log_success "Script update-imports.sh criado"
}

# Main
main() {
    echo ""
    log_info "=========================================="
    log_info "  MIGRAÇÃO DE ARQUITETURA - v2"
    log_info "=========================================="
    echo ""
    
    # Verificar diretório
    if [ ! -d "features" ]; then
        log_error "Diretório 'features' não encontrado!"
        log_error "Execute na raiz do projeto"
        exit 1
    fi
    
    # Confirmação
    echo -e "${YELLOW}Esta migração irá:${NC}"
    echo "  1. Criar backup de features/"
    echo "  2. Criar estrutura src/features/"
    echo "  3. Copiar todos os módulos para nova estrutura"
    echo "  4. Renomear arquivos conforme boas práticas"
    echo "  5. A pasta 'features' original NÃO será deletada"
    echo ""
    read -p "$(echo -e ${YELLOW}Continuar? [y/N]:${NC} )" -n 1 -r
    echo
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_warning "Migração cancelada"
        exit 0
    fi
    
    # Executar
    create_backup
    create_new_structure
    perform_migration
    create_tsconfig_paths
    create_update_imports_script
    generate_report
    
    echo ""
    log_success "=========================================="
    log_success "  MIGRAÇÃO CONCLUÍDA!"
    log_success "=========================================="
    echo ""
    log_info "📋 Próximos passos:"
    echo "  1. Execute: ./update-imports.sh"
    echo "  2. Configure path aliases no tsconfig.json"
    echo "  3. Teste: npm run dev"
    echo "  4. Se tudo OK, delete: rm -rf features/"
    echo ""
    log_info "📄 Veja detalhes em: migration_report.md"
    echo ""
}

main