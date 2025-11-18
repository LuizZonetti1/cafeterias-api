// ===== VALIDAÇÃO DE VARIÁVEIS DE AMBIENTE =====
// Valida se todas as variáveis obrigatórias estão configuradas antes de iniciar o servidor

const coercePort = () => {
  if (!process.env.PORT && process.env.RENDER_INTERNAL_PORT) {
    process.env.PORT = process.env.RENDER_INTERNAL_PORT;
  }

  if (!process.env.PORT) {
    process.env.PORT = '3333';
  }
};

const parseListEnv = (value = '') => value
  .split(',')
  .map(item => item.trim())
  .filter(Boolean);

const maskValue = (value = '') => '*'.repeat(Math.min(value.length, 8)) || 'não definido';

export function validateEnv() {
  coercePort();

  const required = [
    'DATABASE_URL',
    'JWT_SECRET'
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
  console.log(`   - JWT_SECRET: ${maskValue(process.env.JWT_SECRET)}`);
  console.log(`   - PORT: ${process.env.PORT}`);
}

// ===== CONFIGURAÇÕES DO AMBIENTE =====
export const config = {
  port: Number(process.env.PORT || 3333),
  host: process.env.HOST || '0.0.0.0',
  jwtSecret: process.env.JWT_SECRET,
  databaseUrl: process.env.DATABASE_URL,
  nodeEnv: process.env.NODE_ENV || 'development',
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  corsOrigin: parseListEnv(process.env.CORS_ORIGIN || '*'),
  requestBodyLimit: process.env.REQUEST_BODY_LIMIT || '10mb',
  uploadStrategy: process.env.UPLOAD_STRATEGY || 'local',
  uploadBaseUrl: process.env.UPLOAD_BASE_URL || '',
  renderExternalUrl: process.env.RENDER_EXTERNAL_URL || process.env.RENDER_EXTERNAL_HOSTNAME || '',
  logLevel: process.env.LOG_LEVEL || 'info'
};

