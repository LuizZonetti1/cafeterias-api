import * as yup from 'yup';

// ===== CRIAR PEDIDO =====
export const createOrderSchema = yup.object({
    items: yup.array().of(
        yup.object({
            productId: yup.number()
                .required('productId é obrigatório')
                .positive('productId deve ser positivo')
                .integer('productId deve ser inteiro'),

            quantity: yup.number()
                .required('quantity é obrigatória')
                .min(1, 'quantity deve ser no mínimo 1')
                .integer('quantity deve ser inteiro'),

            additional: yup.string()
                .nullable()
                .max(500, 'additional deve ter no máximo 500 caracteres'),

            observations: yup.string()
                .nullable()
                .max(500, 'observations deve ter no máximo 500 caracteres'),

            additionalIngredients: yup.array().of(
                yup.object({
                    ingredientId: yup.number()
                        .required('ingredientId é obrigatório')
                        .positive('ingredientId deve ser positivo')
                        .integer('ingredientId deve ser inteiro'),

                    quantity: yup.number()
                        .required('quantity do adicional é obrigatória')
                        .min(0, 'quantity deve ser no mínimo 0'),

                    unit: yup.string()
                        .required('unit do adicional é obrigatória')
                        .oneOf(['GRAMAS', 'LITROS', 'UNIDADES', 'MILILITROS'], 'unit deve ser GRAMAS, LITROS, UNIDADES ou MILILITROS'),

                    price: yup.number()
                        .required('price do adicional é obrigatório')
                        .min(0, 'price deve ser no mínimo 0')
                })
            ).nullable()
        })
    ).min(1, 'O pedido deve ter pelo menos 1 item').required('items é obrigatório')
});

// ===== ATUALIZAR STATUS DO PEDIDO =====
export const updateOrderStatusSchema = yup.object({
    status: yup.string()
        .required('status é obrigatório')
        .oneOf(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'], 'status deve ser PENDING, IN_PROGRESS, COMPLETED ou CANCELLED')
});

// ===== FINALIZAR PEDIDO =====
export const completeOrderSchema = yup.object({
    wastePercentage: yup.number()
        .min(0, 'wastePercentage deve ser no mínimo 0')
        .max(100, 'wastePercentage deve ser no máximo 100')
        .nullable()
});

// ===== VALIDAÇÃO DE ID (PARAMS) =====
export const orderIdParamSchema = yup.object({
    orderId: yup.number()
        .required('orderId é obrigatório')
        .positive('orderId deve ser positivo')
        .integer('orderId deve ser inteiro')
});
