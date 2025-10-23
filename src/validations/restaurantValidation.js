import * as yup from 'yup';

// ===== SCHEMA PARA CRIAR RESTAURANTE =====
export const createRestaurantSchema = yup.object({
  name: yup
    .string()
    .required('Nome do restaurante é obrigatório')
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .trim(),
    
  description: yup
    .string()
    .max(500, 'Descrição deve ter no máximo 500 caracteres')
    .trim()
    .nullable(),
    
  address: yup
    .string()
    .required('Endereço é obrigatório')
    .min(5, 'Endereço deve ter pelo menos 5 caracteres')
    .max(200, 'Endereço deve ter no máximo 200 caracteres')
    .trim(),
    
  phone: yup
    .string()
    .matches(/^(\(\d{2}\))?\s?\d{4,5}-?\d{4}$/, 'Telefone deve ter formato válido (ex: (11) 99999-9999, 11999999999, etc.)')
    .nullable(),
    
  email: yup
    .string()
    .email('Email deve ter um formato válido')
    .lowercase()
    .trim()
    .nullable()
});

// ===== SCHEMA PARA ATUALIZAR RESTAURANTE =====
export const updateRestaurantSchema = yup.object({
  name: yup
    .string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .trim(),
    
  description: yup
    .string()
    .max(500, 'Descrição deve ter no máximo 500 caracteres')
    .trim()
    .nullable(),
    
  address: yup
    .string()
    .min(10, 'Endereço deve ter pelo menos 10 caracteres')
    .max(200, 'Endereço deve ter no máximo 200 caracteres')
    .trim(),
    
  phone: yup
    .string()
    .matches(/^\(\d{2}\)\s\d{4,5}-\d{4}$/, 'Telefone deve estar no formato (11) 99999-9999')
    .nullable(),
    
  email: yup
    .string()
    .email('Email deve ter um formato válido')
    .lowercase()
    .trim()
    .nullable(),
    
  logo_url: yup
    .string()
    .url('Logo deve ser uma URL válida')
    .nullable(),
    
  isActive: yup
    .boolean('isActive deve ser true ou false')
});

// ===== SCHEMA PARA VALIDAR ID NOS PARÂMETROS =====
export const restaurantIdParamSchema = yup.object({
  id: yup
    .number()
    .positive('ID deve ser um número positivo')
    .integer('ID deve ser um número inteiro')
    .required('ID é obrigatório')
    .transform((value, originalValue) => {
      // Converter string para número
      return originalValue === "" ? undefined : Number(originalValue);
    })
});