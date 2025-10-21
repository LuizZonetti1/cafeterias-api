// ===== MIDDLEWARE DE VALIDAÇÃO =====
export const validateSchema = (schema, property = 'body') => {
  return async (req, res, next) => {
    try {
      // Pega os dados para validar (body, params, query)
      const dataToValidate = req[property];
      
      // Valida e transforma os dados
      const validatedData = await schema.validate(dataToValidate, {
        abortEarly: false, // Mostra todos os erros, não apenas o primeiro
        stripUnknown: true // Remove campos que não estão no schema
      });
      
      // Substitui os dados originais pelos validados
      req[property] = validatedData;
      
      next(); // Continua para o próximo middleware/rota
      
    } catch (error) {
      // Se houver erro de validação
      if (error.name === 'ValidationError') {
        const errors = error.inner.map(err => ({
          field: err.path,
          message: err.message
        }));
        
        return res.status(400).json({
          error: 'Dados inválidos',
          details: errors
        });
      }
      
      // Se houver outro tipo de erro
      console.error('Erro na validação:', error);
      return res.status(500).json({
        error: 'Erro interno do servidor na validação'
      });
    }
  };
};