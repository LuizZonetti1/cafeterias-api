import express from 'express';      // Framework web
import cors from 'cors';           // Middleware para CORS
import helmet from 'helmet';       // Segurança: Headers HTTP
import rateLimit from 'express-rate-limit'; // Segurança: Rate limiting
import routes from './routes.js';
import { errorHandler } from './middlewares/errorHandler.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config/env.js';

// Para ESM modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Render/Proxies precisam dessa flag para manter IPs e HTTPS corretos
app.set('trust proxy', 1);

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

const allowedOrigins = config.corsOrigin;
const isOriginAllowed = origin => {
  if (!origin) return true; // Requisições do próprio servidor / ferramentas CLI
  if (allowedOrigins.includes('*')) return true;
  return allowedOrigins.some(allowed => {
    if (allowed.startsWith('*.')) {
      const suffix = allowed.slice(1); // remove *
      return origin.endsWith(suffix);
    }
    return allowed === origin;
  });
};

const corsOptions = {
  origin(origin, callback) {
    if (isOriginAllowed(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`Origin não permitido: ${origin}`));
  },
  credentials: true,
  exposedHeaders: ['Content-Disposition']
};

// MIDDLEWARES
app.use(cors(corsOptions));         // Permite requisições de outros domínios
app.use(express.json({ limit: config.requestBodyLimit }));
app.use(express.urlencoded({ extended: true, limit: config.requestBodyLimit }));

// SERVIR ARQUIVOS ESTÁTICOS (IMAGENS)
if (config.uploadStrategy === 'local') {
  app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
} else {
  console.log('ℹ️ Uploads servidos externamente via', config.uploadBaseUrl || 'bucket configurado');
}

// ROTAS
app.use(routes);

// ERROR HANDLER (DEVE SER O ÚLTIMO MIDDLEWARE)
app.use(errorHandler);

export default app;
