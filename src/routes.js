import { Router } from 'express';

const routes = Router();

// Rota de health check
routes.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'API funcionando!',
    timestamp: new Date().toISOString()
  });
});

// Rota básica
routes.get('/', (req, res) => {
  res.json({
    message: 'Bem-vindo à Cafeterias API!',
    version: '1.0.0'
  });
});

export default routes;