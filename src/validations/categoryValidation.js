import * as yup from 'yup';

// ===== CRIAR CATEGORIA =====
export const createCategorySchema = yup.object({
    name: yup.string()
        .required('name é obrigatório')
        .min(2, 'name deve ter pelo menos 2 caracteres')
        .max(100, 'name deve ter no máximo 100 caracteres')
        .trim(),

    description: yup.string()
        .nullable()
        .max(500, 'description deve ter no máximo 500 caracteres')
        .trim(),

    restaurantId: yup.number()
        .required('restaurantId é obrigatório')
        .positive('restaurantId deve ser positivo')
        .integer('restaurantId deve ser inteiro')
});

// ===== ATUALIZAR CATEGORIA =====
export const updateCategorySchema = yup.object({
    name: yup.string()
        .min(2, 'name deve ter pelo menos 2 caracteres')
        .max(100, 'name deve ter no máximo 100 caracteres')
        .trim()
        .nullable(),

    description: yup.string()
        .max(500, 'description deve ter no máximo 500 caracteres')
        .trim()
        .nullable()
});

// ===== VALIDAÇÃO DE ID (PARAMS) =====
export const categoryIdParamSchema = yup.object({
    categoryId: yup.number()
        .required('categoryId é obrigatório')
        .positive('categoryId deve ser positivo')
        .integer('categoryId deve ser inteiro')
});

export const restaurantIdParamSchema = yup.object({
    restaurantId: yup.number()
        .required('restaurantId é obrigatório')
        .positive('restaurantId deve ser positivo')
        .integer('restaurantId deve ser inteiro')
});
