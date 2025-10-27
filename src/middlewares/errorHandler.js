// ===== ERROR HANDLER CENTRALIZADO =====
// Trata erros de forma padronizada para facilitar debug e melhorar UX

export const errorHandler = (err, req, res, next) => {
  // Log do erro no console (desenvolvimento)
  console.error('❌ ERRO CAPTURADO:');
  console.error('Rota:', req.method, req.path);
  console.error('Erro:', err);

  // ===== ERROS DO PRISMA =====

  // P2002: Unique constraint violation (registro duplicado)
  if (err.code === 'P2002') {
    const target = err.meta?.target || 'campo';
    return res.status(409).json({
      error: 'Registro duplicado',
      message: `Já existe um registro com este ${target}`,
      field: target,
      code: 'DUPLICATE_ENTRY'
    });
  }

  // P2025: Record not found (registro não encontrado)
  if (err.code === 'P2025') {
    return res.status(404).json({
      error: 'Registro não encontrado',
      message: 'O registro que você está tentando acessar não existe',
      code: 'NOT_FOUND'
    });
  }

  // P2003: Foreign key constraint violation (chave estrangeira inválida)
  if (err.code === 'P2003') {
    const field = err.meta?.field_name || 'relacionado';
    return res.status(400).json({
      error: 'Referência inválida',
      message: `O ${field} informado não existe`,
      field,
      code: 'INVALID_REFERENCE'
    });
  }

  // P2014: Relation violation (tentativa de deletar registro com dependências)
  if (err.code === 'P2014') {
    return res.status(400).json({
      error: 'Não é possível deletar',
      message: 'Este registro possui dependências e não pode ser deletado',
      code: 'HAS_DEPENDENCIES'
    });
  }

  // P2016: Query interpretation error
  if (err.code === 'P2016') {
    return res.status(400).json({
      error: 'Erro na consulta',
      message: 'Parâmetros inválidos fornecidos',
      code: 'INVALID_QUERY'
    });
  }

  // P1001: Database connection error
  if (err.code === 'P1001') {
    return res.status(503).json({
      error: 'Erro de conexão com banco de dados',
      message: 'Não foi possível conectar ao banco de dados',
      code: 'DATABASE_CONNECTION_ERROR'
    });
  }

  // ===== ERROS DE VALIDAÇÃO YUP =====
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Erro de validação',
      message: 'Os dados enviados não passaram na validação',
      details: err.errors || [err.message],
      code: 'VALIDATION_ERROR'
    });
  }

  // ===== ERROS DE JWT =====

  // Token expirado
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Token expirado',
      message: 'Sua sessão expirou. Faça login novamente',
      code: 'TOKEN_EXPIRED'
    });
  }

  // Token inválido
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Token inválido',
      message: 'Token de autenticação inválido',
      code: 'INVALID_TOKEN'
    });
  }

  // Token não fornecido
  if (err.name === 'NotBeforeError') {
    return res.status(401).json({
      error: 'Token ainda não é válido',
      message: 'Token ainda não pode ser usado',
      code: 'TOKEN_NOT_ACTIVE'
    });
  }

  // ===== ERROS DE MULTER (UPLOAD) =====

  // Arquivo muito grande
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      error: 'Arquivo muito grande',
      message: 'O tamanho do arquivo excede o limite permitido (5MB)',
      code: 'FILE_TOO_LARGE'
    });
  }

  // Tipo de arquivo inválido
  if (err.message && err.message.includes('tipo de arquivo')) {
    return res.status(400).json({
      error: 'Tipo de arquivo inválido',
      message: err.message,
      code: 'INVALID_FILE_TYPE'
    });
  }

  // Muitos arquivos
  if (err.code === 'LIMIT_FILE_COUNT') {
    return res.status(400).json({
      error: 'Muitos arquivos',
      message: 'Apenas um arquivo por vez é permitido',
      code: 'TOO_MANY_FILES'
    });
  }

  // Campo de upload inesperado
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      error: 'Campo de upload inválido',
      message: `Campo esperado: 'image' ou 'logo'. Recebido: ${err.field}`,
      code: 'UNEXPECTED_FIELD'
    });
  }

  // ===== ERRO GENÉRICO =====

  // Em desenvolvimento, retornar detalhes completos
  if (process.env.NODE_ENV === 'development') {
    return res.status(500).json({
      error: 'Erro interno do servidor',
      message: err.message,
      stack: err.stack,
      code: 'INTERNAL_SERVER_ERROR'
    });
  }

  // Em produção, ocultar detalhes sensíveis
  return res.status(500).json({
    error: 'Erro interno do servidor',
    message: 'Ocorreu um erro inesperado. Entre em contato com o suporte',
    code: 'INTERNAL_SERVER_ERROR'
  });
};
