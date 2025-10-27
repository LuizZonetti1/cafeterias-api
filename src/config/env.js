// ===== VALIDAÇÃO DE VARIÁVEIS DE AMBIENTE =====
// Valida se todas as variáveis obrigatórias estão configuradas antes de iniciar o servidor

export function validateEnv() {
  const required = [
    'DATABASE_URL',
    'JWT_SECRET',
    'PORT'
  ];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    console.error('❌ ERRO: Variáveis de ambiente faltando!');
    console.error('Faltam:', missing.join(', '));
    console.error('\nConfigure as variáveis no arquivo .env:\n');
    missing.forEach(key => {
      console.error(`${key}=seu_valor_aqui`);
    });
    console.error('\nExemplo de .env:');
    console.error('DATABASE_URL=postgresql://user:password@host:5432/database');
    console.error('JWT_SECRET=seu_secret_super_seguro_aqui');
    console.error('PORT=3333\n');

    throw new Error(`Variáveis de ambiente faltando: ${missing.join(', ')}`);
  }

  console.log('✅ Variáveis de ambiente validadas com sucesso!');
  console.log(`   - DATABASE_URL: ${process.env.DATABASE_URL.substring(0, 30)}...`);
  console.log(`   - JWT_SECRET: ${process.env.JWT_SECRET ? '*'.repeat(process.env.JWT_SECRET.length) : 'não definido'}`);
  console.log(`   - PORT: ${process.env.PORT}`);
}

// ===== CONFIGURAÇÕES DO AMBIENTE =====
export const config = {
  port: process.env.PORT || 3333,
  jwtSecret: process.env.JWT_SECRET,
  databaseUrl: process.env.DATABASE_URL,
  nodeEnv: process.env.NODE_ENV || 'development',
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production'
};

