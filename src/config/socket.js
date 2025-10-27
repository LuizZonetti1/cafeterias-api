// ===== CONFIGURAÇÃO DO WEBSOCKET (SOCKET.IO) =====
// Gerencia conexões em tempo real para notificações e pedidos

import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from './env.js';

let io = null;

/**
 * Inicializa o servidor Socket.IO
 * @param {Object} httpServer - Servidor HTTP do Express
 * @returns {Server} Instância do Socket.IO
 */
export function initializeSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || '*',
      methods: ['GET', 'POST'],
      credentials: true
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000
  });

  // Middleware de autenticação
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error('Authentication error: Token não fornecido'));
    }

    try {
      const decoded = jwt.verify(token, config.jwtSecret);

      socket.userId = decoded.userId;
      socket.restaurantId = decoded.restaurantId;
      socket.tipoUser = decoded.tipo_user;
      socket.userName = decoded.name;

      next();
    } catch (err) {
      next(new Error('Authentication error: Token inválido'));
    }
  });

  // Gerenciar conexões
  io.on('connection', (socket) => {
    console.log('✅ WebSocket: Cliente conectado');
    console.log(`   Socket ID: ${socket.id}`);
    console.log(`   User: ${socket.userName} (${socket.tipoUser})`);
    console.log(`   Restaurant ID: ${socket.restaurantId}`);

    // Cliente entra na "sala" do seu restaurante
    socket.join(`restaurant:${socket.restaurantId}`);

    // Enviar confirmação de conexão
    socket.emit('connected', {
      message: 'Conectado ao WebSocket com sucesso',
      userId: socket.userId,
      restaurantId: socket.restaurantId,
      tipoUser: socket.tipoUser
    });

    // Eventos personalizados (opcional)
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: new Date() });
    });

    // Evento de desconexão
    socket.on('disconnect', (reason) => {
      console.log(`❌ WebSocket: Cliente desconectado (${reason})`);
      console.log(`   User: ${socket.userName}`);
    });

    // Tratamento de erros
    socket.on('error', (error) => {
      console.error('❌ WebSocket Error:', error);
    });
  });

  console.log('📡 WebSocket (Socket.IO) inicializado');

  return io;
}

/**
 * Retorna a instância do Socket.IO
 * @returns {Server|null}
 */
export function getIO() {
  if (!io) {
    throw new Error('Socket.IO não foi inicializado! Chame initializeSocket() primeiro.');
  }
  return io;
}

/**
 * Emite evento para todos os usuários de um restaurante
 * @param {number} restaurantId - ID do restaurante
 * @param {string} event - Nome do evento
 * @param {Object} data - Dados a enviar
 */
export function emitToRestaurant(restaurantId, event, data) {
  if (!io) {
    console.warn('⚠️ Socket.IO não inicializado. Evento não emitido.');
    return;
  }

  io.to(`restaurant:${restaurantId}`).emit(event, {
    ...data,
    timestamp: new Date()
  });
}

/**
 * Emite evento para usuário específico
 * @param {string} socketId - ID do socket
 * @param {string} event - Nome do evento
 * @param {Object} data - Dados a enviar
 */
export function emitToUser(socketId, event, data) {
  if (!io) {
    console.warn('⚠️ Socket.IO não inicializado. Evento não emitido.');
    return;
  }

  io.to(socketId).emit(event, {
    ...data,
    timestamp: new Date()
  });
}

/**
 * Emite evento global (todos os clientes conectados)
 * @param {string} event - Nome do evento
 * @param {Object} data - Dados a enviar
 */
export function emitGlobal(event, data) {
  if (!io) {
    console.warn('⚠️ Socket.IO não inicializado. Evento não emitido.');
    return;
  }

  io.emit(event, {
    ...data,
    timestamp: new Date()
  });
}

/**
 * Retorna número de clientes conectados
 * @returns {number}
 */
export function getConnectedClientsCount() {
  if (!io) return 0;
  return io.sockets.sockets.size;
}

/**
 * Retorna clientes conectados de um restaurante
 * @param {number} restaurantId - ID do restaurante
 * @returns {Array}
 */
export async function getRestaurantClients(restaurantId) {
  if (!io) return [];

  const sockets = await io.in(`restaurant:${restaurantId}`).fetchSockets();
  return sockets.map(socket => ({
    socketId: socket.id,
    userId: socket.userId,
    userName: socket.userName,
    tipoUser: socket.tipoUser
  }));
}
