import 'dotenv/config'; // Carrega variáveis de ambiente ANTES de tudo
import { validateEnv, config } from './config/env.js';
import app from './app.js';

// ===== VALIDAR VARIÁVEIS DE AMBIENTE =====
try {
  validateEnv();
} catch (error) {
  console.error('\n🚨 SERVIDOR NÃO PODE INICIAR:', error.message);
  process.exit(1); // Sair com erro
}

// ===== INICIAR SERVIDOR =====
const PORT = config.port;

app.listen(PORT, () => {
  console.log('\n🚀 ========================================');
  console.log(`   SERVIDOR RODANDO NA PORTA ${PORT}`);
  console.log(`   Ambiente: ${config.nodeEnv}`);
  console.log(`   http://localhost:${PORT}`);
  console.log('========================================\n');
});
