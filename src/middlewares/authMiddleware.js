import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'sua-chave-secreta-aqui';

// ===== MIDDLEWARE PARA VERIFICAR TOKEN JWT E SE É DEVELOPER =====
export const requireDeveloperToken = async (req, res, next) => {
  try {
    console.log('🔐 Verificando token JWT de DEVELOPER...');
    
    // Buscar token no header Authorization
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        error: 'Token de acesso obrigatório. Faça login como DEVELOPER.'
      });
    }
    
    const token = authHeader.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        error: 'Token de acesso inválido.'
      });
    }
    
    // Verificar e decodificar token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Verificar se é DEVELOPER
    if (decoded.tipo_user !== 'DEVELOPER') {
      return res.status(403).json({
        error: 'Acesso negado: apenas DEVELOPER pode realizar esta operação.'
      });
    }
    
    // Adicionar dados do usuário na request
    req.user = decoded;
    
    console.log('✅ Token DEVELOPER válido:', decoded.email);
    next();
    
  } catch (error) {
    console.error('❌ Erro na verificação do token:', error.message);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expirado. Faça login novamente.'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Token inválido.'
      });
    }
    
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
};

// ===== MIDDLEWARE SIMPLES PARA TESTES (DEVELOPER) =====
export const requireDeveloper = async (req, res, next) => {
  try {
    // Para fins de teste, vamos permitir acesso mesmo sem autenticação
    const userType = req.headers['x-user-type'] || req.body.user_type || 'DEVELOPER';
    
    console.log('🔍 Verificando autorização DEVELOPER...');
    console.log('📝 User type recebido:', userType);
    
    // Temporariamente aceitar qualquer requisição para testes
    if (process.env.NODE_ENV === 'development' || !req.headers['x-user-type']) {
      console.log('🧪 Modo de desenvolvimento - autorização temporária concedida');
      req.user = { tipo_user: 'DEVELOPER' }; // Simular usuário DEVELOPER
      return next();
    }
    
    if (userType !== 'DEVELOPER') {
      return res.status(403).json({
        error: 'Acesso negado: apenas DEVELOPER pode acessar esta rota'
      });
    }
    
    console.log('✅ Usuário DEVELOPER autorizado');
    next();
    
  } catch (error) {
    console.error('❌ Erro no middleware de autorização:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
};

// ===== MIDDLEWARE PARA VERIFICAR SE É DEVELOPER OU ADMIN =====
export const requireDeveloperOrAdmin = async (req, res, next) => {
  try {
    const userType = req.headers['x-user-type'] || req.body.user_type;
    
    if (!['DEVELOPER', 'ADMIN'].includes(userType)) {
      return res.status(403).json({
        error: 'Acesso negado: apenas DEVELOPER ou ADMIN podem acessar esta rota'
      });
    }
    
    console.log('✅ Usuário autorizado:', userType);
    next();
    
  } catch (error) {
    console.error('❌ Erro no middleware de autorização:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
};