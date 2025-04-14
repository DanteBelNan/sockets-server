// routes/socket.ts
import { Server } from 'socket.io';
import { chatController } from '../controllers/chatController';
import { privateChatController } from '../controllers/privateChatController';
import { Request, Response, NextFunction } from 'express';
import { authenticateSocket } from '../middleware/auth';
import { AuthenticatedSocket } from '../types/IAuthenticatedSocket';

const socketRouter = (io: Server) => {
  // Chat general (namespace /chat)
  const chatNamespace = io.of('/chat');
  
  // Aplicar middleware de autenticación al namespace
  chatNamespace.use(authenticateSocket);
  
  let connectedUsers = 0;
  
  chatNamespace.on('connection', (socket: AuthenticatedSocket) => {
    console.log(`Usuario ${socket.data.user.username} conectado al namespace /chat (socket ID: ${socket.id})`);
    connectedUsers++;
    chatController.connectedUsers(chatNamespace, connectedUsers);
    chatController.handleConnection(chatNamespace, socket);

    socket.on('disconnect', () => {
      connectedUsers--;
      chatController.connectedUsers(chatNamespace, connectedUsers);
      chatController.handleDisconnect(chatNamespace, socket);
    });

    socket.on('chat message', (data) => {
      chatController.handleChatMessage(chatNamespace, socket, data);
    });
  });

  // Chat privado (namespace /privateChat)
  const privateChatNamespace = io.of('/privateChat');
  
  // Aplicar middleware de autenticación al namespace
  privateChatNamespace.use(authenticateSocket);
  
  privateChatNamespace.on('connection', (socket: AuthenticatedSocket) => {
    console.log(`Usuario ${socket.data.user.username} conectado al namespace /privateChat (socket ID: ${socket.id})`);
    
    // Manejar solicitud de lista de salas
    socket.on('get rooms', () => {
      privateChatController.handleGetRooms(privateChatNamespace, socket);
    });
    
    // Manejar creación de nueva sala
    socket.on('create room', (data) => {
      privateChatController.handleCreateRoom(privateChatNamespace, socket, data);
    });

    socket.on('delete room', (roomId) => {
      privateChatController.handleDeleteRoom(privateChatNamespace, socket, roomId);
    });
    
    // Evento para unirse a una sala específica
    socket.on('join room', (roomId) => {
      // Primero abandonamos todas las salas actuales (excepto la sala por defecto del socket)
      socket.rooms.forEach(room => {
        if (room !== socket.id) {
          privateChatController.handleLeaveRoom(privateChatNamespace, socket, room);
        }
      });
      
      // Unirse a la nueva sala
      privateChatController.handleJoinRoom(privateChatNamespace, socket, roomId);
    });

    // Manejar evento para abandonar una sala específica
    socket.on('leave room', (roomId) => {
      privateChatController.handleLeaveRoom(privateChatNamespace, socket, roomId);
    });

    // Enviar mensaje a una sala específica
    socket.on('chat message', (data) => {
      const { roomId } = data;
      
      // Verificar que el usuario esté en la sala
      if (socket.rooms.has(roomId)) {
        privateChatController.handleChatMessage(privateChatNamespace, socket, data, roomId);
      }
    });

    socket.on('disconnect', () => {
      privateChatController.handleDisconnect(privateChatNamespace, socket);
    });
  });

  return (req: Request, res: Response, next: NextFunction) => {
    next();
  };
};

export default socketRouter;