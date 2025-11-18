import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'sua-chave-secreta-aqui';

// ===== MIDDLEWARE PARA VERIFICAR TOKEN JWT E SE É DEVELOPER =====
export const requireDeveloperToken = async (req, res, next) => {
  try {

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
    if (decoded.type_user !== 'DEVELOPER') {
      return res.status(403).json({
        error: 'Acesso negado: apenas DEVELOPER pode realizar esta operação.'
      });
    }

    // Adicionar dados do usuário na request
    req.user = decoded;
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

    // Temporariamente aceitar qualquer requisição para testes
    if (process.env.NODE_ENV === 'development' || !req.headers['x-user-type']) {
      req.user = { type_user: 'DEVELOPER' }; // Simular usuário DEVELOPER
      return next();
    }

    if (userType !== 'DEVELOPER') {
      return res.status(403).json({
        error: 'Acesso negado: apenas DEVELOPER pode acessar esta rota'
      });
    }

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

    next();

  } catch (error) {
    console.error('❌ Erro no middleware de autorização:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
};

// ===== MIDDLEWARE PARA VERIFICAR TOKEN JWT GENÉRICO =====
export const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        error: 'Token de acesso obrigatório. Faça login.'
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

    // Adicionar dados do usuário na request
    req.user = decoded;
    req.body.userId = decoded.id;
    req.body.userRole = decoded.type_user;

    next();

  } catch (error) {
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

// ===== MIDDLEWARE PARA VERIFICAR SE É ADMIN =====
export const requireAdmin = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        error: 'Token de acesso obrigatório. Faça login.'
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

    // Verificar se é ADMIN
    if (decoded.type_user !== 'ADMIN') {
      return res.status(403).json({
        error: 'Acesso negado: apenas ADMINISTRADOR pode realizar esta operação.',
        requiredRole: 'ADMIN',
        userRole: decoded.type_user
      });
    }

    // Adicionar dados do usuário na request
    req.user = decoded;

    next();

  } catch (error) {
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

    return res.status(500).json({
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
};

// ===== MIDDLEWARE PARA VERIFICAR SE É ADMIN OU DEVELOPER =====
export const requireAdminOrDeveloper = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        error: 'Token de acesso obrigatório. Faça login.'
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, JWT_SECRET);

    if (!['ADMIN', 'DEVELOPER'].includes(decoded.type_user)) {
      return res.status(403).json({
        error: 'Acesso negado: apenas ADMINISTRADOR ou DEVELOPER podem realizar esta operação.',
        requiredRoles: ['ADMIN', 'DEVELOPER'],
        userRole: decoded.type_user
      });
    }

    req.user = decoded;
    req.body.userId = decoded.id;
    req.body.userRole = decoded.type_user;

    next();

  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expirado. Faça login novamente.'
      });
    }

    res.status(401).json({
      error: 'Token inválido.'
    });
  }
};

// ===== MIDDLEWARE PARA VERIFICAR SE É COZINHA OU ADMIN =====
export const requireKitchenOrAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        error: 'Token de acesso obrigatório. Faça login.'
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, JWT_SECRET);

    if (!['COZINHA', 'ADMIN'].includes(decoded.type_user)) {
      return res.status(403).json({
        error: 'Acesso negado: apenas COZINHA ou ADMINISTRADOR podem realizar esta operação.',
        requiredRoles: ['COZINHA', 'ADMIN'],
        userRole: decoded.type_user
      });
    }

    req.user = decoded;
    req.body.userId = decoded.id;
    req.body.userRole = decoded.type_user;

    next();

  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expirado. Faça login novamente.'
      });
    }

    res.status(401).json({
      error: 'Token inválido.'
    });
  }
};

// ===== MIDDLEWARE PARA VERIFICAR SE É GARCOM OU ADMIN =====
export const requireGarcomOrAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        error: 'Token de acesso obrigatório. Faça login.'
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, JWT_SECRET);

    if (!['GARCOM', 'ADMIN'].includes(decoded.type_user)) {
      return res.status(403).json({
        error: 'Acesso negado: apenas GARÇOM ou ADMINISTRADOR podem realizar esta operação.',
        requiredRoles: ['GARCOM', 'ADMIN'],
        userRole: decoded.type_user
      });
    }

    req.user = decoded;
    req.body.userId = decoded.id;
    req.body.userRole = decoded.type_user;

    next();

  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expirado. Faça login novamente.'
      });
    }

    res.status(401).json({
      error: 'Token inválido.'
    });
  }
};

