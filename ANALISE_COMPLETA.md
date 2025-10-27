# 📊 ANÁLISE COMPLETA DO SISTEMA - Cafeterias API

## ✅ O QUE JÁ ESTÁ IMPLEMENTADO

### 1. Autenticação e Usuários ✅
- ✅ Registro de usuários (DEVELOPER, ADMIN, COZINHA, GARCOM)
- ✅ Login com JWT
- ✅ Middleware de autenticação (requireAuth, requireAdmin, requireDeveloper, etc.)
- ✅ Multi-tenant (usuários vinculados a restaurantes)
- ✅ Validação com Yup

### 2. Restaurantes ✅
- ✅ CRUD completo
- ✅ Apenas DEVELOPER pode criar/editar/deletar
- ✅ Upload de logo obrigatória
- ✅ Listagem pública para seleção
- ✅ Validação de dados

### 3. Warehouses (Estoques Físicos) ✅
- ✅ CRUD completo
- ✅ Múltiplos estoques por restaurante (Estoque Cozinha, Bar, etc.)
- ✅ Apenas ADMIN pode criar/editar
- ✅ Multi-tenant enforcement

### 4. Ingredientes ✅
- ✅ Cadastro vinculado a warehouse
- ✅ Stock criado automaticamente ao cadastrar (quantidade 0)
- ✅ Listagem com status de estoque
- ✅ Apenas ADMIN pode criar/deletar
- ✅ Cascade delete (deleta Stock, Stock_Movement, Notification)

### 5. Controle de Estoque (Stock) ✅
- ✅ Criação automática ao cadastrar ingrediente
- ✅ Adicionar estoque (ENTRADA) - ADMIN/DEVELOPER
- ✅ Definir estoque mínimo
- ✅ Registrar perda/desperdício - COZINHA/ADMIN
- ✅ Movimentações registradas (ENTRADA, SAIDA_RECEITA, SAIDA_PERDA)
- ✅ Visão geral do estoque por restaurante
- ✅ Validação multi-tenant

### 6. Produtos ✅
- ✅ CRUD completo
- ✅ Criação com receita (ingredientes + quantidades)
- ✅ Atualizar receita separadamente
- ✅ Visualizar produto com receita e estoque atual
- ✅ Apenas ADMIN pode criar/editar/deletar
- ✅ Multi-tenant enforcement

### 7. Produção de Produtos ✅
- ✅ Rota de produção: `POST /products/:productId/produce`
- ✅ Validação de estoque suficiente ANTES de produzir
- ✅ Erro detalhado se faltar ingredientes
- ✅ Consumo automático de estoque ao produzir
- ✅ Suporte a desperdício configurável (0-100%)
- ✅ Registro de movimentações (SAIDA_RECEITA + SAIDA_PERDA)
- ✅ Avisos de estoque baixo após produção
- ✅ COZINHA e ADMIN podem produzir

---

## ❌ O QUE FALTA IMPLEMENTAR

### 1. ❌ Sistema de Pedidos (CRÍTICO)
**Status:** NÃO IMPLEMENTADO

**O que está faltando:**
- ❌ `orderController.js` - Controller de pedidos
- ❌ Rotas de pedidos (criar, listar, buscar, atualizar status, deletar)
- ❌ Lógica de criação de pedido pelo GARCOM
- ❌ Adicionar itens ao pedido (Item_Order)
- ❌ Campo `additional` deve permitir adicionar ingredientes extras
- ❌ Ingredientes extras devem consumir estoque automaticamente
- ❌ Finalização de pedido pela COZINHA
- ❌ Opção de registrar desperdício ao finalizar pedido
- ❌ Histórico de pedidos por garçom/restaurante
- ❌ Consumo automático de estoque ao finalizar pedido

**Schema já existe:**
```prisma
model Orders {
  id           Int          @id @default(autoincrement())
  user         User         @relation(fields: [userId], references: [id])
  userId       Int          @unique  // ⚠️ PROBLEMA: deveria permitir múltiplos pedidos por usuário
  data_pedido  DateTime     @default(now())
  status_order status_order
  restaurantId Int
  restaurant   Restaurant   @relation(fields: [restaurantId], references: [id])
  Item_Order   Item_Order[]
}

model Item_Order {
  id         Int      @id @default(autoincrement())
  order      Orders   @relation(fields: [orderId], references: [id])
  orderId    Int
  product    Product  @relation(fields: [productId], references: [id])
  productId  Int
  quantity   Int
  additional String   // ⚠️ Precisa ser estruturado para ingredientes extras
  created_at DateTime @default(now())
  updated_at DateTime @updatedAt
}
```

**⚠️ PROBLEMA CRÍTICO NO SCHEMA:**
```prisma
userId Int @unique  // ❌ ERRO: Não permite múltiplos pedidos por usuário!
```
**Deveria ser:**
```prisma
userId Int  // ✅ Permite múltiplos pedidos
```

### 2. ❌ Sistema de Categorias
**Status:** PARCIALMENTE IMPLEMENTADO

**O que está faltando:**
- ❌ `categoryController.js` - Controller não existe
- ❌ Rotas de categorias (criar, listar, atualizar, deletar)
- ❌ Upload de imagem para categoria
- ❌ Apenas ADMIN pode criar categorias

**Schema já existe:**
```prisma
model Category {
  id        Int     @id @default(autoincrement())
  name      String
  image_url String? // URL da imagem da categoria
  restaurantId Int
  restaurant   Restaurant @relation(fields: [restaurantId], references: [id])
  created_at DateTime  @default(now())
  updated_at DateTime  @updatedAt
  Product    Product[]
  @@unique([name, restaurantId])
}
```

### 3. ❌ Sistema de Notificações Automáticas
**Status:** NÃO IMPLEMENTADO

**O que está faltando:**
- ❌ `notificationController.js` - Controller não existe
- ❌ Criação automática de notificação quando estoque fica abaixo do mínimo
- ❌ Listar notificações por restaurante
- ❌ Marcar notificação como lida
- ❌ Deletar notificações antigas

**Schema já existe:**
```prisma
model Notification {
  id           Int              @id @default(autoincrement())
  ingredient   Ingredient       @relation(fields: [ingredientId], references: [id], onDelete: Cascade)
  ingredientId Int
  type         NotificationType @default(LOW_STOCK)
  message      String // "Estoque baixo: Farinha (10g restantes)"
  is_read      Boolean          @default(false)
  restaurantId Int
  restaurant   Restaurant @relation(fields: [restaurantId], references: [id])
  created_at DateTime @default(now())
}
```

**Onde implementar:**
- Após adicionar estoque (`addStock`)
- Após consumir estoque (`produceProduct`, `registerStockLoss`)
- Após finalizar pedido (quando implementar)

### 4. ❌ Upload de Imagens para Produtos e Categorias
**Status:** NÃO IMPLEMENTADO

**O que está faltando:**
- ❌ Rota de upload para produtos
- ❌ Rota de upload para categorias
- ❌ Middleware de upload já existe (`uploadMiddleware.js`) mas não está sendo usado para produtos/categorias

**Já funciona para:**
- ✅ Restaurantes (logo obrigatória)

---

## ⚠️ PROBLEMAS ENCONTRADOS NO SCHEMA

### Problema 1: TipoUser enum está em INGLÊS
**Atual:**
```prisma
enum TipoUser {
  DEVELOPER
  ADMIN
  WAITER  // ❌ Deveria ser GARCOM
  KITCHEN // ❌ Deveria ser COZINHA
}
```

**Deveria ser:**
```prisma
enum TipoUser {
  DEVELOPER
  ADMIN
  GARCOM   // ✅
  COZINHA  // ✅
}
```

**Impacto:** Todos os middlewares e controllers já usam "COZINHA" e "GARCOM", mas o enum está diferente!

### Problema 2: WasteReason incompleto
**Atual:**
```prisma
enum WasteReason {
  VENCIMENTO
  DETERIORACAO
  DESPERDICIO
  OUTROS
}
```

**Deveria incluir (conforme já usado no código):**
```prisma
enum WasteReason {
  VENCIDO           // ✅ Já usado no código
  DETERIORADO       // ✅ Já usado no código
  CONTAMINADO       // ✅ Já usado no código
  QUEBRA            // ✅ Já usado no código
  DESPERDICIO_PREPARO // ✅ Já usado no código
  OUTROS            // ✅ Já existe
}
```

### Problema 3: Orders.userId com @unique
**Atual:**
```prisma
userId Int @unique  // ❌ Impede múltiplos pedidos por usuário
```

**Deveria ser:**
```prisma
userId Int  // ✅ Permite múltiplos pedidos
```

### Problema 4: Stock_Movement sem stockId
**Atual:**
```prisma
model Stock_Movement {
  id           Int          @id @default(autoincrement())
  ingredient   Ingredient   @relation(...)
  ingredientId Int
  user         User         @relation(...)
  userId       Int
  // ❌ FALTA: stockId Int (referência ao Stock)
}
```

**Obs:** O código usa `stockId` mas o schema tem `ingredientId` + user. Precisa verificar consistência.

---

## 📋 REQUISITOS vs IMPLEMENTAÇÃO

### ✅ Requisitos Atendidos:

1. ✅ **Multi-estabelecimentos** - Restaurantes isolados por ID
2. ✅ **4 tipos de usuário** - DEVELOPER, ADMIN, GARCOM (WAITER), COZINHA (KITCHEN)
3. ✅ **DEVELOPER exclusivo** - Apenas você/equipe cadastra restaurantes
4. ✅ **ADMIN gerencia tudo** - Produtos, ingredientes, estoque
5. ✅ **Múltiplos estoques** - Warehouses por setor (Cozinha, Bar, etc.)
6. ✅ **Ingredientes vinculados a warehouse** - Sim
7. ✅ **Estoque criado automaticamente** - Ao cadastrar ingrediente
8. ✅ **Estoque mínimo** - Configurável por ingrediente
9. ✅ **Movimentações registradas** - ENTRADA, SAIDA_RECEITA, SAIDA_PERDA
10. ✅ **Produtos com receita** - Ingredientes + quantidades
11. ✅ **Produção valida estoque** - Erro se faltar ingredientes
12. ✅ **Consumo automático na produção** - Sim, com desperdício opcional
13. ✅ **COZINHA registra perdas** - Sim, com motivos

### ❌ Requisitos NÃO Atendidos:

1. ❌ **GARCOM acessa lista de produtos** - Rota existe mas sem funcionalidade de pedido
2. ❌ **Histórico de pedidos por garçom** - Sistema de pedidos não implementado
3. ❌ **GARCOM cria pedidos** - Não implementado
4. ❌ **COZINHA finaliza pedidos** - Não implementado
5. ❌ **Desperdício ao finalizar pedido** - Não implementado (só existe na produção direta)
6. ❌ **Ingredientes extras consomem estoque** - Campo `additional` não estruturado
7. ❌ **Notificações de estoque baixo** - Schema existe mas lógica não implementada
8. ❌ **Categorias gerenciadas por ADMIN** - Controller não existe
9. ❌ **Upload de fotos para produtos** - Não implementado
10. ❌ **Upload de fotos para categorias** - Não implementado

---

## 🚨 PROBLEMAS DE LÓGICA IDENTIFICADOS

### 1. Sistema de Pedidos está confuso
**Sua descrição:** 
> "GARCOM cria pedido → COZINHA visualiza ingredientes → COZINHA finaliza → opção de desperdício → consome estoque"

**Implementação atual:**
> Não existe sistema de pedidos. A produção é feita diretamente via `POST /products/:productId/produce`

**Problema:**
- GARCOM deveria criar pedidos (Orders)
- Pedido deveria ter status: PENDING, IN_PROGRESS, COMPLETED, CANCELLED
- COZINHA deveria finalizar pedido (não produto isolado)
- Ao finalizar, consumir estoque de TODOS os produtos do pedido
- Desperdício deveria ser registrado ao finalizar PEDIDO, não produto

**Solução sugerida:**
1. GARCOM cria pedido: `POST /orders/create` com array de produtos
2. COZINHA lista pedidos pendentes: `GET /orders/pending`
3. COZINHA finaliza pedido: `POST /orders/:orderId/complete` (com opção de desperdício por ingrediente)
4. Sistema consome estoque automaticamente ao finalizar

### 2. Campo `additional` não estruturado
**Sua descrição:**
> "Item pode ter ingrediente adicional que deve ser descontado do estoque"

**Implementação atual:**
```prisma
additional String  // ❌ String simples, não permite vincular ingredientes
```

**Problema:**
- Como saber QUAL ingrediente foi adicionado?
- Como saber a QUANTIDADE adicionada?
- Como consumir do estoque?

**Solução sugerida:**
Criar modelo separado:
```prisma
model Item_Order_Additional {
  id           Int        @id @default(autoincrement())
  itemOrderId  Int
  itemOrder    Item_Order @relation(...)
  ingredientId Int
  ingredient   Ingredient @relation(...)
  quantity     Float
  unit         Unit
}
```

Ou usar JSON no campo `additional`:
```json
{
  "extras": [
    {"ingredientId": 5, "quantity": 50, "unit": "GRAMAS"},
    {"ingredientId": 8, "quantity": 20, "unit": "MILILITROS"}
  ]
}
```

### 3. Desperdício em dois lugares diferentes
**Implementação atual:**
- Desperdício na produção: `POST /products/:productId/produce` com `wastePercentage`
- Desperdício manual: `POST /stock/loss/:ingredientId`

**Sua descrição:**
> "Ao finalizar pedido, COZINHA escolhe se houve desperdício por ingrediente"

**Problema:**
- Você quer desperdício ao finalizar PEDIDO (não existe)
- Implementei desperdício na PRODUÇÃO direta de produto

**Solução sugerida:**
- Manter desperdício na produção direta (para uso interno)
- Adicionar desperdício ao finalizar PEDIDO (para fluxo GARCOM → COZINHA)

---

## 📝 CHECKLIST PARA PRODUTO FINAL

### Backend Profissional Completo:

#### 1. Controllers Faltantes:
- [ ] `orderController.js` - Sistema de pedidos
- [ ] `categoryController.js` - CRUD de categorias
- [ ] `notificationController.js` - Notificações automáticas

#### 2. Rotas Faltantes:
- [ ] POST `/orders/create` - GARCOM cria pedido
- [ ] GET `/orders/restaurant/:restaurantId` - Listar pedidos
- [ ] GET `/orders/:orderId` - Buscar pedido específico
- [ ] PUT `/orders/:orderId/status` - Atualizar status (COZINHA aceita)
- [ ] POST `/orders/:orderId/complete` - COZINHA finaliza + consome estoque
- [ ] DELETE `/orders/:orderId` - Cancelar pedido
- [ ] POST `/categories/create` - ADMIN cria categoria (com upload)
- [ ] GET `/categories/restaurant/:restaurantId` - Listar categorias
- [ ] PUT `/categories/:categoryId` - Atualizar categoria
- [ ] DELETE `/categories/:categoryId` - Deletar categoria
- [ ] GET `/notifications/restaurant/:restaurantId` - Listar notificações
- [ ] PUT `/notifications/:notificationId/read` - Marcar como lida
- [ ] DELETE `/notifications/:notificationId` - Deletar notificação

#### 3. Migrations Necessárias:
- [ ] Corrigir `TipoUser` enum (WAITER → GARCOM, KITCHEN → COZINHA)
- [ ] Corrigir `WasteReason` enum (adicionar VENCIDO, DETERIORADO, etc.)
- [ ] Remover `@unique` de `Orders.userId`
- [ ] Adicionar `Item_Order_Additional` (ou estruturar campo `additional`)

#### 4. Lógica Faltante:
- [ ] Criação automática de notificações ao estoque ficar abaixo do mínimo
- [ ] Upload de imagem para produtos
- [ ] Upload de imagem para categorias
- [ ] Validação de ingredientes extras no pedido
- [ ] Consumo automático de estoque ao finalizar pedido
- [ ] Histórico de pedidos por garçom

#### 5. Validações e Segurança:
- [ ] Validação de schemas com Yup para orders
- [ ] Validação de schemas com Yup para categories
- [ ] Multi-tenant enforcement em TODAS as rotas de orders
- [ ] Permissões corretas (GARCOM cria pedido, COZINHA finaliza)

#### 6. Documentação:
- [ ] Atualizar `PRODUTOS_PRODUCAO.md` com sistema de pedidos
- [ ] Criar `ORDERS_WORKFLOW.md` explicando fluxo completo
- [ ] Documentar rotas na rota raiz `/`

---

## 🎯 PRIORIDADES PARA FINALIZAÇÃO

### CRÍTICO (Sem isso não funciona conforme requisitos):
1. **Sistema de Pedidos completo** - orderController + rotas + lógica
2. **Corrigir schema** - Remover @unique de userId, corrigir enums
3. **Ingredientes extras estruturados** - Item_Order_Additional ou JSON

### IMPORTANTE (Funcionalidades essenciais):
4. **Sistema de Categorias** - categoryController + upload de imagens
5. **Notificações automáticas** - notificationController + lógica de criação
6. **Upload para produtos** - Rota de upload de imagem

### DESEJÁVEL (Melhorias):
7. **Histórico detalhado de pedidos**
8. **Relatórios de desperdício**
9. **Dashboard de estoque**

---

## 📊 RESUMO EXECUTIVO

### Status Atual: **70% Completo**

**O que funciona perfeitamente:**
- ✅ Autenticação e autorização multi-tenant
- ✅ Gestão de restaurantes
- ✅ Gestão de warehouses
- ✅ Gestão de ingredientes
- ✅ Controle de estoque completo
- ✅ Gestão de produtos com receitas
- ✅ Produção de produtos com consumo automático

**O que falta para 100%:**
- ❌ Sistema de pedidos (GARCOM → COZINHA)
- ❌ Sistema de categorias com CRUD
- ❌ Sistema de notificações automáticas
- ❌ Correções no schema (enums, @unique)
- ❌ Upload de imagens para produtos/categorias
- ❌ Estruturação de ingredientes extras

**Tempo estimado para finalização:** 
- Sistema de pedidos: **8-12 horas**
- Categorias: **2-3 horas**
- Notificações: **3-4 horas**
- Correções schema: **1-2 horas**
- Uploads: **2-3 horas**
- **TOTAL: 16-24 horas de desenvolvimento**

---

## 🚀 PRÓXIMOS PASSOS RECOMENDADOS

1. **Corrigir Schema** (1-2h)
   - Remover @unique de Orders.userId
   - Corrigir TipoUser enum
   - Corrigir WasteReason enum
   - Aplicar migration

2. **Sistema de Pedidos** (8-12h)
   - Criar orderController.js
   - Implementar rotas de pedidos
   - Lógica de finalização com consumo de estoque
   - Opção de desperdício ao finalizar

3. **Sistema de Categorias** (2-3h)
   - Criar categoryController.js
   - Implementar CRUD
   - Upload de imagens

4. **Sistema de Notificações** (3-4h)
   - Criar notificationController.js
   - Lógica de criação automática
   - Rotas de listagem e marcação

5. **Testes e Documentação** (2-3h)
   - Testar fluxo completo
   - Atualizar documentação
   - Criar exemplos de uso

**Total estimado: 16-24 horas**
