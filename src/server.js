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
const httpServer = createServer(app);

// ===== INICIALIZAR WEBSOCKET =====
const io = initializeSocket(httpServer);

// Tornar io disponível no app para os controllers
app.set('io', io);

// ===== INICIAR SERVIDOR =====
httpServer.listen(PORT, () => {
  console.log('\n🚀 ========================================');
  console.log(`   SERVIDOR RODANDO NA PORTA ${PORT}`);
  console.log(`   Ambiente: ${config.nodeEnv}`);
  console.log(`   HTTP: http://localhost:${PORT}`);
  console.log(`   WebSocket: ws://localhost:${PORT}`);
  console.log('========================================\n');
});
