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
import { validateSchema } from './middlewares/validation.js';
import { requireDeveloper, requireDeveloperToken } from './middlewares/authMiddleware.js';
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
        login: 'POST /users/login (público)'
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
      }
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

export default routes;