import express from 'express';      // Framework web
import cors from 'cors';           // Middleware para CORS
import helmet from 'helmet';       // Segurança: Headers HTTP
import rateLimit from 'express-rate-limit'; // Segurança: Rate limiting
import routes from './routes.js';
import { errorHandler } from './middlewares/errorHandler.js';
import path from 'path';
import { fileURLToPath } from 'url';

// Para ESM modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// ===== SEGURANÇA: HELMET (HEADERS) =====
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // Permitir carregar imagens
}));

// ===== SEGURANÇA: RATE LIMITING =====
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Máximo 100 requisições por IP
  message: {
    error: 'Muitas requisições deste IP',
    message: 'Tente novamente em 15 minutos',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true, // Retornar info de rate limit nos headers
  legacyHeaders: false, // Desabilitar headers `X-RateLimit-*` legados
});

// Aplicar rate limiting em todas as rotas
app.use(limiter);

// MIDDLEWARES
app.use(cors());                    // Permite requisições de outros domínios
app.use(express.json());            // Permite receber JSON no body
app.use(express.urlencoded({ extended: true })); // Permite receber dados de formulário

// SERVIR ARQUIVOS ESTÁTICOS (IMAGENS)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ROTAS
app.use(routes);

// ERROR HANDLER (DEVE SER O ÚLTIMO MIDDLEWARE)
app.use(errorHandler);

export default app;
