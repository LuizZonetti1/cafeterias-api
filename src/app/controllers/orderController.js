import { PrismaClient } from '../../../generated/prisma/index.js';

const prisma = new PrismaClient();

// ===== CRIAR PEDIDO (GARCOM OU ADMIN) =====
export const createOrder = async (req, res) => {
    try {
        const { items } = req.body; // items = [{ productId, quantity, additional, observations }]
        const garcomId = req.user?.id;
        const garcomRestaurantId = req.user?.restaurantId;
        const userRole = req.user?.tipo_user;

        // DEVELOPER não pode criar pedidos (não tem restaurante)
        if (userRole === 'DEVELOPER') {
            return res.status(403).json({
                error: 'DEVELOPER não pode criar pedidos',
                detail: 'Apenas usuários vinculados a restaurantes podem criar pedidos'
            });
        }

        // Validar itens do pedido
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                error: 'O pedido deve conter pelo menos 1 item',
                example: {
                    items: [
                        {
                            productId: 1,
                            quantity: 2,
                            additional: 'Sem cebola',
                            observations: 'Cliente alérgico'
                        }
                    ]
                }
            });
        }

        // Validar cada item
        for (const item of items) {
            if (!item.productId || !item.quantity || item.quantity <= 0) {
                return res.status(400).json({
                    error: 'Cada item deve ter productId e quantity válidos',
                    invalidItem: item
                });
            }
        }

        // Verificar se todos os produtos existem e pertencem ao restaurante do garçom
        const productIds = items.map(item => parseInt(item.productId));
        const products = await prisma.product.findMany({
            where: { id: { in: productIds } },
            include: {
                category: { select: { name: true } },
                restaurant: { select: { name: true } }
            }
        });

        if (products.length !== productIds.length) {
            return res.status(404).json({
                error: 'Um ou mais produtos não foram encontrados',
                requestedIds: productIds,
                foundIds: products.map(p => p.id)
            });
        }

        // Verificar se todos os produtos pertencem ao restaurante do garçom
        const wrongRestaurant = products.find(p => p.restaurantId !== garcomRestaurantId);
        if (wrongRestaurant) {
            return res.status(403).json({
                error: 'Você não pode criar pedidos com produtos de outro restaurante',
                detail: `Produto "${wrongRestaurant.name}" pertence a outro restaurante`
            });
        }

        // Calcular valor total do pedido
        let totalAmount = 0;
        const itemsWithPrice = items.map(item => {
            const product = products.find(p => p.id === parseInt(item.productId));
            const itemTotal = product.price * item.quantity;
            totalAmount += itemTotal;
            return {
                ...item,
                productName: product.name,
                unitPrice: product.price,
                itemTotal
            };
        });

        // Criar pedido
        const order = await prisma.orders.create({
            data: {
                userId: garcomId,
                restaurantId: garcomRestaurantId,
                status_order: 'PENDING',
                Item_Order: {
                    create: items.map(item => ({
                        productId: parseInt(item.productId),
                        quantity: parseInt(item.quantity),
                        additional: item.additional || null,
                        observations: item.observations || null
                    }))
                }
            },
            include: {
                Item_Order: {
                    include: {
                        product: {
                            select: {
                                id: true,
                                name: true,
                                price: true,
                                category: { select: { name: true } }
                            }
                        }
                    }
                },
                user: {
                    select: { id: true, name: true, tipo_user: true }
                },
                restaurant: {
                    select: { id: true, name: true }
                }
            }
        });

        res.status(201).json({
            success: true,
            message: '✅ Pedido criado com sucesso!',
            order: {
                id: order.id,
                status: order.status_order,
                restaurant: order.restaurant.name,
                createdBy: {
                    name: order.user.name,
                    role: order.user.tipo_user
                },
                items: order.Item_Order.map(item => ({
                    product: item.product.name,
                    category: item.product.category.name,
                    quantity: item.quantity,
                    unitPrice: item.product.price,
                    total: item.product.price * item.quantity,
                    additional: item.additional,
                    observations: item.observations
                })),
                totalAmount,
                createdAt: order.created_at
            }
        });

    } catch (error) {
        console.error('❌ Erro ao criar pedido:', error);
        res.status(500).json({
            error: 'Erro interno do servidor',
            details: error.message
        });
    }
};

// ===== LISTAR PEDIDOS DO RESTAURANTE =====
export const listOrders = async (req, res) => {
    try {
        const { status } = req.query; // Filtro opcional por status
        const userRestaurantId = req.user?.restaurantId;
        const userRole = req.user?.tipo_user;

        // DEVELOPER não pode listar pedidos (não tem restaurante)
        if (userRole === 'DEVELOPER') {
            return res.status(403).json({
                error: 'DEVELOPER não pode listar pedidos',
                detail: 'Apenas usuários vinculados a restaurantes podem acessar pedidos'
            });
        }

        const whereClause = {
            restaurantId: userRestaurantId
        };

        // Aplicar filtro de status se fornecido
        if (status && ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].includes(status.toUpperCase())) {
            whereClause.status_order = status.toUpperCase();
        }

        const orders = await prisma.orders.findMany({
            where: whereClause,
            include: {
                Item_Order: {
                    include: {
                        product: {
                            select: {
                                name: true,
                                price: true
                            }
                        }
                    }
                },
                user: {
                    select: { name: true, tipo_user: true }
                }
            },
            orderBy: { created_at: 'desc' }
        });

        // Calcular totais
        const ordersWithTotals = orders.map(order => {
            const totalAmount = order.Item_Order.reduce((sum, item) => {
                return sum + (item.product.price * item.quantity);
            }, 0);

            return {
                id: order.id,
                status: order.status_order,
                createdBy: order.user.name,
                role: order.user.tipo_user,
                itemsCount: order.Item_Order.length,
                totalAmount,
                createdAt: order.created_at,
                updatedAt: order.updated_at
            };
        });

        res.json({
            success: true,
            restaurant: {
                id: userRestaurantId,
                role: userRole
            },
            filters: {
                status: status || 'all'
            },
            summary: {
                total: ordersWithTotals.length,
                pending: ordersWithTotals.filter(o => o.status === 'PENDING').length,
                inProgress: ordersWithTotals.filter(o => o.status === 'IN_PROGRESS').length,
                completed: ordersWithTotals.filter(o => o.status === 'COMPLETED').length,
                cancelled: ordersWithTotals.filter(o => o.status === 'CANCELLED').length
            },
            orders: ordersWithTotals
        });

    } catch (error) {
        console.error('❌ Erro ao listar pedidos:', error);
        res.status(500).json({
            error: 'Erro interno do servidor',
            details: error.message
        });
    }
};

// ===== BUSCAR PEDIDO POR ID =====
export const getOrderById = async (req, res) => {
    try {
        const { orderId } = req.params;
        const userRestaurantId = req.user?.restaurantId;
        const userRole = req.user?.tipo_user;

        const order = await prisma.orders.findUnique({
            where: { id: parseInt(orderId) },
            include: {
                Item_Order: {
                    include: {
                        product: {
                            select: {
                                id: true,
                                name: true,
                                price: true,
                                category: { select: { name: true } }
                            }
                        }
                    }
                },
                user: {
                    select: { id: true, name: true, tipo_user: true }
                },
                restaurant: {
                    select: { id: true, name: true }
                }
            }
        });

        if (!order) {
            return res.status(404).json({
                error: 'Pedido não encontrado'
            });
        }

        // DEVELOPER pode ver qualquer pedido, outros só do próprio restaurante
        if (userRole !== 'DEVELOPER' && order.restaurantId !== userRestaurantId) {
            return res.status(403).json({
                error: 'Você não tem permissão para visualizar este pedido',
                detail: 'Este pedido pertence a outro restaurante'
            });
        }

        // Calcular total
        const totalAmount = order.Item_Order.reduce((sum, item) => {
            return sum + (item.product.price * item.quantity);
        }, 0);

        res.json({
            success: true,
            order: {
                id: order.id,
                status: order.status_order,
                restaurant: order.restaurant.name,
                createdBy: {
                    id: order.user.id,
                    name: order.user.name,
                    role: order.user.tipo_user
                },
                items: order.Item_Order.map(item => ({
                    id: item.id,
                    product: {
                        id: item.product.id,
                        name: item.product.name,
                        category: item.product.category.name
                    },
                    quantity: item.quantity,
                    unitPrice: item.product.price,
                    subtotal: item.product.price * item.quantity,
                    additional: item.additional,
                    observations: item.observations
                })),
                totalAmount,
                createdAt: order.created_at,
                updatedAt: order.updated_at
            }
        });

    } catch (error) {
        console.error('❌ Erro ao buscar pedido:', error);
        res.status(500).json({
            error: 'Erro interno do servidor',
            details: error.message
        });
    }
};

// ===== ATUALIZAR STATUS DO PEDIDO (COZINHA/ADMIN) =====
export const updateOrderStatus = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { status } = req.body; // PENDING, IN_PROGRESS, COMPLETED, CANCELLED
        const userRestaurantId = req.user?.restaurantId;
        const userRole = req.user?.tipo_user;
        const userId = req.user?.id;

        // Validar status
        if (!['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].includes(status)) {
            return res.status(400).json({
                error: 'Status inválido',
                validStatus: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']
            });
        }

        // Buscar pedido
        const order = await prisma.orders.findUnique({
            where: { id: parseInt(orderId) },
            include: { restaurant: { select: { name: true } } }
        });

        if (!order) {
            return res.status(404).json({
                error: 'Pedido não encontrado'
            });
        }

        // Verificar permissão (apenas do próprio restaurante)
        if (userRole !== 'DEVELOPER' && order.restaurantId !== userRestaurantId) {
            return res.status(403).json({
                error: 'Você não tem permissão para atualizar este pedido',
                detail: 'Este pedido pertence a outro restaurante'
            });
        }

        // Atualizar status
        const updatedOrder = await prisma.orders.update({
            where: { id: parseInt(orderId) },
            data: {
                status_order: status,
                updated_at: new Date()
            }
        });

        res.json({
            success: true,
            message: `✅ Status do pedido atualizado para: ${status}`,
            order: {
                id: updatedOrder.id,
                previousStatus: order.status_order,
                newStatus: updatedOrder.status_order,
                restaurant: order.restaurant.name,
                updatedBy: userRole,
                updatedAt: updatedOrder.updated_at
            }
        });

    } catch (error) {
        console.error('❌ Erro ao atualizar status do pedido:', error);
        res.status(500).json({
            error: 'Erro interno do servidor',
            details: error.message
        });
    }
};

// ===== FINALIZAR PEDIDO (COZINHA/ADMIN) - CONSOME ESTOQUE AUTOMATICAMENTE =====
export const completeOrder = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { wastePercentage = 0 } = req.body; // % de desperdício opcional
        const userRestaurantId = req.user?.restaurantId;
        const userRole = req.user?.tipo_user;
        const userId = req.user?.id;

        if (wastePercentage < 0 || wastePercentage > 100) {
            return res.status(400).json({
                error: 'Percentual de desperdício deve estar entre 0 e 100'
            });
        }

        // Buscar pedido completo com receitas
        const order = await prisma.orders.findUnique({
            where: { id: parseInt(orderId) },
            include: {
                restaurant: { select: { name: true } },
                Item_Order: {
                    include: {
                        product: {
                            include: {
                                Item_Product: {
                                    include: {
                                        ingredient: {
                                            include: {
                                                Stock: true
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        if (!order) {
            return res.status(404).json({
                error: 'Pedido não encontrado'
            });
        }

        // Verificar permissão
        if (userRole !== 'DEVELOPER' && order.restaurantId !== userRestaurantId) {
            return res.status(403).json({
                error: 'Você não tem permissão para finalizar este pedido'
            });
        }

        // Verificar se pedido já foi finalizado
        if (order.status_order === 'COMPLETED') {
            return res.status(400).json({
                error: 'Este pedido já foi finalizado',
                completedAt: order.updated_at
            });
        }

        if (order.status_order === 'CANCELLED') {
            return res.status(400).json({
                error: 'Este pedido foi cancelado e não pode ser finalizado'
            });
        }

        // Consolidar necessidades de ingredientes
        const ingredientNeeds = new Map(); // ingredientId -> { stock, totalNeeded, details }

        for (const orderItem of order.Item_Order) {
            const product = orderItem.product;

            if (!product.Item_Product || product.Item_Product.length === 0) {
                return res.status(400).json({
                    error: `Produto "${product.name}" não possui receita cadastrada`,
                    action: 'Configure a receita antes de finalizar o pedido'
                });
            }

            for (const recipeItem of product.Item_Product) {
                const ingredient = recipeItem.ingredient;
                const stock = ingredient.Stock[0];

                if (!stock) {
                    return res.status(400).json({
                        error: `Estoque não encontrado para: ${ingredient.name}`,
                        action: 'Configure o estoque do ingrediente'
                    });
                }

                const quantityNeeded = recipeItem.quantity * orderItem.quantity;

                if (!ingredientNeeds.has(ingredient.id)) {
                    ingredientNeeds.set(ingredient.id, {
                        ingredient,
                        stock,
                        totalNeeded: 0,
                        details: []
                    });
                }

                const need = ingredientNeeds.get(ingredient.id);
                need.totalNeeded += quantityNeeded;
                need.details.push({
                    product: product.name,
                    quantity: orderItem.quantity,
                    needed: quantityNeeded
                });
            }
        }

        // Validar estoque disponível
        const stockErrors = [];
        ingredientNeeds.forEach((need) => {
            const wasteQuantity = (need.totalNeeded * wastePercentage) / 100;
            const totalWithWaste = need.totalNeeded + wasteQuantity;

            if (need.stock.quantity_current < totalWithWaste) {
                stockErrors.push({
                    ingredient: need.ingredient.name,
                    needed: totalWithWaste,
                    available: need.stock.quantity_current,
                    missing: totalWithWaste - need.stock.quantity_current,
                    unit: need.ingredient.unit,
                    usedIn: need.details
                });
            }
        });

        if (stockErrors.length > 0) {
            return res.status(400).json({
                success: false,
                error: '🚨 Estoque insuficiente para finalizar o pedido',
                orderId: order.id,
                wastePercentage,
                missingIngredients: stockErrors
            });
        }

        // Consumir estoque
        const consumptionResults = [];
        const stockWarnings = [];

        for (const [ingredientId, need] of ingredientNeeds) {
            const recipeQuantity = need.totalNeeded;
            const wasteQuantity = (recipeQuantity * wastePercentage) / 100;
            const totalConsumed = recipeQuantity + wasteQuantity;

            const previousQuantity = need.stock.quantity_current;
            const newQuantity = previousQuantity - totalConsumed;

            // Atualizar estoque
            await prisma.stock.update({
                where: { id: need.stock.id },
                data: {
                    quantity_current: newQuantity,
                    last_updated_by: parseInt(userId),
                    updated_at: new Date()
                }
            });

            // Registrar movimentação de pedido
            await prisma.stock_Movement.create({
                data: {
                    stockId: need.stock.id,
                    type: 'SAIDA_PEDIDO',
                    quantity: recipeQuantity,
                    observation: `Pedido #${order.id} finalizado`,
                    responsible_user_id: parseInt(userId)
                }
            });

            // Registrar desperdício se houver
            if (wasteQuantity > 0) {
                await prisma.stock_Movement.create({
                    data: {
                        stockId: need.stock.id,
                        type: 'SAIDA_PERDA',
                        quantity: wasteQuantity,
                        waste_reason: 'DESPERDICIO_PREPARO',
                        observation: `Desperdício (${wastePercentage}%) - Pedido #${order.id}`,
                        responsible_user_id: parseInt(userId)
                    }
                });
            }

            // Verificar necessidade de reabastecimento
            if (newQuantity <= need.stock.quantity_minimum) {
                stockWarnings.push({
                    ingredient: need.ingredient.name,
                    currentStock: newQuantity,
                    minimumStock: need.stock.quantity_minimum,
                    status: newQuantity === 0 ? '🚨 ESGOTADO' : '⚠️ BAIXO'
                });
            }

            consumptionResults.push({
                ingredient: need.ingredient.name,
                previousStock: previousQuantity,
                consumed: totalConsumed,
                newStock: newQuantity,
                unit: need.ingredient.unit,
                details: need.details
            });
        }

        // Atualizar pedido para COMPLETED
        const completedOrder = await prisma.orders.update({
            where: { id: parseInt(orderId) },
            data: {
                status_order: 'COMPLETED',
                updated_at: new Date()
            }
        });

        res.json({
            success: true,
            message: '✅ Pedido finalizado com sucesso! Estoque consumido automaticamente.',
            order: {
                id: completedOrder.id,
                status: completedOrder.status_order,
                restaurant: order.restaurant.name,
                completedBy: userRole,
                completedAt: completedOrder.updated_at
            },
            stockConsumption: {
                ingredientsProcessed: consumptionResults.length,
                wastePercentage,
                details: consumptionResults
            },
            warnings: stockWarnings.length > 0 ? {
                message: '⚠️ Alguns ingredientes precisam de reabastecimento',
                items: stockWarnings
            } : null
        });

    } catch (error) {
        console.error('❌ Erro ao finalizar pedido:', error);
        res.status(500).json({
            error: 'Erro interno do servidor',
            details: error.message
        });
    }
};

// ===== CANCELAR PEDIDO =====
export const cancelOrder = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { reason } = req.body; // Motivo do cancelamento
        const userRestaurantId = req.user?.restaurantId;
        const userRole = req.user?.tipo_user;

        const order = await prisma.orders.findUnique({
            where: { id: parseInt(orderId) },
            include: { restaurant: { select: { name: true } } }
        });

        if (!order) {
            return res.status(404).json({
                error: 'Pedido não encontrado'
            });
        }

        // Verificar permissão
        if (userRole !== 'DEVELOPER' && order.restaurantId !== userRestaurantId) {
            return res.status(403).json({
                error: 'Você não tem permissão para cancelar este pedido'
            });
        }

        // Verificar se já foi finalizado
        if (order.status_order === 'COMPLETED') {
            return res.status(400).json({
                error: 'Pedido já foi finalizado e não pode ser cancelado',
                completedAt: order.updated_at
            });
        }

        if (order.status_order === 'CANCELLED') {
            return res.status(400).json({
                error: 'Pedido já está cancelado'
            });
        }

        // Cancelar pedido
        const cancelledOrder = await prisma.orders.update({
            where: { id: parseInt(orderId) },
            data: {
                status_order: 'CANCELLED',
                updated_at: new Date()
            }
        });

        res.json({
            success: true,
            message: '✅ Pedido cancelado com sucesso',
            order: {
                id: cancelledOrder.id,
                previousStatus: order.status_order,
                newStatus: cancelledOrder.status_order,
                restaurant: order.restaurant.name,
                reason: reason || 'Não informado',
                cancelledBy: userRole,
                cancelledAt: cancelledOrder.updated_at
            }
        });

    } catch (error) {
        console.error('❌ Erro ao cancelar pedido:', error);
        res.status(500).json({
            error: 'Erro interno do servidor',
            details: error.message
        });
    }
};
