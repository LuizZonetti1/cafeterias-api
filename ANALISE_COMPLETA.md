# 📊 ANÁLISE COMPLETA DO SISTEMA - Cafeterias API

**Última atualização:** 26/10/2025  
**Status Atual:** 85% completo - Sistema funcional em produção

---

## ✅ O QUE JÁ ESTÁ IMPLEMENTADO

### 1. Autenticação e Usuários ✅
- ✅ Registro de usuários (DEVELOPER, ADMIN, COZINHA, GARCOM)
- ✅ Login com JWT
- ✅ Middleware de autenticação (requireAuth, requireAdmin, requireDeveloper, etc.)
- ✅ Multi-tenant (usuários vinculados a restaurantes)
- ✅ Validação com Yup (userValidation, restaurantValidation)

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
- ✅ Movimentações registradas (ENTRADA, SAIDA_PEDIDO, SAIDA_PERDA)
- ✅ Visão geral do estoque por restaurante
- ✅ Validação multi-tenant

### 6. Categorias ✅ (Step 3)
- ✅ CRUD completo (categoryController.js)
- ✅ Upload de imagens (multer)
- ✅ Multi-tenant enforcement
- ✅ Validação de produtos vinculados antes de deletar
- ✅ URLs públicas para imagens

### 7. Produtos ✅
- ✅ CRUD completo com upload de imagens
- ✅ Criação com receita (ingredientes + quantidades)
- ✅ Atualizar receita separadamente
- ✅ Visualizar produto com receita e estoque atual
- ✅ Apenas ADMIN pode criar/editar/deletar
- ✅ Multi-tenant enforcement
- ✅ Upload de imagens (Step 3)

### 8. Sistema de Pedidos ✅ (Step 2 + 3)
- ✅ `orderController.js` completo
- ✅ Criar pedido (GARCOM) - `POST /orders`
- ✅ Listar pedidos por restaurante - `GET /orders`
- ✅ Buscar pedido por ID - `GET /orders/:orderId`
- ✅ Atualizar status - `PUT /orders/:orderId/status`
- ✅ Finalizar pedido (COZINHA) - `POST /orders/:orderId/complete`
- ✅ Cancelar pedido - `DELETE /orders/:orderId`
- ✅ Consumo automático de estoque ao finalizar
- ✅ Registro de desperdício configurável
- ✅ **Adicionais estruturados com controle de estoque** (Step 3)
  - ✅ Tabela `Item_Order_Additional`
  - ✅ Validação de ingredientes extras
  - ✅ Consumo automático de estoque dos adicionais
  - ✅ Cálculo de preço incluindo adicionais
  - ✅ Movimentações rastreadas

### 9. Upload de Arquivos ✅
- ✅ Multer configurado
- ✅ Upload de logos (restaurantes)
- ✅ Upload de imagens (categorias)
- ✅ Upload de imagens (produtos)
- ✅ Validação de tipo e tamanho
- ✅ URLs públicas geradas

### 10. Produção de Produtos ✅
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

## 🎯 SPRINT 4: Qualidade & Segurança para Produção

**Objetivo:** Deixar o sistema robusto, seguro e com qualidade profissional para equipe pequena (4 pessoas, 1 dev backend)

**Tempo estimado:** 4-6 horas

### ✅ Tarefas Sprint 4:

#### 1. **Sistema de Notificações Automáticas** ⏱️ 2h
**Por quê é importante:** ADMIN precisa ser alertado quando ingredientes estão acabando

**Implementar:**
- [ ] `notificationController.js` com CRUD completo
- [ ] Criar notificação automática quando `estoque atual < estoque mínimo`
- [ ] Rotas: `GET /notifications/:restaurantId`, `PUT /notifications/:id/read`, `DELETE /notifications/:id`
- [ ] Integrar criação automática nos controllers: `stockController`, `orderController`

---

#### 2. **Error Handler Centralizado** ⏱️ 1h
**Por quê é importante:** Erros padronizados facilitam debug e melhoram experiência do usuário

**Implementar:**
- [ ] Criar `src/middlewares/errorHandler.js`
- [ ] Tratar erros do Prisma (P2002, P2025, P2003, etc.)
- [ ] Tratar erros de validação Yup
- [ ] Tratar erros de JWT
- [ ] Logs de erro estruturados
- [ ] Aplicar no `app.js` como último middleware

---

#### 3. **Validações Faltantes** ⏱️ 1h
**Por quê é importante:** Prevenir dados inválidos antes de chegar ao banco

**Implementar:**
- [ ] `src/validations/orderValidation.js`
- [ ] `src/validations/categoryValidation.js`
- [ ] Aplicar nas rotas correspondentes

---

#### 4. **Rate Limiting & Helmet (Segurança)** ⏱️ 30min
**Por quê é importante:** Proteger API de ataques DDoS e vulnerabilidades comuns

**Implementar:**
- [ ] Instalar: `npm install express-rate-limit helmet`
- [ ] Configurar helmet para headers de segurança
- [ ] Configurar rate limiting (100 requests/15min)

---

#### 5. **Validação de Variáveis de Ambiente** ⏱️ 30min
**Por quê é importante:** Evitar deploy quebrado por falta de configuração

**Implementar:**
- [ ] Criar `src/config/env.js`
- [ ] Validar variáveis obrigatórias no startup
- [ ] Falhar rápido se variável estiver faltando

---

#### 6. **Health Check Endpoint** ⏱️ 15min
**Por quê é importante:** Monitorar se API está funcionando

**Implementar:**
- [ ] Criar rota `GET /health`
- [ ] Testar conexão com banco
- [ ] Retornar status + uptime

---

### ⚠️ Itens NÃO incluídos no Sprint 4 (não essenciais para equipe pequena):

❌ **Testes automatizados** - Tempo: 20-30h  
*Motivo:* Equipe pequena, 1 dev backend. Testes manuais são suficientes inicialmente.

❌ **Documentação Swagger** - Tempo: 8-12h  
*Motivo:* Com 4 pessoas na equipe, documentação markdown é suficiente. Frontend pode consultar código diretamente.

❌ **Docker & CI/CD** - Tempo: 6-8h  
*Motivo:* Deploy manual é aceitável para MVP. Implementar quando escalar.

❌ **Logging estruturado (Winston)** - Tempo: 4-6h  
*Motivo:* Console.log é suficiente para debug em equipe pequena. Implementar se crescer.

❌ **WebSockets** - Tempo: 10-15h  
*Motivo:* Polling ou refresh manual é aceitável inicialmente. Adicionar quando tiver demanda.

---

## 📊 Sprint 5 (Opcional - Futuro):

**Para quando crescer ou precisar escalar:**

#### Documentação Profissional:
- [ ] Swagger/OpenAPI completo (8-12h)
- [ ] Postman Collection atualizada
- [ ] README detalhado com exemplos

#### Infraestrutura:
- [ ] Docker + docker-compose (4-6h)
- [ ] GitHub Actions CI/CD (2-3h)
- [ ] Logging estruturado com Winston (4-6h)
- [ ] Paginação em todas as listagens (3-4h)

#### Funcionalidades Avançadas:
- [ ] WebSockets para notificações em tempo real (10-15h)
- [ ] Relatórios avançados (vendas, desperdício, estoque) (8-12h)
- [ ] Sistema de backup automático (2-3h)
- [ ] Métricas e dashboard de monitoramento (6-8h)

**Total Sprint 5:** 40-65 horas

---

### 📡 WebSockets - Notificações em Tempo Real (Sprint 5)

**Por quê implementar:** Atualizar tela automaticamente sem refresh, melhor UX

**Quando implementar:**
- ✅ Quando tiver múltiplos usuários simultâneos
- ✅ Quando COZINHA precisar ver pedidos novos instantaneamente
- ✅ Quando ADMIN precisar ver notificações em tempo real
- ❌ NÃO é essencial para MVP com poucos usuários

---

#### Implementação com Socket.IO

**1. Instalar dependências:**
```bash
npm install socket.io cors
```

**2. Configurar Socket.IO no servidor (`src/server.js`):**

```javascript
import { createServer } from 'http'
import { Server } from 'socket.io'
import app from './app.js'
import { config } from './config/env.js'

// Criar servidor HTTP
const httpServer = createServer(app)

// Configurar Socket.IO
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['websocket', 'polling']
})

// Middleware de autenticação WebSocket
io.use((socket, next) => {
  const token = socket.handshake.auth.token
  
  if (!token) {
    return next(new Error('Authentication error'))
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret)
    socket.userId = decoded.userId
    socket.restaurantId = decoded.restaurantId
    socket.tipoUser = decoded.tipo_user
    next()
  } catch (err) {
    next(new Error('Invalid token'))
  }
})

// Gerenciar conexões
io.on('connection', (socket) => {
  console.log(`✅ Cliente conectado: ${socket.id}`)
  console.log(`   User ID: ${socket.userId}`)
  console.log(`   Restaurant ID: ${socket.restaurantId}`)

  // Cliente entra na "sala" do seu restaurante
  socket.join(`restaurant:${socket.restaurantId}`)
  
  // Evento de desconexão
  socket.on('disconnect', () => {
    console.log(`❌ Cliente desconectado: ${socket.id}`)
  })
})

// Tornar io disponível globalmente
app.set('io', io)

// Iniciar servidor
httpServer.listen(config.port, () => {
  console.log(`🚀 Servidor rodando na porta ${config.port}`)
  console.log(`📡 WebSocket habilitado`)
})
```

---

#### Eventos WebSocket por Módulo

**3. Notificações em Tempo Real:**

```javascript
// src/app/controllers/notificationController.js

export const createNotification = async (ingredientData, restaurantId) => {
  // ... código existente de criação ...

  const notification = await prisma.notification.create({
    data: {
      ingredientId: ingredientData.id,
      restaurantId,
      type: ingredientData.quantity_current === 0 ? 'OUT_OF_STOCK' : 'LOW_STOCK',
      message: `Estoque baixo: ${ingredientData.name} (${ingredientData.quantity_current}${ingredientData.unit} restantes)`
    },
    include: {
      ingredient: true
    }
  })

  // 🔥 EMITIR EVENTO WEBSOCKET
  const io = req.app.get('io')
  io.to(`restaurant:${restaurantId}`).emit('notification:created', {
    notification,
    timestamp: new Date()
  })

  return notification
}
```

**4. Pedidos em Tempo Real:**

```javascript
// src/app/controllers/orderController.js

export const createOrder = async (req, res) => {
  // ... código de criação do pedido ...

  const order = await prisma.orders.create({
    data: { /* ... */ },
    include: {
      Item_Order: {
        include: {
          product: true,
          Item_Order_Additional: {
            include: { ingredient: true }
          }
        }
      }
    }
  })

  // 🔥 NOTIFICAR COZINHA EM TEMPO REAL
  const io = req.app.get('io')
  io.to(`restaurant:${restaurantId}`).emit('order:created', {
    order,
    timestamp: new Date(),
    message: `Novo pedido #${order.id} criado por ${req.user.name}`
  })

  return res.status(201).json({ order })
}

export const updateOrderStatus = async (req, res) => {
  // ... atualizar status ...

  // 🔥 NOTIFICAR MUDANÇA DE STATUS
  const io = req.app.get('io')
  io.to(`restaurant:${restaurantId}`).emit('order:updated', {
    orderId: order.id,
    status: order.status_order,
    timestamp: new Date()
  })
}

export const completeOrder = async (req, res) => {
  // ... finalizar pedido ...

  // 🔥 NOTIFICAR CONCLUSÃO
  const io = req.app.get('io')
  io.to(`restaurant:${restaurantId}`).emit('order:completed', {
    orderId: order.id,
    stockConsumed: consumptionDetails,
    timestamp: new Date()
  })
}
```

**5. Estoque em Tempo Real:**

```javascript
// src/app/controllers/stockController.js

export const addStock = async (req, res) => {
  // ... adicionar estoque ...

  // 🔥 NOTIFICAR ATUALIZAÇÃO DE ESTOQUE
  const io = req.app.get('io')
  io.to(`restaurant:${restaurantId}`).emit('stock:updated', {
    ingredientId: ingredient.id,
    ingredientName: ingredient.name,
    oldQuantity,
    newQuantity: updatedStock.quantity_current,
    type: 'ENTRADA',
    timestamp: new Date()
  })
}
```

---

#### Frontend - Como Conectar (React/Vue/Angular)

**6. Cliente React com Socket.IO:**

```javascript
// src/hooks/useWebSocket.js
import { useEffect, useState } from 'react'
import io from 'socket.io-client'

export function useWebSocket() {
  const [socket, setSocket] = useState(null)
  const [notifications, setNotifications] = useState([])
  const [orders, setOrders] = useState([])

  useEffect(() => {
    // Conectar ao WebSocket
    const token = localStorage.getItem('token')
    
    const newSocket = io('http://localhost:3333', {
      auth: { token },
      transports: ['websocket', 'polling']
    })

    // Conexão estabelecida
    newSocket.on('connect', () => {
      console.log('✅ WebSocket conectado')
    })

    // Ouvir notificações
    newSocket.on('notification:created', (data) => {
      console.log('🔔 Nova notificação:', data)
      setNotifications(prev => [data.notification, ...prev])
      
      // Mostrar toast/alerta
      showToast('Alerta de Estoque', data.notification.message, 'warning')
    })

    // Ouvir novos pedidos
    newSocket.on('order:created', (data) => {
      console.log('📋 Novo pedido:', data)
      setOrders(prev => [data.order, ...prev])
      
      // Tocar som + notificação
      playNotificationSound()
      showToast('Novo Pedido', `Pedido #${data.order.id} recebido`, 'info')
    })

    // Ouvir atualização de pedido
    newSocket.on('order:updated', (data) => {
      setOrders(prev => 
        prev.map(order => 
          order.id === data.orderId 
            ? { ...order, status_order: data.status }
            : order
        )
      )
    })

    // Ouvir pedido concluído
    newSocket.on('order:completed', (data) => {
      setOrders(prev => 
        prev.map(order => 
          order.id === data.orderId 
            ? { ...order, status_order: 'COMPLETED' }
            : order
        )
      )
      showToast('Pedido Concluído', `Pedido #${data.orderId} finalizado`, 'success')
    })

    // Ouvir atualização de estoque
    newSocket.on('stock:updated', (data) => {
      console.log('📦 Estoque atualizado:', data)
      // Atualizar lista de estoque na tela
    })

    // Erro de conexão
    newSocket.on('connect_error', (error) => {
      console.error('❌ Erro WebSocket:', error)
    })

    setSocket(newSocket)

    // Cleanup ao desmontar
    return () => {
      newSocket.close()
    }
  }, [])

  return { socket, notifications, orders }
}
```

**7. Usar no componente:**

```javascript
// src/pages/CozinhaPage.jsx
import { useWebSocket } from '../hooks/useWebSocket'

function CozinhaPage() {
  const { orders, notifications } = useWebSocket()

  return (
    <div>
      <h1>Pedidos Pendentes</h1>
      
      {/* Lista atualiza automaticamente sem refresh */}
      {orders.filter(o => o.status_order === 'PENDING').map(order => (
        <OrderCard key={order.id} order={order} />
      ))}

      {/* Notificações em tempo real */}
      <NotificationBell notifications={notifications} />
    </div>
  )
}
```

---

#### Casos de Uso WebSocket

**Cenário 1: Novo Pedido**
```
1. GARCOM cria pedido no celular
   ↓
2. Backend emite: order:created
   ↓
3. Tela da COZINHA atualiza INSTANTANEAMENTE
   ↓
4. Som de notificação toca
   ↓
5. COZINHA vê pedido sem dar refresh
```

**Cenário 2: Estoque Baixo**
```
1. COZINHA finaliza pedido
   ↓
2. Estoque de café cai para 50g (< 100g mínimo)
   ↓
3. Backend cria notificação + emite: notification:created
   ↓
4. Tela do ADMIN mostra alerta VERMELHO instantaneamente
   ↓
5. ADMIN vê sem precisar atualizar página
```

**Cenário 3: Status do Pedido**
```
1. COZINHA clica "Iniciar Preparo"
   ↓
2. Backend emite: order:updated (status: IN_PROGRESS)
   ↓
3. Tela do GARCOM atualiza status do pedido
   ↓
4. Cliente vê que pedido está sendo preparado
```

---

#### Vantagens vs Desvantagens

**✅ VANTAGENS:**
- UX excepcional (atualização instantânea)
- Reduz carga no servidor (menos polling)
- Melhor comunicação entre setores
- Notificações push automáticas
- Sensação de "app moderno"

**❌ DESVANTAGENS:**
- Complexidade aumenta (10-15h implementação)
- Requer servidor sempre ligado
- Mais difícil de debugar
- Conexões persistentes (mais recursos)
- Fallback para polling se WebSocket falhar

---

#### Quando NÃO usar WebSocket (atual):

Para equipe de 4 pessoas com 1 backend dev:
- ❌ Poucos usuários simultâneos (polling é suficiente)
- ❌ COZINHA pode dar refresh a cada 30s
- ❌ Notificações podem aparecer no próximo acesso
- ❌ Complexidade não justifica o benefício inicial
- ❌ Foco em funcionalidades core primeiro

**Alternativa simples:** Frontend faz polling a cada 15-30 segundos
```javascript
// Muito mais simples que WebSocket
useEffect(() => {
  const interval = setInterval(() => {
    fetchOrders() // Busca pedidos novos
  }, 15000) // A cada 15s

  return () => clearInterval(interval)
}, [])
```

---

#### Quando SIM usar WebSocket (futuro):

✅ Quando tiver 10+ usuários simultâneos  
✅ Quando COZINHA reclamar de "não ver pedidos novos rapidamente"  
✅ Quando tiver múltiplos garçons criando pedidos  
✅ Quando ADMIN precisar monitorar estoque em tempo real  
✅ Quando quiser oferecer experiência premium  

**Recomendação:** Implemente **DEPOIS** do Sprint 4, quando sistema estiver estável e com usuários reais testando.

---

## 📊 RESUMO EXECUTIVO ATUALIZADO

### Status Atual: **85% Completo** ✅

**O que funciona perfeitamente:**
- ✅ Autenticação JWT multi-tenant
- ✅ Gestão de restaurantes com upload
- ✅ Gestão de warehouses
- ✅ Gestão de ingredientes
- ✅ Controle de estoque completo (entrada, saída, perdas)
- ✅ Gestão de produtos com receitas e upload de imagens
- ✅ Gestão de categorias com upload de imagens
- ✅ **Sistema de pedidos completo** (GARCOM → COZINHA)
- ✅ **Adicionais estruturados com controle de estoque**
- ✅ Consumo automático de estoque ao finalizar pedidos
- ✅ Produção de produtos com desperdício configurável

**O que falta para 90% (Produção-Ready):**
- 🔶 Sistema de notificações automáticas (Sprint 4 - 2h)
- 🔶 Error handler centralizado (Sprint 4 - 1h)
- 🔶 Validações faltantes (Sprint 4 - 1h)
- 🔶 Rate limiting + Helmet (Sprint 4 - 30min)
- 🔶 Validação de env vars (Sprint 4 - 30min)
- 🔶 Health check endpoint (Sprint 4 - 15min)

**O que falta para 100% (Enterprise):**
- ⚪ Testes automatizados (Sprint 5 - 20-30h)
- ⚪ Swagger/Documentação (Sprint 5 - 8-12h)
- ⚪ Docker + CI/CD (Sprint 5 - 6-9h)
- ⚪ Logging estruturado (Sprint 5 - 4-6h)
- ⚪ WebSockets tempo real (Sprint 5 - 10-15h)

---

## 🚀 RECOMENDAÇÃO PARA SUA EQUIPE

### **Implementar AGORA (Sprint 4):**
✅ Notificações, Error Handler, Validações, Security  
**Resultado:** Sistema **90% pronto** e seguro para produção  
**Tempo:** 4-6 horas (1 dia de trabalho)

### **Implementar DEPOIS (Sprint 5):**
⚪ Testes, Swagger, Docker, Logs, WebSockets  
**Resultado:** Sistema **100% enterprise-grade**  
**Tempo:** 40-65 horas (1-2 semanas)  
**Quando:** Quando a aplicação crescer, tiver mais usuários ou precisar escalar

---

## 💡 **DECISÃO: Sprint 4 Essencial!**

**Para equipe de 4 pessoas (1 dev backend):**
- ✅ **Sprint 4 é ESSENCIAL** → Segurança e qualidade mínima
- ⚠️ **Sprint 5 é OPCIONAL** → Só se precisar escalar ou ter demanda

**Seu sistema já está funcional (85%)!** Sprint 4 vai deixá-lo **produção-ready (90%)** com pouquíssimo esforço (4-6h).

