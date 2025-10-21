import { Router } from 'express';
import {
  registerUser,
  loginUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser
} from './app/controllers/userController.js';
import { validateSchema } from './middlewares/validation.js';
import {
  registerUserSchema,
  loginUserSchema,
  updateUserSchema,
  idParamSchema
} from './validations/userValidation.js';

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
        register: 'POST /users/register',
        login: 'POST /users/login'
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
routes.post('/users/register', validateSchema(registerUserSchema), registerUser);  // Cadastrar usuário
routes.post('/users/login', validateSchema(loginUserSchema), loginUser);        // Login

// ===== ROTAS CRUD DE USUÁRIOS COM VALIDAÇÃO =====
routes.get('/users', getAllUsers);             // Listar todos
routes.get('/users/:id', validateSchema(idParamSchema, 'params'), getUserById);         // Buscar por ID
routes.put('/users/:id', validateSchema(idParamSchema, 'params'), validateSchema(updateUserSchema), updateUser);          // Atualizar
routes.delete('/users/:id', validateSchema(idParamSchema, 'params'), deleteUser);       // Deletar

export default routes;