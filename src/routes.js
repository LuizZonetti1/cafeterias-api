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
        create: 'POST /ingredients/create (TOKEN ADMIN - requer warehouseId + auto-cria Stock zerado)',
        listByRestaurant: 'GET /ingredients/restaurant/:restaurantId (TOKEN JWT - qualquer usuário)',
        delete: 'DELETE /ingredients/:ingredientId (TOKEN ADMIN - deleta ingrediente + estoque)'
      },
      products: {
        create: 'POST /products/create (TOKEN ADMIN - pode incluir receita)',
        listByRestaurant: 'GET /products/restaurant/:restaurantId (TOKEN JWT)',
        getById: 'GET /products/:productId (TOKEN JWT - retorna receita completa com estoque)',
        update: 'PUT /products/:productId (TOKEN ADMIN)',
        delete: 'DELETE /products/:productId (TOKEN ADMIN)',
        updateRecipe: 'PUT /products/:productId/recipe (TOKEN ADMIN - atualizar ingredientes)',
        produce: 'POST /products/:productId/produce (TOKEN COZINHA/ADMIN - PRODUZIR + CONSUMIR ESTOQUE)'
      },
      stock: {
        note: 'Stock é criado automaticamente ao cadastrar ingrediente com quantidade 0',
        setMinimum: 'PUT /stock/minimum/:ingredientId (TOKEN ADMIN/DEVELOPER)',
        addStock: 'POST /stock/add/:ingredientId (TOKEN ADMIN/DEVELOPER - ENTRADA)',
        autoConsume: 'POST /stock/consume (DEPRECIADO - use /products/:productId/produce)',
        registerLoss: 'POST /stock/loss/:ingredientId (TOKEN COZINHA/ADMIN - perda/desperdício)',
        overview: 'GET /stock/overview/:restaurantId (TOKEN JWT - qualquer usuário)'
      }
    },
    workflow: {
      '1_create_warehouse': 'POST /warehouses/create → ADMIN cria estoque (ex: Estoque Cozinha, Estoque Bar)',
      '2_create_ingredient': 'POST /ingredients/create → ADMIN cria ingrediente no estoque (warehouseId obrigatório)',
      '3_add_stock': 'POST /stock/add/:ingredientId → ADMIN/DEVELOPER adiciona quantidade (soma)',
      '4_create_product': 'POST /products/create → ADMIN cria produto com receita (ingredientes + quantidades)',
      '5_update_recipe': 'PUT /products/:productId/recipe → ADMIN atualiza receita se necessário',
      '6_produce_product': 'POST /products/:productId/produce → COZINHA/ADMIN produz (valida estoque + consome)',
      '7_manual_loss': 'POST /stock/loss/:ingredientId → COZINHA/ADMIN registra perda manual (fora da produção)'
    },
    permissions: {
      'ADMIN': 'Pode: criar produtos/ingredientes, adicionar estoque, produzir, registrar perdas',
      'DEVELOPER': 'Pode: adicionar estoque, produzir',
      'COZINHA': 'Pode: produzir produtos, registrar perdas/desperdício',
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
routes.get('/warehouses/:warehouseId', requireAdmin, getWarehouseById);                                // Buscar estoque por ID
routes.put('/warehouses/:warehouseId', requireAdmin, updateWarehouse);                                // Atualizar estoque (APENAS ADMIN)
routes.delete('/warehouses/:warehouseId', requireAdmin, deleteWarehouse);                             // Deletar estoque (APENAS ADMIN)

// ===== ROTAS DE INGREDIENTES =====
routes.post('/ingredients/create', requireAdmin, createIngredient);                                   // Criar ingrediente (APENAS ADMIN + requer warehouseId)
routes.get('/ingredients/restaurant/:restaurantId', requireAdmin, getIngredientsByRestaurant);        // Listar ingredientes por restaurante (com status do estoque)
routes.delete('/ingredients/:ingredientId', requireAdmin, deleteIngredient);                         // Deletar ingrediente (APENAS ADMIN)

// ===== ROTAS DE PRODUTOS =====
routes.post('/products/create', requireAdmin, createProduct);                                         // Criar produto com receita (APENAS ADMIN)
routes.get('/products/restaurant/:restaurantId', requireAuth, getProductsByRestaurant);               // Listar produtos por restaurante
routes.get('/products/:productId', requireAuth, getProductById);                                      // Buscar produto por ID (com receita e estoque)
routes.put('/products/:productId', requireAdmin, updateProduct);                                      // Atualizar produto (APENAS ADMIN)
routes.delete('/products/:productId', requireAdmin, deleteProduct);                                   // Deletar produto (APENAS ADMIN)
routes.put('/products/:productId/recipe', requireAdmin, updateProductRecipe);                         // Atualizar receita do produto (APENAS ADMIN)
routes.post('/products/:productId/produce', requireKitchenOrAdmin, produceProduct);                   // Produzir produto (COZINHA/ADMIN) - CONSOME ESTOQUE AUTOMATICAMENTE

// ===== ROTAS DE ESTOQUE =====
// Nota: Stock é criado automaticamente ao cadastrar ingrediente (quantidade 0)
routes.put('/stock/minimum/:ingredientId', requireAdminOrDeveloper, setMinimumStock);                            // Definir/atualizar estoque mínimo
routes.post('/stock/add/:ingredientId', requireAdminOrDeveloper, addStock);                                      // Adicionar estoque (ENTRADA) - APENAS ADMIN/DEVELOPER
routes.post('/stock/consume', requireAuth, consumeStockByProduct);                                   // Consumir estoque por produto (AUTOMÁTICO - DEPRECIADO: use /products/:productId/produce)
routes.post('/stock/loss/:ingredientId', requireKitchenOrAdmin, registerStockLoss);                            // Registrar perda/estrago - APENAS COZINHA/ADMIN
routes.get('/stock/overview/:restaurantId', requireAdmin, getRestaurantStockOverview);               // Visão geral do estoque do restaurante

export default routes;