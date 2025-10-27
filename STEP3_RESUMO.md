# ✅ Step 3: Sistema de Categorias + Adicionais Estruturados

## 📋 Implementações

### 1. Sistema de Categorias (CRUD Completo)

**Arquivo:** `src/app/controllers/categoryController.js`

**Endpoints:**
- `POST /categories` - Criar categoria com upload de imagem
- `GET /categories/:restaurantId` - Listar categorias por restaurante
- `GET /categories/detail/:categoryId` - Detalhes de uma categoria
- `PUT /categories/:categoryId` - Atualizar categoria (com imagem)
- `DELETE /categories/:categoryId` - Deletar categoria (valida produtos vinculados)

**Recursos:**
- ✅ Upload de imagens via multer (`uploads/categories/`)
- ✅ Multi-tenant: categorias isoladas por restaurante
- ✅ Validação de produtos vinculados antes de deletar
- ✅ Permissões: DEVELOPER global, outros apenas do próprio restaurante
- ✅ Geração automática de URLs públicas para imagens

---

### 2. Upload de Imagens para Produtos

**Arquivo:** `src/app/controllers/productController.js`

**Modificações:**
- ✅ `POST /products` - Agora aceita upload de imagem
- ✅ `PUT /products/:productId` - Permite atualizar imagem do produto
- ✅ Middleware `upload.single('image')` aplicado nas rotas

**Estrutura de upload:**
```
uploads/
  ├── categories/      (imagens de categorias)
  ├── products/        (imagens de produtos)
  └── restaurants/     (imagens de restaurantes)
```

---

### 3. Sistema de Adicionais Estruturado

**Schema:** `prisma/schema.prisma`

**Nova tabela:** `Item_Order_Additional`
```prisma
model Item_Order_Additional {
  id           Int        @id @default(autoincrement())
  itemOrderId  Int
  ingredientId Int
  quantity     Float      // Quantidade do adicional
  unit         Unit       // GRAMAS, LITROS, UNIDADES, MILILITROS
  price        Float      @default(0) // Preço do adicional
  created_at   DateTime   @default(now())
  
  itemOrder    Item_Order @relation(fields: [itemOrderId], references: [id])
  ingredient   Ingredient @relation(fields: [ingredientId], references: [id])
}
```

**Relacionamentos:**
- `Item_Order` → `Item_Order_Additional[]` (um item pode ter vários adicionais)
- `Ingredient` → `Item_Order_Additional[]` (um ingrediente pode ser adicional em vários itens)

---

### 4. Controller de Pedidos com Adicionais

**Arquivo:** `src/app/controllers/orderController.js`

#### 4.1. Criar Pedido com Adicionais

**Endpoint:** `POST /orders`

**Novo formato aceito:**
```json
{
  "items": [
    {
      "productId": 1,
      "quantity": 2,
      "additional": "Sem cebola",  // ← Campo legado (texto livre)
      "observations": "Cliente alérgico",
      "additionalIngredients": [   // ← NOVO: adicionais estruturados
        {
          "ingredientId": 5,
          "quantity": 50,
          "unit": "GRAMAS",
          "price": 2.50
        }
      ]
    }
  ]
}
```

**Funcionalidades:**
- ✅ Valida existência e permissão dos ingredientes adicionais
- ✅ Calcula preço total incluindo adicionais
- ✅ Cria registros em `Item_Order_Additional`
- ✅ Retorna detalhes completos dos adicionais na resposta

#### 4.2. Finalizar Pedido com Consumo de Adicionais

**Endpoint:** `POST /orders/:orderId/complete`

**Funcionalidades:**
- ✅ Valida estoque dos ingredientes da receita + adicionais
- ✅ Consome estoque dos adicionais automaticamente
- ✅ Registra movimentação `SAIDA_PEDIDO` para adicionais
- ✅ Inclui adicionais no cálculo de desperdício se configurado
- ✅ Alerta quando estoque fica abaixo do mínimo

**Exemplo de resposta:**
```json
{
  "success": true,
  "message": "✅ Pedido finalizado com sucesso!",
  "stockConsumption": {
    "items": [
      {
        "ingredient": "Queijo Mussarela",
        "consumed": 150,
        "source": "receita",
        "newStock": 850
      },
      {
        "ingredient": "Bacon",
        "consumed": 50,
        "source": "adicional",
        "price": 2.50,
        "newStock": 200
      }
    ]
  }
}
```

#### 4.3. Consultar Pedidos com Adicionais

**Endpoints:**
- `GET /orders/:orderId` - Detalhes com lista de adicionais
- `GET /orders?status=PENDING` - Lista com totais incluindo adicionais

**Resposta incluindo adicionais:**
```json
{
  "items": [
    {
      "product": "Hambúrguer Artesanal",
      "quantity": 2,
      "unitPrice": 15.00,
      "subtotal": 30.00,
      "additionalIngredients": [
        {
          "ingredient": "Bacon Extra",
          "quantity": 50,
          "unit": "GRAMAS",
          "price": 2.50
        }
      ],
      "additionalsTotal": 2.50
    }
  ],
  "totalAmount": 32.50
}
```

---

## 🎯 Fluxo Completo do Sistema

### 1. Garçom Cria Pedido
```
Cliente pede: "Hambúrguer com bacon extra"
↓
GARÇOM cria pedido via app:
- Produto: Hambúrguer (R$ 15,00)
- Adicional: Bacon 50g (R$ 2,50)
↓
Sistema valida:
✓ Produto existe no restaurante
✓ Ingrediente (bacon) existe no restaurante
✓ Calcula total: R$ 17,50
↓
Pedido criado: Status = PENDING
```

### 2. Cozinha Finaliza Pedido
```
COZINHA clica em "Finalizar Pedido"
↓
Sistema verifica estoque:
- Ingredientes da receita do hambúrguer
- Bacon adicional (50g)
↓
Se estoque OK:
✓ Consome estoque da receita
✓ Consome 50g de bacon
✓ Registra movimentações
✓ Alerta se estoque baixo
↓
Pedido: Status = COMPLETED
```

---

## 📊 Benefícios do Sistema de Adicionais

### Antes (campo `additional` texto livre):
- ❌ "Extra bacon" → não controla estoque
- ❌ Preço do adicional não registrado
- ❌ Sem rastreabilidade de consumo
- ❌ Relatórios imprecisos

### Depois (tabela `Item_Order_Additional`):
- ✅ Bacon 50g → consome estoque automaticamente
- ✅ Preço R$ 2,50 registrado e incluído no total
- ✅ Movimentação rastreada no histórico
- ✅ Relatórios precisos de vendas e consumo
- ✅ Alertas de estoque baixo incluem adicionais
- ✅ Frontend pode oferecer lista estruturada de adicionais

---

## 🔄 Compatibilidade Legada

O campo `additional` (String) foi **mantido** para:
- Observações gerais (ex: "Sem cebola")
- Comentários do cliente
- Retrocompatibilidade com versões antigas

**Uso recomendado:**
- `additional`: Texto livre para observações
- `additionalIngredients[]`: Ingredientes extras com controle de estoque

---

## 🗄️ Migração de Banco de Dados

**Comando executado:**
```bash
npx prisma db push
```

**Resultado:**
- ✅ Tabela `Item_Order_Additional` criada
- ✅ Relações configuradas
- ✅ Enums limpos (removidos valores não usados)
- ✅ Prisma Client regenerado

**Nota:** Foi usado `db push` devido a drift de migração anterior. Para produção, recomenda-se resetar migrations.

---

## 📝 Exemplo de Uso Completo

### 1. Criar Pedido com Adicionais
```bash
POST http://localhost:3333/orders
Authorization: Bearer {token_garcom}

{
  "items": [
    {
      "productId": 1,
      "quantity": 1,
      "additionalIngredients": [
        {
          "ingredientId": 5,
          "quantity": 50,
          "unit": "GRAMAS",
          "price": 2.50
        },
        {
          "ingredientId": 12,
          "quantity": 30,
          "unit": "GRAMAS",
          "price": 1.50
        }
      ],
      "observations": "Ponto da carne mal passado"
    }
  ]
}
```

### 2. Consultar Pedido
```bash
GET http://localhost:3333/orders/1
Authorization: Bearer {token}

# Resposta inclui adicionais estruturados
```

### 3. Finalizar Pedido
```bash
POST http://localhost:3333/orders/1/complete
Authorization: Bearer {token_cozinha}

{
  "wastePercentage": 5
}

# Consome estoque da receita + adicionais
```

---

## 🎨 Categorias com Imagens

### Criar Categoria
```bash
POST http://localhost:3333/categories
Authorization: Bearer {token}
Content-Type: multipart/form-data

name: Hambúrgueres
description: Hambúrgueres artesanais
restaurantId: 1
image: [arquivo.jpg]
```

### Resposta
```json
{
  "success": true,
  "category": {
    "id": 1,
    "name": "Hambúrgueres",
    "imageUrl": "http://localhost:3333/uploads/categories/1234567890.jpg"
  }
}
```

---

## ✨ Próximos Passos Sugeridos

### Melhorias para Produção:
1. **Histórico de Preços:** Adicionais podem ter preços variáveis ao longo do tempo
2. **Combos de Adicionais:** Descontos para múltiplos adicionais
3. **Limites por Produto:** Quantidade máxima de bacon por hambúrguer
4. **Sugestões Inteligentes:** IA sugere adicionais com base no histórico
5. **Relatórios Avançados:** Top 10 adicionais mais vendidos
6. **Notificações:** Alertar garçom quando adicional está em falta

---

## 🔒 Segurança e Permissões

- ✅ DEVELOPER: Acesso global a todas as categorias e pedidos
- ✅ ADMIN: Gerencia categorias e pedidos do próprio restaurante
- ✅ GARCOM: Cria pedidos com adicionais do restaurante
- ✅ COZINHA: Finaliza pedidos (consome estoque de adicionais)
- ✅ Validações impedem acesso cross-restaurant
- ✅ Upload de imagens com validação de tipo e tamanho

---

## 📦 Arquivos Modificados

```
✏️  prisma/schema.prisma
✏️  src/app/controllers/orderController.js
✏️  src/app/controllers/productController.js
✏️  src/routes.js
🆕 src/app/controllers/categoryController.js
🆕 STEP3_RESUMO.md
```

---

## 🚀 Status

✅ **Step 3 COMPLETO**
- [x] Sistema de categorias com CRUD
- [x] Upload de imagens (categorias + produtos)
- [x] Tabela Item_Order_Additional
- [x] Criar pedidos com adicionais
- [x] Consumo automático de estoque dos adicionais
- [x] Cálculo de preços com adicionais
- [x] Consultas incluindo adicionais

**Backend está 80% profissional!** 🎉

Faltam apenas features avançadas:
- Notificações em tempo real
- Sistema de logs estruturado
- Paginação avançada
- Testes automatizados
- Documentação Swagger
