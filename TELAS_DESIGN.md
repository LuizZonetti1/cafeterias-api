# 📱 Guia de Telas - Sistema de Cafeteria

## 📋 Índice
- [Resumo Executivo](#resumo-executivo)
- [Fluxo de Navegação](#fluxo-de-navegação)
- [Telas por Perfil de Usuário](#telas-por-perfil-de-usuário)
- [Detalhamento das Telas](#detalhamento-das-telas)
- [Componentes Reutilizáveis](#componentes-reutilizáveis)
- [Priorização de Desenvolvimento](#priorização-de-desenvolvimento)

---

## 📊 Resumo Executivo

### Total de Telas: **32 telas**

| Categoria | Quantidade | Prioridade |
|-----------|------------|------------|
| **Autenticação** | 3 telas | 🔴 Alta |
| **GARÇOM** | 7 telas | 🔴 Alta |
| **COZINHA** | 5 telas | 🔴 Alta |
| **ADMIN** | 11 telas | 🟡 Média |
| **GERENCIAL** | 6 telas | 🟢 Baixa |

---

## 🗺️ Fluxo de Navegação

```
┌─────────────────┐
│  Splash Screen  │
│   (1 tela)      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│     Login       │
│   (1 tela)      │
└────────┬────────┘
         │
         ├─────────────────────┬─────────────────────┬─────────────────────┐
         ▼                     ▼                     ▼                     ▼
    ┌──────────┐         ┌──────────┐         ┌──────────┐         ┌──────────┐
    │  GARÇOM  │         │ COZINHA  │         │  ADMIN   │         │ GERENTE  │
    │ 7 telas  │         │ 5 telas  │         │ 11 telas │         │ 6 telas  │
    └──────────┘         └──────────┘         └──────────┘         └──────────┘
```

---

## 👥 Telas por Perfil de Usuário

### 🔐 AUTENTICAÇÃO (3 telas) - Acesso para todos

#### 1. **Splash Screen** 🎨
- **Objetivo:** Tela inicial de carregamento do app
- **Elementos:**
  - Logo da cafeteria
  - Animação de loading
  - Versão do app
- **Ações:**
  - Verifica se usuário está logado
  - Redireciona para Login ou Dashboard
- **Tempo:** 2-3 segundos
- **Design:** Minimalista, com cores da marca

#### 2. **Login** 🔑
- **Objetivo:** Autenticação do usuário
- **Elementos:**
  - Campo: Email/CPF
  - Campo: Senha (com olho para mostrar/ocultar)
  - Botão: "Entrar"
  - Link: "Esqueci minha senha"
  - Checkbox: "Lembrar-me"
- **Ações:**
  - POST `/users/login`
  - Salvar token JWT
  - Redirecionar baseado no perfil (role)
- **Validações:**
  - Email válido
  - Senha mínimo 6 caracteres
  - Mensagens de erro amigáveis

#### 3. **Recuperar Senha** 🔓
- **Objetivo:** Resetar senha esquecida
- **Elementos:**
  - Campo: Email
  - Botão: "Enviar link de recuperação"
  - Link: "Voltar ao login"
- **Ações:**
  - POST `/users/forgot-password`
  - Mostrar confirmação de email enviado
- **Design:** Simples, com ícone de email

---

### 👔 GARÇOM (7 telas) - Atendimento de mesas

#### 4. **Dashboard Garçom** 📊
- **Objetivo:** Visão geral das mesas e pedidos ativos
- **Elementos:**
  - Header: Nome do garçom, foto, notificações
  - Grid de mesas (status: livre, ocupada, aguardando pagamento)
  - Badge: Número de pedidos pendentes
  - Botão flutuante: "+ Novo Pedido"
  - Filtros: Todas, Ocupadas, Livres
- **Ações:**
  - GET `/orders?status=PENDING`
  - Atualização em tempo real via WebSocket
  - Tocar ao mesa → abrir detalhes
- **Indicadores visuais:**
  - 🟢 Verde: Mesa livre
  - 🟡 Amarelo: Mesa ocupada
  - 🔴 Vermelho: Aguardando pagamento

#### 5. **Criar Pedido** ➕
- **Objetivo:** Registrar novo pedido de uma mesa
- **Elementos:**
  - Seletor: Número da mesa
  - Campo: Código QR da mesa (opcional)
  - Lista de produtos com busca
  - Carrinho lateral com itens selecionados
  - Contador de quantidade (+/-)
  - Campo: Observações do pedido
  - Total: Valor calculado em tempo real
  - Botões: "Cancelar", "Confirmar Pedido"
- **Ações:**
  - GET `/products?available=true`
  - POST `/orders` com items[]
  - WebSocket: Notifica cozinha
- **Validações:**
  - Mesa deve estar selecionada
  - Mínimo 1 item no carrinho
  - Estoque disponível

#### 6. **Detalhes do Pedido** 📋
- **Objetivo:** Visualizar e atualizar status do pedido
- **Elementos:**
  - Header: #Pedido, Mesa, Horário
  - Status atual com cores
  - Timeline: Criado → Em Preparo → Pronto → Entregue
  - Lista de itens (nome, quantidade, preço)
  - Valor total
  - Botões de ação baseados no status:
    - PENDING: "Cancelar Pedido"
    - IN_PROGRESS: "Marcar como Entregue"
    - READY: "Marcar como Entregue"
- **Ações:**
  - GET `/orders/:id`
  - PUT `/orders/:id/status`
  - DELETE `/orders/:id` (cancelar)
- **WebSocket:** Atualização automática do status

#### 7. **Cardápio (Lista de Produtos)** 📖
- **Objetivo:** Visualizar produtos disponíveis
- **Elementos:**
  - Barra de busca
  - Filtros por categoria (Tabs)
  - Cards de produtos com:
    - Foto
    - Nome
    - Descrição curta
    - Preço
    - Badge: "Indisponível" se estoque zerado
  - Botão: "Adicionar ao pedido"
- **Ações:**
  - GET `/products`
  - GET `/categories`
  - Filtrar por categoria
- **Design:** Grid 2 colunas, cards com imagens

#### 8. **Histórico de Pedidos** 📜
- **Objetivo:** Ver pedidos anteriores
- **Elementos:**
  - Filtros: Hoje, Semana, Mês
  - Lista de pedidos com:
    - Data/hora
    - Mesa
    - Status final
    - Valor total
  - Busca por número do pedido
  - Pull to refresh
- **Ações:**
  - GET `/orders?date=YYYY-MM-DD`
  - Tocar → abrir detalhes

#### 9. **Notificações** 🔔
- **Objetivo:** Ver alertas em tempo real
- **Elementos:**
  - Lista de notificações não lidas
  - Tipos:
    - Pedido pronto para entrega
    - Pedido cancelado pela cozinha
    - Alerta de estoque baixo
  - Badge: Contador de não lidas
  - Botão: "Marcar todas como lidas"
- **Ações:**
  - GET `/notifications?is_read=false`
  - PUT `/notifications/:id` (marcar como lida)
- **WebSocket:** Recebe notificações em tempo real

#### 10. **Perfil do Garçom** 👤
- **Objetivo:** Gerenciar conta pessoal
- **Elementos:**
  - Foto de perfil (editável)
  - Nome completo
  - Email
  - CPF
  - Telefone
  - Botões: "Editar Perfil", "Alterar Senha", "Sair"
  - Estatísticas do dia:
    - Pedidos atendidos
    - Total vendido
- **Ações:**
  - GET `/users/me`
  - PUT `/users/:id`
  - Logout (limpar token)

---

### 👨‍🍳 COZINHA (5 telas) - Preparo de pedidos

#### 11. **Dashboard Cozinha** 🍳
- **Objetivo:** Ver pedidos pendentes e em preparo
- **Elementos:**
  - Header: Notificações, contador de pedidos
  - Tabs: "Pendentes" | "Em Preparo" | "Prontos"
  - Cards de pedidos com:
    - Número do pedido
    - Mesa
    - Hora do pedido
    - Tempo decorrido (atualiza em tempo real)
    - Lista de itens
    - Botões de ação
  - Som/vibração ao receber novo pedido
  - Badge vermelho: Pedidos atrasados (>15min)
- **Ações:**
  - GET `/orders?status=PENDING,IN_PROGRESS`
  - PUT `/orders/:id/status`
- **WebSocket:** 
  - Recebe `order:created` → adiciona na lista
  - Som de notificação

#### 12. **Detalhes do Pedido (Cozinha)** 📝
- **Objetivo:** Ver itens detalhados do pedido
- **Elementos:**
  - Header: #Pedido, Mesa, Tempo
  - Lista expandida de itens com:
    - Nome do produto
    - Quantidade
    - Ingredientes necessários
    - Observações especiais
  - Botões grandes:
    - "Iniciar Preparo" (PENDING → IN_PROGRESS)
    - "Marcar como Pronto" (IN_PROGRESS → READY)
    - "Cancelar Pedido" (motivo obrigatório)
- **Ações:**
  - GET `/orders/:id`
  - PUT `/orders/:id/status`
  - DELETE `/orders/:id`
- **WebSocket:** Notifica garçom sobre mudanças

#### 13. **Pedidos Prontos** ✅
- **Objetivo:** Lista de pedidos aguardando retirada
- **Elementos:**
  - Lista de pedidos com status READY
  - Tempo desde que ficou pronto
  - Mesa associada
  - Notificação se passou muito tempo (>5min)
  - Botão: "Pedido Retirado" (opcional)
- **Ações:**
  - GET `/orders?status=READY`
- **WebSocket:** Atualiza quando garçom marca como entregue

#### 14. **Estoque (Visão Cozinha)** 📦
- **Objetivo:** Verificar ingredientes disponíveis
- **Elementos:**
  - Lista de ingredientes com:
    - Nome
    - Quantidade atual
    - Unidade de medida
    - Badge vermelho: Estoque crítico
  - Filtros: "Todos" | "Estoque Baixo"
  - Barra de busca
  - Botão: "Reportar Falta" (cria notificação)
- **Ações:**
  - GET `/ingredients`
  - GET `/stock/low` (estoque baixo)
- **WebSocket:** Atualiza quando admin faz reposição

#### 15. **Notificações Cozinha** 🔔
- **Objetivo:** Alertas específicos da cozinha
- **Elementos:**
  - Novos pedidos
  - Pedidos urgentes (tempo longo)
  - Estoque crítico
  - Cancelamentos
  - Botão: "Limpar todas"
- **Ações:**
  - GET `/notifications?user_type=COZINHA`
- **WebSocket:** Som ao receber novo pedido

---

### 🛡️ ADMIN (11 telas) - Gestão operacional

#### 16. **Dashboard Admin** 📊
- **Objetivo:** Visão geral do sistema
- **Elementos:**
  - Cards de métricas:
    - Pedidos hoje (número)
    - Faturamento hoje (R$)
    - Alertas de estoque (número)
    - Produtos cadastrados
  - Gráfico: Pedidos por hora do dia
  - Status de conexão WebSocket (🟢/🔴)
  - Atalhos rápidos:
    - Criar produto
    - Gerenciar estoque
    - Ver pedidos ativos
  - Notificações urgentes no topo
- **Ações:**
  - GET `/orders/stats`
  - GET `/notifications?is_read=false`
- **WebSocket:** Métricas atualizam em tempo real

#### 17. **Gerenciar Produtos** 🍰
- **Objetivo:** CRUD completo de produtos
- **Elementos:**
  - Barra de busca
  - Filtros por categoria
  - Lista/Grid de produtos com:
    - Foto
    - Nome
    - Preço
    - Categoria
    - Status (Ativo/Inativo)
    - Botões: Editar, Excluir
  - Botão flutuante: "+ Novo Produto"
  - Pull to refresh
- **Ações:**
  - GET `/products`
  - DELETE `/products/:id`
  - Toggle ativo/inativo
- **Design:** Grid com cards, fotos grandes

#### 18. **Criar/Editar Produto** ➕✏️
- **Objetivo:** Cadastrar ou atualizar produto
- **Elementos:**
  - Upload de imagem (câmera ou galeria)
  - Campo: Nome do produto *
  - Campo: Descrição
  - Campo: Preço * (R$)
  - Seletor: Categoria *
  - Toggle: Produto ativo
  - Seção: Ingredientes necessários
    - Lista de ingredientes com quantidade
    - Botão: "+ Adicionar ingrediente"
  - Botões: "Cancelar", "Salvar"
- **Ações:**
  - POST `/products` (criar)
  - PUT `/products/:id` (editar)
  - POST `/products/:id/image` (upload)
  - GET `/categories`
  - GET `/ingredients`
- **Validações:**
  - Nome obrigatório
  - Preço > 0
  - Categoria selecionada
  - Pelo menos 1 ingrediente

#### 19. **Gerenciar Categorias** 🏷️
- **Objetivo:** CRUD de categorias de produtos
- **Elementos:**
  - Lista de categorias com:
    - Ícone/Cor
    - Nome
    - Número de produtos associados
    - Botões: Editar, Excluir
  - Botão: "+ Nova Categoria"
  - Drag and drop: Ordenar categorias
- **Ações:**
  - GET `/categories`
  - POST `/categories`
  - PUT `/categories/:id`
  - DELETE `/categories/:id`
- **Validações:**
  - Não pode excluir se tiver produtos associados

#### 20. **Criar/Editar Categoria** ➕
- **Objetivo:** Cadastrar categoria
- **Elementos:**
  - Upload de ícone
  - Campo: Nome da categoria *
  - Seletor: Cor primária (paleta)
  - Botões: "Cancelar", "Salvar"
- **Ações:**
  - POST `/categories`
  - PUT `/categories/:id`

#### 21. **Gerenciar Estoque** 📦
- **Objetivo:** Controle de ingredientes
- **Elementos:**
  - Tabs: "Ingredientes" | "Alertas" | "Histórico"
  - Lista de ingredientes com:
    - Nome
    - Quantidade atual / Quantidade mínima
    - Barra de progresso (visual)
    - Unidade de medida
    - Badge: 🔴 Crítico, 🟡 Baixo, 🟢 OK
    - Botões: Repor, Editar, Excluir
  - Botão: "+ Novo Ingrediente"
  - Filtros: Todos, Crítico, Baixo
- **Ações:**
  - GET `/ingredients`
  - GET `/stock/low`
  - PUT `/ingredients/:id`
  - DELETE `/ingredients/:id`
- **WebSocket:** Atualiza quando pedido consome estoque

#### 22. **Criar/Editar Ingrediente** ➕
- **Objetivo:** Cadastrar ingrediente no sistema
- **Elementos:**
  - Campo: Nome do ingrediente *
  - Campo: Quantidade atual *
  - Campo: Quantidade mínima * (alerta)
  - Seletor: Unidade de medida * (kg, L, unidade, g, ml)
  - Campo: Preço por unidade
  - Campo: Fornecedor
  - Botões: "Cancelar", "Salvar"
- **Ações:**
  - POST `/ingredients`
  - PUT `/ingredients/:id`

#### 23. **Repor Estoque** 📈
- **Objetivo:** Adicionar quantidade ao ingrediente
- **Elementos:**
  - Info: Nome do ingrediente
  - Info: Quantidade atual
  - Campo: Quantidade a adicionar *
  - Campo: Data de validade
  - Campo: Número da nota fiscal
  - Campo: Observações
  - Botões: "Cancelar", "Confirmar Reposição"
- **Ações:**
  - POST `/stock/replenish`
  - PUT `/ingredients/:id` (atualiza quantidade)
- **WebSocket:** Notifica cozinha sobre reposição

#### 24. **Gerenciar Usuários** 👥
- **Objetivo:** CRUD de usuários do sistema
- **Elementos:**
  - Lista de usuários com:
    - Foto
    - Nome
    - Email
    - Perfil (badge colorido)
    - Status (Ativo/Inativo)
    - Botões: Editar, Desativar, Resetar senha
  - Botão: "+ Novo Usuário"
  - Filtros por perfil: Todos, Admin, Garçom, Cozinha
  - Busca por nome/email
- **Ações:**
  - GET `/users`
  - DELETE `/users/:id` (desativar)
  - POST `/users/:id/reset-password`
- **Permissões:** Apenas DEVELOPER e ADMIN

#### 25. **Criar/Editar Usuário** ➕
- **Objetivo:** Cadastrar funcionário
- **Elementos:**
  - Upload de foto
  - Campo: Nome completo *
  - Campo: Email *
  - Campo: CPF *
  - Campo: Telefone
  - Seletor: Perfil * (GARCOM, COZINHA, ADMIN)
  - Campo: Senha * (apenas criação)
  - Toggle: Usuário ativo
  - Botões: "Cancelar", "Salvar"
- **Ações:**
  - POST `/users`
  - PUT `/users/:id`
- **Validações:**
  - Email único
  - CPF válido e único
  - Senha mínimo 6 caracteres

#### 26. **Notificações Admin** 🔔
- **Objetivo:** Central de alertas do sistema
- **Elementos:**
  - Tabs: "Não lidas" | "Todas"
  - Lista de notificações com:
    - Tipo (ícone + cor)
    - Mensagem
    - Data/hora
    - Botão: "Marcar como lida"
  - Tipos de notificação:
    - 🔴 Estoque crítico
    - 🟡 Estoque baixo
    - 🔵 Novo pedido criado
    - ✅ Pedido finalizado
    - ❌ Pedido cancelado
  - Botão: "Marcar todas como lidas"
  - Filtros por tipo
- **Ações:**
  - GET `/notifications`
  - PUT `/notifications/:id`
  - PUT `/notifications/mark-all-read`
- **WebSocket:** Recebe todas as notificações do sistema

---

### 📈 GERENCIAL (6 telas) - Relatórios e análises

#### 27. **Dashboard Gerencial** 📊
- **Objetivo:** Visão estratégica do negócio
- **Elementos:**
  - Seletor de período: Hoje, Semana, Mês, Customizado
  - Cards de KPIs:
    - Faturamento total
    - Ticket médio
    - Produtos mais vendidos
    - Horários de pico
  - Gráfico de vendas (linha)
  - Gráfico de produtos (pizza)
  - Comparação com período anterior (%)
  - Botão: "Exportar Relatório" (PDF)
- **Ações:**
  - GET `/reports/sales?period=month`
  - GET `/reports/products?period=month`
- **Design:** Gráficos interativos, cores vibrantes

#### 28. **Relatório de Vendas** 💰
- **Objetivo:** Análise detalhada de faturamento
- **Elementos:**
  - Filtros:
    - Data início/fim
    - Categoria de produto
    - Forma de pagamento
    - Garçom
  - Tabela de vendas com:
    - Data/hora
    - Pedido #
    - Mesa
    - Itens
    - Valor
    - Garçom
  - Totalizadores:
    - Subtotal
    - Descontos
    - Total
  - Gráfico: Vendas por dia
  - Botões: "Exportar Excel", "Exportar PDF"
- **Ações:**
  - GET `/reports/sales?start_date&end_date`
- **Design:** Tabela responsiva, scroll horizontal

#### 29. **Relatório de Produtos** 📦
- **Objetivo:** Análise de desempenho por produto
- **Elementos:**
  - Filtros:
    - Período
    - Categoria
    - Ordenar por: Mais vendidos, Menos vendidos, Maior faturamento
  - Lista de produtos com:
    - Foto
    - Nome
    - Quantidade vendida
    - Faturamento total
    - Ticket médio
    - Gráfico mini (sparkline)
  - Botão: "Exportar Relatório"
- **Ações:**
  - GET `/reports/products?start_date&end_date`

#### 30. **Relatório de Estoque** 📊
- **Objetivo:** Análise de consumo de ingredientes
- **Elementos:**
  - Filtros: Período
  - Lista de ingredientes com:
    - Nome
    - Estoque inicial
    - Consumo no período
    - Reposições
    - Estoque final
    - Custo total
  - Gráfico: Consumo ao longo do tempo
  - Alertas: Ingredientes mais consumidos
  - Botão: "Exportar Relatório"
- **Ações:**
  - GET `/reports/stock?start_date&end_date`

#### 31. **Relatório de Funcionários** 👥
- **Objetivo:** Performance da equipe
- **Elementos:**
  - Filtros: Período, Perfil
  - Lista de funcionários com:
    - Nome
    - Perfil
    - Pedidos atendidos
    - Faturamento gerado
    - Ticket médio
    - Avaliação (se houver)
  - Ranking: Top 5 garçons
  - Gráfico: Produtividade por hora
  - Botão: "Exportar Relatório"
- **Ações:**
  - GET `/reports/employees?start_date&end_date`

#### 32. **Configurações do Sistema** ⚙️
- **Objetivo:** Configurações gerais da aplicação
- **Elementos:**
  - Seção: Informações do Restaurante
    - Nome
    - Logo (upload)
    - Endereço
    - Telefone
    - Horário de funcionamento
  - Seção: Preferências
    - Tema (Claro/Escuro)
    - Idioma
    - Moeda
    - Fuso horário
  - Seção: Notificações
    - Push notifications (on/off)
    - Sons (on/off)
    - Vibração (on/off)
  - Seção: Avançado
    - Limpar cache
    - Exportar dados
    - Versão do app
    - Termos de uso
    - Política de privacidade
  - Botões: "Salvar", "Restaurar padrões"
- **Ações:**
  - GET `/restaurants/:id`
  - PUT `/restaurants/:id`

---

## 🧩 Componentes Reutilizáveis

### Lista de Componentes que podem ser compartilhados entre telas:

1. **Header Padrão**
   - Logo/título
   - Botão voltar
   - Ícone de notificações com badge
   - Menu hamburger

2. **Card de Produto**
   - Imagem
   - Nome
   - Preço
   - Botão de ação

3. **Card de Pedido**
   - Número do pedido
   - Mesa
   - Status (colorido)
   - Hora
   - Botões de ação

4. **Badge de Status**
   - Cores dinâmicas baseadas no status
   - Texto personalizado

5. **Bottom Tab Navigation**
   - 4-5 abas principais
   - Ícones + labels
   - Badge de notificações

6. **Loading Spinner**
   - Animação de carregamento
   - Mensagem customizável

7. **Empty State**
   - Ilustração
   - Mensagem
   - Botão de ação

8. **Alert/Toast**
   - Sucesso (verde)
   - Erro (vermelho)
   - Aviso (amarelo)
   - Info (azul)

9. **Modal de Confirmação**
   - Título
   - Mensagem
   - Botões: Cancelar/Confirmar

10. **Input com Validação**
    - Label
    - Campo de texto
    - Mensagem de erro
    - Ícones (olho, check, etc)

11. **Filtros/Search Bar**
    - Campo de busca
    - Botões de filtro
    - Chips de filtros ativos

12. **Lista Paginada**
    - Pull to refresh
    - Infinite scroll
    - Loading no final

---

## 🎯 Priorização de Desenvolvimento

### **FASE 1 - MVP (4-6 semanas)** 🔴 CRÍTICO

**Objetivo:** Sistema funcional para operação básica

1. ✅ Autenticação (3 telas)
   - Splash Screen
   - Login
   - Recuperar Senha

2. ✅ GARÇOM - Core (4 telas)
   - Dashboard Garçom
   - Criar Pedido
   - Detalhes do Pedido
   - Cardápio

3. ✅ COZINHA - Core (3 telas)
   - Dashboard Cozinha
   - Detalhes do Pedido
   - Pedidos Prontos

**Total:** 10 telas | **Entregas:** Criar, visualizar e finalizar pedidos

---

### **FASE 2 - Gestão (4-6 semanas)** 🟡 IMPORTANTE

**Objetivo:** Ferramentas administrativas essenciais

4. ✅ ADMIN - Produtos (5 telas)
   - Dashboard Admin
   - Gerenciar Produtos
   - Criar/Editar Produto
   - Gerenciar Categorias
   - Criar/Editar Categoria

5. ✅ ADMIN - Estoque (4 telas)
   - Gerenciar Estoque
   - Criar/Editar Ingrediente
   - Repor Estoque
   - Estoque (Visão Cozinha)

**Total:** 9 telas | **Entregas:** CRUD de produtos e controle de estoque

---

### **FASE 3 - Experiência (3-4 semanas)** 🟢 DESEJÁVEL

**Objetivo:** Melhorar UX e notificações

6. ✅ Notificações (3 telas)
   - Notificações Garçom
   - Notificações Cozinha
   - Notificações Admin

7. ✅ Perfis (4 telas)
   - Perfil do Garçom
   - Gerenciar Usuários
   - Criar/Editar Usuário
   - Histórico de Pedidos

**Total:** 7 telas | **Entregas:** Sistema de notificações e gestão de usuários

---

### **FASE 4 - Relatórios (3-4 semanas)** 🔵 OPCIONAL

**Objetivo:** Inteligência de negócio

8. ✅ Gerencial (6 telas)
   - Dashboard Gerencial
   - Relatório de Vendas
   - Relatório de Produtos
   - Relatório de Estoque
   - Relatório de Funcionários
   - Configurações do Sistema

**Total:** 6 telas | **Entregas:** Análises e exportação de relatórios

---

## 📐 Guia de Design

### Paleta de Cores Sugerida

```
Primária:    #1976D2 (Azul)
Secundária:  #FF9800 (Laranja)
Sucesso:     #4CAF50 (Verde)
Erro:        #F44336 (Vermelho)
Aviso:       #FFC107 (Amarelo)
Info:        #2196F3 (Azul claro)

Fundo:       #F5F5F5 (Cinza claro)
Cards:       #FFFFFF (Branco)
Texto:       #333333 (Cinza escuro)
Texto Sec.:  #666666 (Cinza médio)
```

### Tipografia

```
Títulos:     24px - Bold
Subtítulos:  18px - SemiBold
Corpo:       14px - Regular
Pequeno:     12px - Regular
```

### Espaçamentos

```
Padding cards:    16px
Margin entre:     12px
Border radius:    8px
Ícones:          24px
```

### Status Colors

```
PENDING:      #FFC107 (Amarelo)
IN_PROGRESS:  #2196F3 (Azul)
READY:        #FF9800 (Laranja)
COMPLETED:    #4CAF50 (Verde)
CANCELLED:    #F44336 (Vermelho)
```

---

## ✅ Checklist por Tela

Use este checklist para garantir que todas as telas foram implementadas:

### Autenticação
- [ ] 1. Splash Screen
- [ ] 2. Login
- [ ] 3. Recuperar Senha

### GARÇOM (7)
- [ ] 4. Dashboard Garçom
- [ ] 5. Criar Pedido
- [ ] 6. Detalhes do Pedido
- [ ] 7. Cardápio
- [ ] 8. Histórico de Pedidos
- [ ] 9. Notificações
- [ ] 10. Perfil do Garçom

### COZINHA (5)
- [ ] 11. Dashboard Cozinha
- [ ] 12. Detalhes do Pedido (Cozinha)
- [ ] 13. Pedidos Prontos
- [ ] 14. Estoque (Visão Cozinha)
- [ ] 15. Notificações Cozinha

### ADMIN (11)
- [ ] 16. Dashboard Admin
- [ ] 17. Gerenciar Produtos
- [ ] 18. Criar/Editar Produto
- [ ] 19. Gerenciar Categorias
- [ ] 20. Criar/Editar Categoria
- [ ] 21. Gerenciar Estoque
- [ ] 22. Criar/Editar Ingrediente
- [ ] 23. Repor Estoque
- [ ] 24. Gerenciar Usuários
- [ ] 25. Criar/Editar Usuário
- [ ] 26. Notificações Admin

### GERENCIAL (6)
- [ ] 27. Dashboard Gerencial
- [ ] 28. Relatório de Vendas
- [ ] 29. Relatório de Produtos
- [ ] 30. Relatório de Estoque
- [ ] 31. Relatório de Funcionários
- [ ] 32. Configurações do Sistema

---

## 🎨 Referências de Design

### Inspirações de UI/UX:
- **Dribbble:** Buscar "restaurant app", "food ordering"
- **Behance:** "POS system", "kitchen management"
- **Material Design:** Guidelines do Google
- **Apple HIG:** Human Interface Guidelines

### Ferramentas de Design:
- **Figma:** Protótipo interativo
- **Adobe XD:** Wireframes
- **Sketch:** Design de interfaces
- **Miro:** Fluxos e arquitetura

---

## 📱 Responsividade

### Breakpoints recomendados:

```
Mobile:     < 768px  (Telefones)
Tablet:     768-1024px (iPads)
Desktop:    > 1024px (Não prioritário)
```

**Foco principal:** Mobile-first (telefones 5.5" - 6.7")

---

## 🚀 Próximos Passos para o Time de Design

1. **Definir Identidade Visual**
   - Logo da cafeteria
   - Paleta de cores
   - Tipografia
   - Ícones personalizados

2. **Criar Wireframes** (Fase 1 primeiro)
   - Estrutura das 10 telas do MVP
   - Fluxos de navegação
   - Aprovação com stakeholders

3. **Protótipo Interativo**
   - Figma com transições
   - Testar com usuários reais
   - Coletar feedback

4. **Guia de Estilo (Design System)**
   - Componentes documentados
   - Especificações técnicas
   - Assets exportados para dev

5. **Handoff para Desenvolvimento**
   - Exportar assets (PNG, SVG)
   - Especificações de espaçamento
   - Animações e transições

---

**Resumo Final:**
- ✅ **32 telas mapeadas**
- ✅ **4 fases de desenvolvimento priorizadas**
- ✅ **Componentes reutilizáveis identificados**
- ✅ **Guia de design fornecido**
- ✅ **Checklist completo para acompanhamento**

**Seu time de design agora tem um roadmap claro! 🎨🚀**

*Documentação criada em: Outubro 2025*  
*Backend API: ✅ Pronto*  
*WebSocket: ✅ Implementado*  
*Próximo passo: Design das telas do MVP (Fase 1)*
