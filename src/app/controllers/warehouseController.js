import { PrismaClient } from '../../../generated/prisma/index.js';

const prisma = new PrismaClient();

// ===== CRIAR ESTOQUE/ARMAZÉM (APENAS ADMIN) =====
export const createWarehouse = async (req, res) => {
  try {
    const { name, description } = req.body;
    const adminRestaurantId = req.user?.restaurantId;

    // Verificar se o ADMIN tem restaurantId
    if (!adminRestaurantId) {
      return res.status(400).json({
        error: 'Administrador não está vinculado a nenhum restaurante'
      });
    }

    // Criar estoque automaticamente no restaurante do ADMIN
    const warehouse = await prisma.warehouse.create({
      data: {
        name,
        description,
        restaurantId: adminRestaurantId
      }
    });

    res.status(201).json({
      message: 'Estoque criado com sucesso',
      warehouse
    });

  } catch (error) {
    console.error('Erro ao criar estoque:', error);

    if (error.code === 'P2002') {
      return res.status(400).json({
        error: 'Já existe um estoque com este nome neste restaurante'
      });
    }

    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
};

// ===== LISTAR ESTOQUES POR RESTAURANTE =====
export const getWarehousesByRestaurant = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const userRestaurantId = req.user?.restaurantId;
    const userRole = req.user?.tipo_user;

    // DEVELOPER pode ver qualquer restaurante, outros só o próprio
    if (userRole !== 'DEVELOPER' && parseInt(restaurantId) !== userRestaurantId) {
      return res.status(403).json({
        error: 'Você não tem permissão para visualizar estoques deste restaurante',
        detail: 'Você só pode visualizar estoques do seu próprio restaurante'
      });
    }

    const warehouses = await prisma.warehouse.findMany({
      where: { restaurantId: parseInt(restaurantId) },
      include: {
        _count: {
          select: {
            Ingredients: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    res.json({
      warehouses,
      total: warehouses.length
    });

  } catch (error) {
    console.error('Erro ao listar estoques:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
};

// ===== BUSCAR ESTOQUE POR ID =====
export const getWarehouseById = async (req, res) => {
  try {
    const { warehouseId } = req.params;
    const userRestaurantId = req.user?.restaurantId;
    const userRole = req.user?.tipo_user;

    const warehouse = await prisma.warehouse.findUnique({
      where: { id: parseInt(warehouseId) },
      include: {
        restaurant: {
          select: {
            id: true,
            name: true
          }
        },
        Ingredients: {
          include: {
            Stock: true
          }
        }
      }
    });

    if (!warehouse) {
      return res.status(404).json({
        error: 'Estoque não encontrado'
      });
    }

    // DEVELOPER pode ver qualquer warehouse, outros só do próprio restaurante
    if (userRole !== 'DEVELOPER' && warehouse.restaurantId !== userRestaurantId) {
      return res.status(403).json({
        error: 'Você não tem permissão para visualizar este estoque',
        detail: 'Este estoque pertence a outro restaurante'
      });
    }

    res.json(warehouse);

  } catch (error) {
    console.error('Erro ao buscar estoque:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
};

// ===== ATUALIZAR ESTOQUE (APENAS ADMIN) =====
export const updateWarehouse = async (req, res) => {
  try {
    const { warehouseId } = req.params;
    const { name, description } = req.body;
    const adminRestaurantId = req.user?.restaurantId;

    // Verificar se estoque existe
    const existingWarehouse = await prisma.warehouse.findUnique({
      where: { id: parseInt(warehouseId) }
    });

    if (!existingWarehouse) {
      return res.status(404).json({
        error: 'Estoque não encontrado'
      });
    }

    // Verificar se o warehouse pertence ao restaurante do ADMIN
    if (existingWarehouse.restaurantId !== adminRestaurantId) {
      return res.status(403).json({
        error: 'Você não tem permissão para atualizar este estoque',
        detail: 'Este estoque pertence a outro restaurante'
      });
    }

    // Atualizar estoque
    const warehouse = await prisma.warehouse.update({
      where: { id: parseInt(warehouseId) },
      data: {
        name,
        description
      }
    });

    res.json({
      message: 'Estoque atualizado com sucesso',
      warehouse
    });

  } catch (error) {
    console.error('Erro ao atualizar estoque:', error);

    if (error.code === 'P2002') {
      return res.status(400).json({
        error: 'Já existe um estoque com este nome neste restaurante'
      });
    }

    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
};

// ===== DELETAR ESTOQUE (APENAS ADMIN) =====
export const deleteWarehouse = async (req, res) => {
  try {
    const { warehouseId } = req.params;
    const adminRestaurantId = req.user?.restaurantId;

    // Verificar se estoque existe
    const existingWarehouse = await prisma.warehouse.findUnique({
      where: { id: parseInt(warehouseId) },
      include: {
        Ingredients: true
      }
    });

    if (!existingWarehouse) {
      return res.status(404).json({
        error: 'Estoque não encontrado'
      });
    }

    // Verificar se o warehouse pertence ao restaurante do ADMIN
    if (existingWarehouse.restaurantId !== adminRestaurantId) {
      return res.status(403).json({
        error: 'Você não tem permissão para deletar este estoque',
        detail: 'Este estoque pertence a outro restaurante'
      });
    }

    // Verificar se tem ingredientes
    if (existingWarehouse.Ingredients.length > 0) {
      return res.status(400).json({
        error: `Não é possível deletar. Estoque possui ${existingWarehouse.Ingredients.length} ingrediente(s) cadastrado(s)`
      });
    }

    // Deletar estoque
    await prisma.warehouse.delete({
      where: { id: parseInt(warehouseId) }
    });

    res.json({
      message: 'Estoque deletado com sucesso'
    });

  } catch (error) {
    console.error('Erro ao deletar estoque:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
};
