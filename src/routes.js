import { Router } from 'express';
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
  createStock,
  setMinimumStock,
  addStock,
  consumeStockByProduct,
  registerStockLoss,
  getRestaurantStockOverview
} from './app/controllers/stockController.js';
import { validateSchema } from './middlewares/validation.js';
import {
  requireDeveloper,
  requireDeveloperToken,
  requireAuth,
  requireAdmin,
  requireAdminOrDeveloper,
  requireKitchenOrAdmin
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

// ===== ROTA DE HEALTH CHECK =====
routes.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Cafeterias API funcionando!',
    timestamp: new Date().toISOString(),
    database: 'Conectado'
  });
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
        create: 'POST /ingredients/create (TOKEN ADMIN - requer warehouseId + cria estoque zerado)',
        listByRestaurant: 'GET /ingredients/restaurant/:restaurantId (TOKEN JWT - qualquer usuário)',
        delete: 'DELETE /ingredients/:ingredientId (TOKEN ADMIN - deleta ingrediente + estoque)'
      },
      stock: {
        create: 'POST /stock/create (TOKEN ADMIN/DEVELOPER)',
        setMinimum: 'PUT /stock/minimum/:ingredientId (TOKEN ADMIN/DEVELOPER)',
        addStock: 'POST /stock/add/:ingredientId (TOKEN ADMIN/DEVELOPER - ENTRADA)',
        autoConsume: 'POST /stock/consume (TOKEN JWT - consumo automático)',
        registerLoss: 'POST /stock/loss/:ingredientId (TOKEN COZINHA/ADMIN - perda/desperdício)',
        overview: 'GET /stock/overview/:restaurantId (TOKEN JWT - qualquer usuário)'
      }
    },
    workflow: {
      '1_create_warehouse': 'POST /warehouses/create → ADMIN cria estoque (ex: Estoque Cozinha, Estoque Bar)',
      '2_create_ingredient': 'POST /ingredients/create → ADMIN cria ingrediente no estoque (warehouseId obrigatório)',
      '3_add_stock': 'POST /stock/add/:ingredientId → ADMIN/DEVELOPER adiciona quantidade (soma)',
      '4_auto_consume': 'POST /stock/consume → ao finalizar pedido (baseado na receita)',
      '5_manual_loss': 'POST /stock/loss/:ingredientId → COZINHA/ADMIN registra desperdício/estrago'
    },
    permissions: {
      'ADMIN': 'Pode: criar ingredientes, adicionar estoque, registrar perdas',
      'DEVELOPER': 'Pode: adicionar estoque',
      'COZINHA': 'Pode: registrar perdas/desperdício',
      'GARCOM': 'Pode: apenas visualizar'
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
routes.get('/users', getAllUsers);             // Listar todos
routes.get('/users/:id', validateSchema(idParamSchema, 'params'), getUserById);         // Buscar por ID
routes.put('/users/:id', validateSchema(idParamSchema, 'params'), validateSchema(updateUserSchema), updateUser);          // Atualizar
routes.delete('/users/:id', validateSchema(idParamSchema, 'params'), deleteUser);       // Deletar

// ===== ROTAS DE ESTOQUES/ARMAZÉNS =====
routes.post('/warehouses/create', requireAdmin, createWarehouse);                                     // Criar estoque (APENAS ADMIN)
routes.get('/warehouses/restaurant/:restaurantId', requireAdmin, getWarehousesByRestaurant);          // Listar estoques por restaurante
routes.get('/warehouses/:warehouseId', requireAuth, getWarehouseById);                                // Buscar estoque por ID
routes.put('/warehouses/:warehouseId', requireAdmin, updateWarehouse);                                // Atualizar estoque (APENAS ADMIN)
routes.delete('/warehouses/:warehouseId', requireAdmin, deleteWarehouse);                             // Deletar estoque (APENAS ADMIN)

// ===== ROTAS DE INGREDIENTES =====
routes.post('/ingredients/create', requireAdmin, createIngredient);                                   // Criar ingrediente (APENAS ADMIN + requer warehouseId)
routes.get('/ingredients/restaurant/:restaurantId', requireAdmin, getIngredientsByRestaurant);        // Listar ingredientes por restaurante (com status do estoque)
routes.delete('/ingredients/:ingredientId', requireAdmin, deleteIngredient);                         // Deletar ingrediente (APENAS ADMIN)

// ===== ROTAS DE ESTOQUE =====
routes.post('/stock/create', requireAdminOrDeveloper, createStock);                                              // Criar estoque para ingrediente
routes.put('/stock/minimum/:ingredientId', requireAdminOrDeveloper, setMinimumStock);                            // Definir/atualizar estoque mínimo
routes.post('/stock/add/:ingredientId', requireAdminOrDeveloper, addStock);                                      // Adicionar estoque (ENTRADA) - APENAS ADMIN/DEVELOPER
routes.post('/stock/consume', requireAuth, consumeStockByProduct);                                   // Consumir estoque por produto (AUTOMÁTICO)
routes.post('/stock/loss/:ingredientId', requireKitchenOrAdmin, registerStockLoss);                            // Registrar perda/estrago - APENAS COZINHA/ADMIN
routes.get('/stock/overview/:restaurantId', requireAuth, getRestaurantStockOverview);               // Visão geral do estoque do restaurante

export default routes;