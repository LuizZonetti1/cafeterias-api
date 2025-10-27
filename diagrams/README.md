# 📊 Diagramas UML - Cafeterias API

Este diretório contém todos os diagramas UML do sistema em formato PlantUML.

## 📁 Arquivos

### 1. `database-diagram.puml`
**Diagrama de Entidade-Relacionamento (ER)**
- Mostra todas as tabelas do banco de dados
- Relacionamentos entre entidades (1:1, 1:N)
- Chaves primárias, estrangeiras e únicas
- Enums do sistema
- Anotações com regras de negócio

### 2. `use-case-diagram.puml`
**Diagrama de Casos de Uso**
- 4 atores: DEVELOPER, ADMIN, GARCOM, COZINHA
- Todos os casos de uso por módulo
- Relacionamentos include e extend
- Anotações sobre permissões

### 3. `sequence-order-flow.puml`
**Diagrama de Sequência - Fluxo de Pedido Completo**
- Fluxo detalhado desde criação até finalização do pedido
- Mostra interação entre GARCOM, API, Controllers, Database, COZINHA
- Incluí validações, consumo de estoque e criação de notificações
- 4 fases: Criar Pedido → Aceitar → Finalizar → Notificar

### 4. `architecture-diagram.puml`
**Diagrama de Arquitetura de Componentes**
- Camadas do sistema (Middlewares, Routes, Controllers, Services, Data Access)
- Fluxo de dados entre componentes
- Integração com PostgreSQL e File System
- Padrão MVC com camada de serviços

## 🎨 Como Visualizar os Diagramas

### Opção 1: Online (Mais Fácil)

1. **PlantUML Online Editor**
   - Acesse: https://www.plantuml.com/plantuml/uml/
   - Cole o conteúdo do arquivo `.puml`
   - Visualize o diagrama renderizado
   - Baixe como PNG, SVG ou PDF

2. **PlantText**
   - Acesse: https://www.planttext.com/
   - Cole o código
   - Clique em "Refresh"

### Opção 2: VS Code (Recomendado para Desenvolvimento)

1. **Instalar Extensão**
   ```
   - Extensão: "PlantUML" by jebbs
   - ID: jebbs.plantuml
   ```

2. **Instalar Java** (necessário para a extensão)
   - Baixe: https://www.java.com/download/
   - Instale e reinicie o VS Code

3. **Instalar Graphviz** (opcional, melhora qualidade)
   ```powershell
   choco install graphviz
   ```
   Ou baixe: https://graphviz.org/download/

4. **Visualizar no VS Code**
   - Abra arquivo `.puml`
   - Pressione `Alt+D` ou `Ctrl+Shift+P` → "PlantUML: Preview Current Diagram"
   - Exportar: `Ctrl+Shift+P` → "PlantUML: Export Current Diagram"

### Opção 3: Exportar para Imagem

**No VS Code com extensão PlantUML:**
1. Abra o arquivo `.puml`
2. `Ctrl+Shift+P` → "PlantUML: Export Current Diagram"
3. Escolha formato: PNG, SVG, PDF
4. Imagem salva na pasta `out/`

**Online:**
1. Acesse https://www.plantuml.com/plantuml/uml/
2. Cole o código
3. Clique com botão direito na imagem → "Salvar imagem como..."

## 📐 Dimensões Recomendadas

- **database-diagram.puml:** 1920x1080 (paisagem)
- **use-case-diagram.puml:** 1600x1200 (paisagem)
- **sequence-order-flow.puml:** 1200x2400 (retrato - diagrama longo)
- **architecture-diagram.puml:** 1600x1200 (paisagem)

## 🔄 Atualizar Diagramas

Sempre que houver mudanças no sistema:

1. **Mudança no Banco de Dados:**
   - Atualizar `database-diagram.puml`
   - Adicionar novos modelos, campos ou relacionamentos

2. **Novas Funcionalidades:**
   - Atualizar `use-case-diagram.puml`
   - Adicionar novos casos de uso

3. **Mudanças em Fluxos:**
   - Atualizar `sequence-order-flow.puml`
   - Criar novos diagramas de sequência se necessário

4. **Mudanças Arquiteturais:**
   - Atualizar `architecture-diagram.puml`
   - Adicionar novos componentes ou camadas

## 📚 Recursos

- **Documentação PlantUML:** https://plantuml.com/
- **Exemplos de Diagramas:** https://real-world-plantuml.com/
- **Sintaxe PlantUML:** https://plantuml.com/guide
- **C4 Model (Arquitetura):** https://c4model.com/

## 🎯 Uso na Documentação

Estes diagramas são referenciados no arquivo principal:
- `DOCUMENTACAO_SISTEMA.md` - Seção "Diagrama UML"

Para incluir na documentação:
1. Exporte os diagramas como PNG
2. Salve na pasta `diagrams/images/`
3. Referencie no Markdown:
   ```markdown
   ![Database Diagram](diagrams/images/database-diagram.png)
   ```

## ✅ Checklist de Qualidade

Ao criar/atualizar diagramas, verifique:

- [ ] Todas as entidades estão representadas
- [ ] Relacionamentos estão corretos (cardinalidade)
- [ ] Chaves primárias e estrangeiras estão marcadas
- [ ] Anotações explicam regras de negócio importantes
- [ ] Cores ajudam a identificar grupos/tipos
- [ ] Legenda está presente quando necessário
- [ ] Diagrama é legível (não muito poluído)
- [ ] Nomes em português consistentes com o código

---

**Criado em:** Outubro 2025  
**Última atualização:** Outubro 2025  
**Versão:** 1.0.0
