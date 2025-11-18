import 'dotenv/config'; // Carrega variáveis de ambiente ANTES de tudo
import { createServer } from 'http';
import { validateEnv, config } from './config/env.js';
import { initializeSocket } from './config/socket.js';
import app from './app.js';

// ===== VALIDAR VARIÁVEIS DE AMBIENTE =====
try {
  validateEnv();
} catch (error) {
  console.error('\n🚨 SERVIDOR NÃO PODE INICIAR:', error.message);
  process.exit(1); // Sair com erro
}

// ===== CRIAR SERVIDOR HTTP =====
const PORT = config.port;
const HOST = config.host;
const httpServer = createServer(app);

// ===== INICIALIZAR WEBSOCKET =====
const io = initializeSocket(httpServer);

// Tornar io disponível no app para os controllers
app.set('io', io);

// ===== INICIAR SERVIDOR =====
const inferredPublicUrl = config.renderExternalUrl || `http://localhost:${PORT}`;
const inferredWsUrl = inferredPublicUrl.replace(/^http/, 'ws');

httpServer.listen(PORT, HOST, () => {
  console.log('\n🚀 ========================================');
  console.log(`   SERVIDOR RODANDO EM ${HOST}:${PORT}`);
  console.log(`   Ambiente: ${config.nodeEnv}`);
  console.log(`   HTTP: ${inferredPublicUrl}`);
  console.log(`   WebSocket: ${inferredWsUrl}`);
  console.log('========================================\n');
});

const gracefulShutdown = signal => {
  console.log(`\n⚠️ Recebido ${signal}. Encerrando servidor com segurança...`);
  httpServer.close(() => {
    console.log('Servidor HTTP finalizado. Até mais!');
    process.exit(0);
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
