import { Router } from 'express';
import { PrismaClient } from '../generated/prisma/index.js';
import {
  registerUser,
  loginUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser
} from './app/controllers/userController.js';
import {
  createRestaurant,
  getRestaurantsList,
  getAllRestaurants,
  getRestaurantById,
  updateRestaurant,
  deleteRestaurant
} from './app/controllers/restaurantController.js';
import {
  createWarehouse,
  getWarehousesByRestaurant,
  getWarehouseById,
  updateWarehouse,
  deleteWarehouse
} from './app/controllers/warehouseController.js';
import {
  createIngredient,
  getIngredientsByRestaurant,
  deleteIngredient
} from './app/controllers/ingredientController.js';
import {
  setMinimumStock,
  addStock,
  consumeStockByProduct,
  registerStockLoss,
  getRestaurantStockOverview
} from './app/controllers/stockController.js';
import {
  createProduct,
  getProductsByRestaurant,
  getProductById,
  updateProduct,
  deleteProduct,
  updateProductRecipe,
  produceProduct
} from './app/controllers/productController.js';
import {
  createCategory,
  getCategoriesByRestaurant,
  getCategoryById,
  updateCategory,
  deleteCategory
} from './app/controllers/categoryController.js';
import {
  createOrder,
  listOrders,
  getOrderById,
  updateOrderStatus,
  completeOrder,
  cancelOrder
} from './app/controllers/orderController.js';
import {
  getNotificationsByRestaurant,
  markNotificationAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllRead
} from './app/controllers/notificationController.js';
import { validateSchema } from './middlewares/validation.js';
import {
  requireDeveloper,
  requireDeveloperToken,
  requireAuth,
  requireAdmin,
  requireAdminOrDeveloper,
  requireKitchenOrAdmin,
  requireGarcomOrAdmin
} from './middlewares/authMiddleware.js';
import { uploadSingleImage, handleUploadError } from './middlewares/uploadMiddleware.js';
import {
  registerUserSchema,
  registerDeveloperSchema,
  loginUserSchema,
  updateUserSchema,
  idParamSchema
} from './validations/userValidation.js';
import {
  createRestaurantSchema,
  updateRestaurantSchema,
  restaurantIdParamSchema
} from './validations/restaurantValidation.js';

const routes = Router();
const prisma = new PrismaClient();

// ===== ROTA DE HEALTH CHECK =====
routes.get('/health', async (req, res) => {
  try {
    // Testar conexão com banco de dados
    await prisma.$queryRaw`SELECT 1`;

    res.json({
      status: 'healthy',
      message: '✅ API funcionando perfeitamente!',
      timestamp: new Date().toISOString(),
      uptime: `${Math.floor(process.uptime())} segundos`,
      database: {
        status: 'connected',
        type: 'PostgreSQL (Neon)'
      },
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    console.error('❌ Health check falhou:', error);
    res.status(503).json({
      status: 'unhealthy',
      message: '❌ Erro de conexão com o banco de dados',
      timestamp: new Date().toISOString(),
      database: {
        status: 'disconnected',
        error: error.message
      }
    });
  }
});

// ===== ROTA BÁSICA =====
routes.get('/', (req, res) => {
  res.json({
    message: 'Bem-vindo à Cafeterias API!',
    version: '1.0.0',
    endpoints: {
      auth: {
        register: 'POST /users/register (TOKEN DEVELOPER)',
        registerDeveloper: 'POST /users/register-developer (TOKEN DEVELOPER)',
        login: 'POST /users/login (retorna token + permissões)'
      },
      restaurants: {
        create: 'POST /restaurants/register (TOKEN DEVELOPER + LOGO OBRIGATÓRIA)',
        list: 'GET /restaurants/list (público)',
        getAll: 'GET /restaurants (TOKEN DEVELOPER)',
        getById: 'GET /restaurants/:id (público)',
        update: 'PUT /restaurants/:id (TOKEN DEVELOPER)',
        delete: 'DELETE /restaurants/:id (TOKEN DEVELOPER)'
      },
      users: {
        list: 'GET /users',
        getById: 'GET /users/:id',
        update: 'PUT /users/:id',
        delete: 'DELETE /users/:id'
      },
      warehouses: {
        create: 'POST /warehouses/create (TOKEN ADMIN - criar estoque)',
        listByRestaurant: 'GET /warehouses/restaurant/:restaurantId (TOKEN JWT)',
        getById: 'GET /warehouses/:warehouseId (TOKEN JWT)',
        update: 'PUT /warehouses/:warehouseId (TOKEN ADMIN)',
        delete: 'DELETE /warehouses/:warehouseId (TOKEN ADMIN)'
      },
      ingredients: {
        create: 'POST /ingredients/create (TOKEN ADMIN - requer warehouseId + auto-cria Stock zerado)',
        listByRestaurant: 'GET /ingredients/restaurant/:restaurantId (TOKEN JWT - qualquer usuário)',
        delete: 'DELETE /ingredients/:ingredientId (TOKEN ADMIN - deleta ingrediente + estoque)'
      },
      products: {
        create: 'POST /products/create (TOKEN ADMIN - pode incluir receita + UPLOAD DE IMAGEM)',
        listByRestaurant: 'GET /products/restaurant/:restaurantId (TOKEN JWT)',
        getById: 'GET /products/:productId (TOKEN JWT - retorna receita completa com estoque)',
        update: 'PUT /products/:productId (TOKEN ADMIN - UPLOAD DE IMAGEM)',
        delete: 'DELETE /products/:productId (TOKEN ADMIN)',
        updateRecipe: 'PUT /products/:productId/recipe (TOKEN ADMIN - atualizar ingredientes)',
        produce: 'POST /products/:productId/produce (TOKEN COZINHA/ADMIN - PRODUZIR + CONSUMIR ESTOQUE)'
      },
      categories: {
        create: 'POST /categories/create (TOKEN ADMIN - UPLOAD DE IMAGEM)',
        listByRestaurant: 'GET /categories/restaurant/:restaurantId (TOKEN JWT)',
        getById: 'GET /categories/:categoryId (TOKEN JWT - retorna produtos da categoria)',
        update: 'PUT /categories/:categoryId (TOKEN ADMIN - UPLOAD DE IMAGEM)',
        delete: 'DELETE /categories/:categoryId (TOKEN ADMIN - só se não tiver produtos)'
      },
      stock: {
        note: 'Stock é criado automaticamente ao cadastrar ingrediente com quantidade 0',
        setMinimum: 'PUT /stock/minimum/:ingredientId (TOKEN ADMIN/DEVELOPER)',
        addStock: 'POST /stock/add/:ingredientId (TOKEN ADMIN/DEVELOPER - ENTRADA)',
        registerLoss: 'POST /stock/loss/:ingredientId (TOKEN COZINHA/ADMIN - perda/desperdício)',
        overview: 'GET /stock/overview/:restaurantId (TOKEN JWT - qualquer usuário)'
      },
      orders: {
        create: 'POST /orders/create (TOKEN GARCOM/ADMIN - criar pedido com itens)',
        list: 'GET /orders (TOKEN JWT - listar pedidos do restaurante, filtro ?status=PENDING)',
        getById: 'GET /orders/:orderId (TOKEN JWT - detalhes completos do pedido)',
        updateStatus: 'PATCH /orders/:orderId/status (TOKEN COZINHA/ADMIN - atualizar status)',
        complete: 'POST /orders/:orderId/complete (TOKEN COZINHA/ADMIN - finalizar + CONSUMIR ESTOQUE)',
        cancel: 'DELETE /orders/:orderId/cancel (TOKEN GARCOM/ADMIN - cancelar pedido)'
      }
    },
    workflow: {
      '1_create_warehouse': 'POST /warehouses/create → ADMIN cria estoque (ex: Estoque Cozinha, Estoque Bar)',
      '2_create_ingredient': 'POST /ingredients/create → ADMIN cria ingrediente no estoque (warehouseId obrigatório)',
      '3_add_stock': 'POST /stock/add/:ingredientId → ADMIN/DEVELOPER adiciona quantidade (soma)',
      '4_create_product': 'POST /products/create → ADMIN cria produto com receita (ingredientes + quantidades)',
      '5_update_recipe': 'PUT /products/:productId/recipe → ADMIN atualiza receita se necessário',
      '6_create_order': 'POST /orders/create → GARCOM cria pedido com produtos (body: {items: [{productId, quantity, additional, observations}]})',
      '7_kitchen_accept': 'PATCH /orders/:orderId/status → COZINHA aceita pedido (body: {status: "IN_PROGRESS"})',
      '8_complete_order': 'POST /orders/:orderId/complete → COZINHA finaliza pedido (CONSOME ESTOQUE + registra desperdício opcional)',
      '9_manual_loss': 'POST /stock/loss/:ingredientId → COZINHA/ADMIN registra perda manual (fora do pedido)',
      '10_produce_product': 'POST /products/:productId/produce → COZINHA/ADMIN produz produto avulso (valida + consome estoque)'
    },
    permissions: {
      'ADMIN': 'Pode: TUDO (gerenciar produtos, ingredientes, adicionar estoque, produzir, criar/finalizar pedidos, registrar perdas)',
      'DEVELOPER': 'Pode: gerenciar restaurantes, adicionar estoque, visualizar tudo de todos os restaurantes',
      'COZINHA': 'Pode: visualizar produtos/ingredientes/estoque, produzir produtos, ACEITAR e FINALIZAR pedidos (consome estoque), registrar perdas',
      'GARCOM': 'Pode: visualizar produtos, CRIAR pedidos, visualizar pedidos, cancelar pedidos'
    }
  });
});

// ===== ROTAS DE AUTENTICAÇÃO COM VALIDAÇÃO =====
routes.post('/users/register', validateSchema(registerUserSchema), registerUser);              // Cadastrar usuário normal
routes.post('/users/register-developer', validateSchema(registerDeveloperSchema), registerUser); // Cadastrar DEVELOPER
routes.post('/users/login', validateSchema(loginUserSchema), loginUser);                       // Login



// ===== ROTAS DE RESTAURANTES =====
routes.post('/restaurants/register',
  requireDeveloperToken,
  uploadSingleImage('logo'),
  validateSchema(createRestaurantSchema),
  createRestaurant
);           // Criar (DEVELOPER JWT)
routes.get('/restaurants/list', getRestaurantsList);                                                               // Listar para seleção (público)
routes.get('/restaurants', requireDeveloperToken, getAllRestaurants);                                                   // Listar todos (DEVELOPER JWT)
routes.get('/restaurants/:id', validateSchema(restaurantIdParamSchema, 'params'), getRestaurantById);             // Buscar por ID (público)
routes.put('/restaurants/:id', requireDeveloperToken, validateSchema(restaurantIdParamSchema, 'params'), validateSchema(updateRestaurantSchema), updateRestaurant); // Atualizar (DEVELOPER JWT)
routes.delete('/restaurants/:id', requireDeveloperToken, validateSchema(restaurantIdParamSchema, 'params'), deleteRestaurant); // Deletar (DEVELOPER JWT)

// ===== MIDDLEWARE DE TRATAMENTO DE ERROS DE UPLOAD =====
routes.use(handleUploadError);

// ===== ROTAS CRUD DE USUÁRIOS COM VALIDAÇÃO =====
routes.get('/users', requireAdminOrDeveloper, getAllUsers);             // Listar todos (ADMIN/DEVELOPER)
routes.get('/users/:id', requireAuth, validateSchema(idParamSchema, 'params'), getUserById);         // Buscar por ID (qualquer autenticado)
routes.put('/users/:id', requireAdminOrDeveloper, validateSchema(idParamSchema, 'params'), validateSchema(updateUserSchema), updateUser);          // Atualizar (ADMIN/DEVELOPER)
routes.delete('/users/:id', requireAdminOrDeveloper, validateSchema(idParamSchema, 'params'), deleteUser);       // Deletar (ADMIN/DEVELOPER)

// ===== ROTAS DE ESTOQUES/ARMAZÉNS =====
routes.post('/warehouses/create', requireAdmin, createWarehouse);                                     // Criar estoque (APENAS ADMIN)
routes.get('/warehouses/restaurant/:restaurantId', requireAuth, getWarehousesByRestaurant);          // Listar estoques por restaurante (qualquer autenticado)
routes.get('/warehouses/:warehouseId', requireAuth, getWarehouseById);                                // Buscar estoque por ID (qualquer autenticado)
routes.put('/warehouses/:warehouseId', requireAdmin, updateWarehouse);                                // Atualizar estoque (APENAS ADMIN)
routes.delete('/warehouses/:warehouseId', requireAdmin, deleteWarehouse);                             // Deletar estoque (APENAS ADMIN)

// ===== ROTAS DE INGREDIENTES =====
routes.post('/ingredients/create', requireAdmin, createIngredient);                                   // Criar ingrediente (APENAS ADMIN + requer warehouseId)
routes.get('/ingredients/restaurant/:restaurantId', requireAuth, getIngredientsByRestaurant);        // Listar ingredientes por restaurante (qualquer autenticado)
routes.delete('/ingredients/:ingredientId', requireAdmin, deleteIngredient);                         // Deletar ingrediente (APENAS ADMIN)

// ===== ROTAS DE CATEGORIAS =====
routes.post('/categories/create', requireAdmin, uploadSingleImage('image'), createCategory);         // Criar categoria (ADMIN + UPLOAD DE IMAGEM)
routes.get('/categories/restaurant/:restaurantId', requireAuth, getCategoriesByRestaurant);          // Listar categorias por restaurante
routes.get('/categories/:categoryId', requireAuth, getCategoryById);                                 // Buscar categoria por ID (com produtos)
routes.put('/categories/:categoryId', requireAdmin, uploadSingleImage('image'), updateCategory);     // Atualizar categoria (ADMIN + UPLOAD DE IMAGEM)
routes.delete('/categories/:categoryId', requireAdmin, deleteCategory);                              // Deletar categoria (ADMIN - só se não tiver produtos)

// ===== ROTAS DE PRODUTOS =====
routes.post('/products/create', requireAdmin, uploadSingleImage('image'), createProduct);            // Criar produto (ADMIN + receita + UPLOAD DE IMAGEM)
routes.get('/products/restaurant/:restaurantId', requireAuth, getProductsByRestaurant);               // Listar produtos por restaurante
routes.get('/products/:productId', requireAuth, getProductById);                                      // Buscar produto por ID (com receita e estoque)
routes.put('/products/:productId', requireAdmin, uploadSingleImage('image'), updateProduct);         // Atualizar produto (ADMIN + UPLOAD DE IMAGEM)
routes.delete('/products/:productId', requireAdmin, deleteProduct);                                   // Deletar produto (APENAS ADMIN)
routes.put('/products/:productId/recipe', requireAdmin, updateProductRecipe);                         // Atualizar receita do produto (APENAS ADMIN)
routes.post('/products/:productId/produce', requireKitchenOrAdmin, produceProduct);                   // Produzir produto (COZINHA/ADMIN) - CONSOME ESTOQUE AUTOMATICAMENTE

// ===== ROTAS DE ESTOQUE =====
// Nota: Stock é criado automaticamente ao cadastrar ingrediente (quantidade 0)
routes.put('/stock/minimum/:ingredientId', requireAdminOrDeveloper, setMinimumStock);                            // Definir/atualizar estoque mínimo
routes.post('/stock/add/:ingredientId', requireAdminOrDeveloper, addStock);                                      // Adicionar estoque (ENTRADA) - APENAS ADMIN/DEVELOPER
routes.post('/stock/loss/:ingredientId', requireKitchenOrAdmin, registerStockLoss);                            // Registrar perda/estrago - APENAS COZINHA/ADMIN
routes.get('/stock/overview/:restaurantId', requireAuth, getRestaurantStockOverview);               // Visão geral do estoque do restaurante (qualquer autenticado)

// ===== ROTAS DE PEDIDOS (ORDERS) =====
routes.post('/orders/create', requireGarcomOrAdmin, createOrder);                                    // Criar pedido (GARCOM/ADMIN)
routes.get('/orders', requireAuth, listOrders);                                                      // Listar pedidos do restaurante (qualquer autenticado)
routes.get('/orders/:orderId', requireAuth, getOrderById);                                           // Buscar pedido por ID (qualquer autenticado)
routes.patch('/orders/:orderId/status', requireKitchenOrAdmin, updateOrderStatus);                   // Atualizar status (COZINHA/ADMIN)
routes.post('/orders/:orderId/complete', requireKitchenOrAdmin, completeOrder);                      // Finalizar pedido + CONSUMIR ESTOQUE (COZINHA/ADMIN)
routes.delete('/orders/:orderId/cancel', requireGarcomOrAdmin, cancelOrder);                         // Cancelar pedido (GARCOM/ADMIN)

// ===== ROTAS DE NOTIFICAÇÕES =====
routes.get('/notifications/:restaurantId', requireAuth, getNotificationsByRestaurant);               // Listar notificações (?unreadOnly=true)
routes.put('/notifications/:notificationId/read', requireAuth, markNotificationAsRead);              // Marcar como lida
routes.put('/notifications/:restaurantId/read-all', requireAuth, markAllAsRead);                     // Marcar todas como lidas
routes.delete('/notifications/:notificationId', requireAuth, deleteNotification);                    // Deletar notificação
routes.delete('/notifications/:restaurantId/clear-read', requireAuth, deleteAllRead);                // Deletar todas lidas

export default routes;
