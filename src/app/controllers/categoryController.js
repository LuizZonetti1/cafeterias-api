import { PrismaClient } from '../../../generated/prisma/index.js';

const prisma = new PrismaClient();

// ===== CRIAR CATEGORIA (APENAS ADMIN) =====
export const createCategory = async (req, res) => {
    try {
        const { name } = req.body;
        const adminRestaurantId = req.user?.restaurantId;
        const userRole = req.user?.tipo_user;

        // Validar campo obrigatório
        if (!name) {
            return res.status(400).json({
                error: 'Nome da categoria é obrigatório'
            });
        }

        // DEVELOPER não pode criar categorias (não tem restaurante)
        if (userRole === 'DEVELOPER') {
            return res.status(403).json({
                error: 'DEVELOPER não pode criar categorias',
                detail: 'Apenas usuários vinculados a restaurantes podem gerenciar categorias'
            });
        }

        // Verificar se já existe categoria com este nome no restaurante
        const existingCategory = await prisma.category.findFirst({
            where: {
                name: name.trim(),
                restaurantId: adminRestaurantId
            }
        });

        if (existingCategory) {
            return res.status(400).json({
                error: 'Já existe uma categoria com este nome no seu restaurante',
                existingCategory: {
                    id: existingCategory.id,
                    name: existingCategory.name
                }
            });
        }

        // Processar imagem se houver upload
        let imageUrl = null;
        if (req.file) {
            // Gerar URL da imagem
            const protocol = req.protocol;
            const host = req.get('host');
            imageUrl = `${protocol}://${host}/uploads/categories/${req.file.filename}`;
        }

        // Criar categoria
        const category = await prisma.category.create({
            data: {
                name: name.trim(),
                restaurantId: adminRestaurantId,
                image_url: imageUrl
            },
            include: {
                restaurant: {
                    select: { id: true, name: true }
                }
            }
        });

        res.status(201).json({
            success: true,
            message: '✅ Categoria criada com sucesso!',
            category: {
                id: category.id,
                name: category.name,
                image_url: category.image_url,
                restaurant: category.restaurant.name,
                createdAt: category.created_at
            }
        });

    } catch (error) {
        console.error('❌ Erro ao criar categoria:', error);
        res.status(500).json({
            error: 'Erro interno do servidor',
            details: error.message
        });
    }
};

// ===== LISTAR CATEGORIAS POR RESTAURANTE =====
export const getCategoriesByRestaurant = async (req, res) => {
    try {
        const { restaurantId } = req.params;
        const userRestaurantId = req.user?.restaurantId;
        const userRole = req.user?.tipo_user;

        // DEVELOPER pode ver qualquer restaurante, outros só o próprio
        if (userRole !== 'DEVELOPER' && parseInt(restaurantId) !== userRestaurantId) {
            return res.status(403).json({
                error: 'Você não tem permissão para visualizar categorias deste restaurante',
                detail: 'Você só pode visualizar categorias do seu próprio restaurante'
            });
        }

        const categories = await prisma.category.findMany({
            where: { restaurantId: parseInt(restaurantId) },
            include: {
                _count: {
                    select: { Product: true }
                }
            },
            orderBy: { name: 'asc' }
        });

        res.json({
            success: true,
            restaurantId: parseInt(restaurantId),
            total: categories.length,
            categories: categories.map(cat => ({
                id: cat.id,
                name: cat.name,
                image_url: cat.image_url,
                productsCount: cat._count.Product,
                createdAt: cat.created_at,
                updatedAt: cat.updated_at
            }))
        });

    } catch (error) {
        console.error('❌ Erro ao listar categorias:', error);
        res.status(500).json({
            error: 'Erro interno do servidor',
            details: error.message
        });
    }
};

// ===== BUSCAR CATEGORIA POR ID =====
export const getCategoryById = async (req, res) => {
    try {
        const { categoryId } = req.params;
        const userRestaurantId = req.user?.restaurantId;
        const userRole = req.user?.tipo_user;

        const category = await prisma.category.findUnique({
            where: { id: parseInt(categoryId) },
            include: {
                restaurant: {
                    select: { id: true, name: true }
                },
                Product: {
                    select: {
                        id: true,
                        name: true,
                        price: true,
                        image_url: true
                    }
                }
            }
        });

        if (!category) {
            return res.status(404).json({
                error: 'Categoria não encontrada'
            });
        }

        // DEVELOPER pode ver qualquer restaurante, outros só o próprio
        if (userRole !== 'DEVELOPER' && category.restaurantId !== userRestaurantId) {
            return res.status(403).json({
                error: 'Você não tem permissão para visualizar esta categoria',
                detail: 'Esta categoria pertence a outro restaurante'
            });
        }

        res.json({
            success: true,
            category: {
                id: category.id,
                name: category.name,
                image_url: category.image_url,
                restaurant: category.restaurant,
                products: category.Product,
                createdAt: category.created_at,
                updatedAt: category.updated_at
            }
        });

    } catch (error) {
        console.error('❌ Erro ao buscar categoria:', error);
        res.status(500).json({
            error: 'Erro interno do servidor',
            details: error.message
        });
    }
};

// ===== ATUALIZAR CATEGORIA (APENAS ADMIN) =====
export const updateCategory = async (req, res) => {
    try {
        const { categoryId } = req.params;
        const { name } = req.body;
        const adminRestaurantId = req.user?.restaurantId;
        const userRole = req.user?.tipo_user;

        // DEVELOPER não pode atualizar categorias
        if (userRole === 'DEVELOPER') {
            return res.status(403).json({
                error: 'DEVELOPER não pode atualizar categorias'
            });
        }

        // Verificar se categoria existe
        const existingCategory = await prisma.category.findUnique({
            where: { id: parseInt(categoryId) }
        });

        if (!existingCategory) {
            return res.status(404).json({
                error: 'Categoria não encontrada'
            });
        }

        // Verificar se pertence ao restaurante do ADMIN
        if (existingCategory.restaurantId !== adminRestaurantId) {
            return res.status(403).json({
                error: 'Você não tem permissão para atualizar esta categoria',
                detail: 'Esta categoria pertence a outro restaurante'
            });
        }

        // Se está atualizando o nome, verificar se não haverá duplicata
        if (name && name.trim() !== existingCategory.name) {
            const duplicateCategory = await prisma.category.findFirst({
                where: {
                    name: name.trim(),
                    restaurantId: adminRestaurantId,
                    id: { not: parseInt(categoryId) }
                }
            });

            if (duplicateCategory) {
                return res.status(400).json({
                    error: 'Já existe uma categoria com este nome no seu restaurante'
                });
            }
        }

        // Preparar dados para atualização
        const updateData = {};
        if (name) updateData.name = name.trim();

        // Processar nova imagem se houver upload
        if (req.file) {
            const protocol = req.protocol;
            const host = req.get('host');
            updateData.image_url = `${protocol}://${host}/uploads/categories/${req.file.filename}`;
        }

        // Atualizar categoria
        const updatedCategory = await prisma.category.update({
            where: { id: parseInt(categoryId) },
            data: updateData,
            include: {
                restaurant: {
                    select: { name: true }
                },
                _count: {
                    select: { Product: true }
                }
            }
        });

        res.json({
            success: true,
            message: '✅ Categoria atualizada com sucesso!',
            category: {
                id: updatedCategory.id,
                name: updatedCategory.name,
                image_url: updatedCategory.image_url,
                restaurant: updatedCategory.restaurant.name,
                productsCount: updatedCategory._count.Product,
                updatedAt: updatedCategory.updated_at
            }
        });

    } catch (error) {
        console.error('❌ Erro ao atualizar categoria:', error);
        res.status(500).json({
            error: 'Erro interno do servidor',
            details: error.message
        });
    }
};

// ===== DELETAR CATEGORIA (APENAS ADMIN) =====
export const deleteCategory = async (req, res) => {
    try {
        const { categoryId } = req.params;
        const adminRestaurantId = req.user?.restaurantId;
        const userRole = req.user?.tipo_user;

        // DEVELOPER não pode deletar categorias
        if (userRole === 'DEVELOPER') {
            return res.status(403).json({
                error: 'DEVELOPER não pode deletar categorias'
            });
        }

        // Verificar se categoria existe
        const category = await prisma.category.findUnique({
            where: { id: parseInt(categoryId) },
            include: {
                _count: {
                    select: { Product: true }
                }
            }
        });

        if (!category) {
            return res.status(404).json({
                error: 'Categoria não encontrada'
            });
        }

        // Verificar permissão
        if (category.restaurantId !== adminRestaurantId) {
            return res.status(403).json({
                error: 'Você não tem permissão para deletar esta categoria',
                detail: 'Esta categoria pertence a outro restaurante'
            });
        }

        // Verificar se há produtos usando esta categoria
        if (category._count.Product > 0) {
            return res.status(400).json({
                error: 'Não é possível deletar esta categoria',
                detail: `Existem ${category._count.Product} produto(s) usando esta categoria`,
                action: 'Mova os produtos para outra categoria ou delete-os primeiro'
            });
        }

        // Deletar categoria
        await prisma.category.delete({
            where: { id: parseInt(categoryId) }
        });

        res.json({
            success: true,
            message: '✅ Categoria deletada com sucesso!',
            deletedCategory: {
                id: category.id,
                name: category.name
            }
        });

    } catch (error) {
        console.error('❌ Erro ao deletar categoria:', error);
        res.status(500).json({
            error: 'Erro interno do servidor',
            details: error.message
        });
    }
};
