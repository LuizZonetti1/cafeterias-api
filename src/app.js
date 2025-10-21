import express from 'express';      // Framework web
import cors from 'cors';           // Middleware para CORS
import routes from './routes.js'; 

const app = express();

// MIDDLEWARES
app.use(cors());                    // Permite requisições de outros domínios
app.use(express.json());            // Permite receber JSON no body
app.use(express.urlencoded({ extended: true })); // Permite receber dados de formulário
app.use(routes);

export default app;
