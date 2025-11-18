import { PrismaClient } from '../../../generated/prisma/index.js';
import { createNotification } from './notificationController.js';

const prisma = new PrismaClient();

// ===== CRIAR ESTOQUE INICIAL PARA INGREDIENTE =====
export const createStock = async (req, res) => {
  try {
    const { ingredientId, quantity_initial, quantity_minimum, userId } = req.body;

    // Verificar se ingrediente existe
    const ingredient = await prisma.ingredient.findUnique({
      where: { id: parseInt(ingredientId) },
      include: { Stock: true }
    });

    if (!ingredient) {
      return res.status(404).json({
        error: 'Ingrediente não encontrado'
      });
    }

    // Verificar se já existe estoque para este ingrediente
    if (ingredient.Stock.length > 0) {
      return res.status(400).json({
        error: 'Já existe estoque para este ingrediente'
      });
    }

    // Criar estoque inicial
    const stock = await prisma.stock.create({
      data: {
        ingredientId: parseInt(ingredientId),
        quantity_current: parseFloat(quantity_initial || 0),
        quantity_minimum: parseFloat(quantity_minimum || 50),
        last_updated_by: parseInt(userId)
      }
    });

    // Registrar movimentação inicial se houver quantidade
    if (quantity_initial > 0) {
      await prisma.stock_Movement.create({
        data: {
          ingredientId: parseInt(ingredientId),
          userId: parseInt(userId),
          type: 'ENTRADA',
          quantity: parseFloat(quantity_initial),
          reason: 'Estoque inicial criado'
        }
      });
    }

    res.status(201).json({
      success: true,
      message: 'Estoque criado com sucesso!',
      stock
    });

  } catch (error) {
    res.status(500).json({
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
};

// ===== DEFINIR/ATUALIZAR ESTOQUE MÍNIMO =====
export const setMinimumStock = async (req, res) => {
  try {
    const { ingredientId } = req.params;
    const { quantity_minimum } = req.body;
    const userId = req.user?.id;
    const userRestaurantId = req.user?.restaurantId;
    const userRole = req.user?.type_user;

    // Verificar se estoque existe
    const stock = await prisma.stock.findUnique({
      where: { ingredientId: parseInt(ingredientId) },
      include: {
        ingredient: {
          select: {
            restaurantId: true,
            name: true
          }
        }
      }
    });

    if (!stock) {
      return res.status(404).json({
        error: 'Estoque não encontrado para este ingrediente'
      });
    }

    // DEVELOPER pode mexer em qualquer restaurante, ADMIN/outros só no próprio
    if (userRole !== 'DEVELOPER' && stock.ingredient.restaurantId !== userRestaurantId) {
      return res.status(403).json({
        error: 'Você não tem permissão para definir estoque mínimo neste ingrediente',
        detail: 'Este ingrediente pertence a outro restaurante'
      });
    }

    // Atualizar estoque mínimo
    const updatedStock = await prisma.stock.update({
      where: { id: stock.id },
      data: {
        quantity_minimum: parseFloat(quantity_minimum),
        last_updated_by: userId
      }
    });

    res.json({
      success: true,
      message: 'Estoque mínimo atualizado com sucesso!',
      stock: updatedStock
    });

  } catch (error) {
    res.status(500).json({
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
};

// ===== ADICIONAR ESTOQUE (ENTRADA) - APENAS ADMIN/DEVELOPER =====
export const addStock = async (req, res) => {
  try {
    const { ingredientId } = req.params;
    const { quantity, reason, supplier, expirationDate, costPerUnit } = req.body;
    const userId = req.user?.id;
    const userRestaurantId = req.user?.restaurantId;
    const userRole = req.user?.type_user;

    // ===== VERIFICAR PERMISSÃO =====
    if (!['ADMIN', 'DEVELOPER'].includes(userRole)) {
      return res.status(403).json({
        error: 'Apenas administradores podem adicionar estoque manualmente'
      });
    }

    if (!quantity || quantity <= 0) {
      return res.status(400).json({
        error: 'Quantidade deve ser maior que zero'
      });
    }

    // Verificar se estoque existe
    const stock = await prisma.stock.findUnique({
      where: { ingredientId: parseInt(ingredientId) },
      include: {
        ingredient: {
          select: {
            name: true,
            unit: true,
            restaurantId: true,
            restaurant: { select: { name: true } }
          }
        }
      }
    });

    if (!stock) {
      return res.status(404).json({
        error: 'Estoque não encontrado para este ingrediente'
      });
    }

    // DEVELOPER pode mexer em qualquer restaurante, ADMIN só no próprio
    if (userRole !== 'DEVELOPER' && stock.ingredient.restaurantId !== userRestaurantId) {
      return res.status(403).json({
        error: 'Você não tem permissão para adicionar estoque neste ingrediente',
        detail: 'Este ingrediente pertence a outro restaurante'
      });
    }

    // ===== SOMAR QUANTIDADE AO ESTOQUE ATUAL =====
    const previousQuantity = stock.quantity_current;
    const addedQuantity = parseFloat(quantity);
    const newQuantity = previousQuantity + addedQuantity;

    // Atualizar estoque
    const updatedStock = await prisma.stock.update({
      where: { id: stock.id },
      data: {
        quantity_current: newQuantity,
        last_updated_by: parseInt(userId),
        updated_at: new Date()
      }
    });

    // Registrar movimentação
    const movement = await prisma.stock_Movement.create({
      data: {
        stockId: stock.id,
        type: 'ENTRADA',
        quantity: addedQuantity,
        cost_per_unit: costPerUnit ? parseFloat(costPerUnit) : null,
        supplier: supplier || null,
        expiration_date: expirationDate ? new Date(expirationDate) : null,
        observation: reason || `Entrada manual - Admin: ${userId}`,
        responsible_user_id: parseInt(userId)
      }
    });

    // ✨ Criar notificação se ainda estiver abaixo do mínimo
    if (newQuantity < stock.quantity_minimum) {
      await createNotification({
        ingredientId: stock.ingredientId,
        type: 'LOW_STOCK',
        message: `Estoque baixo: ${stock.ingredient.name} (${newQuantity}${stock.ingredient.unit} - Mínimo: ${stock.quantity_minimum}${stock.ingredient.unit})`,
        restaurantId: stock.ingredient.restaurantId
      });
    }

    res.json({
      success: true,
      message: '✅ Estoque atualizado com sucesso!',
      operation: {
        ingredient: stock.ingredient.name,
        restaurant: stock.ingredient.restaurant.name,
        unit: stock.ingredient.unit,
        previousQuantity,
        addedQuantity,
        newQuantity,
        calculation: `${previousQuantity} + ${addedQuantity} = ${newQuantity}`,
        minimumStock: stock.quantity_minimum,
        needsRestock: newQuantity <= stock.quantity_minimum,
        status: newQuantity <= stock.quantity_minimum ? '⚠️ ESTOQUE BAIXO' : '✅ ESTOQUE OK'
      },
      movement: {
        id: movement.id,
        type: movement.type,
        quantity: movement.quantity,
        timestamp: movement.created_at
      }
    });

  } catch (error) {
    res.status(500).json({
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
};

// ===== DIMINUIR ESTOQUE POR PRODUTO FINALIZADO (AUTOMÁTICO) =====
export const consumeStockByProduct = async (req, res) => {
  try {
    const { productId, quantity, wastePercentage = 0, userId } = req.body;

    if (!productId || !quantity || quantity <= 0) {
      return res.status(400).json({
        error: 'ID do produto e quantidade válida são obrigatórios'
      });
    }

    // Buscar receita do produto (ingredientes necessários)
    const product = await prisma.product.findUnique({
      where: { id: parseInt(productId) },
      include: {
        Item_Product: {
          include: {
            ingredient: {
              include: {
                Stock: true,
                restaurant: { select: { name: true } }
              }
            }
          }
        }
      }
    });

    if (!product) {
      return res.status(404).json({
        error: 'Produto não encontrado'
      });
    }

    if (product.Item_Product.length === 0) {
      return res.status(400).json({
        error: 'Produto não possui receita cadastrada (ingredientes não definidos)'
      });
    }

    const consumptionResults = [];
    const errors = [];
    const stockWarnings = [];

    // ===== PROCESSAR CADA INGREDIENTE DA RECEITA =====
    for (const item of product.Item_Product) {
      const ingredient = item.ingredient;
      const stock = ingredient.Stock[0];

      if (!stock) {
        errors.push(`❌ Estoque não encontrado para: ${ingredient.name}`);
        continue;
      }

      // Calcular quantidade necessária (receita + desperdício)
      const recipeQuantity = item.quantity * parseFloat(quantity);
      const wasteQuantity = (recipeQuantity * wastePercentage) / 100;
      const totalQuantityNeeded = recipeQuantity + wasteQuantity;

      // Verificar se há estoque suficiente
      if (stock.quantity_current < totalQuantityNeeded) {
        errors.push(
          `❌ Estoque insuficiente para: ${ingredient.name} ` +
                    `(necessário: ${totalQuantityNeeded}, disponível: ${stock.quantity_current})`
        );
        continue;
      }

      // ===== ATUALIZAR ESTOQUE (DIMINUIR) =====
      const previousQuantity = stock.quantity_current;
      const newQuantity = previousQuantity - totalQuantityNeeded;

      const updatedStock = await prisma.stock.update({
        where: { id: stock.id },
        data: {
          quantity_current: newQuantity,
          last_updated_by: parseInt(userId),
          updated_at: new Date()
        }
      });

      // Registrar movimentação (receita)
      const recipeMovement = await prisma.stock_Movement.create({
        data: {
          stockId: stock.id,
          type: 'SAIDA_RECEITA',
          quantity: recipeQuantity,
          observation: `Produção: ${quantity}x ${product.name}`,
          responsible_user_id: parseInt(userId)
        }
      });

      // Registrar movimentação (desperdício, se houver)
      let wasteMovement = null;
      if (wasteQuantity > 0) {
        wasteMovement = await prisma.stock_Movement.create({
          data: {
            stockId: stock.id,
            type: 'SAIDA_PERDA',
            quantity: wasteQuantity,
            observation: `Desperdício na confecção (${wastePercentage}%) - ${product.name}`,
            responsible_user_id: parseInt(userId)
          }
        });
      }

      // Verificar se precisa reabastecer
      const needsRestock = newQuantity <= stock.quantity_minimum;
      if (needsRestock) {
        stockWarnings.push({
          ingredient: ingredient.name,
          currentStock: newQuantity,
          minimumStock: stock.quantity_minimum,
          status: '⚠️ REABASTECIMENTO NECESSÁRIO'
        });

        // ✨ Criar notificação automática
        await createNotification({
          ingredientId: ingredient.id,
          type: 'LOW_STOCK',
          message: `Estoque baixo: ${ingredient.name} (${newQuantity}${ingredient.unit} - Mínimo: ${stock.quantity_minimum}${ingredient.unit})`,
          restaurantId: ingredient.restaurantId
        });
      }

      consumptionResults.push({
        ingredient: ingredient.name,
        restaurant: ingredient.restaurant.name,
        previousStock: previousQuantity,
        recipeUsed: recipeQuantity,
        wasteUsed: wasteQuantity,
        totalUsed: totalQuantityNeeded,
        newStock: newQuantity,
        calculation: `${previousQuantity} - ${totalQuantityNeeded} = ${newQuantity}`,
        needsRestock,
        movements: {
          recipe: recipeMovement.id,
          waste: wasteMovement?.id || null
        }
      });
    }

    // Se houve erros, não processar e retornar erros
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Não foi possível processar o pedido',
        details: errors
      });
    }

    res.json({
      success: true,
      message: `✅ Estoque consumido automaticamente para ${quantity}x ${product.name}`,
      product: {
        name: product.name,
        quantityProduced: parseFloat(quantity),
        wastePercentage: wastePercentage
      },
      consumption: consumptionResults,
      warnings: stockWarnings.length > 0 ? stockWarnings : null,
      summary: {
        totalIngredients: consumptionResults.length,
        lowStockItems: stockWarnings.length,
        status: stockWarnings.length > 0 ? '⚠️ ATENÇÃO: Alguns itens precisam de reabastecimento' : '✅ Todos os estoques OK'
      }
    });

  } catch (error) {
    res.status(500).json({
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
};

// ===== REGISTRAR PERDA DE ESTOQUE =====
// ===== REGISTRAR PERDA/ESTRAGO - APENAS COZINHA E ADMINISTRADOR =====
export const registerStockLoss = async (req, res) => {
  try {
    const { ingredientId } = req.params;
    const { quantity, observation, waste_reason } = req.body;
    const userId = req.user?.id;
    const userRestaurantId = req.user?.restaurantId;
    const userRole = req.user?.type_user;

    // ===== VERIFICAR PERMISSÃO - APENAS COZINHA E ADMINISTRADOR =====
    if (!['COZINHA', 'ADMIN'].includes(userRole)) {
      return res.status(403).json({
        error: 'Apenas cozinheiros e administradores podem registrar desperdício/perda',
        requiredRoles: ['COZINHA', 'ADMIN'],
        userRole: userRole
      });
    }

    if (!quantity || quantity <= 0) {
      return res.status(400).json({
        error: 'Quantidade deve ser maior que zero'
      });
    }

    const validReasons = ['VENCIDO', 'DETERIORADO', 'CONTAMINADO', 'QUEBRA', 'DESPERDICIO_PREPARO', 'OUTROS'];
    if (waste_reason && !validReasons.includes(waste_reason)) {
      return res.status(400).json({
        error: 'Motivo de perda inválido',
        validReasons
      });
    }

    // Verificar se estoque existe
    const stock = await prisma.stock.findUnique({
      where: { ingredientId: parseInt(ingredientId) },
      include: {
        ingredient: {
          select: {
            name: true,
            unit: true,
            restaurantId: true,
            restaurant: { select: { name: true } }
          }
        }
      }
    });

    if (!stock) {
      return res.status(404).json({
        error: 'Estoque não encontrado para este ingrediente'
      });
    }

    // Verificar se o ingrediente pertence ao restaurante do usuário
    if (stock.ingredient.restaurantId !== userRestaurantId) {
      return res.status(403).json({
        error: 'Você não tem permissão para registrar perdas neste ingrediente',
        detail: 'Este ingrediente pertence a outro restaurante'
      });
    }

    const lossQuantity = parseFloat(quantity);

    // Verificar se há estoque suficiente
    if (stock.quantity_current < lossQuantity) {
      return res.status(400).json({
        error: 'Estoque insuficiente para registrar esta perda',
        details: `Disponível: ${stock.quantity_current}, Tentando remover: ${lossQuantity}`
      });
    }

    // ===== DIMINUIR ESTOQUE PELA PERDA =====
    const previousQuantity = stock.quantity_current;
    const newQuantity = previousQuantity - lossQuantity;

    const updatedStock = await prisma.stock.update({
      where: { id: stock.id },
      data: {
        quantity_current: newQuantity,
        last_updated_by: parseInt(userId),
        updated_at: new Date()
      }
    });

    // Registrar movimentação de perda
    const movement = await prisma.stock_Movement.create({
      data: {
        stockId: stock.id,
        type: 'SAIDA_PERDA',
        quantity: lossQuantity,
        waste_reason: waste_reason || 'OUTROS',
        observation: observation || `Perda registrada por ${userRole} - ${waste_reason || 'OUTROS'}`,
        responsible_user_id: parseInt(userId)
      }
    });

    // ✨ Criar notificação se ficou abaixo do mínimo
    if (newQuantity < stock.quantity_minimum) {
      await createNotification({
        ingredientId: stock.ingredientId,
        type: 'LOW_STOCK',
        message: `Estoque baixo: ${stock.ingredient.name} (${newQuantity}${stock.ingredient.unit} - Mínimo: ${stock.quantity_minimum}${stock.ingredient.unit})`,
        restaurantId: stock.ingredient.restaurantId
      });
    }

    res.json({
      success: true,
      message: '🗑️ Perda de estoque registrada com sucesso!',
      operation: {
        ingredient: stock.ingredient.name,
        restaurant: stock.ingredient.restaurant.name,
        unit: stock.ingredient.unit,
        previousQuantity,
        lossQuantity,
        newQuantity,
        calculation: `${previousQuantity} - ${lossQuantity} = ${newQuantity}`,
        lossReason: waste_reason || 'OUTROS',
        minimumStock: stock.quantity_minimum,
        needsRestock: newQuantity <= stock.quantity_minimum,
        status: newQuantity <= stock.quantity_minimum ? '⚠️ ESTOQUE BAIXO' : newQuantity === 0 ? '🚨 ESTOQUE ESGOTADO' : '✅ ESTOQUE OK'
      },
      permissions: {
        registeredBy: userRole,
        allowedRoles: ['COZINHA', 'ADMIN']
      },
      movement: {
        id: movement.id,
        type: movement.type,
        quantity: movement.quantity,
        reason: movement.waste_reason,
        timestamp: movement.created_at
      }
    });

  } catch (error) {
    res.status(500).json({
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
};

// ===== OBTER STATUS COMPLETO DO ESTOQUE DO RESTAURANTE =====
export const getRestaurantStockOverview = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const userRestaurantId = req.user?.restaurantId;
    const userRole = req.user?.type_user;

    // DEVELOPER pode ver qualquer restaurante, outros só o próprio
    if (userRole !== 'DEVELOPER' && parseInt(restaurantId) !== userRestaurantId) {
      return res.status(403).json({
        error: 'Você não tem permissão para visualizar o estoque deste restaurante',
        detail: 'Você só pode visualizar o estoque do seu próprio restaurante'
      });
    }

    const ingredients = await prisma.ingredient.findMany({
      where: { restaurantId: parseInt(restaurantId) },
      include: {
        Stock: true,
        _count: {
          select: { Item_Product: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    const overview = {
      restaurantId: parseInt(restaurantId),
      totalIngredients: ingredients.length,
      statistics: {
        withStock: 0,
        withoutStock: 0,
        lowStock: 0,
        outOfStock: 0
      },
      ingredients: []
    };

    ingredients.forEach(ingredient => {
      const stock = ingredient.Stock[0];
      let status = 'NO_STOCK';

      if (stock) {
        overview.statistics.withStock++;

        if (stock.quantity_current === 0) {
          status = 'OUT_OF_STOCK';
          overview.statistics.outOfStock++;
        } else if (stock.quantity_current <= stock.quantity_minimum) {
          status = 'LOW_STOCK';
          overview.statistics.lowStock++;
        } else {
          status = 'OK';
        }
      } else {
        overview.statistics.withoutStock++;
      }

      overview.ingredients.push({
        id: ingredient.id,
        name: ingredient.name,
        unit: ingredient.unit,
        currentStock: stock?.quantity_current || 0,
        minimumStock: stock?.quantity_minimum || 0,
        usedInRecipes: ingredient._count.Item_Product,
        status,
        lastUpdated: stock?.updated_at || null
      });
    });

    res.json({
      success: true,
      overview
    });

  } catch (error) {
    res.status(500).json({
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
};
