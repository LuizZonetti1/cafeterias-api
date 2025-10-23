import { PrismaClient } from '../../../generated/prisma/index.js';
import { generateImageUrl } from '../../middlewares/uploadMiddleware.js';

const prisma = new PrismaClient();

// ===== CRIAR RESTAURANTE (apenas DEVELOPER) =====
export const createRestaurant = async (req, res) => {
  try {
    const { name, description, address, phone, email } = req.body;

    console.log('🏪 Criando restaurante:', { name, address });
    console.log('📁 Arquivo enviado:', req.file ? req.file.filename : 'Nenhum');

    // ===== VERIFICAR SE IMAGEM É OBRIGATÓRIA =====
    if (!req.file) {
      return res.status(400).json({
        error: 'Logo do restaurante é obrigatória. Por favor, envie uma imagem.'
      });
    }

    console.log('✅ Imagem válida recebida:', req.file.filename);

    // Verificar se já existe restaurante com mesmo nome
    const existingRestaurant = await prisma.restaurant.findFirst({
      where: { name }
    });

    if (existingRestaurant) {
      return res.status(400).json({
        error: 'Já existe um restaurante com este nome'
      });
    }

    // Gerar URL da logo (agora sempre haverá arquivo)
    const logo_url = `restaurants/${req.file.filename}`;
    console.log('🖼️ Logo URL gerada:', logo_url);

    // Criar restaurante
    const restaurant = await prisma.restaurant.create({
      data: {
        name,
        description,
        address,
        phone,
        email,
        logo_url,
        isActive: true
      }
    });

    // Adicionar URL completa na resposta
    const restaurantWithFullUrls = {
      ...restaurant,
      logo_url_full: generateImageUrl(req, logo_url)
    };

    console.log('✅ Restaurante criado com logo:', restaurant.id);

    res.status(201).json({
      success: true,
      message: 'Restaurante criado com sucesso!',
      restaurant: restaurantWithFullUrls
    });

  } catch (error) {
    console.error('❌ Erro ao criar restaurante:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
};

// ===== LISTAR RESTAURANTES PARA SELEÇÃO (público) =====
export const getRestaurantsList = async (req, res) => {
  try {
    console.log('📋 Listando restaurantes ativos...');

    const restaurants = await prisma.restaurant.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        description: true,
        address: true,
        phone: true,
        logo_url: true
      },
      orderBy: { name: 'asc' }
    });

    // Adicionar URLs completas para as imagens
    const restaurantsWithFullUrls = restaurants.map(restaurant => ({
      ...restaurant,
      logo_url_full: restaurant.logo_url ? generateImageUrl(req, restaurant.logo_url) : null
    }));

    console.log(`✅ ${restaurants.length} restaurantes encontrados`);

    res.json({
      success: true,
      restaurants: restaurantsWithFullUrls
    });

  } catch (error) {
    console.error('❌ Erro ao listar restaurantes:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
};

// ===== LISTAR TODOS OS RESTAURANTES (apenas DEVELOPER) =====
export const getAllRestaurants = async (req, res) => {
  try {
    console.log('📋 Listando todos os restaurantes (DEVELOPER)...');

    const restaurants = await prisma.restaurant.findMany({
      include: {
        _count: {
          select: {
            users: true,
            products: true,
            ingredients: true
          }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    console.log(`✅ ${restaurants.length} restaurantes encontrados`);

    res.json({
      success: true,
      restaurants
    });

  } catch (error) {
    console.error('❌ Erro ao listar restaurantes:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
};

// ===== BUSCAR RESTAURANTE POR ID =====
export const getRestaurantById = async (req, res) => {
  try {
    const { id } = req.params;

    console.log('🔍 Buscando restaurante:', id);

    const restaurant = await prisma.restaurant.findUnique({
      where: { id: parseInt(id) },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            tipo_user: true,
            status_user: true
          }
        },
        _count: {
          select: {
            products: true,
            ingredients: true,
            orders: true
          }
        }
      }
    });

    if (!restaurant) {
      return res.status(404).json({
        error: 'Restaurante não encontrado'
      });
    }

    console.log('✅ Restaurante encontrado:', restaurant.name);

    res.json({
      success: true,
      restaurant
    });

  } catch (error) {
    console.error('❌ Erro ao buscar restaurante:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
};

// ===== ATUALIZAR RESTAURANTE (apenas DEVELOPER) =====
export const updateRestaurant = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, address, phone, email, logo_url, isActive } = req.body;

    console.log('🔄 Atualizando restaurante:', id);

    // Verificar se restaurante existe
    const existingRestaurant = await prisma.restaurant.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingRestaurant) {
      return res.status(404).json({
        error: 'Restaurante não encontrado'
      });
    }

    // Atualizar apenas campos fornecidos
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (address !== undefined) updateData.address = address;
    if (phone !== undefined) updateData.phone = phone;
    if (email !== undefined) updateData.email = email;
    if (logo_url !== undefined) updateData.logo_url = logo_url;
    if (isActive !== undefined) updateData.isActive = isActive;

    const restaurant = await prisma.restaurant.update({
      where: { id: parseInt(id) },
      data: updateData
    });

    console.log('✅ Restaurante atualizado:', restaurant.name);

    res.json({
      success: true,
      message: 'Restaurante atualizado com sucesso!',
      restaurant
    });

  } catch (error) {
    console.error('❌ Erro ao atualizar restaurante:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
};

// ===== DELETAR RESTAURANTE (apenas DEVELOPER) =====
export const deleteRestaurant = async (req, res) => {
  try {
    const { id } = req.params;

    console.log('🗑️ Deletando restaurante:', id);

    // Verificar se restaurante existe
    const existingRestaurant = await prisma.restaurant.findUnique({
      where: { id: parseInt(id) },
      include: {
        _count: {
          select: {
            users: true,
            products: true
          }
        }
      }
    });

    if (!existingRestaurant) {
      return res.status(404).json({
        error: 'Restaurante não encontrado'
      });
    }

    // Verificar se tem usuários ou produtos vinculados
    if (existingRestaurant._count.users > 0) {
      return res.status(400).json({
        error: `Não é possível deletar. Restaurante possui ${existingRestaurant._count.users} usuário(s) cadastrado(s)`
      });
    }

    if (existingRestaurant._count.products > 0) {
      return res.status(400).json({
        error: `Não é possível deletar. Restaurante possui ${existingRestaurant._count.products} produto(s) cadastrado(s)`
      });
    }

    // Deletar restaurante
    await prisma.restaurant.delete({
      where: { id: parseInt(id) }
    });

    console.log('✅ Restaurante deletado com sucesso');

    res.json({
      success: true,
      message: 'Restaurante deletado com sucesso!'
    });

  } catch (error) {
    console.error('❌ Erro ao deletar restaurante:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
};