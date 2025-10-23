import express from 'express';      // Framework web
import cors from 'cors';           // Middleware para CORS
import routes from './routes.js';
import path from 'path';
import { fileURLToPath } from 'url';

// Para ESM modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// MIDDLEWARES
app.use(cors());                    // Permite requisições de outros domínios
app.use(express.json());            // Permite receber JSON no body
app.use(express.urlencoded({ extended: true })); // Permite receber dados de formulário

// SERVIR ARQUIVOS ESTÁTICOS (IMAGENS)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ROTAS
app.use(routes);

export default app;
