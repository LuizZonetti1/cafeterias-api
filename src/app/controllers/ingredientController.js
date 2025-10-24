import { PrismaClient } from '../../../generated/prisma/index.js';

const prisma = new PrismaClient();

// ===== CADASTRAR INGREDIENTE (APENAS ADMINISTRADOR) =====
export const createIngredient = async (req, res) => {
    try {
        const { name, warehouseId, unit } = req.body;
        const adminRestaurantId = req.user?.restaurantId;
        const userId = req.user?.id;

        // Validar campos obrigatórios
        if (!name || !warehouseId) {
            return res.status(400).json({
                error: 'Nome e warehouseId são obrigatórios'
            });
        }

        // Verificar se o estoque existe e pertence ao restaurante do ADMIN
        const warehouse = await prisma.warehouse.findUnique({
            where: { id: parseInt(warehouseId) }
        });

        if (!warehouse) {
            return res.status(404).json({
                error: 'Estoque não encontrado'
            });
        }

        if (warehouse.restaurantId !== adminRestaurantId) {
            return res.status(403).json({
                error: 'Você não tem permissão para adicionar ingredientes neste estoque',
                detail: 'Este estoque pertence a outro restaurante'
            });
        }

        // Verificar se já existe ingrediente com este nome neste estoque
        const existingIngredient = await prisma.ingredient.findFirst({
            where: {
                name,
                warehouseId: parseInt(warehouseId)
            }
        });

        if (existingIngredient) {
            return res.status(400).json({
                error: 'Já existe um ingrediente com este nome neste estoque',
                existingIngredient: {
                    id: existingIngredient.id,
                    name: existingIngredient.name
                }
            });
        }

        // Criar ingrediente
        const ingredient = await prisma.ingredient.create({
            data: {
                name,
                restaurantId: adminRestaurantId,
                warehouseId: parseInt(warehouseId),
                unit: unit || 'GRAMAS'
            }
        });

        // ===== CRIAR ESTOQUE AUTOMATICAMENTE ZERADO =====
        const stock = await prisma.stock.create({
            data: {
                ingredientId: ingredient.id,
                quantity_current: 0,
                quantity_minimum: 50,
                last_updated_by: userId ? parseInt(userId) : null
            }
        });

        res.status(201).json({
            success: true,
            message: '✅ Ingrediente cadastrado com sucesso e estoque inicializado!',
            ingredient: {
                id: ingredient.id,
                name: ingredient.name,
                unit: ingredient.unit,
                restaurantId: ingredient.restaurantId,
                initialStock: stock.quantity_current,
                minimumStock: stock.quantity_minimum
            },
            permissions: {
                createdBy: 'ADMIN',
                requiredRole: 'ADMIN'
            }
        });

    } catch (error) {
        console.error('❌ Erro ao cadastrar ingrediente:', error);
        res.status(500).json({
            error: 'Erro interno do servidor',
            details: error.message
        });
    }
}

export const getIngredientsByRestaurant = async (req, res) => {
    try {
        const { restaurantId } = req.params;
        const userRestaurantId = req.user?.restaurantId;
        const userRole = req.user?.tipo_user;

        if (!restaurantId) {
            return res.status(400).json({
                error: 'restaurante não encontrado, informe um id válido'
            });
        }

        // DEVELOPER pode ver qualquer restaurante, outros só o próprio
        if (userRole !== 'DEVELOPER' && parseInt(restaurantId) !== userRestaurantId) {
            return res.status(403).json({
                error: 'Você não tem permissão para visualizar ingredientes deste restaurante',
                detail: 'Você só pode visualizar ingredientes do seu próprio restaurante'
            });
        }

        const ingredients = await prisma.ingredient.findMany({
            where: {
                restaurantId: parseInt(restaurantId)
            },
            include: {
                Stock: true, // Incluir dados de estoque
                _count: {
                    select: {
                        Item_Product: true // Contar em quantos produtos é usado
                    }
                }
            },
            orderBy: {
                name: 'asc'
            }
        });

        // Formatar resposta com dados de estoque
        const ingredientsWithStock = ingredients.map(ingredient => ({
            ...ingredient,
            currentStock: ingredient.Stock[0]?.quantity_current || 0,
            minimumStock: ingredient.Stock[0]?.quantity_minimum || 50,
            usedInProducts: ingredient._count.Item_Product,
            stockStatus: ingredient.Stock[0] ?
                (ingredient.Stock[0].quantity_current <= ingredient.Stock[0].quantity_minimum ? 'LOW' : 'OK')
                : 'NO_STOCK'
        }));

        res.json({
            success: true,
            ingredients: ingredientsWithStock
        });

    } catch (error) {
        res.status(500).json({
            error: 'Erro interno do servidor',
            details: error.message
        });
    }
}

// ===== DELETAR INGREDIENTE (APENAS ADMIN) =====
export const deleteIngredient = async (req, res) => {
    try {
        const { ingredientId } = req.params;
        const adminRestaurantId = req.user?.restaurantId;

        // Verificar se ingrediente existe
        const existingIngredient = await prisma.ingredient.findUnique({
            where: { id: parseInt(ingredientId) },
            include: {
                Item_Product: true
            }
        });

        if (!existingIngredient) {
            return res.status(404).json({
                error: 'Ingrediente não encontrado'
            });
        }

        // Verificar se o ingrediente pertence ao restaurante do ADMIN
        if (existingIngredient.restaurantId !== adminRestaurantId) {
            return res.status(403).json({
                error: 'Você não tem permissão para deletar este ingrediente',
                detail: 'Este ingrediente pertence a outro restaurante'
            });
        }

        // Verificar se está sendo usado em produtos
        if (existingIngredient.Item_Product.length > 0) {
            return res.status(400).json({
                error: `Não é possível deletar. Ingrediente está sendo usado em ${existingIngredient.Item_Product.length} produto(s)`
            });
        }

        // Deletar ingrediente (cascade deleta Stock e Stock_Movement)
        await prisma.ingredient.delete({
            where: { id: parseInt(ingredientId) }
        });

        res.json({
            message: 'Ingrediente deletado com sucesso'
        });

    } catch (error) {
        console.error('Erro ao deletar ingrediente:', error);
        res.status(500).json({
            error: 'Erro interno do servidor',
            details: error.message
        });
    }
};