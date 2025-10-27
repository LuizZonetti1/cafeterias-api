# 📋 Documentação do Sistema - Cafeterias API

**Sistema de Gestão para Cafeterias e Restaurantes Multi-tenant**

**Versão:** 1.0.0  
**Data:** Outubro 2025  
**Status:** Produção-Ready (90% completo)

---

## 📑 Índice

1. [Visão Geral do Sistema](#visão-geral-do-sistema)
2. [Regras de Negócio](#regras-de-negócio)
3. [Requisitos Funcionais](#requisitos-funcionais)
4. [Requisitos Não Funcionais](#requisitos-não-funcionais)
5. [Casos de Uso](#casos-de-uso)
6. [Fluxos de Trabalho](#fluxos-de-trabalho)
7. [Módulos do Sistema](#módulos-do-sistema)
8. [Perfis de Usuário](#perfis-de-usuário)
9. [Diagrama UML](#diagrama-uml)
10. [Glossário](#glossário)

---

## 🎯 Visão Geral do Sistema

### Objetivo
Sistema completo para gestão de múltiplas cafeterias e restaurantes, com controle de estoque inteligente, gestão de pedidos, receitas de produtos e notificações automáticas.

### Propósito
Facilitar a operação diária de cafeterias através de:
- Controle preciso de ingredientes e estoque
- Gestão eficiente de pedidos (garçom → cozinha)
- Rastreamento de desperdícios
- Alertas automáticos de estoque baixo
- Multi-estabelecimentos com isolamento de dados

### Principais Diferenciais
- ✅ **Multi-tenant:** Múltiplos restaurantes no mesmo sistema, dados completamente isolados
- ✅ **Controle de Estoque Inteligente:** Consumo automático ao finalizar pedidos
- ✅ **Receitas de Produtos:** Produtos vinculados a ingredientes com quantidades exatas
- ✅ **Adicionais Estruturados:** Ingredientes extras consomem estoque automaticamente
- ✅ **Notificações Automáticas:** Alertas quando estoque fica abaixo do mínimo
- ✅ **Rastreamento Completo:** Todas as movimentações de estoque registradas
- ✅ **Multi-warehouses:** Estoques separados por setor (Cozinha, Bar, Depósito)

---

## 📜 Regras de Negócio

### RN001 - Hierarquia de Usuários
- **DEVELOPER:** Acesso total ao sistema, único que pode criar/editar restaurantes
- **ADMIN:** Gerencia todo o restaurante (produtos, categorias, ingredientes, estoque)
- **COZINHA:** Finaliza pedidos, registra perdas, visualiza receitas
- **GARCOM:** Cria pedidos, visualiza produtos e categorias

### RN002 - Isolamento Multi-tenant
- Cada restaurante é completamente isolado dos demais
- Usuários só acessam dados do seu próprio restaurante
- Todas as operações validam permissões de restaurante

### RN003 - Gestão de Estoque
- Estoque é criado automaticamente ao cadastrar ingrediente
- Estoque inicia com quantidade zerada
- Estoque tem quantidade mínima configurável
- Movimentações são rastreadas com tipo: ENTRADA, SAIDA_PEDIDO, SAIDA_PERDA, SAIDA_RECEITA

### RN004 - Consumo Automático de Estoque
- Ao finalizar pedido, estoque dos ingredientes é consumido automaticamente
- Adicionais (ingredientes extras) também consomem estoque
- Desperdício pode ser registrado ao finalizar pedido (percentual por ingrediente)
- Sistema valida se há estoque suficiente antes de permitir finalização

### RN005 - Produtos e Receitas
- Produto deve ter categoria obrigatória
- Produto tem receita (lista de ingredientes com quantidades)
- Receita pode ser atualizada separadamente do produto
- Ao produzir produto diretamente, estoque é consumido conforme receita

### RN006 - Warehouses (Estoques Físicos)
- Restaurante pode ter múltiplos warehouses (ex: Cozinha, Bar, Depósito)
- Ingredientes são vinculados a um warehouse específico
- Cada warehouse tem seu próprio controle de estoque
- Nome do warehouse deve ser único por restaurante

### RN007 - Notificações Automáticas
- Notificação LOW_STOCK é criada quando estoque < estoque mínimo
- Notificação OUT_OF_STOCK é criada quando estoque = 0
- Notificações podem ser marcadas como lidas
- Notificações são específicas por restaurante

### RN008 - Pedidos
- GARCOM cria pedido com status PENDING
- Pedido pode ter múltiplos itens (produtos)
- Cada item pode ter adicionais (ingredientes extras com preço)
- COZINHA atualiza status para IN_PROGRESS ao aceitar
- COZINHA finaliza pedido (status COMPLETED) e estoque é consumido
- Pedido pode ser cancelado (status CANCELLED)

### RN009 - Perdas e Desperdícios
- COZINHA pode registrar perda manual de ingrediente
- Motivos: VENCIDO, DETERIORADO, CONTAMINADO, QUEBRA, DESPERDICIO_PREPARO, OUTROS
- Ao finalizar pedido, pode registrar desperdício percentual
- Todas as perdas geram movimentação SAIDA_PERDA

### RN010 - Categorias
- Categoria deve ter nome único por restaurante
- Categoria pode ter imagem ilustrativa
- Categoria não pode ser deletada se tiver produtos vinculados
- Apenas ADMIN pode gerenciar categorias

### RN011 - Autenticação
- Login requer email + senha
- Sistema gera JWT válido por 7 dias
- Token deve ser enviado em todas as requisições autenticadas
- Senha é criptografada com bcrypt

---

## ⚙️ Requisitos Funcionais

### RF001 - Autenticação e Autorização
- **RF001.1:** Sistema deve permitir registro de usuários com tipos: DEVELOPER, ADMIN, GARCOM, COZINHA
- **RF001.2:** Sistema deve validar códigos secretos para registro de DEVELOPER e ADMIN
- **RF001.3:** Sistema deve gerar token JWT ao fazer login
- **RF001.4:** Sistema deve validar permissões por tipo de usuário em cada operação

### RF002 - Gestão de Restaurantes
- **RF002.1:** DEVELOPER deve poder cadastrar novo restaurante com logo obrigatória
- **RF002.2:** DEVELOPER deve poder editar informações do restaurante
- **RF002.3:** DEVELOPER deve poder ativar/desativar restaurante
- **RF002.4:** Sistema deve listar restaurantes ativos para seleção
- **RF002.5:** Sistema deve exibir detalhes completos do restaurante

### RF003 - Gestão de Warehouses
- **RF003.1:** ADMIN deve poder criar warehouse vinculado ao seu restaurante
- **RF003.2:** ADMIN deve poder editar informações do warehouse
- **RF003.3:** ADMIN deve poder deletar warehouse (se não tiver ingredientes)
- **RF003.4:** Sistema deve listar warehouses por restaurante
- **RF003.5:** Sistema deve validar nome único de warehouse por restaurante

### RF004 - Gestão de Ingredientes
- **RF004.1:** ADMIN deve poder cadastrar ingrediente vinculado a warehouse
- **RF004.2:** Ingrediente deve ter unidade de medida: GRAMAS, LITROS, UNIDADES, MILILITROS
- **RF004.3:** Sistema deve criar estoque automaticamente com quantidade 0
- **RF004.4:** ADMIN deve poder editar informações do ingrediente
- **RF004.5:** ADMIN deve poder deletar ingrediente (deleta estoque em cascata)
- **RF004.6:** Sistema deve listar ingredientes com status de estoque

### RF005 - Controle de Estoque
- **RF005.1:** ADMIN deve poder adicionar quantidade ao estoque (ENTRADA)
- **RF005.2:** ADMIN deve poder definir estoque mínimo por ingrediente
- **RF005.3:** COZINHA deve poder registrar perda de ingrediente com motivo
- **RF005.4:** Sistema deve consumir estoque automaticamente ao finalizar pedido
- **RF005.5:** Sistema deve registrar todas as movimentações de estoque
- **RF005.6:** Sistema deve listar visão geral do estoque por restaurante
- **RF005.7:** Sistema deve validar se há estoque suficiente antes de operações

### RF006 - Gestão de Categorias
- **RF006.1:** ADMIN deve poder criar categoria com imagem
- **RF006.2:** ADMIN deve poder editar categoria
- **RF006.3:** ADMIN deve poder deletar categoria (se não tiver produtos)
- **RF006.4:** Sistema deve listar categorias por restaurante
- **RF006.5:** Sistema deve validar nome único de categoria por restaurante

### RF007 - Gestão de Produtos
- **RF007.1:** ADMIN deve poder criar produto com categoria e imagem
- **RF007.2:** ADMIN deve poder criar receita do produto (ingredientes + quantidades)
- **RF007.3:** ADMIN deve poder atualizar receita separadamente
- **RF007.4:** ADMIN deve poder editar informações do produto
- **RF007.5:** ADMIN deve poder deletar produto
- **RF007.6:** Sistema deve listar produtos com receita e estoque atual
- **RF007.7:** Sistema deve exibir detalhes do produto com ingredientes disponíveis

### RF008 - Sistema de Pedidos
- **RF008.1:** GARCOM deve poder criar pedido com múltiplos itens
- **RF008.2:** GARCOM deve poder adicionar ingredientes extras (adicionais) aos itens
- **RF008.3:** Sistema deve calcular preço total incluindo adicionais
- **RF008.4:** COZINHA deve poder listar pedidos pendentes
- **RF008.5:** COZINHA deve poder atualizar status do pedido
- **RF008.6:** COZINHA deve poder finalizar pedido com opção de desperdício
- **RF008.7:** Sistema deve consumir estoque ao finalizar pedido
- **RF008.8:** Pedido pode ser cancelado (não consome estoque)
- **RF008.9:** Sistema deve listar histórico de pedidos por restaurante

### RF009 - Sistema de Notificações
- **RF009.1:** Sistema deve criar notificação automática quando estoque < mínimo
- **RF009.2:** Sistema deve criar notificação quando estoque = 0
- **RF009.3:** ADMIN deve poder listar notificações do restaurante
- **RF009.4:** ADMIN deve poder filtrar notificações não lidas
- **RF009.5:** ADMIN deve poder marcar notificação como lida
- **RF009.6:** ADMIN deve poder deletar notificação
- **RF009.7:** ADMIN deve poder deletar todas as notificações lidas

### RF010 - Upload de Arquivos
- **RF010.1:** Sistema deve permitir upload de logo para restaurante (obrigatório)
- **RF010.2:** Sistema deve permitir upload de imagem para categoria
- **RF010.3:** Sistema deve permitir upload de imagem para produto
- **RF010.4:** Sistema deve validar tipo de arquivo (jpg, jpeg, png)
- **RF010.5:** Sistema deve validar tamanho máximo (5MB)

### RF011 - Produção Direta de Produtos
- **RF011.1:** COZINHA deve poder produzir produto diretamente (fora de pedido)
- **RF011.2:** Sistema deve validar estoque antes de produzir
- **RF011.3:** Sistema deve consumir estoque conforme receita
- **RF011.4:** Sistema deve permitir registrar desperdício na produção
- **RF011.5:** Sistema deve registrar movimentações SAIDA_RECEITA + SAIDA_PERDA

---

## 🔒 Requisitos Não Funcionais

### RNF001 - Segurança
- **RNF001.1:** Senhas devem ser criptografadas com bcrypt (mínimo 10 rounds)
- **RNF001.2:** JWT deve ter expiração de 7 dias
- **RNF001.3:** Todas as rotas autenticadas devem validar token
- **RNF001.4:** Sistema deve usar helmet para headers de segurança HTTP
- **RNF001.5:** Sistema deve implementar rate limiting (100 req/15min)
- **RNF001.6:** Variáveis sensíveis devem estar em arquivo .env
- **RNF001.7:** Sistema deve validar variáveis de ambiente no startup

### RNF002 - Performance
- **RNF002.1:** Queries devem usar índices para melhor performance
- **RNF002.2:** Relações devem usar include do Prisma para evitar N+1
- **RNF002.3:** Imagens devem ter tamanho máximo de 5MB
- **RNF002.4:** Respostas API devem ter tempo médio < 500ms

### RNF003 - Disponibilidade
- **RNF003.1:** Sistema deve ter endpoint de health check
- **RNF003.2:** Health check deve testar conexão com banco de dados
- **RNF003.3:** Sistema deve ter tratamento de erros centralizado
- **RNF003.4:** Erros devem ser logados com contexto completo

### RNF004 - Manutenibilidade
- **RNF004.1:** Código deve seguir padrão ESLint (2 espaços, sem semicolons)
- **RNF004.2:** Controllers devem ter responsabilidade única
- **RNF004.3:** Validações devem usar schemas Yup reutilizáveis
- **RNF004.4:** Erros devem ter mensagens claras e padronizadas

### RNF005 - Escalabilidade
- **RNF005.1:** Arquitetura multi-tenant deve suportar milhares de restaurantes
- **RNF005.2:** Banco de dados PostgreSQL deve usar connection pooling
- **RNF005.3:** Sistema deve ser stateless (permite horizontal scaling)

### RNF006 - Usabilidade
- **RNF006.1:** Mensagens de erro devem ser claras e em português
- **RNF006.2:** Respostas devem seguir padrão JSON consistente
- **RNF006.3:** Status HTTP devem ser apropriados (200, 201, 400, 401, 403, 404, 500)

### RNF007 - Confiabilidade
- **RNF007.1:** Operações críticas devem usar transações do Prisma
- **RNF007.2:** Deleções em cascata devem estar configuradas no schema
- **RNF007.3:** Sistema deve prevenir inconsistências de dados

---

## 📖 Casos de Uso

### UC001 - Cadastrar Restaurante
**Ator:** DEVELOPER  
**Pré-condições:** Usuário autenticado como DEVELOPER  
**Fluxo Principal:**
1. DEVELOPER acessa endpoint de criação de restaurante
2. DEVELOPER envia dados: nome, descrição, endereço, telefone, email
3. DEVELOPER faz upload de logo (obrigatório)
4. Sistema valida dados
5. Sistema cria restaurante com status ativo
6. Sistema retorna dados do restaurante criado

**Fluxo Alternativo:**
- 4a. Dados inválidos → Sistema retorna erro 400 com detalhes
- 4b. Logo não enviada → Sistema retorna erro 400 "Logo é obrigatória"

**Pós-condições:** Restaurante criado e disponível para seleção

---

### UC002 - Cadastrar Ingrediente
**Ator:** ADMIN  
**Pré-condições:** Usuário autenticado como ADMIN, warehouse existe  
**Fluxo Principal:**
1. ADMIN acessa endpoint de criação de ingrediente
2. ADMIN envia dados: nome, unidade (GRAMAS/LITROS/UNIDADES/MILILITROS), warehouseId
3. Sistema valida dados e permissões
4. Sistema cria ingrediente
5. Sistema cria estoque automaticamente com quantidade 0
6. Sistema retorna dados do ingrediente + estoque

**Fluxo Alternativo:**
- 3a. Warehouse não pertence ao restaurante do ADMIN → Erro 403
- 3b. Nome duplicado no mesmo warehouse → Erro 400

**Pós-condições:** Ingrediente criado com estoque zerado

---

### UC003 - Adicionar Estoque
**Ator:** ADMIN  
**Pré-condições:** Usuário autenticado como ADMIN, ingrediente existe  
**Fluxo Principal:**
1. ADMIN acessa endpoint de adicionar estoque
2. ADMIN envia quantidade a adicionar
3. Sistema valida permissões (ingrediente pertence ao restaurante)
4. Sistema incrementa quantidade atual do estoque
5. Sistema registra movimentação tipo ENTRADA
6. Sistema verifica se estoque < mínimo
7. Se estoque < mínimo, sistema cria notificação LOW_STOCK
8. Sistema retorna estoque atualizado

**Fluxo Alternativo:**
- 3a. Ingrediente não pertence ao restaurante → Erro 403
- 3b. Quantidade inválida (negativa/zero) → Erro 400

**Pós-condições:** Estoque incrementado, movimentação registrada, notificação criada se necessário

---

### UC004 - Criar Pedido
**Ator:** GARCOM  
**Pré-condições:** Usuário autenticado como GARCOM, produtos existem  
**Fluxo Principal:**
1. GARCOM acessa endpoint de criação de pedido
2. GARCOM envia lista de itens: [{productId, quantity, observations, additionalIngredients}]
3. Sistema valida produtos pertencem ao restaurante
4. Sistema valida ingredientes adicionais pertencem ao restaurante
5. Sistema cria pedido com status PENDING
6. Sistema cria itens do pedido
7. Sistema cria registros de adicionais (Item_Order_Additional)
8. Sistema calcula preço total (produtos + adicionais)
9. Sistema retorna pedido criado com itens e adicionais

**Fluxo Alternativo:**
- 3a. Produto não encontrado → Erro 404
- 4a. Ingrediente adicional não existe → Erro 404
- 4b. Items array vazio → Erro 400

**Pós-condições:** Pedido criado com status PENDING, aguardando aceitação da cozinha

---

### UC005 - Finalizar Pedido
**Ator:** COZINHA  
**Pré-condições:** Usuário autenticado como COZINHA, pedido existe com status IN_PROGRESS  
**Fluxo Principal:**
1. COZINHA acessa endpoint de finalizar pedido
2. COZINHA opcionalmente envia wastePercentage (0-100) por ingrediente
3. Sistema valida pedido pertence ao restaurante
4. Sistema busca receitas de todos os produtos do pedido
5. Sistema busca ingredientes adicionais do pedido
6. Sistema calcula total de cada ingrediente necessário
7. Sistema valida se há estoque suficiente
8. Para cada ingrediente:
   - Calcula quantidade consumida (receita × quantity × (1 + wastePercentage))
   - Reduz estoque
   - Registra movimentação SAIDA_PEDIDO
   - Se há desperdício, registra movimentação SAIDA_PERDA adicional
   - Verifica se estoque < mínimo e cria notificação
9. Sistema atualiza status do pedido para COMPLETED
10. Sistema retorna pedido finalizado com detalhes de consumo

**Fluxo Alternativo:**
- 3a. Pedido não pertence ao restaurante → Erro 403
- 3b. Status diferente de IN_PROGRESS → Erro 400
- 7a. Estoque insuficiente → Erro 400 com lista de ingredientes faltantes
- 8a. Estoque zerado → Cria notificação OUT_OF_STOCK

**Pós-condições:** Pedido finalizado, estoque consumido, movimentações registradas, notificações criadas se necessário

---

### UC006 - Registrar Perda de Ingrediente
**Ator:** COZINHA, ADMIN  
**Pré-condições:** Usuário autenticado, ingrediente existe  
**Fluxo Principal:**
1. Usuário acessa endpoint de registrar perda
2. Usuário envia: ingredientId, quantidade, motivo (VENCIDO/DETERIORADO/etc), observação
3. Sistema valida permissões
4. Sistema valida se há estoque suficiente
5. Sistema reduz quantidade do estoque
6. Sistema registra movimentação tipo SAIDA_PERDA
7. Sistema verifica se estoque < mínimo e cria notificação
8. Sistema retorna estoque atualizado

**Fluxo Alternativo:**
- 3a. Ingrediente não pertence ao restaurante → Erro 403
- 4a. Estoque insuficiente → Erro 400
- 4b. Quantidade maior que estoque atual → Erro 400

**Pós-condições:** Estoque reduzido, perda registrada, notificação criada se necessário

---

### UC007 - Visualizar Notificações
**Ator:** ADMIN  
**Pré-condições:** Usuário autenticado como ADMIN  
**Fluxo Principal:**
1. ADMIN acessa endpoint de listar notificações
2. ADMIN opcionalmente filtra por não lidas (?unreadOnly=true)
3. Sistema lista notificações do restaurante
4. Sistema retorna notificações com informações do ingrediente

**Pós-condições:** Lista de notificações exibida

---

### UC008 - Criar Produto com Receita
**Ator:** ADMIN  
**Pré-condições:** Usuário autenticado como ADMIN, categoria existe, ingredientes existem  
**Fluxo Principal:**
1. ADMIN acessa endpoint de criação de produto
2. ADMIN envia: nome, descrição, preço, categoryId, imagem
3. ADMIN envia receita: [{ingredientId, quantity, unit}]
4. Sistema valida categoria pertence ao restaurante
5. Sistema valida ingredientes pertencem ao restaurante
6. Sistema cria produto
7. Sistema cria registros de receita (Item_Product)
8. Sistema faz upload da imagem
9. Sistema retorna produto criado com receita

**Fluxo Alternativo:**
- 4a. Categoria não encontrada → Erro 404
- 5a. Ingrediente não encontrado → Erro 404
- 5b. Ingrediente não pertence ao restaurante → Erro 403
- 7a. Receita vazia → Erro 400

**Pós-condições:** Produto criado com receita vinculada

---

### UC009 - Produzir Produto Diretamente
**Ator:** COZINHA, ADMIN  
**Pré-condições:** Usuário autenticado, produto existe com receita  
**Fluxo Principal:**
1. Usuário acessa endpoint de produção
2. Usuário envia: productId, quantity, wastePercentage (opcional)
3. Sistema valida produto pertence ao restaurante
4. Sistema busca receita do produto
5. Sistema calcula ingredientes necessários (receita × quantity)
6. Sistema valida se há estoque suficiente
7. Para cada ingrediente:
   - Calcula consumo com desperdício
   - Reduz estoque
   - Registra SAIDA_RECEITA
   - Se há desperdício, registra SAIDA_PERDA
   - Verifica estoque < mínimo e cria notificação
8. Sistema retorna detalhes de consumo

**Fluxo Alternativo:**
- 3a. Produto não pertence ao restaurante → Erro 403
- 5a. Produto sem receita → Erro 400
- 6a. Estoque insuficiente → Erro 400 com ingredientes faltantes

**Pós-condições:** Estoque consumido, movimentações registradas, notificações criadas se necessário

---

## 🔄 Fluxos de Trabalho

### Fluxo 1: Setup Inicial do Restaurante

```
1. DEVELOPER cadastra restaurante
   ↓
2. DEVELOPER cria usuário ADMIN para o restaurante
   ↓
3. ADMIN faz login
   ↓
4. ADMIN cria warehouses (Cozinha, Bar, Depósito)
   ↓
5. ADMIN cadastra ingredientes vinculados aos warehouses
   ↓
6. ADMIN adiciona estoque inicial aos ingredientes
   ↓
7. ADMIN define estoque mínimo para cada ingrediente
   ↓
8. ADMIN cria categorias (Bebidas, Lanches, Sobremesas)
   ↓
9. ADMIN cria produtos com receitas
   ↓
10. ADMIN cria usuários GARCOM e COZINHA
    ↓
11. Sistema pronto para operação!
```

---

### Fluxo 2: Criação e Finalização de Pedido

```
GARCOM:
1. Anota pedido do cliente
   ↓
2. Acessa sistema e cria pedido
   ↓
3. Adiciona produtos ao pedido
   ↓
4. Adiciona ingredientes extras se cliente solicitou (ex: queijo extra)
   ↓
5. Confirma pedido (status: PENDING)
   ↓

COZINHA:
6. Visualiza pedidos pendentes
   ↓
7. Aceita pedido (status: IN_PROGRESS)
   ↓
8. Prepara itens do pedido
   ↓
9. Finaliza pedido no sistema
   ↓
10. Opcionalmente registra desperdício (ex: 5% de queijo queimou)
    ↓

SISTEMA:
11. Valida estoque suficiente
    ↓
12. Consome estoque de todos os ingredientes (receitas + adicionais)
    ↓
13. Registra movimentações SAIDA_PEDIDO e SAIDA_PERDA
    ↓
14. Verifica estoque < mínimo
    ↓
15. Cria notificações LOW_STOCK se necessário
    ↓
16. Atualiza status pedido para COMPLETED
```

---

### Fluxo 3: Gestão de Estoque com Notificações

```
DIA 1:
ADMIN adiciona 500g de queijo
→ Sistema registra ENTRADA
→ Estoque atual: 500g (mínimo: 100g)

DIA 2:
COZINHA finaliza 3 pedidos
→ Sistema consome 250g de queijo automaticamente
→ Estoque atual: 250g (ainda > mínimo)

DIA 3:
COZINHA finaliza 5 pedidos
→ Sistema consome 200g de queijo
→ Estoque atual: 50g (< mínimo de 100g)
→ 🔔 SISTEMA CRIA NOTIFICAÇÃO AUTOMÁTICA
→ "Estoque baixo: Queijo (50g restantes, mínimo: 100g)"

DIA 4:
ADMIN visualiza notificações
→ Vê alerta de queijo
→ ADMIN adiciona 1000g de queijo
→ Estoque atual: 1050g
→ ADMIN marca notificação como lida

DIA 5:
COZINHA continua operação normalmente
```

---

### Fluxo 4: Registro de Perda

```
SITUAÇÃO: Leite venceu na geladeira

1. COZINHA acessa registro de perda
   ↓
2. Seleciona ingrediente: Leite (2L em estoque)
   ↓
3. Informa quantidade perdida: 500ml
   ↓
4. Seleciona motivo: VENCIDO
   ↓
5. Adiciona observação: "Leite vencido em 26/10"
   ↓
6. Confirma registro
   ↓

SISTEMA:
7. Valida estoque suficiente (2L > 500ml ✓)
   ↓
8. Reduz estoque: 2000ml - 500ml = 1500ml
   ↓
9. Registra movimentação SAIDA_PERDA
   ↓
10. Verifica: 1500ml < 2000ml (mínimo)
    ↓
11. Cria notificação LOW_STOCK
    ↓
12. Retorna estoque atualizado
```

---

## 🏗️ Módulos do Sistema

### Módulo 1: Autenticação e Autorização
**Responsabilidade:** Gerenciar usuários, login, permissões

**Funcionalidades:**
- Registro de usuários com validação de código secreto
- Login com geração de JWT
- Middleware de autenticação
- Middleware de autorização por tipo de usuário
- Validação de multi-tenant

**Endpoints:**
- `POST /users/register` - Registrar usuário
- `POST /users/login` - Fazer login
- `GET /users` - Listar usuários (ADMIN/DEVELOPER)
- `GET /users/:id` - Buscar usuário
- `PUT /users/:id` - Atualizar usuário
- `DELETE /users/:id` - Deletar usuário

---

### Módulo 2: Gestão de Restaurantes
**Responsabilidade:** CRUD de restaurantes

**Funcionalidades:**
- Criar restaurante com logo
- Editar informações
- Ativar/desativar
- Listar restaurantes

**Endpoints:**
- `POST /restaurants` - Criar restaurante (DEVELOPER)
- `GET /restaurants` - Listar restaurantes ativos
- `GET /restaurants/:id` - Buscar restaurante
- `PUT /restaurants/:id` - Atualizar restaurante (DEVELOPER)
- `DELETE /restaurants/:id` - Deletar restaurante (DEVELOPER)

---

### Módulo 3: Gestão de Warehouses
**Responsabilidade:** Gerenciar estoques físicos do restaurante

**Funcionalidades:**
- Criar warehouse vinculado ao restaurante
- Editar informações
- Deletar warehouse
- Listar por restaurante

**Endpoints:**
- `POST /warehouses` - Criar warehouse (ADMIN)
- `GET /warehouses/restaurant/:restaurantId` - Listar warehouses
- `GET /warehouses/:id` - Buscar warehouse
- `PUT /warehouses/:id` - Atualizar warehouse (ADMIN)
- `DELETE /warehouses/:id` - Deletar warehouse (ADMIN)

---

### Módulo 4: Gestão de Ingredientes
**Responsabilidade:** CRUD de ingredientes com criação automática de estoque

**Funcionalidades:**
- Cadastrar ingrediente vinculado a warehouse
- Criar estoque automaticamente
- Editar ingrediente
- Deletar ingrediente (cascata: estoque, movimentações)
- Listar com status de estoque

**Endpoints:**
- `POST /ingredients` - Criar ingrediente (ADMIN)
- `GET /ingredients/restaurant/:restaurantId` - Listar ingredientes
- `GET /ingredients/:id` - Buscar ingrediente
- `PUT /ingredients/:id` - Atualizar ingrediente (ADMIN)
- `DELETE /ingredients/:id` - Deletar ingrediente (ADMIN)

---

### Módulo 5: Controle de Estoque
**Responsabilidade:** Gerenciar quantidades, movimentações, notificações

**Funcionalidades:**
- Adicionar estoque (ENTRADA)
- Definir estoque mínimo
- Registrar perda manual
- Consumir estoque automaticamente (pedidos/produção)
- Listar visão geral por restaurante
- Criar notificações automáticas

**Endpoints:**
- `POST /stock/add/:ingredientId` - Adicionar estoque (ADMIN)
- `PUT /stock/minimum/:ingredientId` - Definir mínimo (ADMIN)
- `POST /stock/loss/:ingredientId` - Registrar perda (COZINHA/ADMIN)
- `GET /stock/restaurant/:restaurantId` - Visão geral estoque
- `POST /stock/consume/:productId` - Consumir por produto (interno)

---

### Módulo 6: Gestão de Categorias
**Responsabilidade:** CRUD de categorias com upload de imagens

**Funcionalidades:**
- Criar categoria com imagem
- Editar categoria
- Deletar categoria (valida produtos)
- Listar por restaurante

**Endpoints:**
- `POST /categories` - Criar categoria (ADMIN)
- `GET /categories/restaurant/:restaurantId` - Listar categorias
- `GET /categories/:id` - Buscar categoria
- `PUT /categories/:id` - Atualizar categoria (ADMIN)
- `DELETE /categories/:id` - Deletar categoria (ADMIN)

---

### Módulo 7: Gestão de Produtos
**Responsabilidade:** CRUD de produtos com receitas e imagens

**Funcionalidades:**
- Criar produto com receita
- Upload de imagem
- Atualizar receita
- Editar produto
- Deletar produto
- Listar com estoque disponível
- Produzir produto diretamente

**Endpoints:**
- `POST /products` - Criar produto (ADMIN)
- `GET /products/restaurant/:restaurantId` - Listar produtos
- `GET /products/:id` - Buscar produto com receita
- `PUT /products/:id` - Atualizar produto (ADMIN)
- `PUT /products/:id/recipe` - Atualizar receita (ADMIN)
- `DELETE /products/:id` - Deletar produto (ADMIN)
- `POST /products/:id/produce` - Produzir produto (COZINHA)

---

### Módulo 8: Sistema de Pedidos
**Responsabilidade:** Gestão completa do fluxo de pedidos

**Funcionalidades:**
- GARCOM cria pedido com múltiplos itens
- Adicionar ingredientes extras (adicionais)
- Calcular preço total
- COZINHA atualiza status
- COZINHA finaliza com consumo de estoque
- Cancelar pedido
- Listar histórico

**Endpoints:**
- `POST /orders` - Criar pedido (GARCOM)
- `GET /orders/restaurant/:restaurantId` - Listar pedidos
- `GET /orders/:id` - Buscar pedido
- `PUT /orders/:id/status` - Atualizar status (COZINHA)
- `POST /orders/:id/complete` - Finalizar pedido (COZINHA)
- `DELETE /orders/:id` - Cancelar pedido

---

### Módulo 9: Sistema de Notificações
**Responsabilidade:** Alertas automáticos de estoque

**Funcionalidades:**
- Criar notificação automática (LOW_STOCK, OUT_OF_STOCK)
- Listar notificações por restaurante
- Filtrar não lidas
- Marcar como lida
- Deletar notificação
- Deletar todas lidas

**Endpoints:**
- `GET /notifications/:restaurantId` - Listar notificações (ADMIN)
- `PUT /notifications/:id/read` - Marcar como lida (ADMIN)
- `PUT /notifications/:restaurantId/read-all` - Marcar todas como lidas
- `DELETE /notifications/:id` - Deletar notificação (ADMIN)
- `DELETE /notifications/:restaurantId/clear-read` - Deletar lidas

---

### Módulo 10: Upload de Arquivos
**Responsabilidade:** Gerenciar upload e validação de imagens

**Funcionalidades:**
- Upload de logo de restaurante
- Upload de imagem de categoria
- Upload de imagem de produto
- Validação de tipo e tamanho
- Geração de URLs públicas

**Middlewares:**
- `uploadRestaurantLogo` - Upload obrigatório de logo
- `uploadCategoryImage` - Upload opcional de imagem
- `uploadProductImage` - Upload opcional de imagem

---

## 👥 Perfis de Usuário

### DEVELOPER (Desenvolvedor/Proprietário do Sistema)
**Nível de Acesso:** Total  
**Responsabilidades:**
- Criar e gerenciar restaurantes
- Criar primeiro usuário ADMIN de cada restaurante
- Acesso administrativo ao sistema todo

**Permissões:**
- ✅ Criar, editar, deletar restaurantes
- ✅ Fazer tudo que ADMIN pode
- ✅ Acessar dados de todos os restaurantes

**Casos de Uso:**
- Cadastrar novo restaurante cliente
- Configurar logo e informações
- Criar usuário administrador para o cliente

---

### ADMIN (Administrador do Restaurante)
**Nível de Acesso:** Total no seu restaurante  
**Responsabilidades:**
- Gerenciar toda operação do restaurante
- Configurar produtos, categorias, ingredientes
- Controlar estoque
- Gerenciar usuários do restaurante

**Permissões:**
- ✅ Criar, editar, deletar: warehouses, ingredientes, categorias, produtos
- ✅ Adicionar estoque, definir estoque mínimo
- ✅ Registrar perdas
- ✅ Visualizar e gerenciar notificações
- ✅ Criar usuários GARCOM e COZINHA
- ✅ Visualizar todos os pedidos
- ✅ Produzir produtos diretamente
- ❌ NÃO pode criar/editar restaurante

**Casos de Uso:**
- Cadastrar novo produto no cardápio
- Adicionar 5kg de farinha ao estoque
- Visualizar alerta de estoque baixo
- Criar usuário garçom

---

### GARCOM (Garçom/Atendente)
**Nível de Acesso:** Operacional limitado  
**Responsabilidades:**
- Criar pedidos para os clientes
- Visualizar produtos disponíveis

**Permissões:**
- ✅ Criar pedidos com múltiplos itens
- ✅ Adicionar ingredientes extras aos itens
- ✅ Visualizar lista de produtos e categorias
- ✅ Visualizar seus próprios pedidos
- ❌ NÃO pode finalizar pedidos
- ❌ NÃO pode gerenciar estoque
- ❌ NÃO pode gerenciar produtos

**Casos de Uso:**
- Cliente pede 1 latte com shot extra de café
- GARCOM cria pedido no sistema
- Adiciona "Latte" + adicional "Shot de Café"
- Confirma pedido (vai para cozinha)

---

### COZINHA (Cozinheiro/Preparador)
**Nível de Acesso:** Operacional e estoque  
**Responsabilidades:**
- Visualizar e finalizar pedidos
- Registrar perdas de ingredientes
- Produzir produtos

**Permissões:**
- ✅ Visualizar pedidos pendentes e em andamento
- ✅ Atualizar status de pedidos
- ✅ Finalizar pedidos (consome estoque)
- ✅ Registrar desperdício ao finalizar
- ✅ Registrar perdas manuais de ingredientes
- ✅ Produzir produtos diretamente
- ❌ NÃO pode criar pedidos
- ❌ NÃO pode gerenciar produtos/categorias
- ❌ NÃO pode adicionar estoque

**Casos de Uso:**
- Visualiza pedido pendente de 2 capuccinos
- Aceita pedido (status: IN_PROGRESS)
- Prepara os capuccinos
- Finaliza pedido no sistema
- Registra que 10g de canela foram desperdiçadas
- Sistema consome estoque automaticamente

---

## 📊 Diagrama UML

### 🎨 Diagramas Disponíveis

Os diagramas UML completos do sistema estão disponíveis no diretório `/diagrams/` em formato PlantUML.

#### 1. **Diagrama de Entidade-Relacionamento (ER)**
📁 `diagrams/database-diagram.puml`

Mostra a estrutura completa do banco de dados:
- Todas as 14 tabelas e relacionamentos
- Chaves primárias, estrangeiras e constraints únicos
- 7 enums do sistema
- Anotações com regras de negócio

**Principais Entidades:**
- `Restaurant` (central multi-tenant)
- `User` (4 tipos: DEVELOPER, ADMIN, GARCOM, COZINHA)
- `Warehouse` (estoques físicos)
- `Ingredient` (matérias-primas)
- `Stock` (quantidades e mínimos)
- `Stock_Movement` (rastreamento completo)
- `Category` e `Product` (cardápio)
- `Orders`, `Item_Order`, `Item_Order_Additional` (pedidos com extras)
- `Notification` (alertas automáticos)

---

#### 2. **Diagrama de Casos de Uso**
📁 `diagrams/use-case-diagram.puml`

Mostra todos os casos de uso organizados por módulo:
- **Gestão de Restaurantes:** 4 casos de uso (DEVELOPER)
- **Gestão de Usuários:** 4 casos de uso
- **Gestão de Estoque:** 6 casos de uso (ADMIN)
- **Gestão de Produtos:** 6 casos de uso (ADMIN)
- **Sistema de Pedidos:** 6 casos de uso (GARCOM + COZINHA)
- **Notificações:** 3 casos de uso (ADMIN)
- **Sistema Automático:** 3 casos de uso (interno)

**Inclui:**
- Permissões por tipo de usuário
- Relacionamentos include/extend
- Fluxos alternativos
- Anotações sobre cada ator

---

#### 3. **Diagrama de Sequência - Fluxo Completo de Pedido**
📁 `diagrams/sequence-order-flow.puml`

Diagrama detalhado do fluxo mais importante do sistema:

**Fase 1: GARCOM cria pedido**
- Validação de autenticação e permissões
- Criação de Order, Item_Order e Item_Order_Additional
- Cálculo de preço total

**Fase 2: COZINHA visualiza e aceita**
- Listagem de pedidos PENDING
- Atualização de status para IN_PROGRESS

**Fase 3: Finalizar pedido com consumo de estoque**
- Busca de receitas completas
- Cálculo de ingredientes necessários (incluindo extras)
- Validação de estoque suficiente
- Consumo automático de estoque
- Registro de movimentações (SAIDA_PEDIDO + SAIDA_PERDA)
- Verificação de estoque < mínimo
- Criação automática de notificações

**Fase 4: ADMIN visualiza notificações**
- Listagem de alertas
- Adição de estoque
- Marcação de notificação como lida

---

#### 4. **Diagrama de Arquitetura de Componentes**
📁 `diagrams/architecture-diagram.puml`

Mostra a organização em camadas do sistema:

**Camadas:**
1. **Middlewares:** auth, validation, errorHandler, upload
2. **Routes Layer:** apiRoutes (Express Router)
3. **Controllers:** 9 controllers especializados
4. **Business Logic:** Services (Stock, Notification, Order)
5. **Data Access:** Prisma Client ORM

**Integrações Externas:**
- PostgreSQL (banco de dados)
- File System (armazenamento de imagens)

**Padrão:** MVC com camada de serviços para lógica complexa

---

### 📖 Como Visualizar os Diagramas

#### Opção 1: Online (Mais Rápido)
1. Acesse: https://www.plantuml.com/plantuml/uml/
2. Abra o arquivo `.puml` desejado
3. Copie e cole o conteúdo
4. Visualize e baixe como PNG/SVG/PDF

#### Opção 2: VS Code (Recomendado)
1. Instale a extensão "PlantUML" (jebbs.plantuml)
2. Instale Java JRE (necessário)
3. Abra arquivo `.puml`
4. Pressione `Alt+D` para preview
5. Exporte: `Ctrl+Shift+P` → "PlantUML: Export Current Diagram"

#### Opção 3: Outras Ferramentas
- **PlantText:** https://www.planttext.com/
- **Kroki:** https://kroki.io/
- **IntelliJ IDEA:** Plugin PlantUML Integration

**Consulte:** `/diagrams/README.md` para instruções detalhadas

---

### 🎯 Benefícios dos Diagramas

✅ **Onboarding de Equipe:** Novos desenvolvedores entendem o sistema rapidamente  
✅ **Comunicação com Cliente:** Diagramas visuais facilitam entendimento  
✅ **Documentação Viva:** Atualize diagramas junto com código  
✅ **Análise de Impacto:** Visualize dependências antes de mudanças  
✅ **Validação de Requisitos:** Confirme que tudo está implementado  

---

### 📐 Diagrama Simplificado de Classes (Text)

Para referência rápida, aqui está uma visão simplificada:

```
Controllers (9):
├── UserController............... CRUD de usuários, autenticação
├── RestaurantController......... CRUD de restaurantes (DEVELOPER)
├── WarehouseController.......... CRUD de warehouses (ADMIN)
├── IngredientController......... CRUD de ingredientes (ADMIN)
├── StockController.............. Gestão de estoque e movimentações
├── CategoryController........... CRUD de categorias com upload
├── ProductController............ CRUD de produtos com receitas
├── OrderController.............. Gestão completa de pedidos
└── NotificationController....... CRUD e criação automática de alertas

Middlewares (4):
├── authMiddleware............... JWT + autorização por tipo
├── validation................... Schemas Yup
├── errorHandler................. Tratamento centralizado
└── uploadMiddleware............. Multer para imagens

Services (3):
├── StockService................. Lógica de consumo de estoque
├── NotificationService.......... Criação automática de alertas
└── OrderService................. Processamento de pedidos

Data Access:
└── Prisma Client................ ORM type-safe para PostgreSQL
```

---

## 📚 Glossário

### Termos de Negócio

**Adicional (Extra):** Ingrediente adicional solicitado pelo cliente no pedido (ex: shot extra de café, queijo extra). Consome estoque e tem preço adicional.

**Categoria:** Agrupamento de produtos (ex: Bebidas, Lanches, Sobremesas). Cada categoria pode ter imagem ilustrativa.

**Desperdício (Waste):** Quantidade de ingrediente perdida durante preparo ou produção. Pode ser registrada como percentual ao finalizar pedido ou produção.

**Estoque Mínimo:** Quantidade mínima configurável de um ingrediente. Quando estoque fica abaixo, notificação é criada automaticamente.

**Ingrediente:** Matéria-prima usada nas receitas (ex: Farinha, Leite, Queijo). Tem unidade de medida e está vinculado a um warehouse.

**Movimento de Estoque:** Registro de entrada ou saída de ingrediente. Tipos: ENTRADA, SAIDA_PEDIDO, SAIDA_RECEITA, SAIDA_PERDA.

**Multi-tenant:** Arquitetura que permite múltiplos restaurantes no mesmo sistema com isolamento completo de dados.

**Notificação:** Alerta automático criado quando estoque fica baixo (LOW_STOCK) ou zerado (OUT_OF_STOCK).

**Pedido (Order):** Solicitação de produtos feita pelo garçom. Passa por status: PENDING → IN_PROGRESS → COMPLETED/CANCELLED.

**Perda:** Quantidade de ingrediente descartada. Motivos: VENCIDO, DETERIORADO, CONTAMINADO, QUEBRA, DESPERDICIO_PREPARO, OUTROS.

**Produto:** Item do cardápio (ex: Cappuccino, Hamburguer). Tem preço, categoria, imagem e receita (lista de ingredientes).

**Receita:** Lista de ingredientes com quantidades necessárias para produzir um produto.

**Restaurante:** Estabelecimento cadastrado no sistema. Pode ser cafeteria, lanchonete, restaurante, etc.

**Warehouse:** Estoque físico do restaurante (ex: Cozinha, Bar, Depósito). Ingredientes são vinculados a warehouses.

---

### Termos Técnicos

**Bcrypt:** Algoritmo de criptografia de senha com salt. Usado para armazenar senhas de forma segura.

**Cascade Delete:** Deleção em cascata. Quando entidade pai é deletada, filhos são deletados automaticamente.

**Health Check:** Endpoint que verifica se sistema está funcionando e conectado ao banco de dados.

**Helmet:** Biblioteca que configura headers HTTP de segurança (XSS, clickjacking, etc).

**JWT (JSON Web Token):** Token de autenticação usado para identificar usuário nas requisições.

**Middleware:** Função que intercepta requisição antes de chegar ao controller. Usado para autenticação, validação, etc.

**Multi-tenant Enforcement:** Validação que garante usuário só acessa dados do seu restaurante.

**Prisma ORM:** Framework de banco de dados type-safe para Node.js. Facilita queries e migrations.

**Rate Limiting:** Limite de requisições por período de tempo. Previne ataques DDoS.

**Schema:** Definição da estrutura do banco de dados (tabelas, colunas, relações).

**Transaction:** Operação atômica no banco de dados. Garante que todas as operações sejam executadas ou nenhuma.

**Yup:** Biblioteca de validação de schemas JavaScript. Valida dados de entrada das requisições.

---

## 🎯 Conclusão

Este sistema oferece uma solução completa e profissional para gestão de cafeterias e restaurantes, com foco em:

✅ **Controle preciso de estoque** com consumo automático  
✅ **Rastreamento completo** de todas as movimentações  
✅ **Notificações inteligentes** para evitar falta de ingredientes  
✅ **Multi-tenant robusto** com isolamento de dados  
✅ **Fluxo otimizado** de pedidos (garçom → cozinha)  
✅ **Segurança profissional** com autenticação e permissões  

**Status Atual:** 90% completo e pronto para produção!

**Próximos Passos Sugeridos:**
1. Deploy em ambiente de produção
2. Treinamento da equipe
3. Monitoramento de uso e feedback
4. Implementação de melhorias futuras (Sprint 5) conforme demanda

---

**Desenvolvido para equipes pequenas que precisam de uma solução robusta sem over-engineering.**

*Documentação criada em: Outubro 2025*  
*Versão: 1.0.0*
