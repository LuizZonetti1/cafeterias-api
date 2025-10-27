import { PrismaClient } from '../../../generated/prisma/index.js';

const prisma = new PrismaClient();

// ===== CRIAR PRODUTO COM RECEITA (APENAS ADMIN) =====
export const createProduct = async (req, res) => {
  try {
    const { name, description, price, categoryId, recipe } = req.body;
    const adminRestaurantId = req.user?.restaurantId;
    const userRole = req.user?.tipo_user;

    // Validar campos obrigatórios
    if (!name || !price || !categoryId) {
      return res.status(400).json({
        error: 'Nome, preço e categoria são obrigatórios'
      });
    }

    // Processar imagem se houver upload
    let imageUrl = null;
    if (req.file) {
      const protocol = req.protocol;
      const host = req.get('host');
      imageUrl = `${protocol}://${host}/uploads/products/${req.file.filename}`;
    }

    // Verificar se categoria existe e pertence ao restaurante
    const category = await prisma.category.findUnique({
      where: { id: parseInt(categoryId) }
    });

    if (!category) {
      return res.status(404).json({
        error: 'Categoria não encontrada'
      });
    }

    if (category.restaurantId !== adminRestaurantId) {
      return res.status(403).json({
        error: 'Você não tem permissão para usar esta categoria',
        detail: 'Esta categoria pertence a outro restaurante'
      });
    }

    // Verificar se já existe produto com este nome no restaurante
    const existingProduct = await prisma.product.findFirst({
      where: {
        name,
        restaurantId: adminRestaurantId
      }
    });

    if (existingProduct) {
      return res.status(400).json({
        error: 'Já existe um produto com este nome no seu restaurante',
        existingProduct: {
          id: existingProduct.id,
          name: existingProduct.name
        }
      });
    }

    // Validar receita (se fornecida)
    if (recipe && Array.isArray(recipe) && recipe.length > 0) {
      // Verificar se todos os ingredientes existem e pertencem ao restaurante
      const ingredientIds = recipe.map(item => parseInt(item.ingredientId));
      const ingredients = await prisma.ingredient.findMany({
        where: {
          id: { in: ingredientIds },
          restaurantId: adminRestaurantId
        }
      });

      if (ingredients.length !== ingredientIds.length) {
        return res.status(400).json({
          error: 'Um ou mais ingredientes não foram encontrados ou não pertencem ao seu restaurante'
        });
      }

      // Validar quantidades
      for (const item of recipe) {
        if (!item.quantity || item.quantity <= 0) {
          return res.status(400).json({
            error: `Quantidade inválida para ingrediente ID ${item.ingredientId}`
          });
        }
        if (!item.unit || !['GRAMAS', 'LITROS', 'UNIDADES', 'MILILITROS'].includes(item.unit)) {
          return res.status(400).json({
            error: `Unidade inválida para ingrediente ID ${item.ingredientId}`,
            validUnits: ['GRAMAS', 'LITROS', 'UNIDADES', 'MILILITROS']
          });
        }
      }
    }

    // Criar produto e receita em transação
    const product = await prisma.product.create({
      data: {
        name,
        description: description || '',
        price: parseFloat(price),
        image_url: imageUrl,
        categoryId: parseInt(categoryId),
        restaurantId: adminRestaurantId,
        // Criar receita junto com o produto (se fornecida)
        Item_Product: recipe && recipe.length > 0 ? {
          create: recipe.map(item => ({
            ingredientId: parseInt(item.ingredientId),
            quantity: parseFloat(item.quantity),
            unit: item.unit
          }))
        } : undefined
      },
      include: {
        category: { select: { name: true } },
        Item_Product: {
          include: {
            ingredient: {
              select: { id: true, name: true, unit: true }
            }
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: '✅ Produto criado com sucesso!',
      product: {
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        category: product.category.name,
        image_url: product.image_url,
        hasRecipe: product.Item_Product.length > 0,
        recipe: product.Item_Product.map(item => ({
          ingredient: item.ingredient.name,
          quantity: item.quantity,
          unit: item.unit
        }))
      },
      permissions: {
        createdBy: userRole,
        requiredRole: 'ADMIN'
      }
    });

  } catch (error) {
    console.error('❌ Erro ao criar produto:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
};

// ===== LISTAR PRODUTOS POR RESTAURANTE =====
export const getProductsByRestaurant = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const userRestaurantId = req.user?.restaurantId;
    const userRole = req.user?.tipo_user;

    if (!restaurantId) {
      return res.status(400).json({
        error: 'restaurantId é obrigatório'
      });
    }

    // DEVELOPER pode ver qualquer restaurante, outros só o próprio
    if (userRole !== 'DEVELOPER' && parseInt(restaurantId) !== userRestaurantId) {
      return res.status(403).json({
        error: 'Você não tem permissão para visualizar produtos deste restaurante'
      });
    }

    const products = await prisma.product.findMany({
      where: {
        restaurantId: parseInt(restaurantId)
      },
      include: {
        category: { select: { name: true } },
        _count: {
          select: { Item_Product: true } // Contar ingredientes na receita
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    res.json({
      success: true,
      total: products.length,
      products: products.map(product => ({
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        category: product.category.name,
        image_url: product.image_url,
        hasRecipe: product._count.Item_Product > 0,
        totalIngredients: product._count.Item_Product,
        created_at: product.created_at,
        updated_at: product.updated_at
      }))
    });

  } catch (error) {
    console.error('❌ Erro ao buscar produtos:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
};

// ===== BUSCAR PRODUTO POR ID COM RECEITA COMPLETA =====
export const getProductById = async (req, res) => {
  try {
    const { productId } = req.params;
    const userRestaurantId = req.user?.restaurantId;
    const userRole = req.user?.tipo_user;

    const product = await prisma.product.findUnique({
      where: { id: parseInt(productId) },
      include: {
        category: { select: { name: true } },
        restaurant: { select: { id: true, name: true } },
        Item_Product: {
          include: {
            ingredient: {
              select: {
                id: true,
                name: true,
                unit: true,
                Stock: {
                  select: {
                    quantity_current: true,
                    quantity_minimum: true
                  }
                }
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

    // DEVELOPER pode ver qualquer restaurante, outros só o próprio
    if (userRole !== 'DEVELOPER' && product.restaurantId !== userRestaurantId) {
      return res.status(403).json({
        error: 'Você não tem permissão para visualizar este produto'
      });
    }

    res.json({
      success: true,
      product: {
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        category: product.category.name,
        restaurant: product.restaurant.name,
        image_url: product.image_url,
        recipe: product.Item_Product.map(item => ({
          ingredient: {
            id: item.ingredient.id,
            name: item.ingredient.name,
            unit: item.ingredient.unit,
            currentStock: item.ingredient.Stock[0]?.quantity_current || 0,
            minimumStock: item.ingredient.Stock[0]?.quantity_minimum || 0
          },
          quantityNeeded: item.quantity,
          unitInRecipe: item.unit
        })),
        created_at: product.created_at,
        updated_at: product.updated_at
      }
    });

  } catch (error) {
    console.error('❌ Erro ao buscar produto:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
};

// ===== ATUALIZAR PRODUTO (APENAS ADMIN) =====
export const updateProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const { name, description, price, categoryId } = req.body;
    const adminRestaurantId = req.user?.restaurantId;

    // Verificar se produto existe e pertence ao restaurante do ADMIN
    const existingProduct = await prisma.product.findUnique({
      where: { id: parseInt(productId) }
    });

    if (!existingProduct) {
      return res.status(404).json({
        error: 'Produto não encontrado'
      });
    }

    if (existingProduct.restaurantId !== adminRestaurantId) {
      return res.status(403).json({
        error: 'Você não tem permissão para editar este produto'
      });
    }

    // Se mudar categoria, validar que pertence ao restaurante
    if (categoryId && parseInt(categoryId) !== existingProduct.categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: parseInt(categoryId) }
      });

      if (!category) {
        return res.status(404).json({
          error: 'Categoria não encontrada'
        });
      }

      if (category.restaurantId !== adminRestaurantId) {
        return res.status(403).json({
          error: 'Você não tem permissão para usar esta categoria'
        });
      }
    }

    // Processar nova imagem se houver upload
    let imageUrl = existingProduct.image_url;
    if (req.file) {
      const protocol = req.protocol;
      const host = req.get('host');
      imageUrl = `${protocol}://${host}/uploads/products/${req.file.filename}`;
    }

    // Atualizar produto
    const updatedProduct = await prisma.product.update({
      where: { id: parseInt(productId) },
      data: {
        name: name || existingProduct.name,
        description: description !== undefined ? description : existingProduct.description,
        price: price ? parseFloat(price) : existingProduct.price,
        categoryId: categoryId ? parseInt(categoryId) : existingProduct.categoryId,
        image_url: imageUrl,
        updated_at: new Date()
      },
      include: {
        category: { select: { name: true } }
      }
    });

    res.json({
      success: true,
      message: 'Produto atualizado com sucesso',
      product: {
        id: updatedProduct.id,
        name: updatedProduct.name,
        description: updatedProduct.description,
        price: updatedProduct.price,
        category: updatedProduct.category.name,
        image_url: updatedProduct.image_url
      }
    });

  } catch (error) {
    console.error('❌ Erro ao atualizar produto:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
};

// ===== DELETAR PRODUTO (APENAS ADMIN) =====
export const deleteProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const adminRestaurantId = req.user?.restaurantId;

    // Verificar se produto existe e pertence ao restaurante do ADMIN
    const existingProduct = await prisma.product.findUnique({
      where: { id: parseInt(productId) },
      include: {
        _count: {
          select: {
            Item_Order: true,
            Item_Product: true
          }
        }
      }
    });

    if (!existingProduct) {
      return res.status(404).json({
        error: 'Produto não encontrado'
      });
    }

    if (existingProduct.restaurantId !== adminRestaurantId) {
      return res.status(403).json({
        error: 'Você não tem permissão para deletar este produto'
      });
    }

    // Verificar se tem pedidos associados
    if (existingProduct._count.Item_Order > 0) {
      return res.status(400).json({
        error: 'Não é possível deletar produto com pedidos cadastrados',
        detail: `Este produto possui ${existingProduct._count.Item_Order} pedido(s) associado(s)`
      });
    }

    // Deletar produto (cascade deleta Item_Product - receita)
    await prisma.product.delete({
      where: { id: parseInt(productId) }
    });

    res.json({
      success: true,
      message: 'Produto deletado com sucesso',
      deletedRecipeItems: existingProduct._count.Item_Product
    });

  } catch (error) {
    console.error('❌ Erro ao deletar produto:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
};

// ===== ADICIONAR/ATUALIZAR RECEITA DO PRODUTO (APENAS ADMIN) =====
export const updateProductRecipe = async (req, res) => {
  try {
    const { productId } = req.params;
    const { recipe } = req.body; // Array: [{ ingredientId, quantity, unit }]
    const adminRestaurantId = req.user?.restaurantId;

    if (!recipe || !Array.isArray(recipe) || recipe.length === 0) {
      return res.status(400).json({
        error: 'Receita inválida. Forneça um array de ingredientes'
      });
    }

    // Verificar se produto existe e pertence ao restaurante
    const product = await prisma.product.findUnique({
      where: { id: parseInt(productId) }
    });

    if (!product) {
      return res.status(404).json({
        error: 'Produto não encontrado'
      });
    }

    if (product.restaurantId !== adminRestaurantId) {
      return res.status(403).json({
        error: 'Você não tem permissão para editar a receita deste produto'
      });
    }

    // Validar ingredientes
    const ingredientIds = recipe.map(item => parseInt(item.ingredientId));
    const ingredients = await prisma.ingredient.findMany({
      where: {
        id: { in: ingredientIds },
        restaurantId: adminRestaurantId
      }
    });

    if (ingredients.length !== ingredientIds.length) {
      return res.status(400).json({
        error: 'Um ou mais ingredientes não foram encontrados ou não pertencem ao seu restaurante'
      });
    }

    // Validar quantidades e unidades
    for (const item of recipe) {
      if (!item.quantity || item.quantity <= 0) {
        return res.status(400).json({
          error: `Quantidade inválida para ingrediente ID ${item.ingredientId}`
        });
      }
      if (!item.unit || !['GRAMAS', 'LITROS', 'UNIDADES', 'MILILITROS'].includes(item.unit)) {
        return res.status(400).json({
          error: `Unidade inválida para ingrediente ID ${item.ingredientId}`,
          validUnits: ['GRAMAS', 'LITROS', 'UNIDADES', 'MILILITROS']
        });
      }
    }

    // Deletar receita antiga
    await prisma.item_Product.deleteMany({
      where: { productId: parseInt(productId) }
    });

    // Criar nova receita
    const newRecipe = await prisma.item_Product.createMany({
      data: recipe.map(item => ({
        productId: parseInt(productId),
        ingredientId: parseInt(item.ingredientId),
        quantity: parseFloat(item.quantity),
        unit: item.unit
      }))
    });

    // Buscar receita atualizada com detalhes
    const updatedProduct = await prisma.product.findUnique({
      where: { id: parseInt(productId) },
      include: {
        Item_Product: {
          include: {
            ingredient: {
              select: { id: true, name: true, unit: true }
            }
          }
        }
      }
    });

    res.json({
      success: true,
      message: 'Receita atualizada com sucesso',
      product: {
        id: updatedProduct.id,
        name: updatedProduct.name,
        recipe: updatedProduct.Item_Product.map(item => ({
          ingredient: item.ingredient.name,
          quantity: item.quantity,
          unit: item.unit
        }))
      }
    });

  } catch (error) {
    console.error('❌ Erro ao atualizar receita:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
};

// ===== CONFECCIONAR PRODUTO (PRODUZIR) - CONSOME ESTOQUE AUTOMATICAMENTE =====
export const produceProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity, wastePercentage = 0 } = req.body;
    const userId = req.user?.id;
    const userRestaurantId = req.user?.restaurantId;
    const userRole = req.user?.tipo_user;

    if (!quantity || quantity <= 0) {
      return res.status(400).json({
        error: 'Quantidade deve ser maior que zero'
      });
    }

    if (wastePercentage < 0 || wastePercentage > 100) {
      return res.status(400).json({
        error: 'Percentual de desperdício deve estar entre 0 e 100'
      });
    }

    // Buscar produto com receita
    const product = await prisma.product.findUnique({
      where: { id: parseInt(productId) },
      include: {
        restaurant: { select: { name: true } },
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

    // Validar multi-tenant (DEVELOPER pode produzir em qualquer restaurante)
    if (userRole !== 'DEVELOPER' && product.restaurantId !== userRestaurantId) {
      return res.status(403).json({
        error: 'Você não tem permissão para produzir este produto',
        detail: 'Este produto pertence a outro restaurante'
      });
    }

    // Verificar se tem receita
    if (product.Item_Product.length === 0) {
      return res.status(400).json({
        error: 'Produto não possui receita cadastrada',
        detail: 'Não é possível produzir um produto sem ingredientes definidos',
        action: 'Cadastre a receita antes de produzir'
      });
    }

    const consumptionResults = [];
    const errors = [];
    const stockWarnings = [];

    // ===== VALIDAR ESTOQUE DISPONÍVEL ANTES DE CONSUMIR =====
    for (const item of product.Item_Product) {
      const ingredient = item.ingredient;
      const stock = ingredient.Stock[0];

      if (!stock) {
        errors.push({
          ingredient: ingredient.name,
          error: 'Estoque não encontrado',
          action: 'Cadastre o estoque deste ingrediente'
        });
        continue;
      }

      // Calcular quantidade total necessária (receita + desperdício)
      const recipeQuantity = item.quantity * parseFloat(quantity);
      const wasteQuantity = (recipeQuantity * wastePercentage) / 100;
      const totalNeeded = recipeQuantity + wasteQuantity;

      // Verificar disponibilidade
      if (stock.quantity_current < totalNeeded) {
        errors.push({
          ingredient: ingredient.name,
          error: '❌ ESTOQUE INSUFICIENTE',
          needed: totalNeeded,
          available: stock.quantity_current,
          missing: totalNeeded - stock.quantity_current,
          unit: ingredient.unit,
          action: `Adicione pelo menos ${(totalNeeded - stock.quantity_current).toFixed(2)} ${ingredient.unit} ao estoque`
        });
      }
    }

    // Se houver erros, retornar sem processar
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: '🚨 Não é possível produzir o produto',
        message: 'Ingredientes insuficientes no estoque',
        product: {
          name: product.name,
          quantityRequested: parseFloat(quantity),
          wastePercentage
        },
        missingIngredients: errors
      });
    }

    // ===== CONSUMIR ESTOQUE (TODOS OS INGREDIENTES ESTÃO DISPONÍVEIS) =====
    for (const item of product.Item_Product) {
      const ingredient = item.ingredient;
      const stock = ingredient.Stock[0];

      // Calcular quantidades
      const recipeQuantity = item.quantity * parseFloat(quantity);
      const wasteQuantity = (recipeQuantity * wastePercentage) / 100;
      const totalConsumed = recipeQuantity + wasteQuantity;

      const previousQuantity = stock.quantity_current;
      const newQuantity = previousQuantity - totalConsumed;

      // Atualizar estoque
      const updatedStock = await prisma.stock.update({
        where: { id: stock.id },
        data: {
          quantity_current: newQuantity,
          last_updated_by: parseInt(userId),
          updated_at: new Date()
        }
      });

      // Registrar movimentação de receita
      const recipeMovement = await prisma.stock_Movement.create({
        data: {
          stockId: stock.id,
          type: 'SAIDA_RECEITA',
          quantity: recipeQuantity,
          observation: `Produção: ${quantity}x ${product.name}`,
          responsible_user_id: parseInt(userId)
        }
      });

      // Registrar movimentação de desperdício (se houver)
      let wasteMovement = null;
      if (wasteQuantity > 0) {
        wasteMovement = await prisma.stock_Movement.create({
          data: {
            stockId: stock.id,
            type: 'SAIDA_PERDA',
            quantity: wasteQuantity,
            waste_reason: 'DESPERDICIO_PREPARO',
            observation: `Desperdício na produção (${wastePercentage}%) - ${product.name}`,
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
          status: newQuantity === 0 ? '🚨 ESTOQUE ESGOTADO' : '⚠️ ESTOQUE BAIXO - REABASTECIMENTO NECESSÁRIO'
        });
      }

      consumptionResults.push({
        ingredient: ingredient.name,
        previousStock: previousQuantity,
        recipeUsed: recipeQuantity,
        wasteUsed: wasteQuantity,
        totalConsumed,
        newStock: newQuantity,
        unit: ingredient.unit,
        calculation: `${previousQuantity} - ${totalConsumed} = ${newQuantity}`,
        needsRestock,
        movements: {
          recipe: recipeMovement.id,
          waste: wasteMovement?.id || null
        }
      });
    }

    res.json({
      success: true,
      message: '✅ Produto produzido com sucesso! Estoque consumido automaticamente.',
      production: {
        product: product.name,
        restaurant: product.restaurant.name,
        quantityProduced: parseFloat(quantity),
        wastePercentage,
        producedBy: userRole,
        producedAt: new Date()
      },
      consumption: consumptionResults,
      warnings: stockWarnings.length > 0 ? stockWarnings : null,
      summary: {
        totalIngredients: consumptionResults.length,
        lowStockItems: stockWarnings.length,
        status: stockWarnings.length > 0
          ? '⚠️ ATENÇÃO: Alguns ingredientes precisam de reabastecimento'
          : '✅ Todos os estoques OK'
      }
    });

  } catch (error) {
    console.error('❌ Erro ao produzir produto:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
};
