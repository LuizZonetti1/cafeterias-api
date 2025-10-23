import * as yup from 'yup';

// ===== SCHEMA PARA CADASTRO DE USUÁRIO NORMAL =====
export const registerUserSchema = yup.object({
  name: yup
    .string()
    .required('Nome é obrigatório')
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .trim(),
    
  email: yup
    .string()
    .required('Email é obrigatório')
    .email('Email deve ter um formato válido (exemplo: usuario@dominio.com)')
    .lowercase()
    .trim(),
    
  password: yup
    .string()
    .required('Senha é obrigatória')
    .min(6, 'Senha deve ter pelo menos 6 caracteres')
    .max(50, 'Senha deve ter no máximo 50 caracteres'),
    
  type_user: yup
    .string()
    .oneOf(['ADMIN', 'WAITER', 'KITCHEN'], 'Tipo de usuário deve ser ADMIN, WAITER ou KITCHEN')
    .default('WAITER'),
    
  // Código ADMIN opcional (apenas se type_user for ADMIN)
  code_admin: yup
    .string()
    .when('type_user', {
      is: 'ADMIN',
      then: (schema) => schema.required('Código ADMIN é obrigatório'),
      otherwise: (schema) => schema.notRequired()
    })
    .trim(),
    
  restaurantId: yup
    .number()
    .positive('ID do restaurante deve ser um número positivo')
    .integer('ID do restaurante deve ser um número inteiro')
    .required('Restaurante é obrigatório para usuários normais')
});

// ===== SCHEMA PARA CADASTRO DE DEVELOPER =====
export const registerDeveloperSchema = yup.object({
  name: yup
    .string()
    .required('Nome é obrigatório')
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .trim(),
    
  email: yup
    .string()
    .required('Email é obrigatório')
    .email('Email deve ter um formato válido (exemplo: usuario@dominio.com)')
    .lowercase()
    .trim(),
    
  password: yup
    .string()
    .required('Senha é obrigatória')
    .min(6, 'Senha deve ter pelo menos 6 caracteres')
    .max(50, 'Senha deve ter no máximo 50 caracteres'),
    
    code_developer: yup
    .string()
    .required('Código DEVELOPER é obrigatório')
    .trim(),
    
    type_user: yup
    .string()
    .oneOf(['DEVELOPER'], 'Tipo deve ser DEVELOPER')
    .required('Tipo de usuário é obrigatório')
});

// ===== SCHEMA PARA LOGIN =====
export const loginUserSchema = yup.object({
  email: yup
    .string()
    .required('Email é obrigatório')
    .email('Email deve ter um formato válido')
    .lowercase()
    .trim(),
    
  password: yup
    .string()
    .required('Senha é obrigatória')
    .min(1, 'Senha não pode estar vazia')
});

// ===== SCHEMA PARA ATUALIZAR USUÁRIO =====
export const updateUserSchema = yup.object({
  name: yup
    .string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .trim(),
    
  email: yup
    .string()
    .email('Email deve ter um formato válido')
    .lowercase()
    .trim(),
    
  type_user: yup
    .string()
    .oneOf(['ADMIN', 'WAITER', 'KITCHEN'], 'Tipo de usuário deve ser ADMIN, WAITER ou KITCHEN'),
    
  status_user: yup
    .string()
    .oneOf(['ACTIVE', 'INACTIVE'], 'Status deve ser ACTIVE ou INACTIVE')
});

// ===== SCHEMA PARA VALIDAR ID =====
export const idParamSchema = yup.object({
  id: yup
    .number()
    .required('ID é obrigatório')
    .positive('ID deve ser um número positivo')
    .integer('ID deve ser um número inteiro')
});