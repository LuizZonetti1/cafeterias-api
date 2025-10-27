import { PrismaClient } from '../../../generated/prisma/index.js';
const prisma = new PrismaClient();

// ===== HELPER: CRIAR NOTIFICAÇÃO AUTOMÁTICA =====
export const createNotification = async ({ ingredientId, type = 'LOW_STOCK', message, restaurantId }) => {
    try {
        // Verificar se já existe notificação não lida para este ingrediente
        const existingNotification = await prisma.notification.findFirst({
            where: {
                ingredientId,
                type,
                is_read: false,
                restaurantId
            }
        });

        // Se já existe, não criar duplicada
        if (existingNotification) {
            return existingNotification;
        }

        // Criar nova notificação
        const notification = await prisma.notification.create({
            data: {
                ingredientId,
                type,
                message,
                restaurantId,
                is_read: false
            },
            include: {
                ingredient: {
                    select: {
                        name: true,
                        unit: true
                    }
                }
            }
        });

        return notification;
    } catch (error) {
        console.error('❌ Erro ao criar notificação:', error);
        return null;
    }
};

// ===== LISTAR NOTIFICAÇÕES POR RESTAURANTE =====
export const getNotificationsByRestaurant = async (req, res) => {
    try {
        const { restaurantId } = req.params;
        const { unreadOnly } = req.query; // ?unreadOnly=true
        const userRestaurantId = req.user?.restaurantId;
        const userRole = req.user?.tipo_user;

        // DEVELOPER pode ver de qualquer restaurante
        if (userRole !== 'DEVELOPER') {
            if (parseInt(restaurantId) !== userRestaurantId) {
                return res.status(403).json({
                    error: 'Você não tem permissão para visualizar notificações deste restaurante'
                });
            }
        }

        const whereClause = {
            restaurantId: parseInt(restaurantId)
        };

        // Filtrar apenas não lidas se solicitado
        if (unreadOnly === 'true') {
            whereClause.is_read = false;
        }

        const notifications = await prisma.notification.findMany({
            where: whereClause,
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
            },
            orderBy: {
                created_at: 'desc'
            }
        });

        res.json({
            success: true,
            restaurantId: parseInt(restaurantId),
            filters: {
                unreadOnly: unreadOnly === 'true'
            },
            summary: {
                total: notifications.length,
                unread: notifications.filter(n => !n.is_read).length,
                read: notifications.filter(n => n.is_read).length
            },
            notifications: notifications.map(n => ({
                id: n.id,
                type: n.type,
                message: n.message,
                isRead: n.is_read,
                ingredient: {
                    id: n.ingredient.id,
                    name: n.ingredient.name,
                    unit: n.ingredient.unit,
                    currentStock: n.ingredient.Stock[0]?.quantity_current || 0,
                    minimumStock: n.ingredient.Stock[0]?.quantity_minimum || 0
                },
                createdAt: n.created_at
            }))
        });

    } catch (error) {
        console.error('❌ Erro ao listar notificações:', error);
        res.status(500).json({
            error: 'Erro interno do servidor',
            details: error.message
        });
    }
};

// ===== MARCAR NOTIFICAÇÃO COMO LIDA =====
export const markNotificationAsRead = async (req, res) => {
    try {
        const { notificationId } = req.params;
        const userRestaurantId = req.user?.restaurantId;
        const userRole = req.user?.tipo_user;

        const notification = await prisma.notification.findUnique({
            where: { id: parseInt(notificationId) }
        });

        if (!notification) {
            return res.status(404).json({
                error: 'Notificação não encontrada'
            });
        }

        // DEVELOPER pode marcar qualquer notificação, outros só do próprio restaurante
        if (userRole !== 'DEVELOPER' && notification.restaurantId !== userRestaurantId) {
            return res.status(403).json({
                error: 'Você não tem permissão para marcar esta notificação'
            });
        }

        const updated = await prisma.notification.update({
            where: { id: parseInt(notificationId) },
            data: { is_read: true }
        });

        res.json({
            success: true,
            message: 'Notificação marcada como lida',
            notification: {
                id: updated.id,
                message: updated.message,
                isRead: updated.is_read
            }
        });

    } catch (error) {
        console.error('❌ Erro ao marcar notificação:', error);
        res.status(500).json({
            error: 'Erro interno do servidor',
            details: error.message
        });
    }
};

// ===== MARCAR TODAS AS NOTIFICAÇÕES COMO LIDAS =====
export const markAllAsRead = async (req, res) => {
    try {
        const { restaurantId } = req.params;
        const userRestaurantId = req.user?.restaurantId;
        const userRole = req.user?.tipo_user;

        // DEVELOPER pode marcar de qualquer restaurante
        if (userRole !== 'DEVELOPER') {
            if (parseInt(restaurantId) !== userRestaurantId) {
                return res.status(403).json({
                    error: 'Você não tem permissão para marcar notificações deste restaurante'
                });
            }
        }

        const result = await prisma.notification.updateMany({
            where: {
                restaurantId: parseInt(restaurantId),
                is_read: false
            },
            data: {
                is_read: true
            }
        });

        res.json({
            success: true,
            message: `${result.count} notificações marcadas como lidas`,
            count: result.count
        });

    } catch (error) {
        console.error('❌ Erro ao marcar todas as notificações:', error);
        res.status(500).json({
            error: 'Erro interno do servidor',
            details: error.message
        });
    }
};

// ===== DELETAR NOTIFICAÇÃO =====
export const deleteNotification = async (req, res) => {
    try {
        const { notificationId } = req.params;
        const userRestaurantId = req.user?.restaurantId;
        const userRole = req.user?.tipo_user;

        const notification = await prisma.notification.findUnique({
            where: { id: parseInt(notificationId) }
        });

        if (!notification) {
            return res.status(404).json({
                error: 'Notificação não encontrada'
            });
        }

        // DEVELOPER pode deletar qualquer notificação, outros só do próprio restaurante
        if (userRole !== 'DEVELOPER' && notification.restaurantId !== userRestaurantId) {
            return res.status(403).json({
                error: 'Você não tem permissão para deletar esta notificação'
            });
        }

        await prisma.notification.delete({
            where: { id: parseInt(notificationId) }
        });

        res.json({
            success: true,
            message: 'Notificação deletada com sucesso'
        });

    } catch (error) {
        console.error('❌ Erro ao deletar notificação:', error);
        res.status(500).json({
            error: 'Erro interno do servidor',
            details: error.message
        });
    }
};

// ===== DELETAR TODAS AS NOTIFICAÇÕES LIDAS =====
export const deleteAllRead = async (req, res) => {
    try {
        const { restaurantId } = req.params;
        const userRestaurantId = req.user?.restaurantId;
        const userRole = req.user?.tipo_user;

        // DEVELOPER pode deletar de qualquer restaurante
        if (userRole !== 'DEVELOPER') {
            if (parseInt(restaurantId) !== userRestaurantId) {
                return res.status(403).json({
                    error: 'Você não tem permissão para deletar notificações deste restaurante'
                });
            }
        }

        const result = await prisma.notification.deleteMany({
            where: {
                restaurantId: parseInt(restaurantId),
                is_read: true
            }
        });

        res.json({
            success: true,
            message: `${result.count} notificações deletadas`,
            count: result.count
        });

    } catch (error) {
        console.error('❌ Erro ao deletar notificações:', error);
        res.status(500).json({
            error: 'Erro interno do servidor',
            details: error.message
        });
    }
};
